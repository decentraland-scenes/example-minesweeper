import { AvatarModifierArea, AvatarModifierType, CameraModeArea, CameraType, ColliderLayer, engine, Entity, GltfContainer, InputModifier, MainCamera, Material, MeshCollider, MeshRenderer, Transform, VirtualCamera } from "@dcl/sdk/ecs";
import { Color4, Quaternion, Vector3 } from "@dcl/sdk/math";
import { movePlayerTo } from "~system/RestrictedActions";
import { sceneParentEntity } from "./globals"
import { getPlayer } from "@dcl/sdk/players";
import * as utilities from "../utilities"

let lockCollider: Entity
let lockPos: Vector3
let boardPos = Vector3.create(8, 2, 3)
let playPos = Vector3.create(13, 1, 8)
let spectatorPos = Vector3.create(8, 0, 15)
let cameraPos =  Vector3.create(8, 8, 14.0)

var customCameraEnt: Entity
let hideArea:Entity

export function lockPlayer(){
    let sceneTransform = Transform.get(sceneParentEntity)
    let sceneRotation = sceneTransform.rotation
    let sceneCenter = sceneTransform.position
   

    lockPos = utilities.rotateVectorAroundCenter(playPos, sceneCenter, sceneRotation)
    boardPos = utilities.rotateVectorAroundCenter(boardPos, sceneCenter, sceneRotation)
    
    // if(!lockCollider) lockCollider = engine.addEntity()
    // Transform.createOrReplace(lockCollider, {
    //     position: Vector3.add(lockPos, Vector3.create(0, 0, 0)),
    //     scale: Vector3.create(0.72, 1.75, 0.72)
    // })
    // GltfContainer.createOrReplace(lockCollider, {src: 'models/lock_collider.glb', invisibleMeshesCollisionMask: ColliderLayer.CL_PHYSICS})
    
    // CameraModeArea.createOrReplace(lockCollider, {
    //     area: Vector3.create(3, 3, 3),
    //     mode: CameraType.CT_FIRST_PERSON, 
    // })

    movePlayerTo({
        newRelativePosition: lockPos,
        cameraTarget: Vector3.add(boardPos, Vector3.create(0, 0.1, 0)),
    })
    InputModifier.createOrReplace(engine.PlayerEntity, {
        mode: {
            $case: 'standard',
            standard: {
                disableAll: true,
            },
        },
    })

    if(!hideArea) hideArea = engine.addEntity()
        Transform.createOrReplace(hideArea, {
            position: Vector3.create(6,1,8),
            scale: Vector3.create(11, 5, 12)
        })
        
        let userData = getPlayer()
        if(userData){
            AvatarModifierArea.createOrReplace(hideArea, {
                area:  Vector3.create(11, 5, 12),
                modifiers: [AvatarModifierType.AMT_HIDE_AVATARS],
                excludeIds: [userData.userId]})
            
        }
   // engine.addSystem(LockSystem)
}

export function unlockPlayer(){
    let sceneTransform = Transform.get(sceneParentEntity)
    let sceneRotation = sceneTransform.rotation
    let sceneCenter = sceneTransform.position

    //engine.removeSystem(LockSystem)

    if(!lockCollider) lockCollider = engine.addEntity()
    Transform.createOrReplace(lockCollider, {
        position: Vector3.create(8, -2, 8), 
        scale: Vector3.create(0.72, 1.75, 0.72)
    })
    
    let unlockPos = utilities.rotateVectorAroundCenter(spectatorPos, sceneCenter, sceneRotation)
    movePlayerTo({
        newRelativePosition: unlockPos,
        cameraTarget: Vector3.add(Vector3.add(sceneCenter, Vector3.create(0, 1, 0)), Vector3.create(0, 0.5, 0)),
    })
    InputModifier.createOrReplace(engine.PlayerEntity, {
        mode: {
            $case: 'standard',
            standard: {
                disableAll: false,
            },
        },
    })
    if(hideArea){
        Transform.getMutable(hideArea).position.y = 14
    }
}

export function initCamera() {
    try {
        if(!customCameraEnt) {
            let sceneTransform = Transform.get(sceneParentEntity)
            let sceneRotation = sceneTransform.rotation
            let sceneCenter = sceneTransform.position            
            cameraPos = utilities.rotateVectorAroundCenter(cameraPos, sceneCenter, sceneRotation)

            customCameraEnt = engine.addEntity()
            Transform.create(customCameraEnt, {
                position: Vector3.create(cameraPos.x, cameraPos.y, cameraPos.z),
                rotation: Quaternion.fromEulerDegrees(42,-90,0)
            })
            VirtualCamera.create(customCameraEnt, {
                defaultTransition: { transitionMode: VirtualCamera.Transition.Time(0.5) },
            })
        }
    } catch (error) {
        console.error(error); 
    }
}

export function blockCamera() {
    try {
        MainCamera.createOrReplace(engine.CameraEntity, {
            virtualCameraEntity: customCameraEnt,
        })    
        
    } catch (error) {
        console.error(error); 
    }
}
export function freeCamera() {
    try {
        MainCamera.getMutable(engine.CameraEntity).virtualCameraEntity = undefined
    } catch (error) {
        console.error(error); 
    }
}