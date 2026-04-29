import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { Module, EngineContext } from '@/ThreeWrapper/5.modules/Module'
export type CameraMode = 'orbit' | 'third-person' | 'free'
export interface CameraModuleOptions {
  mode?: CameraMode
  target?: THREE.Object3D
  distance?: number
  angle?: number
}
export class CameraModule implements Module {
  readonly type = 'camera'
  private context: EngineContext | null = null
  private mode: CameraMode
  private target: THREE.Object3D | null
  private distance: number
  private angle: number
  private orbitControls: OrbitControls | null = null
  private yaw = 0
  private pitch = 0
  constructor(options: CameraModuleOptions = {}) {
    this.mode = options.mode ?? 'orbit'
    this.target = options.target ?? null
    this.distance = options.distance ?? 2
    this.angle = options.angle ?? 0.7
  }
  init(context: EngineContext): void {
    this.context = context
    this.applyMode()
  }
  private applyMode(): void {
    if (!this.context) return
    if (this.orbitControls) {
      this.orbitControls.dispose()
      this.orbitControls = null
    }
    if (this.mode === 'orbit') {
      this.orbitControls = new OrbitControls(this.context.camera, this.context.canvas)
      if (this.target) {
        this.orbitControls.target.copy(this.target.position)
      }
      this.orbitControls.update()
    }
  }
  setMode(mode: CameraMode): void {
    this.mode = mode
    this.applyMode()
  }
  setTarget(object: THREE.Object3D): void {
    this.target = object
    if (this.mode === 'orbit' && this.orbitControls) {
      this.orbitControls.target.copy(object.position)
      this.orbitControls.update()
    }
  }
  setRotation(yaw: number, pitch: number): void {
    this.yaw = yaw
    this.pitch = pitch
  }
  update(_delta: number): void {
    if (!this.context) return
    if (this.mode === 'orbit' && this.orbitControls) {
      if (this.target) {
        this.orbitControls.target.copy(this.target.position)
      }
      this.orbitControls.update()
      return
    }
    if (this.mode === 'third-person' && this.target) {
      const camera = this.context.camera
      const obj = this.target
      const bbox = new THREE.Box3().setFromObject(obj)
      const size = new THREE.Vector3()
      bbox.getSize(size)
      const cameraDistance = Math.max(size.x, size.y, size.z) * this.distance
      const direction = new THREE.Vector3(0, 0, -1)
      direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw)
      direction.applyAxisAngle(new THREE.Vector3(1, 0, 0), this.pitch)
      camera.position.copy(obj.position).addScaledVector(direction, cameraDistance)
      camera.position.y += size.y * this.angle
      camera.lookAt(obj.position)
    }
  }
  dispose(): void {
    this.orbitControls?.dispose()
    this.orbitControls = null
    this.context = null
  }
}
