import type { Module, WorldContext } from '../ModuleClass'
import type { RoundEndPayload } from 'shared/protocol'
export class EventListenerModule implements Module {
  readonly type = 'event-listener'
  init(_ctx: WorldContext): void {}
  handleRoundEnd(payload: RoundEndPayload): void {
    console.log(`[EventListenerModule] Round ended`, payload.rankings)
  }
  dispose(): void {}
}
