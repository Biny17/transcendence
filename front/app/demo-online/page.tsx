'use client'
import { EngineCanvas } from '../../ThreeWrapper/1.engine/EngineCanvas'
import { LobbyWorld } from '../../ThreeWrapper/2.world/worlds/LobbyWorld'
export default function OnlineDemo() {
  return (
    <EngineCanvas
      config={{ mode: 'online', serverUrl: 'wss://ws.spacecowboy.fr/ws' }}
      world={() => new LobbyWorld()}
      style={{ width: '100vw', height: '100vh' }}
    />
  )
}
