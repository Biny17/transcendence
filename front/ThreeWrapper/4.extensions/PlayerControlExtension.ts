import * as THREE from 'three'
import type { Extension } from './Extension'
import type { EngineContext } from '../5.modules/Module'
import type { InputModule } from '../5.modules/input/InputModule'
export type PlayerControlOptions = {
  moveSpeed?: number
  mouseSensitivity?: number
}
export class PlayerControlExtension implements Extension {
  readonly type = 'player_control'
  private input: InputModule | null = null
  private camera: THREE.PerspectiveCamera | null = null
  private readonly moveSpeed: number
  private readonly mouseSensitivity: number
  private yaw = 0
  private pitch = 0
  constructor(options: PlayerControlOptions = {}) {
    this.moveSpeed = options.moveSpeed ?? 5
    this.mouseSensitivity = options.mouseSensitivity ?? 0.0015
  }
  init(context: EngineContext): void {
    this.camera = context.camera
    this.input = context.world.getModule<InputModule>('input') ?? null
    if (!this.input) {
      console.warn('[PlayerControlExtension] InputModule not found on world.')
    }
  }
  update(delta: number): void {
    if (!this.input || !this.camera) return
    const mouse = this.input.getMouseDelta()
    this.yaw   -= mouse.x
    this.pitch -= mouse.y
    this.pitch = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, this.pitch))
    this.camera.rotation.order = 'YXZ'
    this.camera.rotation.y = this.yaw
    this.camera.rotation.x = this.pitch
    const speed = this.moveSpeed * delta
    const forward = new THREE.Vector3()
    const right   = new THREE.Vector3()
    this.camera.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()
    right.crossVectors(forward, THREE.Object3D.DEFAULT_UP).normalize()
    if (this.input.isActionPressed('move_forward'))  this.camera.position.addScaledVector(forward,  speed)
    if (this.input.isActionPressed('move_backward')) this.camera.position.addScaledVector(forward, -speed)
    if (this.input.isActionPressed('move_right'))    this.camera.position.addScaledVector(right,    speed)
    if (this.input.isActionPressed('move_left'))     this.camera.position.addScaledVector(right,   -speed)
    if (this.input.isActionPressed('jump'))          this.camera.position.y += speed
  }
  dispose(): void {
    this.input = null
    this.camera = null
  }
}
