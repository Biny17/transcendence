import { createElement } from "react";
import type { Module, WorldContext } from "../../ModuleClass";
import { ModuleKey } from "../../ModuleClass";
import type { UIModule } from "./UIModule";
import type { InputModule } from "../input/InputModule";
import { EscapeMenu } from "./components/EscapeMenu";
import { HUD } from "./components/HUD";
import { KeybindsMenu } from "./components/KeybindsMenu";
export class EscapeUIModule implements Module {
	readonly type = "escape_ui";
	readonly requires = [ModuleKey.input] as const;
	private ui!: UIModule;
	private input!: InputModule;
	private ctx!: WorldContext;
	private isPaused = false;
	private _detachRequested = false;
	constructor(_dep1: typeof ModuleKey.ui, _dep2: typeof ModuleKey.input) {}
	async init(ctx: WorldContext): Promise<void> {
		this.ctx = ctx;
		const uiFromCtx = ctx.getModule<UIModule>(ModuleKey.ui);
		const uiFromWindow: UIModule | undefined = (window as any).__uiModule;
		this.ui = uiFromWindow ?? uiFromCtx ?? this.ui;
		if (!this.ui) throw new Error("[EscapeUIModule] UIModule is required — add it to the World first");
		this.input = ctx.getModule<InputModule>(ModuleKey.input)!;
		try {
			const stored = localStorage.getItem("game_keybindings");
			if (stored) {
				const bindings = JSON.parse(stored);
				for (const binding of bindings) {
					ctx.keymap.rebind(binding.action, binding.key);
				}
			}
		} catch (error) {
			console.error("[EscapeUIModule] Failed to load keybindings from localStorage:", error);
		}
		const pauseKey = ctx.keymap.getKey("pause") ?? "Escape";
		this.input?.setKeyBinding(pauseKey, { action: "pause", onDown: () => this.togglePause() });
		this.input?.setKeyBinding("F2", { action: "detach", onDown: () => {
			this._detachRequested = true;
			document.exitPointerLock?.();
		} });
		this.input?.onPointerLock((locked) => {
			if (this._detachRequested) {
				this._detachRequested = false;
				return;
			}
			if (!locked && !this.isPaused) {
				this.openEscapeMenu();
			}
		});
		this.ui.show("hud", createElement(HUD));
		this.ui.disablePointer("hud");
	}
	togglePause(): void {
		this.isPaused ? this.closeEscapeMenu() : this.openEscapeMenu();
	}
	private openEscapeMenu(): void {
		this.isPaused = true;
		this.input?.setEnabled(false);
		this.ui.show(
			"escape-menu",
			createElement(EscapeMenu, {
				onResume: () => this.closeEscapeMenu(),
				onKeybinds: () => this.openKeybindsMenu(),
				onReset: () => this.ctx.server?.send.reset()
			})
		);
		this.ui.enablePointer("escape-menu");
		document.exitPointerLock?.();
	}
	private closeEscapeMenu(): void {
		this.isPaused = false;
		this.input?.setEnabled(true);
		this.ui.hide("escape-menu");
		this.ui.hide("keybinds-menu");
	}
	openKeybindsMenu(): void {
		this.ui.show(
			"keybinds-menu",
			createElement(KeybindsMenu, {
				getBindings: () => this.ctx.keymap.getAll(),
				onRebind: (action, key) => this.rebind(action, key),
				onClose: () => this.ui.hide("keybinds-menu")
			})
		);
		this.ui.enablePointer("keybinds-menu");
	}
	rebind(action: string, key: string): void {
		const oldKey = this.ctx.keymap.getKey(action);
		this.ctx.keymap.rebind(action, key);
		this.input.onKeymapRebind(action, key, oldKey);
		this.openKeybindsMenu();
	}
	dispose(): void {
		this.ui?.hide("hud");
		this.ui?.hide("escape-menu");
		this.ui?.hide("keybinds-menu");
		this.ctx?.keymap.rebind("detach", "");
	}
}
