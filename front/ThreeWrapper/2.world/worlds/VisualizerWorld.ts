import { VisualizerEnvironment } from "@/ThreeWrapper/3.environment/envs/VisualizerEnvironment";
import * as THREE from "three";
import { World } from "../WorldClass";
export type VisualizerWorldArgs = {
	id?: string;
	object?: string;
	cameraPos?: { x: number; y: number; z: number };
};
export class VisualizerWorld extends World {
	private objectPath: string | null;
	private cameraPos: { x: number; y: number; z: number };
	constructor(args: VisualizerWorldArgs = {}) {
		super({ id: args.id ?? "visualizer" });
		this.objectPath = args.object ?? null;
		this.cameraPos = { x: 5, y: 5, z: 10, ...args.cameraPos };
	}
	protected setupEnvironment(): void {
		this.applyEnvironment(new VisualizerEnvironment());
	}
	protected override async onLoad(): Promise<void> {
		const ambient = new THREE.AmbientLight(0xffffff, 0.6);
		this.ctx.objects.add({ type: "map", name: "ambient", pieces: [{ asset: ambient, relativePosition: { x: 0, y: 0, z: 0 }, hitboxes: [] }] });
		const sun = new THREE.DirectionalLight(0xffffff, 1.2);
		sun.position.set(10, 20, 10);
		console.log("load");
		sun.castShadow = true;
		this.ctx.objects.add({ type: "map", name: "sun", pieces: [{ asset: sun, relativePosition: { x: 0, y: 0, z: 0 }, hitboxes: [] }] });
		this.ctx.camera.position.set(this.cameraPos.x, this.cameraPos.y, this.cameraPos.z);
		this.ctx.camera.lookAt(0, 0, 0);
		if (this.objectPath) {
			const model = await this.ctx.gltf.load(this.objectPath, this.objectPath);
			const obj = this.ctx.objects.add({
				type: "player",
				name: "obj",
				pieces: [{ asset: model.scene, relativePosition: { x: 0, y: 0, z: 0 }, hitboxes: [] }]
			});
			if (model.mixer) obj.mixers.push(model.mixer);
			obj.animationClips.push(...(model.animations ?? []));
			if (model.animations?.[0]) {
				this.ctx.objects.playAnimation(obj.id, model.animations[0].name);
			}
		}
	}
	protected override async onStart(_initialState?: unknown): Promise<void> {
		console.log("start");
	}
}
