import type { Module, WorldContext } from '@/ThreeWrapper/4.module'
import type { Zone, ZoneShape } from '@/ThreeWrapper/2.world/tools/PhysicsWorld'
export type Checkpoint = {
  id: string
  order: number
  center: { x: number; y: number; z: number }
  shape: ZoneShape
}
export type CheckpointModuleOptions = {
  checkpoints?: Checkpoint[]
  onCheckpointReached?: (playerId: string, checkpoint: Checkpoint, progress: number) => void
  onAllCompleted?: (playerId: string) => void
}
export class CheckpointModule implements Module {
  readonly type = 'checkpoint'
  private ctx: WorldContext | null = null
  private checkpoints: Checkpoint[] = []
  private playerProgress: Map<string, number> = new Map()
  private onCheckpointReached: ((playerId: string, checkpoint: Checkpoint, progress: number) => void) | null
  private onAllCompleted: ((playerId: string) => void) | null
  constructor(options: CheckpointModuleOptions = {}) {
    this.checkpoints = (options.checkpoints ?? []).sort((a, b) => a.order - b.order)
    this.onCheckpointReached = options.onCheckpointReached ?? null
    this.onAllCompleted = options.onAllCompleted ?? null
  }
  init(ctx: WorldContext): void {
    this.ctx = ctx
    for (const cp of this.checkpoints) {
      ctx.objects.addZone({
        id: `checkpoint_${cp.id}`,
        center: cp.center,
        shape: cp.shape,
        onEnter: (obj) => {
          if (obj.type !== 'player') return
          const playerId = obj.extraData?.playerId as string | undefined
          if (!playerId) return
          this.reachCheckpoint(playerId, cp)
        },
      })
    }
  }
  addCheckpoint(checkpoint: Checkpoint): void {
    this.checkpoints.push(checkpoint)
    this.checkpoints.sort((a, b) => a.order - b.order)
    this.ctx?.objects.addZone({
      id: `checkpoint_${checkpoint.id}`,
      center: checkpoint.center,
      shape: checkpoint.shape,
      onEnter: (obj) => {
        if (obj.type !== 'player') return
        const playerId = obj.extraData?.playerId as string | undefined
        if (!playerId) return
        this.reachCheckpoint(playerId, checkpoint)
      },
    })
  }
  private reachCheckpoint(playerId: string, checkpoint: Checkpoint): void {
    const currentProgress = this.playerProgress.get(playerId) ?? -1
    if (checkpoint.order <= currentProgress) return
    if (checkpoint.order !== currentProgress + 1) return
    this.playerProgress.set(playerId, checkpoint.order)
    const progress = (checkpoint.order + 1) / this.checkpoints.length
    this.onCheckpointReached?.(playerId, checkpoint, progress)
    if (checkpoint.order === this.checkpoints.length - 1) {
      this.onAllCompleted?.(playerId)
    }
  }
  getPlayerProgress(playerId: string): number {
    return this.playerProgress.get(playerId) ?? -1
  }
  getLastCheckpoint(playerId: string): Checkpoint | null {
    const progress = this.playerProgress.get(playerId) ?? -1
    if (progress < 0) return null
    return this.checkpoints.find(cp => cp.order === progress) ?? null
  }
  resetPlayer(playerId: string): void {
    this.playerProgress.delete(playerId)
  }
  resetAll(): void {
    this.playerProgress.clear()
  }
  update(_delta: number): void {}
  dispose(): void {
    if (this.ctx) {
      for (const cp of this.checkpoints) {
        this.ctx.objects.removeZone(`checkpoint_${cp.id}`)
      }
    }
    this.playerProgress.clear()
    this.onCheckpointReached = null
    this.onAllCompleted = null
    this.ctx = null
  }
}
