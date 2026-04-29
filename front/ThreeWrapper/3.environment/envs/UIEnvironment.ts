import { Environment } from '@/ThreeWrapper/3.environment/EnvironmentClass'
import { ResizeModule } from '@/ThreeWrapper/4.module/index'
export class UIEnvironment extends Environment {
	constructor() {
		super({ id: 'ui' })
		this.addModule(new ResizeModule())
	}
}
