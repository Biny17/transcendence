import { type Module } from '@/ThreeWrapper/4.module'
export class Environment {
	readonly config: {} = {}
	protected modules: Module[] = []
	constructor(config: {}) {
		this.config = config
	}
	protected addModule(module: Module): void {
		this.modules.push(module)
	}
	getModules(): Module[] {
		return this.modules
	}
}
