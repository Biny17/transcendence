import type { Module, WorldContext } from '../ModuleClass'
import type { RoundEndPayload } from '@/../shared/protocol'
import type { Ranking } from '@/../shared/state/world'
type GameState = {
  score: number
  level: number
  isActive: boolean
}
export class StateTrackerModule implements Module {
  readonly type = 'state-tracker'
  private state: GameState = {
    score: 0,
    level: 1,
    isActive: true,
  }
  init(_ctx: WorldContext): void {}
  update(_delta: number): void {}
  handleRoundEnd(payload: RoundEndPayload): void {
    const myRank = payload.rankings.find((r: Ranking) => r.score > 0)
    if (myRank) {
      this.state.score += myRank.score
    }
  }
  getState(): GameState {
    return { ...this.state }
  }
  dispose(): void {}
}
