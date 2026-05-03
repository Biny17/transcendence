import * as THREE from "three";
import { World } from "../WorldClass";
import { LoadingUI } from "@/ThreeWrapper/5.modules/ui/LoadingUI";
import type { UIModule } from "@/ThreeWrapper/5.modules/ui/UIModule";

const STORAGE_KEY = 'loading_progress';

export class LoadingWorld extends World {
	constructor() {
		super({ id: "minimal" });
	}

	protected setupEnvironment(): void {}

	protected override async onLoad(): Promise<void> {
		localStorage.setItem(STORAGE_KEY, '1');
		const uiModule = this.ctx.getModule<UIModule>("ui");
		if (uiModule) {
			uiModule.show("loading", <LoadingUI />);
		}
		this.ctx.scene.background = new THREE.Color(0x0a0a12);
		this.ctx.camera.position.set(0, 0, 1);
		this.ctx.camera.lookAt(0, 0, 0);
	}

	override update(_delta: number): void {}

	protected override onStart(): void {}

	protected override onDispose(): void {
		const uiModule = this.ctx.getModule<UIModule>("ui");
		if (uiModule) {
			uiModule.hide("loading");
		}
		localStorage.removeItem(STORAGE_KEY);
	}
}