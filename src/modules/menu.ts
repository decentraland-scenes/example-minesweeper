import { engine, Entity, Transform } from "@dcl/sdk/ecs";
import { Game } from "../game";
//import { MenuButton } from "../minigame-ui/button";
//import { MenuLabel } from "../minigame-ui/label";
import { Quaternion, Vector3 } from "@dcl/sdk/math";
//import { ui.uiAssets } from "../minigame-ui/resources";
//import { setCurrentPlayer } from "../minigame-multiplayer/multiplayer";
//import { Counter3D } from "../minigame-ui/counter";
import * as ui from "../ui"

export class MainMenu{
    menuRoot:Entity
    menuWidth:number = 8
    playButton:ui.MenuButton
    exitButton:ui.MenuButton
    resetButton:ui.MenuButton
    musicButton:ui.MenuButton
    soundsButton:ui.MenuButton
    levelLabel:ui.MenuLabel
    level1Button:ui.MenuButton
    level2Button:ui.MenuButton
    level3Button:ui.MenuButton
    progressLabel:ui.MenuLabel
    mineCounter:ui.Counter3D
    countdown:ui.Timer3D
   // minesLabel:MenuLabel

    constructor(game:Game){
        let menuRow1Height:number = 0
        let menuRow2Height:number = -1.8
        let menuRow3Height:number = -2.6
        let buttonScale:number = 2.2
        let buttonSpacing:number = 0.7

        this.menuRoot = engine.addEntity()
        Transform.create(this.menuRoot, {
            position: Vector3.create(4,3.77,-7.5),
            rotation: Quaternion.fromEulerDegrees(0,180,0),
            scale: Vector3.create(1,1,1),
            parent:game.sceneRoot
        })

         //PLAY BUTTON
         this.playButton = new ui.MenuButton({
            position: Vector3.create(0, 1 ,3.80),
            rotation: Quaternion.fromEulerDegrees(-32.8,180,0),
            scale: Vector3.create(1.3, 1.3, 1.3),
            parent: game.sceneRoot
        },
        
        
        ui.uiAssets.shapes.RECT_GREEN,
        ui.uiAssets.icons.playText,        
        "PLAY/SIGN UP",
        ()=>{            
            game.newGame()    
        })

         //EXIT BUTTON
         this.exitButton = new ui.MenuButton({
            position: Vector3.create(1.3,menuRow1Height,0),
            rotation: Quaternion.fromEulerDegrees(-90,0,0),
            scale: Vector3.create(3,3,3),
            parent: this.menuRoot
        },
        
        ui.uiAssets.shapes.RECT_RED,
        ui.uiAssets.icons.exitText,        
        "EXIT GAME",
        ()=>{            
            game.exitPlayer()        
        })

         //SOUND BUTTON
         this.soundsButton = new ui.MenuButton({
            position: Vector3.create(this.menuWidth-0.5 - buttonSpacing,menuRow1Height,0),
            rotation: Quaternion.fromEulerDegrees(-90,0,0),
            scale: Vector3.create(buttonScale, buttonScale, buttonScale),
            parent: this.menuRoot
        },
        
        ui.uiAssets.shapes.SQUARE_RED,
        ui.uiAssets.icons.sound,        
        "TOGGLE SOUNDS",
        ()=>{            
            //setCurrentPlayer()           
        })

         //MUSIC BUTTON
         this.musicButton = new ui.MenuButton({
            position: Vector3.create(this.menuWidth-0.5,menuRow1Height,0),
            rotation: Quaternion.fromEulerDegrees(-90,0,0),
            scale: Vector3.create(buttonScale, buttonScale, buttonScale),
            parent: this.menuRoot
        },
        
        ui.uiAssets.shapes.SQUARE_RED,
        ui.uiAssets.icons.music,        
        "TOGGLE MUSIC",
        ()=>{            
            //setCurrentPlayer()           
        })


         //RESTART BUTTON
         this.resetButton = new ui.MenuButton({
            position: Vector3.create(this.menuWidth-1, menuRow2Height ,0),
            rotation: Quaternion.fromEulerDegrees(-90,0,0),
            scale: Vector3.create(buttonScale*2, buttonScale *2, buttonScale *2),
            parent: this.menuRoot
        },
        
        ui.uiAssets.shapes.SQUARE_RED,
        ui.uiAssets.icons.restart,        
        "RETRY",
        ()=>{            
            //game.map.setLevel(levelData[this.currentLevel].linesX, levelData[this.currentLevel].linesZ,levelData[this.currentLevel].mines)            
            game.startLevel(game.getLevel())
        })

         //LEVEL 1 BUTTON
         this.level1Button = new ui.MenuButton({
            position: Vector3.create(0.5,menuRow2Height, 0),
            rotation: Quaternion.fromEulerDegrees(-90,0,0),
            scale: Vector3.create(buttonScale, buttonScale, buttonScale),
            parent: this.menuRoot
        },
        
        ui.uiAssets.shapes.SQUARE_GREEN,
        ui.uiAssets.numbers[1],        
        "LEVEL 1",
        ()=>{          
            // game.setLevel(0)  
             game.startLevel(0)
             //this.map.setLevel(levelData[0].linesX, levelData[0].linesZ,levelData[0].mines)            
        })

         //LEVEL 2 BUTTON
         this.level2Button = new ui.MenuButton({
            position: Vector3.create(0.5 + buttonSpacing,menuRow2Height,0),
            rotation: Quaternion.fromEulerDegrees(-90,0,0),
            scale: Vector3.create(buttonScale, buttonScale, buttonScale),
            parent: this.menuRoot
        },
        
        ui.uiAssets.shapes.SQUARE_GREEN,
        ui.uiAssets.numbers[2],        
        "LEVEL 2",
        ()=>{            
            // game.setLevel(1)
             game.startLevel(1)
           // this.map.setLevel(levelData[1].linesX, levelData[1].linesZ,levelData[1].mines)          
        })
        this.level2Button.enable()

         //LEVEL 3 BUTTON
         this.level3Button = new ui.MenuButton({
            position: Vector3.create(0.5 + buttonSpacing*2,menuRow2Height,0),
            rotation: Quaternion.fromEulerDegrees(-90,0,0),
            scale: Vector3.create(buttonScale, buttonScale, buttonScale),
            parent: this.menuRoot
        },
        
        ui.uiAssets.shapes.SQUARE_GREEN,
        ui.uiAssets.numbers[3],        
        "LEVEL 3",
        ()=>{            
            // game.setLevel(2)
             game.startLevel(2)
           //this.map.setLevel(levelData[2].linesX, levelData[2].linesZ, levelData[2].mines)            
        })
        this.level3Button.enable()

        // LEVEL LABEL
        this.levelLabel = new ui.MenuLabel({
            position: Vector3.create(1.3,menuRow2Height+0.7,-0.05),
            rotation: Quaternion.fromEulerDegrees(-90,0,0),
            scale: Vector3.create(5,5,5),
            parent: this.menuRoot
        }, 
        ui.uiAssets.icons.levelText)

        //Progress Mines LABEL
        this.progressLabel = new ui.MenuLabel({
            position: Vector3.create(0,menuRow3Height,-0.05),
            rotation: Quaternion.fromEulerDegrees(-90,0,0),
            scale: Vector3.create(6,6,6),
            parent: this.menuRoot
        }, 
        ui.uiAssets.icons.progressText)

        // //MINES LEFT LABEL
        // this.progressLabel = new MenuLabel({
        //     position: Vector3.create(-0.0,-6,-0.05),
        //     rotation: Quaternion.fromEulerDegrees(-90,0,0),
        //     scale: Vector3.create(10,10,10),
        //     parent: this.menuRoot
        // }, 
        // ui.uiAssets.icons.progressText)

        this.mineCounter = new ui.Counter3D({
            parent:this.menuRoot,
            position: Vector3.create(0.5 + buttonSpacing*2,menuRow3Height,-0.05),
            rotation: Quaternion.fromEulerDegrees(0,180,0),
            scale:Vector3.create(0.5, 0.5, 0.5)
        },
         2,
         1.1,
         true,
         60000001
        )

        //this.mineCounter.setNumber(0)

        //COUNTDOWN
        this.countdown = new ui.Timer3D({
            parent:this.menuRoot,
            position: Vector3.create(4.1, -2.8,-0.4),
            rotation: Quaternion.fromEulerDegrees(0,180,0),
            scale:Vector3.create(0.5,0.5,0.5)
        },
         1,
         1.1,
         false,
         2        
        )
        //this.countdown.hide()
    }

    showCountdown(){
        this.countdown.show()
    }
    hideCountdown(){
        this.countdown.hide()
    }

    updateMineCounter(_number:number){
        this.mineCounter.setNumber(_number)
    }
}

