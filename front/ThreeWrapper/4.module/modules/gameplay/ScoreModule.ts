import type { Module, WorldContext } from '@/ThreeWrapper/4.module'
export type ScoreEntry = {
  playerId: string
  score: number
}
export type ScoreModuleOptions = {
  initialScores?: ScoreEntry[]
  onScoreChange?: (playerId: string, score: number) => void
}
export class ScoreModule implements Module {
  readonly type = 'score'
  private ctx: WorldContext | null = null
  private scores: Map<string, number> = new Map()
  private onScoreChange: ((playerId: string, score: number) => void) | null
  constructor(options: ScoreModuleOptions = {}) {
    this.onScoreChange = options.onScoreChange ?? null
    if (options.initialScores) {
      for (const entry of options.initialScores) {
        this.scores.set(entry.playerId, entry.score)
      }
    }
  }
  init(ctx: WorldContext): void {
    this.ctx = ctx
  }
  setScore(playerId: string, score: number): void {
    this.scores.set(playerId, score)
    this.onScoreChange?.(playerId, score)
  }
  addScore(playerId: string, amount: number): number {
    const current = this.scores.get(playerId) ?? 0
    const newScore = current + amount
    this.setScore(playerId, newScore)
    return newScore
  }
  getScore(playerId: string): number {
    return this.scores.get(playerId) ?? 0
  }
  getAllScores(): ScoreEntry[] {
    return Array.from(this.scores.entries())
      .map(([playerId, score]) => ({ playerId, score }))
  }
  getRankings(): ScoreEntry[] {
    return this.getAllScores().sort((a, b) => b.score - a.score)
  }
  resetAll(): void {
    this.scores.clear()
  }
  resetPlayer(playerId: string): void {
    this.scores.delete(playerId)
  }
  update(_delta: number): void {}
  dispose(): void {
    this.scores.clear()
    this.onScoreChange = null
    this.ctx = null
  }
}
