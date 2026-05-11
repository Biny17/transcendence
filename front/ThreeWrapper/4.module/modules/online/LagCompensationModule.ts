import * as THREE from 'three'
import { SERVER_MSG } from 'shared/protocol'
import type { WorldStatePayload } from 'shared/protocol'
import type { Module, WorldContext } from '@/ThreeWrapper/4.module'
import { ModuleKey } from '@/ThreeWrapper/4.module'
import { OBJECT_TYPE } from '@/ThreeWrapper/2.world/tools'

type PositionSnapshot = {
  pos: THREE.Vector3
  rot: THREE.Quaternion
  timestamp: number
}

export type RemotePlayerData = {
  velocity: THREE.Vector3
  horizontalSpeed: number
  verticalVelocity: number
  isGrounded: boolean
  position: THREE.Vector3
  rotation: THREE.Quaternion
}

export type LagCompensationModuleOptions = {
  interpolationDelay?: number
  maxSnapshots?: number
  /** Max distance before snapping to server state (teleport/respawn detection) */
  teleportThreshold?: number
}

export class LagCompensationModule implements Module {
  readonly type = ModuleKey.lagCompensation

  private ctx: WorldContext | null = null
  private snapshots: Map<string, PositionSnapshot[]> = new Map()
  private velocities: Map<string, THREE.Vector3> = new Map()
  private interpolationDelay: number
  private maxSnapshots: number
  private teleportThreshold: number
  private unsubscribe: (() => void) | null = null

  constructor(options: LagCompensationModuleOptions = {}) {
    this.interpolationDelay = options.interpolationDelay ?? 100
    this.maxSnapshots = options.maxSnapshots ?? 20
    this.teleportThreshold = options.teleportThreshold ?? 10
  }

  init(ctx: WorldContext): void {
    this.ctx = ctx
    this.unsubscribe = ctx.server?.on(
      SERVER_MSG.WORLD_STATE,
      (payload: WorldStatePayload) => {
        const now = Date.now()
        for (const playerState of payload.players) {
          const id = playerState.id
          if (id === ctx.selfWorldPlayer?.id) continue
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
      if (!obj) continue
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
        obj.position.lerpVectors(from.pos, to.pos, t)
        obj.rotation.slerpQuaternions(from.rot, to.rot, t)
        this.computeVelocity(playerId, from, to)
      } else {
        const latest = buffer[buffer.length - 1]
        const dist = obj.position.distanceTo(latest.pos)
        if (dist > this.teleportThreshold) {
          obj.position.copy(latest.pos)
          obj.rotation.copy(latest.rot)
        } else {
          obj.position.lerp(latest.pos, 0.15)
          obj.rotation.slerp(latest.rot, 0.15)
        }
        this.velocities.set(playerId, new THREE.Vector3(0, 0, 0))
      }

      this.ctx.objects.setPosition(playerId, { x: obj.position.x, y: obj.position.y, z: obj.position.z })
      this.ctx.objects.setRotation(playerId, { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z, w: obj.rotation.w })
      this.ctx.objects.setGravityScale(playerId, 0)
      this.ctx.objects.setVelocity(playerId, { x: 0, y: 0, z: 0 })
    }
  }

  private computeVelocity(id: string, from: PositionSnapshot, to: PositionSnapshot): void {
    const dt = (to.timestamp - from.timestamp) / 1000
    if (dt <= 0) return
    const vel = new THREE.Vector3()
      .copy(to.pos)
      .sub(from.pos)
      .divideScalar(dt)
    this.velocities.set(id, vel)
  }

  /** Returns estimated movement data for a remote player (used by PlayerAnimationModule). */
  getRemotePlayerData(id: string): RemotePlayerData | undefined {
    const vel = this.velocities.get(id)
    const obj = this.ctx?.objects.getById(id, OBJECT_TYPE.PLAYER)
    if (!vel || !obj) return undefined
    const horizontalSpeed = Math.sqrt(vel.x * vel.x + vel.z * vel.z)
    const verticalVelocity = vel.y
    const isGrounded = Math.abs(verticalVelocity) < 0.3
    return {
      velocity: vel.clone(),
      horizontalSpeed,
      verticalVelocity,
      isGrounded,
      position: obj.position.clone(),
      rotation: obj.rotation.clone(),
    }
  }

  setInterpolationDelay(ms: number): void {
    this.interpolationDelay = ms
  }

  dispose(): void {
    this.unsubscribe?.()
    this.snapshots.clear()
    this.velocities.clear()
    this.ctx = null
  }
}
