import type { Module, WorldContext } from "@/ThreeWrapper/4.module";
import { ModuleKey } from "@/ThreeWrapper/4.module";
import type { InputModule } from "../input/InputModule";

export class LobbyReadyModule implements Module {
	readonly type = "lobby_ready";
	readonly requires = [ModuleKey.input] as const;
	private ctx: WorldContext | null = null;
	private input: InputModule | null = null;
	private readyPressed = false;
	private isReady = false;

	init(ctx: WorldContext): void {
		this.ctx = ctx;
		this.input = ctx.getModule<InputModule>(ModuleKey.input) ?? null;
		if (!this.input) {
			console.warn("[LobbyReadyModule] InputModule not found");
			return;
		}
		const interactKey = ctx.keymap.getKey("interact")!;
		this.input.setKeyBinding(interactKey, {
			action: "interact",
			onDown: () => {
				if (!this.isReady) {
					this.readyPressed = true;
				}
			}
		});
	}

	update(_delta: number): void {
		if (!this.ctx || !this.input || !this.ctx.server) return;
		if (this.readyPressed && !this.isReady) {
			this.ctx.server.send.playerReady();
			this.isReady = true;
			console.log("[LobbyReadyModule] Player sent ready signal");
		}
		this.readyPressed = false;
	}

	dispose(): void {
		this.ctx = null;
		this.input = null;
	}
}