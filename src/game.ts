import { Quaternion, Vector3 } from "@dcl/sdk/math"
import { GridMap } from "./modules/grid"
import { SCENE_CENTER, sceneParentEntity, winSound } from "./modules/globals"
import { levelData } from "./modules/levelData"
import { engine, Entity, MeshRenderer, Transform } from "@dcl/sdk/ecs"
import { SoundBox } from "./modules/soundbox"
import { addEnvironment } from "./modules/environment"
import { checkWin } from "./modules/cell"
//import { initPlayerData, setCurrentPlayer } from "./minigame-multiplayer/multiplayer"
import { MainMenu } from "./modules/menu"
//import { TIME_LEVEL } from "./minigame-ui/scoreboard/columnData"
import * as utils from "@dcl-sdk/utils"

// import * as miniGames from "@dcl-sdk/mini-games/src"
import { GAME_STATE, GameStateData } from "./gameState"
import { blockCamera, freeCamera, initCamera, lockPlayer, unlockPlayer } from "./modules/lockPlayer"
import { MusicPlayer } from "./modules/music"
import { ClickBlocker } from "./modules/clickBlocker"


import * as ui from "./ui"

export let gameStateEntity:Entity

export class Game {
    sceneRoot:Entity
    //currentLevel:number
    maxLevel:number = 2
    map:GridMap
    checkFrequncy:number = 1
    elapsedTime:number = 0
    soundBox:SoundBox

    mainMenu:MainMenu 
    //scoreboard:miniGames.ui.ScoreBoard   
    //instructions:miniGames.ui.InstructionsBoard

    musicPlayer:MusicPlayer
    clickBlocker:ClickBlocker
    mineCount:number = 10
    

    constructor(){

        this.sceneRoot = engine.addEntity()
        Transform.create(this.sceneRoot,{
            position:Vector3.create(0,0,0),
            rotation:Quaternion.fromEulerDegrees(0,0,0),
            parent: sceneParentEntity
        })

        
        this.soundBox = new SoundBox()  
        this.musicPlayer = new MusicPlayer()

        gameStateEntity = engine.addEntity()

      GameStateData.createOrReplace(gameStateEntity, {
         // cells: [],    
          gameTime: 0,       
          roundTime: 30,            
          sfxOn:true,
          currentLevel:0,           
          elapsedTime: 0,
          maxLevel:3,
          currentSpeed: 1,
          state:GAME_STATE.IDLE,
          lives: 3,
          score:0 
      })      
        //DEBUG
      //  MeshRenderer.setBox(this.menuRoot)
        //---
        this.map = new GridMap({
                position: Vector3.create(0, 0.0, -2),
                rotation:Quaternion.fromEulerDegrees(0,180,0),
                parent:this.sceneRoot
            },
            8.5,
            8.5,
            levelData[this.getLevel()].linesX, 
            levelData[this.getLevel()].linesZ, 
            levelData[this.getLevel()].mines,             
            Quaternion.fromEulerDegrees(0,180,0),
            this
        )

        this.map.initGrid()

        this.mainMenu = new MainMenu(this)       

        // virutal camera
        initCamera()

        this.clickBlocker = new ClickBlocker(sceneParentEntity)
        //initPlayerData(this)
       
        //GAME LOOP
        engine.addSystem((dt:number)=>{

          switch(this.getState()){
            case GAME_STATE.IDLE: break;

            case GAME_STATE.MAIN_LOOP: {
              this.elapsedTime+=dt
              GameStateData.getMutable(gameStateEntity).gameTime +=dt
  
              if(this.elapsedTime >= this.checkFrequncy){
                  if(this.map.isLevelComplete()){
                    this.setLevel( this.getLevel() +1 )
                      if(this.getLevel() <= this.maxLevel){                         
                          this.startLevel(this.getLevel())
                          
  
                          switch(this.getLevel()){
                              case 1:{
                                  this.mainMenu.level2Button.enable()
                                  this.mainMenu.level2Button.changeIcon(ui.uiAssets.numbers[2])                                
                                  break;
                              }
                              case 2:{
                                  this.mainMenu.level3Button.enable()
                                  this.mainMenu.level3Button.changeIcon(ui.uiAssets.numbers[3]) 
                                  break;
                              }
                          }
                          
                          //this.soundBox.playSound(winSound)
                          console.log("CURRENT LEVEL: " + this.getLevel())
                      }
                    else {
                      console.log("MAX LEVEL REACHED - EXITING " + this.getLevel() )
                      this.exitPlayer()
                      // utils.timers.setTimeout(()=>{
                       
                      // }, 4000)
                      
                    }  
                  }
                              
              }            
            }
          }
            
        })

      
    }   

    startCountDown(){
        this.mainMenu.countdown.show()
        //this.soundBox.playSound("sounds/pre_countdown.mp3")
        let countDown = 4 
        this.mainMenu.countdown.setTimeAnimated(countDown--)
        let countDownTimer = utils.timers.setInterval(()=>{
          this.mainMenu.countdown.setTimeAnimated(countDown--)
        }, 1000)
        
    
        utils.timers.setTimeout(() => {     
          this.startLevel(0)         
          this.mainMenu.hideCountdown()
          this.mainMenu.countdown.hide()
          GameStateData.getMutable(gameStateEntity).gameTime = 0
          this.setState(GAME_STATE.MAIN_LOOP)
          this.map.setInteractive(true)
          utils.timers.clearInterval(countDownTimer)
        }, 4000)
      }

    newGame(){       

        utils.timers.setTimeout(() => {
          // const mainCamera = MainCamera.createOrReplace(engine.CameraEntity, {
          //   virtualCameraEntity: this.customCamera,
          // })
          this.clickBlocker.disable()
          lockPlayer()  
          blockCamera()    
          //this.mainMenu.moveScoreToTop()
          this.mainMenu.showCountdown()
          this.startCountDown()          
         
        }, 1000)
    
          console.log("GETS THROUGH PLAYER CHECK")
    }

    startLevel(level:number){       
        
        if(level < 3){            
            this.map.setLevel(levelData[level].linesX, levelData[level].linesZ, levelData[level].mines )
            this.mainMenu.updateMineCounter(levelData[level].mines)
        }
    }

    

    exitPlayer(){           
        //movePlayerTo({ newRelativePosition: Vector3.create(1, 0, 8) })      
        //this.musicPlayer.stopMusic()
        unlockPlayer()
        freeCamera()
        this.clickBlocker.enable()
        //this.musicPlayer.stopMusic()        
        this.setState(GAME_STATE.IDLE)   
        this.map.setInteractive(false)    
       
        this.setLevel(0)

      }

    getState():GAME_STATE{
        return GameStateData.get(gameStateEntity).state
      }
  
    setState(state:GAME_STATE){
      GameStateData.getMutable(gameStateEntity).state = state
    } 
      
    getLevel():number{
      return GameStateData.get(gameStateEntity).currentLevel
    } 
    setLevel(level:number){
      GameStateData.getMutable(gameStateEntity).currentLevel = level
    } 
    
}

