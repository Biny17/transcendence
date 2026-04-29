'use client'
import { EngineCanvas } from '@/ThreeWrapper/1.engine/EngineCanvas'
import { ComponentCreatorWorld } from '@/ThreeWrapper/2.world/worlds/ComponentCreatorWorld'

export default function ComponentCreatorPage() {
  return (
    <EngineCanvas
      config={{ mode: 'standalone' }}
      world={() => new ComponentCreatorWorld()}
      style={{ width: '100vw', height: '100vh' }}
    />
  )
}
