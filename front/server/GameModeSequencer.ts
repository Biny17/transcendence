import type { AssetManifest, EnvConfig } from '../shared/types'
import { createMessage, SERVER_MSG } from '../shared/protocol'
type BroadcastFn = (msg: string) => void
type GameModeEntry = {
  modeId: string
  assets: AssetManifest[]
  envConfig: EnvConfig
}
export class GameModeSequencer {
  private queue: GameModeEntry[] = []
  private currentIndex = -1
  private readyPlayers = new Set<string>()
  private totalPlayers = 0
  private broadcast: BroadcastFn = () => {}
  setBroadcast(fn: BroadcastFn): void {
    this.broadcast = fn
  }
  setTotalPlayers(n: number): void {
    this.totalPlayers = n
  }
  addGameMode(entry: GameModeEntry): void {
    this.queue.push(entry)
  }
  nextGameMode(): void {
    this.currentIndex++
    if (this.currentIndex >= this.queue.length) {
      console.log('[Sequencer] No more GameModes in queue')
      return
    }
    this.readyPlayers.clear()
    const entry = this.queue[this.currentIndex]
    this.broadcast(JSON.stringify(createMessage(SERVER_MSG.LOAD_GAMEMODE, entry)))
    console.log(`[Sequencer] Loading GameMode: ${entry.modeId}`)
  }
  markAssetsReady(playerId: string): void {
    this.readyPlayers.add(playerId)
    if (this.readyPlayers.size >= this.totalPlayers) {
      this.startCurrentGameMode()
    }
  }
  private startCurrentGameMode(): void {
    const entry = this.queue[this.currentIndex]
    if (!entry) return
    const initialState = {
      tick: 0,
      players: [],
      events: [],
    }
    this.broadcast(JSON.stringify(createMessage(SERVER_MSG.GAMEMODE_START, { initialState })))
    console.log(`[Sequencer] GameMode started: ${entry.modeId}`)
  }
  endCurrentGameMode(scores: { playerId: string; value: number }[]): void {
    const rankings = scores
      .sort((a, b) => b.value - a.value)
      .map((s, i) => ({ playerId: s.playerId, rank: i + 1, score: s.value }))
    this.broadcast(JSON.stringify(createMessage(SERVER_MSG.GAMEMODE_END, { scores, rankings })))
  }
}
