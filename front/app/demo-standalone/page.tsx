'use client'
import { VisualizerWorld } from '@/ThreeWrapper/2.world/worlds/VisualizerWorld'
import { EngineCanvas } from '../../ThreeWrapper/1.engine/EngineCanvas'
import { DemoWorld } from '../../ThreeWrapper/2.world/worlds/DemoWorld'
import { ParkourWorld } from '@/ThreeWrapper/2.world/worlds/ParkourWorld'
export default function StandaloneDemo() {
  return (
	<div className='bg-black'>
		<EngineCanvas
		config={{ mode: 'standalone'}}
		
		world={()=> new ParkourWorld()}	  
		//world={() => new VisualizerWorld({object:"charactere/scene.gltf", cameraPos:{x:0,y:2,z:5}})}
		style={{ width: '100vw', height: '100vh' }}
		/>
    	</div>
  )
}
