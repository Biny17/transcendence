import type { PlayerState, WorldState, Vec3 } from '../shared/types'
import type { PlayerInputPayload } from '../shared/protocol'
const MAX_SPEED = 15 
const MAX_MESSAGES_PER_SECOND = 30
export class WorldSync {
  private players = new Map<string, PlayerState>()
  private events: WorldState['events'] = []
  private tick = 0
  private messageCounts = new Map<string, number>()
  private lastRateReset = Date.now()
  addPlayer(id: string): void {
    this.players.set(id, {
      id,
      pos: { x: 0, y: 1, z: 0 },
      rot: { x: 0, y: 0, z: 0, w: 1 },
      health: 100,
      score: 0,
    })
    this.messageCounts.set(id, 0)
  }
  removePlayer(id: string): void {
    this.players.delete(id)
    this.messageCounts.delete(id)
  }
  handleInput(playerId: string, input: PlayerInputPayload): null | WorldState {
    if (!this.checkRateLimit(playerId)) {
      console.warn(`[WorldSync] Rate limit exceeded for ${playerId}`)
      return null;
    }
    const player = this.players.get(playerId)
    if (!player) return null;
    player.pos = input.pos
    player.rot = input.rot
    if (input.action) player.action = input.action
    if (input.action) {
      this.processAction(playerId, input.action, input.pos)
    }
    return this.getWorldState();
  }
  private processAction(playerId: string, action: string, pos: Vec3): void {
    if (action.startsWith('checkpoint:')) {
      const index = parseInt(action.split(':')[1])
      this.events.push({
        type: 'checkpoint',
        data: { playerId, index, pos },
        tick: this.tick,
      })
    }
    if (action.startsWith('hit:')) {
      const targetId = action.split(':')[1]
      this.events.push({
        type: 'hit',
        data: { attackerId: playerId, targetId },
        tick: this.tick,
      })
    }
  }
  private validateSpeed(prevPos: Vec3, newPos: Vec3): boolean {
    const dx = newPos.x - prevPos.x
    const dy = newPos.y - prevPos.y
    const dz = newPos.z - prevPos.z
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
    return dist <= MAX_SPEED * 0.05
  }
  private checkRateLimit(playerId: string): boolean {
    const now = Date.now()
    if (now - this.lastRateReset > 1000) {
      this.messageCounts.clear()
      this.lastRateReset = now
    }
    const count = (this.messageCounts.get(playerId) ?? 0) + 1
    this.messageCounts.set(playerId, count)
    return true
  }
  getWorldState(): WorldState {
    this.tick++
    const state: WorldState = {
      tick: this.tick,
      players: [...this.players.values()],
      events: this.events.splice(0), 
    }
    return state
  }
}
