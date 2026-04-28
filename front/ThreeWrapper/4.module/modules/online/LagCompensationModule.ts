import * as THREE from 'three'
import { SERVER_MSG } from 'shared/protocol'
import type { WorldStatePayload } from 'shared/protocol'
import type { Module, WorldContext } from '@/ThreeWrapper/4.module'
import { OBJECT_TYPE } from '@/ThreeWrapper/2.world/tools'
type PositionSnapshot = {
  pos: THREE.Vector3
  rot: THREE.Quaternion
  timestamp: number
}
export type LagCompensationModuleOptions = {
  interpolationDelay?: number
  maxSnapshots?: number
}
export class LagCompensationModule implements Module {
  readonly type = 'lag_compensation'
  private ctx: WorldContext | null = null
  private snapshots: Map<string, PositionSnapshot[]> = new Map()
  private interpolationDelay: number
  private maxSnapshots: number
  private unsubscribe: (() => void) | null = null
  constructor(options: LagCompensationModuleOptions = {}) {
    this.interpolationDelay = options.interpolationDelay ?? 100
    this.maxSnapshots = options.maxSnapshots ?? 20
  }
  init(ctx: WorldContext): void {
    this.ctx = ctx
    this.unsubscribe = ctx.server?.on(
      SERVER_MSG.WORLD_STATE,
      (payload: WorldStatePayload) => {
        const now = Date.now()
        for (const playerState of payload.players) {
          const id = playerState.id
          if (!this.snapshots.has(id)) this.snapshots.set(id, [])
          const buffer = this.snapshots.get(id)!
          buffer.push({
            pos: new THREE.Vector3(playerState.pos.x, playerState.pos.y, playerState.pos.z),
            rot: new THREE.Quaternion(playerState.rot.x, playerState.rot.y, playerState.rot.z, playerState.rot.w),
            timestamp: now,
          })
          if (buffer.length > this.maxSnapshots) buffer.shift()
        }
      },
    ) ?? null
  }
  update(_delta: number): void {
    if (!this.ctx) return
    const renderTime = Date.now() - this.interpolationDelay
    for (const [playerId, buffer] of this.snapshots) {
      if (buffer.length < 2) continue
      const obj = this.ctx.objects.getById(playerId, OBJECT_TYPE.PLAYER)
      const piece = obj?.pieces[0]
      if (!piece) continue
      if (obj.extraData?.isLocalPlayer) continue
      let from: PositionSnapshot | null = null
      let to: PositionSnapshot | null = null
      for (let i = 0; i < buffer.length - 1; i++) {
        if (buffer[i].timestamp <= renderTime && buffer[i + 1].timestamp >= renderTime) {
          from = buffer[i]
          to = buffer[i + 1]
          break
        }
      }
      if (from && to) {
        const range = to.timestamp - from.timestamp
        const t = range > 0 ? (renderTime - from.timestamp) / range : 0
        piece.asset.position.lerpVectors(from.pos, to.pos, t)
        piece.asset.quaternion.slerpQuaternions(from.rot, to.rot, t)
      } else if (buffer.length > 0) {
        const latest = buffer[buffer.length - 1]
        piece.asset.position.lerp(latest.pos, 0.1)
        piece.asset.quaternion.slerp(latest.rot, 0.1)
      }
    }
  }
  setInterpolationDelay(ms: number): void {
    this.interpolationDelay = ms
  }
  dispose(): void {
    this.unsubscribe?.()
    this.snapshots.clear()
    this.ctx = null
  }
}
