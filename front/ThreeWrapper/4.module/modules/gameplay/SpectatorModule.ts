import * as THREE from 'three'
import type { Module, WorldContext } from '@/ThreeWrapper/4.module'
import { OBJECT_TYPE } from '@/ThreeWrapper/2.world/tools'
export type SpectatorModuleOptions = {
  followDistance?: number
  followHeight?: number
  smoothing?: number
}
export class SpectatorModule implements Module {
  readonly type = 'spectator'
  readonly requires = [] as const
  private ctx: WorldContext | null = null
  private active = false
  private targetId: string | null = null
  private targetIds: string[] = []
  private currentIndex = 0
  private followDistance: number
  private followHeight: number
  private smoothing: number
  constructor(options: SpectatorModuleOptions = {}) {
    this.followDistance = options.followDistance ?? 5
    this.followHeight = options.followHeight ?? 3
    this.smoothing = options.smoothing ?? 5
  }
  init(ctx: WorldContext): void {
    this.ctx = ctx
  }
  activate(): void {
    if (!this.ctx) return
    this.active = true
    this.targetIds = this.ctx.objects.getByType(OBJECT_TYPE.PLAYER)
      .filter(p => !p.extraData.serverData.isSpectator)
      .map(p => p.id)
    if (this.targetIds.length > 0) {
      this.currentIndex = 0
      this.targetId = this.targetIds[0]
    }
  }
  deactivate(): void {
    this.active = false
    this.targetId = null
  }
  isActive(): boolean {
    return this.active
  }
  nextTarget(): void {
    if (this.targetIds.length === 0) return
    this.currentIndex = (this.currentIndex + 1) % this.targetIds.length
    this.targetId = this.targetIds[this.currentIndex]
  }
  previousTarget(): void {
    if (this.targetIds.length === 0) return
    this.currentIndex = (this.currentIndex - 1 + this.targetIds.length) % this.targetIds.length
    this.targetId = this.targetIds[this.currentIndex]
  }
  setTarget(playerId: string): void {
    const idx = this.targetIds.indexOf(playerId)
    if (idx >= 0) {
      this.currentIndex = idx
      this.targetId = playerId
    }
  }
  removeTarget(playerId: string): void {
    this.targetIds = this.targetIds.filter(id => id !== playerId)
    if (this.targetId === playerId) {
      this.currentIndex = Math.min(this.currentIndex, this.targetIds.length - 1)
      this.targetId = this.targetIds[this.currentIndex] ?? null
    }
  }
  getCurrentTargetId(): string | null {
    return this.targetId
  }
  update(delta: number): void {
    if (!this.active || !this.ctx || !this.targetId) return
    const obj = this.ctx.objects.getById(this.targetId, OBJECT_TYPE.PLAYER)
    const piece = obj?.pieces[0]
    if (!piece) return
    const targetPos = piece.asset.position
    const camera = this.ctx.camera
    const desiredPos = new THREE.Vector3(
      targetPos.x,
      targetPos.y + this.followHeight,
      targetPos.z + this.followDistance,
    )
    camera.position.lerp(desiredPos, this.smoothing * delta)
    camera.lookAt(targetPos)
  }
  dispose(): void {
    this.active = false
    this.targetId = null
    this.targetIds = []
    this.ctx = null
  }
}
