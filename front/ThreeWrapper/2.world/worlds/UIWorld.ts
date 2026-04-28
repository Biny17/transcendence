import { World } from '../WorldClass'
import { UIEnvironment } from '@/ThreeWrapper/3.environment/envs/UIEnvironment'
import { ModuleKey } from '@/ThreeWrapper/4.module'
import type { UIModule } from '@/ThreeWrapper/4.module/modules/ui/UIModule'
export type UIWorldArgs = {
	id?: string
}
export class UIWorld extends World {
	constructor(args: UIWorldArgs = {}) {
		super({ id: args.id ?? 'ui' })
	}
	protected setupEnvironment(): void {
		this.applyEnvironment(new UIEnvironment())
	}
	getUI(): UIModule {
		const ui = this.getModule<UIModule>(ModuleKey.ui)
		if (!ui) throw new Error('[UIWorld] UIModule not found')
		return ui
	}
}
