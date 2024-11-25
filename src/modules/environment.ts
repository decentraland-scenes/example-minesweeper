import { Entity, GltfContainer, Transform, engine } from "@dcl/sdk/ecs";
import { Vector3, Quaternion } from "@dcl/sdk/math";
import { SCENE_CENTER } from "./globals";

export function addEnvironment(parent:Entity){
    let environment = engine.addEntity()

    Transform.create(environment, {
        //position: Vector3.create(SCENE_CENTER.x, SCENE_CENTER.y, SCENE_CENTER.z),
        parent: parent
    })

    GltfContainer.create(environment, {src: "models/minesweeper.glb" })

    let workstation = engine.addEntity()

    GltfContainer.create(workstation, {
        src: "models/workstation.glb"

    })

    Transform.create(workstation, {
        position: Vector3.create(0, 0, 3.65),
        scale: Vector3.create(1, 1, 1),
        rotation: Quaternion.fromEulerDegrees(0, 0, 0),
        parent:parent
        
    })
///Workstation display




    // let workstationDisplay = engine.addEntity()

    // GltfContainer.create(workstationDisplay, {
    //     src: "models/workstation_display.glb"

    // })

    // Transform.create(workstationDisplay, {
    //     position: Vector3.create(0, 1.35, 3.47),
    //     scale: Vector3.create(1, 1, 1),
    //     rotation: Quaternion.fromEulerDegrees(0, 0, 0),
    //     parent: parent
    // })
}