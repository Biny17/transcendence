'use client'
import { EngineCanvas } from '../../ThreeWrapper/1.engine/EngineCanvas'
import { DemoWorld } from '../../ThreeWrapper/2.world/worlds/DemoWorld'
export default function StandaloneDemo() {
  return (
    <EngineCanvas
      config={{ mode: 'standalone' , debug:{enabled:true,logPhases:true,showHitboxes:true, showBounds:true, logRenderState:true, logPhaseDurations:true,logPhysicsState:true}}}
      world={() => new DemoWorld()}
      style={{ width: '100vw', height: '100vh' }}
    />
  )
}
