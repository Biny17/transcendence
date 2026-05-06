import * as THREE from "three";
import { World } from "../WorldClass";
import { ConnectingUI } from "@/ThreeWrapper/4.module/modules/ui/ConnectingUI";
import type { UIModule } from "@/ThreeWrapper/4.module/modules/ui/UIModule";

export class ConnectingWorld extends World {
	constructor() {
		super({ id: "minimal" });
	}

	protected setupEnvironment(): void {}

	protected override async onLoad(): Promise<void> {
		const uiModule = this.ctx.getModule<UIModule>("ui");
		if (uiModule) {
			uiModule.show("connecting", <ConnectingUI />);
		}
		this.ctx.camera.position.set(0, 0, 1);
		this.ctx.camera.lookAt(0, 0, 0);
	}

	override update(_delta: number): void {}

	protected override onStart(): void {}

	protected override onDispose(): void {
		const uiModule = this.ctx.getModule<UIModule>("ui");
		if (uiModule) {
			uiModule.hide("connecting");
		}
	}
}
