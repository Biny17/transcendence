'use client'
import type { LoadWorldPayload, StartWorldPayload } from '../../shared/protocol'
import { SERVER_MSG } from '../../shared/protocol'
import type { World } from '../2.world/WorldClass'
import type { NetworkManager } from './network/NetworkManager'
async function loadWorldById(worldId: string): Promise<World> {
  const name = `${worldId.charAt(0).toUpperCase()}${worldId.slice(1)}World`
  const mod = await import(`../2.world/worlds/${name}`)
  const Ctor = mod[name]
  if (!Ctor) throw new Error(`[Engine] No export "${name}" in worlds/${name}.ts`)
  return new Ctor()
}
export class OnlineModeHandler {
  private pendingWorldId: string | null = null
  constructor(
    private readonly nm: NetworkManager,
    private readonly load: (world: World) => Promise<void>,
    private readonly startActive: (initialState?: unknown) => void,
  ) {
    this.setup()
  }
  private setup(): void {
    const { nm } = this
    nm.on<LoadWorldPayload>(SERVER_MSG.LOAD_WORLD, async (payload) => {
      this.pendingWorldId = payload.worldId
      try {
        const world = await loadWorldById(payload.worldId)
        await this.load(world)
        nm.sendAssetsReady()
      } catch (e) {
        console.error(`[Engine] Failed to load world "${payload.worldId}":`, e)
        this.pendingWorldId = null
      }
    })
    nm.on<StartWorldPayload>(SERVER_MSG.START_WORLD, (payload) => {
      if (!this.pendingWorldId) return
      this.startActive(payload.initialState)
      this.pendingWorldId = null
    })
  }
}
