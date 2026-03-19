import type * as THREE from 'three'
import type { EventHandler } from '../1.engine/EventHandler'
import type { KeymapHandler } from '../1.engine/KeymapHandler'
import type { Logger } from '../1.engine/Logger'
import type { NetworkManager } from '../1.engine/network/NetworkManager'
export type EngineContext = {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  canvas: HTMLCanvasElement
  world: import('../2.world/WorldClass').World
  networkManager?: NetworkManager
  eventHandler?: EventHandler
  keymap?: KeymapHandler
  logger?: Logger
}
export interface Module {
  readonly type: string
  init(context: EngineContext): void | Promise<void>
  update?(delta: number): void
  dispose(): void
}
