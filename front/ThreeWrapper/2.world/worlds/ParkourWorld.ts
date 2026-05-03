import * as THREE from "three";
import { World } from "../WorldClass";
import { ParkourEnvironement } from "@/ThreeWrapper/3.environment/envs/ParkourEnvironment";
import { ComponentLoader, OBJECT_TYPE } from "../tools";
import { RespawnModule, ModuleKey } from "@/ThreeWrapper/4.module";
import type { SpawnPoint } from "@/ThreeWrapper/4.module/modules/physics/RespawnModule";
export class ParkourWorld extends World {
	private _disposeMap?: () => void;
	constructor() {
		super({ id: "networked" });
	}
	protected setupEnvironment(): void {
		this.applyEnvironment(new ParkourEnvironement());
	}
	protected override async onLoad(): Promise<void> {
		const components = new ComponentLoader();
		const def = await this.ctx.map.loadFile("/game/maps/gta.yaml");
		this._disposeMap = await this.ctx.map.spawn(def, components, this.ctx.gltf, this.ctx.objects);
		this.ctx.camera.position.set(5, 5, 15);
	}
	protected override onStart(): void {}
	protected override onDispose(): void {
		this._disposeMap?.();
	}
}
