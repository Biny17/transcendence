import { createElement } from 'react'
import type { Extension } from './Extension'
import type { EngineContext } from '../5.modules/Module'
import type { UIModule } from '../5.modules/ui/UIModule'
import type { InputModule } from '../5.modules/input/InputModule'
import { EscapeMenu } from '../5.modules/ui/components/EscapeMenu'
import { HUD } from '../5.modules/ui/components/HUD'
import { KeybindsMenu } from '../5.modules/ui/components/KeybindsMenu'

export class UIExtension implements Extension {
	readonly type = 'ui_extension'
	private ui!: UIModule
	private context!: EngineContext
	private isPaused = false

	init(context: EngineContext): void {
		this.context = context
		const ui = context.world.getModule<UIModule>('ui')
		if (!ui) throw new Error('[UIExtension] UIModule is required — add it to the World first')
		this.ui = ui

		const input = context.world.getModule<InputModule>('input')
		const pauseKey = context.keymap?.getKey('pause') ?? 'Escape'
		input?.setKeyBinding(pauseKey, { action: 'pause', onDown: () => this.togglePause() })

		this.ui.show('hud', createElement(HUD))
		this.ui.disablePointer('hud')
	}

	togglePause(): void {
		this.isPaused ? this.closeEscapeMenu() : this.openEscapeMenu()
	}

	private openEscapeMenu(): void {
		this.isPaused = true
		this.ui.show('escape-menu', createElement(EscapeMenu, {
			onResume: () => this.closeEscapeMenu(),
			onKeybinds: () => this.openKeybindsMenu(),
		}))
		this.ui.enablePointer('escape-menu')
		document.exitPointerLock?.()
	}

	private closeEscapeMenu(): void {
		this.isPaused = false
		this.ui.hide('escape-menu')
		this.ui.hide('keybinds-menu')
	}

	openKeybindsMenu(): void {
		const bindings = this.context.keymap?.getAll() ?? []
		this.ui.show('keybinds-menu', createElement(KeybindsMenu, {
			bindings,
			onRebind: (action, key) => this.rebind(action, key),
			onClose: () => this.ui.hide('keybinds-menu'),
		}))
		this.ui.enablePointer('keybinds-menu')
	}

	rebind(action: string, key: string): void {
		this.context.keymap?.rebind(action, key)
		this.openKeybindsMenu()
	}

	dispose(): void {
		this.ui.hide('hud')
		this.ui.hide('escape-menu')
		this.ui.hide('keybinds-menu')
	}
}
