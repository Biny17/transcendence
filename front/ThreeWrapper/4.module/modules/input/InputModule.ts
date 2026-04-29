import { Logger } from "@/ThreeWrapper/1.engine/tools";
import type { Module, WorldContext } from "@/ThreeWrapper/4.module";
export interface KeyBinding {
	action: string;
	fn?: (delta: number) => void;
	onDown?: () => void;
}
export interface InputModuleOptions {
	enablePointerLock?: boolean;
	mouseSensitivity?: number;
	keymap?: Record<string, KeyBinding>;
}
export class InputModule implements Module {
	readonly type = "input";
	private ctx: WorldContext | null = null;
	private options: Required<InputModuleOptions>;
	private keymap: Map<string, KeyBinding>;
	private pressed = new Set<string>();
	private justPressed = new Set<string>();
	private pendingJustPressed = new Set<string>();
	private mouseDelta = { x: 0, y: 0 };
	private isLocked = false;
	private enabled = true;
	private pointerLockCallbacks: Array<(locked: boolean) => void> = [];
	private _onKeyDown: (e: KeyboardEvent) => void;
	private _onKeyUp: (e: KeyboardEvent) => void;
	private _onMouseMove: (e: MouseEvent) => void;
	private _onPointerLockChange: () => void;
	private _onCanvasClick: () => void;
	constructor(options: InputModuleOptions = {}) {
		this.options = {
			enablePointerLock: options.enablePointerLock ?? false,
			mouseSensitivity: options.mouseSensitivity ?? 0.0015,
			keymap: options.keymap ?? {},
		};
		this.keymap = new Map(Object.entries(this.options.keymap));
		this._onKeyDown = (e: KeyboardEvent) => {
			if (e.repeat) return;
			if (!this.enabled) return;
			const binding = this.keymap.get(e.code);
			if (!binding) return;
			this.pressed.add(binding.action);
			this.pendingJustPressed.add(binding.action);
			binding.onDown?.();
		};
		this._onKeyUp = (e: KeyboardEvent) => {
			const binding = this.keymap.get(e.code);
			if (binding) this.pressed.delete(binding.action);
		};
		this._onMouseMove = (e: MouseEvent) => {
			if (this.options.enablePointerLock && !this.isLocked) return;
			this.mouseDelta.x += e.movementX * this.options.mouseSensitivity;
			this.mouseDelta.y += e.movementY * this.options.mouseSensitivity;
		};
		this._onPointerLockChange = () => {
			if (!this.ctx) return;
			const wasLocked = this.isLocked;
			this.isLocked = document.pointerLockElement === this.ctx.canvas;
			if (this.isLocked !== wasLocked) {
				for (const cb of this.pointerLockCallbacks) cb(this.isLocked);
			}
		};
		this._onCanvasClick = () => {
			if (this.options.enablePointerLock && this.ctx) {
				this.ctx.canvas.requestPointerLock?.();
			}
		};
	}
	init(ctx: WorldContext): void {
		this.ctx = ctx;
		for (const binding of ctx.keymap.getAll()) {
			this.keymap.set(binding.key, { action: binding.action });
		}
		window.addEventListener("keydown", this._onKeyDown);
		window.addEventListener("keyup", this._onKeyUp);
		document.addEventListener("mousemove", this._onMouseMove);
		document.addEventListener(
			"pointerlockchange",
			this._onPointerLockChange,
		);
		if (this.options.enablePointerLock) {
			ctx.canvas.addEventListener("click", this._onCanvasClick);
		}
		const log = ctx.logger.for(this.type);
		log.logVariable("enablePointerLock", this.options.enablePointerLock);
		log.logVariable("mouseSensitivity", this.options.mouseSensitivity);
		log.logVariable(
			"keyBindingsCount",
			this.keymap.size,
		);
	}
	update(delta: number): void {
		this.justPressed = this.pendingJustPressed;
		this.pendingJustPressed = new Set();
		for (const [, binding] of this.keymap) {
			if (binding.fn && this.pressed.has(binding.action)) {
				binding.fn(delta);
			}
		}
		const logger = Logger.getInstance();
		if (
			logger.isDebugFeatureEnabled("logInputState") &&
			logger.shouldLogThisFrame()
		) {
			logger
				.for(this.type)
				.logVariable("pressed", Array.from(this.pressed));
			logger.for(this.type).logVariable("mouseDelta", this.mouseDelta);
			logger.for(this.type).logVariable("pointerLocked", this.isLocked);
		}
	}
	getMouseDelta(): { x: number; y: number } {
		const delta = { ...this.mouseDelta };
		this.mouseDelta.x = 0;
		this.mouseDelta.y = 0;
		return delta;
	}
	onPointerLock(callback: (locked: boolean) => void): void {
		this.pointerLockCallbacks.push(callback);
	}
	setKeyBinding(code: string, binding: KeyBinding): void {
		this.keymap.set(code, binding);
	}
	onKeymapRebind(action: string, newKey: string, oldKey?: string): void {
		if (oldKey) {
			const existing = this.keymap.get(oldKey);
			if (existing && existing.action === action) {
				this.keymap.delete(oldKey);
			}
		}
		const existing = this.keymap.get(newKey);
		if (!existing || existing.action !== action) {
			this.keymap.set(newKey, { action });
		}
	}
	isActionPressed(action: string): boolean {
		return this.pressed.has(action);
	}
	isActionJustPressed(action: string): boolean {
		return this.justPressed.has(action);
	}
	setEnabled(enabled: boolean): void {
		this.enabled = enabled;
	}
	isEnabled(): boolean {
		return this.enabled;
	}
	isPointerLocked(): boolean {
		return this.isLocked;
	}
	dispose(): void {
		window.removeEventListener("keydown", this._onKeyDown);
		window.removeEventListener("keyup", this._onKeyUp);
		document.removeEventListener("mousemove", this._onMouseMove);
		document.removeEventListener(
			"pointerlockchange",
			this._onPointerLockChange,
		);
		if (this.ctx) {
			this.ctx.canvas.removeEventListener(
				"click",
				this._onCanvasClick,
			);
		}
		if (document.pointerLockElement) {
			document.exitPointerLock?.();
		}
		this.pressed.clear();
		this.justPressed.clear();
		this.pointerLockCallbacks = [];
		this.ctx = null;
	}
}
