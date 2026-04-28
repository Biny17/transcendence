import { Environment } from '@/ThreeWrapper/3.environment/EnvironmentClass'
import { ResizeModule } from '@/ThreeWrapper/4.module/index'
export class VisualizerEnvironment extends Environment {
	constructor() {
		super({ id: 'visualizer' })
		this.addModule(new ResizeModule())
	}
}
