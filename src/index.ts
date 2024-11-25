import { addEnvironment } from './modules/environment'
import { Game } from './game'
import { sceneParentEntity } from './modules/globals'

export const multiPlayer = false

export function main() {
  
  let game = new Game()

  addEnvironment(sceneParentEntity)

  
  
}


