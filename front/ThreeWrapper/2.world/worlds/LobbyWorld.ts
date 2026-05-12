import * as THREE from "three";
import { World } from "../WorldClass";
import { OnlineEnvironement } from "@/ThreeWrapper/3.environment/envs/OnlineEnvironement";
import { ComponentLoader, GeometryFactory, LightFactory, OBJECT_TYPE } from "../tools";
import { ParkourEnvironement } from "@/ThreeWrapper/3.environment/envs/ParkourEnvironment";
import { LobbyEnvironment } from "@/ThreeWrapper/3.environment/envs/LobbyEnvironment";
interface FloatingPlatform {
	mesh: THREE.Mesh;
	initialY: number;
	bobSpeed: number;
	bobAmount: number;
	rotationSpeed: number;
}
export class LobbyWorld extends World {
	private floatingPlatforms: FloatingPlatform[] = [];
	private showcasePiece: THREE.Mesh | null = null;
	private orbitingRings: THREE.Mesh[] = [];
	constructor() {
		super({ id: "lobby" });
	}
	protected setupEnvironment(): void {
		this.applyEnvironment(new LobbyEnvironment());
	}
	protected override async onLoad(): Promise<void> {
		/*const { sun, sky, bounce } = LightFactory.createCinematicLighting();
		this.ctx.objects.addSimple({ type: OBJECT_TYPE.MAP, asset: sun });
		this.ctx.objects.addSimple({ type: OBJECT_TYPE.MAP, asset: sky });
		this.ctx.objects.addSimple({ type: OBJECT_TYPE.MAP, asset: bounce });
		const ambient = LightFactory.createAmbientLight({
			color: 0x8899bb,
			intensity: 0.3
		});
		this.ctx.objects.addSimple({ type: OBJECT_TYPE.MAP, asset: ambient });
		const floor = GeometryFactory.cylinder({
			height: 0.1,
			radiusTop: 30,
			radiusBottom: 30,
			material: {
				color: 0x1a1a2e,
				metalness: 0.8,
				roughness: 0.3
			}
		});
		this.ctx.objects.add({
			type: OBJECT_TYPE.MAP,
			position: { x: 0, y: 0, z: 0 },
			rotation: { w: 0, x: -Math.PI / 2, y: 0, z: 0 },
			pieces: [
				{
					asset: floor,
					hitboxes: [{ relativeOffset: { x: 0, y: 0, z: 0 }, shape: { kind: "auto" } }],
					relativePosition: { x: 0, y: 0, z: 0 }
				}
			],
			physics: { bodyType: "static" }
		});
		this.ctx.objects.add({ type: OBJECT_TYPE.MAP, componentId: "spawn_point", position: { x: 0, y: 2, z: 0 } });
		this.ctx.camera.position.set(0, 8, 20);
		this.ctx.camera.lookAt(0, 3, 0);*/
		const components = new ComponentLoader();
		const def = await this.ctx.map.loadFile("/game/maps/lobby1.yaml");
		await this.ctx.map.spawn(def, components, this.ctx.gltf, this.ctx.objects);
	}
	protected override onStart(): void {
		console.log("LobbyWorld started");
	}
	protected override onDispose(): void {
		this.floatingPlatforms = [];
		this.showcasePiece = null;
		this.orbitingRings = [];
	}
}
