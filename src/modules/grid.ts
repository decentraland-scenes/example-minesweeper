
import { Entity, GltfContainer, InputAction, PointerEventType, PointerEvents, PointerEventsResult, Schemas, Transform,TransformTypeWithOptionals,VisibilityComponent,engine, inputSystem } from '@dcl/sdk/ecs'

import { Quaternion, Vector3 } from '@dcl/sdk/math'
import { loseSound, winSound } from './globals'
import * as utils from "@dcl-sdk/utils"
import { Cell, checkWin, createGridCell, flagCell, resetGridCell, revealCell, setMine } from './cell'
import { SoundBox } from './soundbox'
import { syncEntity } from '@dcl/sdk/network'
import { AvatarAnimHandler } from './avatarAnimation'
import { triggerSceneEmote } from '~system/RestrictedActions'
import { Game } from '../game'
// import * as miniGames from "@dcl-sdk/mini-games/src"
import { GameStateData } from '../gameState'
import { multiPlayer } from '..'
import * as ui from "../ui"
// export const GameStateData = engine.defineComponent('game-state-data', {    
//     cells:Schemas.Array(Schemas.Array(Schemas.Entity)),
//     mines:Schemas.Array(Schemas.Entity),
//     mineCount:Schemas.Number
// })

export class GridMap {
    root:Entity
    cellHover:Entity
    interactive: boolean = false
    // center:Vector3
    gridLnX:number
    gridLnZ:number
    maxCellCount:number = 16
    maxMineCount:number = 40
    sideLengthX:number
    sideLengthZ:number
    stepX:number 
    stepZ:number 
    areMinesDistributed:boolean = false
    cells:Entity[][]  
    mineCount:number = 5
    mines:Entity[]
    soundBox:SoundBox
    private levelWon:boolean = false
    clickCount:number = 0
    winAnimHandler:ui.WinAnimationHandler
    avatarAnimator:AvatarAnimHandler
    game:Game

    constructor(transform:TransformTypeWithOptionals, _sideLengthX:number, _sideLengthZ:number, _gridLinesX:number, _gridLinesZ:number, _mineCount:number, _rotation:Quaternion, game:Game){         

        this.game = game
        
        this.root = engine.addEntity()

        Transform.create(this.root,transform)     

        // GameStateData.createOrReplace(this.root, {
        //     cells: [],
        //     mineCount:  _mineCount,
        //     mines: []
        // })

        
        //syncEntity(this.root, [Transform.componentId, GameStateData.componentId], 100000)

        multiPlayer && syncEntity(this.root, [Transform.componentId], 100000)
       
        
        this.mines = []

        this.cells = []
       // this.center = Vector3.create(center.x, center.y, center.z)        
        this.sideLengthX = _sideLengthX *0.95
        this.sideLengthZ = _sideLengthZ *0.95
        this.gridLnX = _gridLinesX
        this.gridLnZ = _gridLinesZ
        this.stepX = this.sideLengthX/this.gridLnX
        this.stepZ = this.sideLengthZ/this.gridLnZ
        
        this.winAnimHandler = new ui.WinAnimationHandler(Vector3.create(2, 3, 0))
        this.avatarAnimator = new AvatarAnimHandler()    
            

        this.soundBox = new SoundBox()

        // INPUTS SYSTEM
        engine.addSystem(() => {

            if(this.interactive){
                const clickedCells = engine.getEntitiesWith(PointerEvents, Cell)

                for (const [entity] of clickedCells) {
    
                    //FLAG
                    if(inputSystem.getInputCommand(InputAction.IA_SECONDARY, PointerEventType.PET_DOWN, entity)){
                    
                        if(flagCell(entity)){
                            this.game.mainMenu.mineCounter.reduceNumberBy(1)
                        } 
                        else{
                            this.game.mainMenu.mineCounter.increaseNumberBy(1)
                        }
                       
                        if(checkWin()){                    
                            this.winGame()
                        }                    
                    }
    
                    // DIG
                    if (inputSystem.isTriggered(InputAction.IA_POINTER, PointerEventType.PET_DOWN, entity)) {                    
                        
                        //place mines on first click
                        if(!this.areMinesDistributed){
                            this.areMinesDistributed = true
    
                            let firstClickedCell = Cell.get(entity)
                            
                            this.placeMines(this.game.mineCount, firstClickedCell.x, firstClickedCell.z)
                            this.setupNeighborConnections()
                            this.initializeNeighborNumbers()    
    
                        }
                      this.hideHover()
                        
                      // if reveal is a mine cell
                        if(revealCell(entity)){
                            this.loseGame()
                        }
    
                        if(checkWin()){                   
                            this.winGame()
                        }
                    }
    
                    // HOVER
                    if (inputSystem.isTriggered(InputAction.IA_POINTER, PointerEventType.PET_HOVER_ENTER, entity)) {
                        
                      if(!Cell.get(entity).revealed){
                        this.showHover(entity)
                      }                   
                    }             
                }            
            }
            
            
        })

        this.cellHover = engine.addEntity()
        Transform.createOrReplace(this.cellHover,{
            rotation:Quaternion.fromEulerDegrees(-90,0,0)
        })
        GltfContainer.create(this.cellHover, { src: "models/cell_hover.glb"})
        VisibilityComponent.create(this.cellHover)
        this.initEntityPool()        

    }

    setInteractive(interactive:boolean){
        this.interactive = interactive
    }

    showHover(cell:Entity){
        Transform.getMutable(this.cellHover).parent = cell
        VisibilityComponent.getMutable(this.cellHover).visible = true
    }

    hideHover(){
        Transform.getMutable(this.cellHover).parent = engine.RootEntity
        VisibilityComponent.getMutable(this.cellHover).visible = false
    }    
    
    getCell(x:number, z:number):Entity{
       return  this.cells[x][z]
    }

    placeMines(count:number, exceptionX:number, exceptionZ:number){        

        let placedMines = 0

        while(placedMines < count){
            let randX = Math.floor(Math.random()* this.gridLnX)
            let randZ = Math.floor(Math.random()* this.gridLnZ)
            
            // do not place a mine on the first clicked cell
            if(randX!= exceptionX && randZ != exceptionZ){
                setMine(this.getCell(randX, randZ))

                placedMines++

                this.mines.push(this.getCell(randX, randZ))
            }
        }
        // for(let i =0; i<count; i++){
            
            
        // }
        
    }
    revealAllMines(depth:number){           

        revealCell(this.mines[depth])


        if(depth+1 < this.mines.length){
            utils.timers.setTimeout(()=>{
                this.revealAllMines(depth+1)
            }, 25)
            
        }
        else {                 

            utils.timers.setTimeout(()=>{
                //this.resetGrid()
                this.soundBox.playSound(loseSound)
               // this.setLevel(16,20)
            }, 500)
        }       
    }

    revealAllNeighbors(cell:Entity){

        const cellInfo = Cell.get(cell)

        for(let neighbor of cellInfo.neighbors){
            if(!Cell.get(neighbor).revealed  && Cell.get(neighbor).neighborMineCount == 0 ){
                revealCell(neighbor)
                this.revealAllNeighbors(neighbor)
            }
        }
    }
   

    countNeighborMines(cell:Entity):number{

        let count = 0  
        const cellInfo = Cell.get(cell)

        for(let neighbor of cellInfo.neighbors){
            if(Cell.get(neighbor).isMine ){
                count++
            }
        }

        return count       
    }

    getNeighbors(row:number, col:number):Entity[]{

        let neighbors:Entity[] = [] 
        
        // Check TOP LEFT
        if (col - 1 >= 0 && row - 1 >=0 ) { 
            neighbors.push(this.getCell(row-1, col-1))
        }

        // Check TOP CENTER
        if (row - 1 >=0 ) { 
            neighbors.push(this.getCell(row-1,col))
        }
        // Check TOP RIGHT
        if ( row - 1 >=0 && col + 1 <= this.gridLnZ - 1 ) { 
            neighbors.push(this.getCell(row-1,col+1))
        }

        // Check BOTTOM LEFT
        if (col - 1 >= 0 && row + 1 <= this.gridLnX - 1 ) { 
            neighbors.push(this.getCell(row+1,col-1))
        }

        // Check BOTTOM CENTER
        if (row + 1 <= this.gridLnX - 1 ) { 
            neighbors.push(this.getCell(row+1,col))
        }
        // Check BOTTOM  RIGHT
        if ( row + 1 <= this.gridLnX - 1 && col + 1 <= this.gridLnZ - 1 ) { 
            neighbors.push(this.getCell(row+1,col+1))
        }

        // Check LEFT
        if (col - 1 >= 0 ) { 
            neighbors.push(this.getCell(row,col-1))
        }
        // Check RIGHT
        if (col + 1 <=  this.gridLnZ - 1 ) { 
            neighbors.push(this.getCell(row,col+1))
        }

        return neighbors
       
    }

    setupNeighborConnections(){
        for(let i=0; i < this.gridLnX; i++){
            for(let j=0; j < this.gridLnZ; j++){
                
                let cellInfo =Cell.getMutable(this.getCell(i,j))                
                cellInfo.neighbors = this.getNeighbors(i,j)                
            }
        }
    }

    initializeNeighborNumbers(){
        for(let i=0; i < this.gridLnX; i++){
            for(let j=0; j < this.gridLnZ; j++){

                let count = this.countNeighborMines(this.getCell(i,j))

                 let cellInfo =Cell.getMutable(this.getCell(i,j))
                 cellInfo.neighborMineCount = count                

                //DEBUG ONLY
                // addDebugCoords(this.cells[i][j], i.toString(), j.toString())
            }
        }
    } 
    
    initEntityPool(){
        
        const lowerCornerX = -this.sideLengthX/2
        const lowerCornerZ = -this.sideLengthZ/2

        let scaleX = this.sideLengthX/this.gridLnX *0.98
        let scaleZ = this.sideLengthZ/this.gridLnZ *0.98

        for(let i=0; i< this.maxCellCount; i++){
            let newLine:Entity[] = []
            for(let j=0; j< this.maxCellCount; j++){

                let cell = createGridCell(
                    i*this.maxCellCount +j,
                    {
                        position: Vector3.create( lowerCornerX + this.stepX/2 + i*this.stepX, -10, lowerCornerZ + this.stepZ/2 + j*this.stepZ),
                        scale: Vector3.create(scaleX, scaleZ, scaleX ),     
                        rotation:Quaternion.fromEulerDegrees(90,0,0)               
                    },                
                    i,
                    j,
                    this.root,                

            ) 
            newLine.push(cell)    
            }
            // const gameStateData = GameStateData.getMutable(this.root)
            // gameStateData.cells.push(newLine)     
            this.cells.push(newLine)      
            
        }
    }
    
    initGrid(){
        const lowerCornerX = -this.sideLengthX/2
        const lowerCornerZ = -this.sideLengthZ/2

        let scaleX = this.sideLengthX/this.gridLnX *0.98
        let scaleZ = this.sideLengthZ/this.gridLnZ *0.98

        // const gameStateData = GameStateData.getMutable(this.root)
        // gameStateData.cells

        for(let i=0; i< this.gridLnX; i++){
            for(let j=0; j< this.gridLnZ; j++){
              
               // let cell = gameStateData.cells[i][j]
                let cell = this.cells[i][j]
                const cellTransform = Transform.getMutable(cell)
              
                let cellData = Cell.getMutable(cell)
                VisibilityComponent.getMutable(cell).visible = true
                cellData.active = true
             
                cellTransform.position =  Vector3.create( lowerCornerX + this.stepX/2 + i*this.stepX, 0.1, lowerCornerZ + this.stepZ/2 + j*this.stepZ)
                cellTransform.scale =  Vector3.create(scaleX, scaleZ, scaleX)  

            }            
        }

        //places mines
        // this.placeMines(GameStateData.get(this.root).mineCount)
        // this.setupNeighborConnections()
        // this.initializeNeighborNumbers()       

    } 
    isLevelComplete():boolean{
        return this.levelWon
    }

    winGame(){
        console.log("GAME WON")
        
        this.soundBox.playSound(winSound)
        this.winAnimHandler.playWinAnimation()
        triggerSceneEmote({ src: 'assets/scene/Pose_Win.glb', loop: false })
        

        utils.timers.setTimeout(()=>{
            this.resetGrid()
            this.winAnimHandler.hide()
           // this.removeAllCells()
          
            this.levelWon = true
        }, 3000)
    }

    loseGame(){
        console.log("GAME LOST")
        this.revealAllMines(0)
        
    }

    resetGrid(){
        //RESTART CURRENT LEVEL       
        this.setLevel(this.gridLnX, this.gridLnZ, this.game.mineCount)     
    }


    deactivateAllCells(){
       // const gameStateData = GameStateData.getMutable(this.root)

        for(let i=0; i < this.cells.length; i++){
            for(let j=0; j < this.cells[i].length; j++){

               Cell.getMutable(this.cells[i][j]).active = false
               VisibilityComponent.getMutable(this.cells[i][j]).visible = false
               resetGridCell(this.cells[i][j], i, j)
            }
        }
    }


    setLevel(_gridlinesX:number, _gridlinesZ:number, mineCount:number){

        //const gameStateData = GameStateData.getMutable(this.root)

        this.levelWon = false
        this.areMinesDistributed = false
       // this.resetGrid()
        //this.removeAllCells()

        this.game.mineCount = mineCount
        this.mines = []             
        this.gridLnX = _gridlinesX
        this.gridLnZ = _gridlinesZ
        this.stepX = this.sideLengthX/this.gridLnX
        this.stepZ = this.sideLengthZ/this.gridLnZ
        //gameStateData.cells = []
        this.deactivateAllCells()
        this.initGrid()
    }   
}