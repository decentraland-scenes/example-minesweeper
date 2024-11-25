import { Animator, AudioSource, ColliderLayer, Entity, GltfContainer, InputAction, PointerEventType, PointerEvents, Schemas, TextAlignMode, TextShape, Transform, TransformTypeWithOptionals, VisibilityComponent, engine } from "@dcl/sdk/ecs"
import { Color4, Quaternion, Vector3 } from "@dcl/sdk/math"
import * as utils from "@dcl-sdk/utils"
import { triggerEmote, triggerSceneEmote } from "~system/RestrictedActions"



export function checkWin():boolean{
    let cellGroup = engine.getEntitiesWith(Cell,Transform)

    for (const [entity, cellInfo] of cellGroup) {
        
        //check only the cells currently in play
        if(cellInfo.active){
        
            //cell is a mine but was not flagged by the user
            if (!cellInfo.flagged && cellInfo.isMine){
                return false
            }

            //cell is not a mine, but was not revealed yet
            if(!cellInfo.revealed && !cellInfo.isMine){
                return false
            }
        }          
    }

    return true         
}

export const Cell = engine.defineComponent('cell', { 
    //id:Schemas.Number,
    active:Schemas.Boolean,
    isMine:Schemas.Boolean,
   // mineEntity: Schemas.Entity,
    neighborMineCount: Schemas.Number,
  //  numberMarkerEntity: Schemas.Entity,
    revealed: Schemas.Boolean,
    flagged: Schemas.Boolean,
    flagEntity: Schemas.Entity,
    x: Schemas.Number,
    z: Schemas.Number,
    neighbors: Schemas.Array(Schemas.Entity)
})

export function startExplosion(parentCell:Entity){

    const cellInfo = Cell.getMutable(parentCell)   

    let explosion = engine.addEntity()
    Transform.create(explosion,{
        rotation:Quaternion.fromEulerDegrees(-90,0,0),
        scale: Vector3.create(0.25,0.25,0.25)
    })
    GltfContainer.createOrReplace(explosion, {src:'models/explosion.glb' })

    utils.timers.setTimeout(()=>{
        engine.removeEntity(explosion)
        },
        1000
    )
    // AudioSource.create(explosion,{
    //     audioClipUrl: "sounds/explosion.mp3",
    //     loop: false,
    //     playing: true
    // })    
    Transform.getMutable(explosion).parent = parentCell
    
    
}

export function addNumberMarker(parentCell:Entity, number:string){    
  

     TextShape.getMutable(parentCell).text = number

     if(number == "0"){
        TextShape.getMutable(parentCell).text = ""
     }
}
export function addDebugCoords(parentCell:Entity, x:string, z:string){    
    
    let debugMarker = engine.addEntity()
    Transform.create(debugMarker,{
        position: Vector3.create(0,0.1,-0.45),
        rotation:Quaternion.fromEulerDegrees(90,0,0),
        parent: parentCell
    })
    TextShape.createOrReplace(debugMarker, {
        text: ("i: " + x + ", j: " + z ),
        fontSize: 2,
        textAlign:TextAlignMode.TAM_BOTTOM_CENTER,       
        textColor:Color4.Black(),
        outlineColor: Color4.Black(),
        outlineWidth: 0.1
        
    })

}

export function spawnDirtParticles(cell:Entity){

    let dirt = engine.addEntity()
    Transform.create(dirt,{
       rotation: Quaternion.fromEulerDegrees(-90,0,0),
        scale: Vector3.create(0.4,0.4,0.4)
    })
    GltfContainer.createOrReplace(dirt, {src:'models/dirt_particles.glb' })

    // AudioSource.create(dirt,{
    //     audioClipUrl: "sounds/dig.mp3",
    //     loop: false,
    //     playing: true
    // })
    
    Transform.getMutable(dirt).parent = cell    

    utils.timers.setTimeout(()=>{
        engine.removeEntity(dirt)
        },
        512
    )
}

export function flagCell(cell:Entity):boolean{

    const cellInfo = Cell.getMutable(cell)
    
    
    if(!cellInfo.flagged && !cellInfo.revealed){

        cellInfo.flagged = true     
        triggerSceneEmote({ src: 'models/Avatar_PlaceFlag.glb', loop: false })
       //triggerEmote({ predefinedEmote: 'robot' })
        //Transform.getMutable(engine.PlayerEntity).rotation = Quaternion.fromEulerDegrees(0,90,0)
        VisibilityComponent.getMutable(cellInfo.flagEntity).visible = true
        
        // AudioSource.createOrReplace(cellInfo.flagEntity,{
        //     audioClipUrl: "sounds/place_flag.mp3",
        //     loop: false,
        //     playing: true
        // })
        Animator.playSingleAnimation(cellInfo.flagEntity, "Flag_Place_Prop")
        
        utils.timers.setTimeout(()=>{
            if(cellInfo.flagged){
                Animator.playSingleAnimation(cellInfo.flagEntity, "Flag_Loop_Prop")
            }
            
        }, 500)

        return true
    }else{

        if(cellInfo.flagged){

            // AudioSource.createOrReplace(cellInfo.flagEntity,{
            //     audioClipUrl: "sounds/woosh.mp3",
            //     loop: false,
            //     playing: true
            // })           
              
       
            cellInfo.flagged = false
            
            triggerSceneEmote({ src: 'models/Avatar_RemoveFlag.glb', loop: false })
            
           Animator.playSingleAnimation(cellInfo.flagEntity, "Flag_Remove_Prop")
            utils.timers.setTimeout(()=>{
                if(!cellInfo.flagged)
                VisibilityComponent.getMutable(cellInfo.flagEntity).visible = false  
            }, 300)

            return false
        }  
        
        
    }

    return false
}

export function gameOver(){
    revealAll()
}

export function revealAll(){
    let cellGroup = engine.getEntitiesWith(Cell,Transform)

    for (const [entity] of cellGroup) {
        revealCell(entity)
    }
}

// returns true if the cell was a mine and the game is over
export function revealCell(cell:Entity ):boolean{   

    let cellInfo = Cell.getMutable(cell)

    if(!cellInfo.revealed && !cellInfo.flagged){
        cellInfo.revealed = true
        

        //console.log("CELL ACTIVE: " + cellInfo.active)
      //  console.log("CELL MINE: " + cellInfo.isMine)
        // mine revealed -> game over
        if (cellInfo.isMine){                 
            startExplosion(cell)
            GltfContainer.createOrReplace(cell, {src:'models/cell_mine.glb',  invisibleMeshesCollisionMask:ColliderLayer.CL_PHYSICS })
            return true
        }
        else{
          //  console.log("NEIGHBORING MINES: " + cellInfo.neighborMineCount.toString())     
          GltfContainer.createOrReplace(cell, {src:'models/cell_revealed.glb', invisibleMeshesCollisionMask:ColliderLayer.CL_PHYSICS })   
            
            addNumberMarker(cell, cellInfo.neighborMineCount.toString())
                
            
            //iterate thorugh all 0 island cells
            if(cellInfo.neighborMineCount == 0){

                // addNumberMarker(cell, "0")

                utils.timers.setTimeout(()=>{
                    revealNeighbors(cell)
                    },
                    50
                )                   
            }            
                spawnDirtParticles(cell)
        }

    }

    return false
}

export function revealNeighbors (cell:Entity){

    let cellInfo = Cell.get(cell)

    for(let neighbor of cellInfo.neighbors){

        revealCell(neighbor)
    }

}

export function createGridCell(_id:number, transform:TransformTypeWithOptionals, idX:number, idZ:number, _parent:Entity):Entity{
    let cell = engine.addEntity()
    Transform.create(cell, transform)
    GltfContainer.createOrReplace(cell,{src: 'models/cell_default.glb'})    

    PointerEvents.create(cell, { pointerEvents: [
        {
          eventType: PointerEventType.PET_DOWN,
          eventInfo: {
            button: InputAction.IA_POINTER,
            showFeedback: true,
            hoverText: "DIG",
            maxDistance: 16,
          }
        },
        {
          eventType: PointerEventType.PET_DOWN,
          eventInfo: {
            button: InputAction.IA_SECONDARY,
            showFeedback: true,
            hoverText: "FLAG",
            maxDistance: 16
          }
        },
        {
          eventType: PointerEventType.PET_HOVER_ENTER,
          eventInfo: {
            button: InputAction.IA_POINTER,
            showFeedback: false,           
            maxDistance: 20
          }
        },
        {
          eventType: PointerEventType.PET_HOVER_LEAVE,
          eventInfo: {
            button: InputAction.IA_POINTER,
            showFeedback: false,           
            maxDistance: 20
          }
        },

      ]})

    TextShape.createOrReplace(cell, {
            text: "",
            fontSize: 6,
            textAlign:TextAlignMode.TAM_MIDDLE_CENTER,       
            textColor:Color4.White(),
            outlineColor: Color4.White(),
            outlineWidth: 0.25,
            paddingBottom:0
            
        })

    //FLAG
    let flag = engine.addEntity()
    Transform.create(flag,{
        // parent: cell,
        position: Vector3.create(0,0.0,0.06),
        rotation: Quaternion.fromEulerDegrees(-90,0,0),
        scale: Vector3.create(1,1,1)
    })
    GltfContainer.createOrReplace(flag, {src:'models/flag.glb' })
    Animator.createOrReplace(flag,{
        states:[{
            clip: "Flag_Place_Prop",
            loop:false,
            speed:1.5
            
        },{
            clip: "Flag_Loop_Prop",
            loop:true,            
        },
        {
            clip: "Flag_Remove_Prop",
            loop:false,    
            speed:2      
        },
    ]
    })
    // AudioSource.createOrReplace(flag,{
    //     audioClipUrl: "sounds/place_flag.mp3",
    //     loop: false,
    //     playing: false
    // })
    VisibilityComponent.createOrReplace(flag, {visible: false})

    
    

    Cell.createOrReplace(cell,{
        isMine: false,
        neighborMineCount: 0,
        revealed: false,
        x: idX,
        z: idZ,
        flagged:false,           
        active:false,       
        flagEntity:flag

    })
    VisibilityComponent.createOrReplace(cell, {visible:false})

    
    Transform.getMutable(cell).parent = _parent
    Transform.getMutable(flag).parent = cell  
        
    return cell 
}

 export function resetGridCell(cell:Entity, idX:number, idZ:number):Entity{

     const cellInfo = Cell.get(cell)
     let flag = cellInfo.flagEntity

     Cell.createOrReplace(cell,{
        isMine: false,
        neighborMineCount: 0,
        revealed: false,
        x: idX,
        z: idZ,
        flagged:false,          
        active:false,
        flagEntity:flag

    })

     VisibilityComponent.getMutable(cellInfo.flagEntity).visible = false

     GltfContainer.createOrReplace(cell,{src: 'models/cell_default.glb', invisibleMeshesCollisionMask:ColliderLayer.CL_PHYSICS | ColliderLayer.CL_POINTER})  

     Transform.getMutable(cell).position.y = -10   

     return cell
 }

export function setMine(cell:Entity){
    let cellInfo = Cell.getMutable(cell)
    cellInfo.isMine = true
   // Mine.getMutable(cellInfo.mineEntity).active = true
}
