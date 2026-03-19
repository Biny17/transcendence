import type { Player } from '../shared/types'
type ClientWS = { send(data: string): void; close(): void }
const LOBBY_COUNTDOWN_MS = 10_000
export class LobbyManager {
  private players = new Map<string, Player>()
  private sockets = new Map<string, ClientWS>()
  private countdownTimer: ReturnType<typeof setTimeout> | null = null
  private countdownEnd = 0
  onAllReady: (() => void) | null = null
  addPlayer(id: string, ws: ClientWS): void {
    this.players.set(id, { id, ready: false, isSpectator: false })
    this.sockets.set(id, ws)
  }
  removePlayer(id: string): void {
    this.players.delete(id)
    this.sockets.delete(id)
    if (this.countdownTimer && !this.allReady()) {
      clearTimeout(this.countdownTimer)
      this.countdownTimer = null
    }
  }
  setReady(id: string): void {
    const player = this.players.get(id)
    if (!player) return
    player.ready = true
    if (this.allReady() && this.players.size > 0) {
      this.startCountdown()
    }
  }
  private allReady(): boolean {
    return [...this.players.values()].every((p) => p.ready)
  }
  private startCountdown(): void {
    if (this.countdownTimer) return
    this.countdownEnd = Date.now() + LOBBY_COUNTDOWN_MS
    this.countdownTimer = setTimeout(() => {
      this.onAllReady?.()
    }, LOBBY_COUNTDOWN_MS)
  }
  getState() {
    return {
      players: [...this.players.values()],
      countdown: Math.max(0, Math.round((this.countdownEnd - Date.now()) / 1000)),
    }
  }
  getPlayerCount(): number {
    return this.players.size
  }
  broadcast(message: string): void {
    for (const ws of this.sockets.values()) {
      ws.send(message)
    }
  }
}
