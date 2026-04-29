import * as THREE from 'three'
import type { Module, WorldContext } from '@/ThreeWrapper/4.module'
import { ModuleKey } from '@/ThreeWrapper/4.module'
import type { InputModule } from '../input/InputModule'
export type FreecamModuleOptions = {
  moveSpeed?: number
  fastMultiplier?: number
}
export class FreecamModule implements Module {
  readonly type = 'freecam'
  readonly requires = [ModuleKey.input] as const
  private ctx: WorldContext | null = null
  private input: InputModule | null = null
  private moveSpeed: number
  private fastMultiplier: number
  private yaw = 0
  private pitch = 0
  private enabled = true
  constructor(options: FreecamModuleOptions = {}) {
    this.moveSpeed = options.moveSpeed ?? 10
    this.fastMultiplier = options.fastMultiplier ?? 3
  }
  enable() { this.enabled = true }
  disable() { this.enabled = false }
  init(ctx: WorldContext): void {
    this.ctx = ctx
    this.input = ctx.getModule<InputModule>(ModuleKey.input) ?? null
    const euler = new THREE.Euler().setFromQuaternion(ctx.camera.quaternion, 'YXZ')
    this.yaw = euler.y
    this.pitch = euler.x
  }
  update(delta: number): void {
    if (!this.enabled || !this.input || !this.ctx) return
    const camera = this.ctx.camera
    const mouse = this.input.getMouseDelta()
    this.yaw -= mouse.x
    this.pitch -= mouse.y
    this.pitch = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, this.pitch))
    camera.rotation.order = 'YXZ'
    camera.rotation.y = this.yaw
    camera.rotation.x = this.pitch
    const fast = this.input.isActionPressed('sprint') ? this.fastMultiplier : 1
    const speed = this.moveSpeed * fast * delta
    const forward = new THREE.Vector3()
    camera.getWorldDirection(forward)
    const right = new THREE.Vector3()
    right.crossVectors(forward, THREE.Object3D.DEFAULT_UP).normalize()
    const up = new THREE.Vector3(0, 1, 0)
    if (this.input.isActionPressed('move_forward')) camera.position.addScaledVector(forward, speed)
    if (this.input.isActionPressed('move_backward')) camera.position.addScaledVector(forward, -speed)
    if (this.input.isActionPressed('move_right')) camera.position.addScaledVector(right, speed)
    if (this.input.isActionPressed('move_left')) camera.position.addScaledVector(right, -speed)
    if (this.input.isActionPressed('jump')) camera.position.addScaledVector(up, speed)
    if (this.input.isActionPressed('crouch')) camera.position.addScaledVector(up, -speed)
  }
  dispose(): void {
    this.input = null
    this.ctx = null
  }
}
