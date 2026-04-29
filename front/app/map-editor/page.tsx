'use client'
import { EngineCanvas } from '@/ThreeWrapper/1.engine/EngineCanvas'
import { EditorWorld } from '@/ThreeWrapper/2.world/worlds/EditorWorld'

export default function EditorPage() {
  return (
    <EngineCanvas
      config={{ mode: 'standalone' }}
      world={() => new EditorWorld()}
      style={{ width: '100vw', height: '100vh' }}
    />
  )
}
