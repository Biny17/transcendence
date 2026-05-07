import { createElement } from "react";
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

	start(): void {
		if (!this.ctx) return;
		const keyLabel = this.ctx.keymap.getKey("interact") ?? "F";
		this.ctx.uiModule?.show(
			"lobby-ready-prompt",
			createElement(
				"div",
				{
					style: {
						position: "absolute",
						bottom: "2rem",
						left: "50%",
						transform: "translateX(-50%)",
						color: "white",
						fontFamily: "sans-serif",
						fontSize: "1.2rem",
						textShadow: "0 0 8px rgba(0,0,0,0.8)",
						background: "rgba(0,0,0,0.5)",
						padding: "0.6rem 1.5rem",
						borderRadius: "8px",
						pointerEvents: "none",
						whiteSpace: "nowrap",
					}
				},
				`Press [${keyLabel}] to ready up`
			)
		);
		this.ctx.uiModule?.disablePointer("lobby-ready-prompt");
	}

	update(_delta: number): void {
		if (!this.ctx || !this.input || !this.ctx.server) return;
		if (this.readyPressed && !this.isReady) {
			this.ctx.server.send.playerReady();
			this.isReady = true;
			this.ctx.uiModule?.hide("lobby-ready-prompt");
			console.log("[LobbyReadyModule] Player sent ready signal");
		}
		this.readyPressed = false;
	}

	dispose(): void {
		this.ctx?.uiModule?.hide("lobby-ready-prompt");
		this.ctx = null;
		this.input = null;
	}
}