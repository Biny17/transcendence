import * as THREE from 'three'
import type { Module, WorldContext } from '@/ThreeWrapper/4.module'
import type { WaypointAnimDef } from '@/ThreeWrapper/2.world/tools'
export type Waypoint = { x: number; y: number; z: number; rx?: number; ry?: number; rz?: number }
export type PlatformDef = {
  objectName: string
  waypoints: Waypoint[]
  speed?: number
  loop?: boolean
  pauseAtWaypoint?: number
}
export type MovingPlatformModuleOptions = {
  platforms?: PlatformDef[]
}
type PlatformState = {
  def: PlatformDef
  currentWaypoint: number
  direction: 1 | -1
  progress: number
  pauseTimer: number
  objectId: string | null
}
export class MovingPlatformModule implements Module {
  readonly type = 'moving_platform'
  private ctx: WorldContext | null = null
  private platforms: PlatformState[] = []
  constructor(options: MovingPlatformModuleOptions = {}) {
    for (const def of options.platforms ?? []) {
      this.platforms.push({
        def,
        currentWaypoint: 0,
        direction: 1,
        progress: 0,
        pauseTimer: 0,
        objectId: null,
      })
    }
  }
  init(ctx: WorldContext): void {
    this.ctx = ctx
    const explicitNames = new Set(this.platforms.map(p => p.def.objectName))
    const mapPlatforms = ctx.objects.getByType('moving_platform')
    for (const obj of mapPlatforms) {
      if (obj.pieces.length === 0) continue
      if (explicitNames.has(obj.name ?? obj.id)) continue
      const anims = obj.extraData?.animations as Record<string, WaypointAnimDef> | undefined
      if (!anims) continue
      for (const [, animDef] of Object.entries(anims)) {
        if (animDef?.kind !== 'waypoints') continue
        const base = obj.pieces[0].asset.position
        const baseRot = obj.pieces[0].asset.rotation
        const worldWaypoints = animDef.waypoints.map(wp => ({
          x: base.x + wp.position.x,
          y: base.y + wp.position.y,
          z: base.z + wp.position.z,
          rx: wp.rotation?.x ?? 0,
          ry: wp.rotation?.y ?? 0,
          rz: wp.rotation?.z ?? 0,
        }))
        this.platforms.push({
          def: {
            objectName:      obj.name ?? obj.id,
            waypoints:       worldWaypoints,
            speed:           animDef.speed,
            loop:            animDef.loop ?? false,
            pauseAtWaypoint: animDef.pauseAtWaypoint,
          },
          currentWaypoint: 0,
          direction: 1,
          progress: 0,
          pauseTimer: 0,
          objectId: obj.id,
        })
        break
      }
    }
    for (const state of this.platforms) {
      if (state.objectId === null) {
        const obj = ctx.objects.get(state.def.objectName)
        state.objectId = obj?.id ?? null
      }
    }
  }
  addPlatform(def: PlatformDef): void {
    const obj = this.ctx?.objects.get(def.objectName)
    this.platforms.push({
      def,
      currentWaypoint: 0,
      direction: 1,
      progress: 0,
      pauseTimer: 0,
      objectId: obj?.id ?? null,
    })
  }
  update(delta: number): void {
    if (!this.ctx) return
    for (const state of this.platforms) {
      this.updatePlatform(state, delta)
    }
  }
  private updatePlatform(state: PlatformState, delta: number): void {
    if (!this.ctx) return
    const { def } = state
    const waypoints = def.waypoints
    if (waypoints.length < 2) return
    if (state.pauseTimer > 0) {
      state.pauseTimer -= delta
      return
    }
    const speed = def.speed ?? 2
    const nextIdx = state.currentWaypoint + state.direction
    if (nextIdx < 0 || nextIdx >= waypoints.length) {
      if (def.loop) {
        state.direction = (state.direction * -1) as 1 | -1
      }
      return
    }
    const from = waypoints[state.currentWaypoint]
    const to   = waypoints[nextIdx]
    const dist = Math.sqrt(
      (to.x - from.x) ** 2 + (to.y - from.y) ** 2 + (to.z - from.z) ** 2,
    )
    if (dist === 0) return
    state.progress += (speed * delta) / dist
    if (state.progress >= 1) {
      state.progress = 0
      state.currentWaypoint = nextIdx
      state.pauseTimer = def.pauseAtWaypoint ?? 0
      this.setPosition(state, to)
    } else {
      this.setPosition(state, {
        x: from.x + (to.x - from.x) * state.progress,
        y: from.y + (to.y - from.y) * state.progress,
        z: from.z + (to.z - from.z) * state.progress,
        rx: from.rx !== undefined || to.rx !== undefined ? from.rx! + ((to.rx ?? 0) - (from.rx ?? 0)) * state.progress : undefined,
        ry: from.ry !== undefined || to.ry !== undefined ? from.ry! + ((to.ry ?? 0) - (from.ry ?? 0)) * state.progress : undefined,
        rz: from.rz !== undefined || to.rz !== undefined ? from.rz! + ((to.rz ?? 0) - (from.rz ?? 0)) * state.progress : undefined,
      })
    }
  }
  private setPosition(state: PlatformState, pos: Waypoint): void {
    if (!this.ctx || !state.objectId) return
    const obj = this.ctx.objects.getById(state.objectId)
    if (!obj || obj.pieces.length === 0) return
    const asset = obj.pieces[0].asset
    asset.position.set(pos.x, pos.y, pos.z)
    if (pos.rx !== undefined || pos.ry !== undefined || pos.rz !== undefined) {
      asset.rotation.set(
        pos.rx ?? asset.rotation.x,
        pos.ry ?? asset.rotation.y,
        pos.rz ?? asset.rotation.z,
      )
    }
    this.ctx.objects.setPosition(state.objectId, pos)
  }
  dispose(): void {
    this.platforms = []
    this.ctx = null
  }
}
