import type { PlayerInputPayload } from '@/shared/protocol'
import type { Vec3 } from '@/shared/types'
const CHECKPOINT_POSITIONS: Vec3[] = [
  { x: 5, y: 1, z: 0 },
  { x: 10, y: 2, z: 0 },
  { x: 15, y: 4, z: 0 },
  { x: 20, y: 6, z: 0 },
]
const CHECKPOINT_RADIUS = 2.5
export class ParkourRules {
  private playerProgress = new Map<string, number>()
  addPlayer(id: string): void {
    this.playerProgress.set(id, -1)
  }
  removePlayer(id: string): void {
    this.playerProgress.delete(id)
  }
  validateCheckpoint(playerId: string, input: PlayerInputPayload): boolean {
    if (!input.action?.startsWith('checkpoint:')) return false
    const index = parseInt(input.action.split(':')[1])
    const current = this.playerProgress.get(playerId) ?? -1
    if (index !== current + 1) return false
    const checkpointPos = CHECKPOINT_POSITIONS[index]
    if (!checkpointPos) return false
    if (!this.isNear(input.pos, checkpointPos, CHECKPOINT_RADIUS)) return false
    this.playerProgress.set(playerId, index)
    return true
  }
  private isNear(a: Vec3, b: Vec3, radius: number): boolean {
    const dx = a.x - b.x
    const dy = a.y - b.y
    const dz = a.z - b.z
    return Math.sqrt(dx * dx + dy * dy + dz * dz) <= radius
  }
  hasFinished(playerId: string): boolean {
    return (this.playerProgress.get(playerId) ?? -1) >= CHECKPOINT_POSITIONS.length - 1
  }
  getProgress(playerId: string): number {
    const reached = this.playerProgress.get(playerId) ?? -1
    return (reached + 1) / CHECKPOINT_POSITIONS.length
  }
  getWinner(): string | null {
    for (const [id] of this.playerProgress) {
      if (this.hasFinished(id)) return id
    }
    return null
  }
}
