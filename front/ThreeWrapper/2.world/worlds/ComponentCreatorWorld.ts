import * as THREE from "three";
import { World } from "../WorldClass";
import { ComponentCreatorEnvironment } from "@/ThreeWrapper/3.environment/envs/ComponentCreatorEnvironment";
import { LightFactory, OBJECT_TYPE } from "../tools";
export class ComponentCreatorWorld extends World {
	constructor() {
		super({ id: "ComponentCreator" });
	}
	protected setupEnvironment(): void {
		this.applyEnvironment(new ComponentCreatorEnvironment());
	}
	protected override async onLoad(): Promise<void> {
		this.ctx.scene.background = new THREE.Color(0x12121e);
		const ambient = LightFactory.createAmbientLight({
			color: 0xffffff,
			intensity: 0.85
		});
		this.ctx.objects.addSimple({ type: OBJECT_TYPE.MAP, asset: ambient });
		const sun = LightFactory.createDirectionalLight({
			color: 0xffffff,
			intensity: 3.8,
			position: { x: 8, y: 5, z: -8 },
			castShadow: true,
			target: { x: 0, y: 0, z: 0 }
		});
		this.ctx.objects.addSimple({ type: OBJECT_TYPE.MAP, asset: sun, position: { x: 10, y: 15, z: 18 } });
		const fill = LightFactory.createDirectionalLight({
			color: 0x8899bb,
			intensity: 0.5,
			position: { x: -5, y: 4, z: -6 },
			target: { x: 0, y: 0, z: 0 },
			castShadow: false
		});
		this.ctx.objects.addSimple({ type: OBJECT_TYPE.MAP, asset: fill, position: { x: -5, y: 4, z: -6 } });
		this.ctx.objects.addRaw(new THREE.GridHelper(20, 20, 0x333355, 0x1a1a2e));
	}
}
