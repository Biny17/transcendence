import * as THREE from "three";
import type { Module, WorldContext } from "@/ThreeWrapper/4.module";
import { ModuleKey } from "@/ThreeWrapper/4.module";
import { OBJECT_TYPE, GeometryFactory, PhysicsDescriptor } from "@/ThreeWrapper/2.world/tools";
function resetObjectTransform(obj: THREE.Object3D): void {
	obj.position.set(0, 0, 0);
	obj.rotation.set(0, 0, 0);
	obj.scale.set(1, 1, 1);
}
export type PlayerBodyModuleOptions = {
	modelUrl?: string;
	textureUrl?: string;
	size?: number;
	physics?: {
		bodyType?: "dynamic" | "kinematic" | "static";
		mass?: number;
		gravityScale?: number;
		friction?: number;
		restitution?: number;
		lockRotations?: boolean;
	};
};
export class PlayerBodyModule implements Module {
	readonly type = ModuleKey.playerBody;
	readonly requires = [ModuleKey.playerAnimation] as const;
	private ctx: WorldContext | null = null;
	private modelUrl: string;
	private textureUrl: string;
	private size: number;
	private physics: PlayerBodyModuleOptions["physics"];
	constructor(options: PlayerBodyModuleOptions = {}) {
		this.modelUrl = options.modelUrl ?? "/game/modeles/charactere/scene.gltf";
		this.textureUrl = options.textureUrl ?? "/game/modeles/charactere/character_texture.png";
		this.size = options.size ?? 1;
		this.physics = {
			bodyType: options.physics?.bodyType ?? "dynamic",
			mass: options.physics?.mass ?? 1,
			gravityScale: options.physics?.gravityScale ?? 1,
			friction: options.physics?.friction ?? 0.3,
			restitution: options.physics?.restitution ?? 0.1,
			lockRotations: options.physics?.lockRotations ?? true
		};
	}
	async init(ctx: WorldContext): Promise<void> {
		this.ctx = ctx;
		const allMapObjs = ctx.objects.getByType(OBJECT_TYPE.MAP);
		const spawnObjs = allMapObjs.filter((o) => o.extraData?.componentId === "spawn_point");
		const players = ctx.objects.getByType(OBJECT_TYPE.PLAYER);
		console.log("[PlayerBody] Players found:", players.length);
		for (const player of players) {
			const physics = this.physics!;
			const physicsDesc: PhysicsDescriptor = physics;
			const spawnPos = spawnObjs.length > 0 && spawnObjs[0].pieces[0]?.asset ? spawnObjs[0].pieces[0].asset.position : new THREE.Vector3(0, 0, 0);
			const mesh = await ctx.gltf.load("player_character_" + player.id, this.modelUrl, this.textureUrl);
			ctx.objects.addPiece(
				player.id,
				{
					asset: mesh,
					relativePosition: { x: 0, y: -0.9, z: -0.05 },
					hitboxes: [{ shape: { kind: "box", halfExtents: { x: 0.4, y: 0.9, z: 0.4 } }, relativeOffset: { x: 0, y: 0, z: 0 }, collidesWith: [OBJECT_TYPE.MAP, OBJECT_TYPE.PLAYER] }]
				},
				physicsDesc,
				false
			);
			const obj = ctx.objects.getById(player.id, OBJECT_TYPE.PLAYER);
			if (obj) obj.extraData.spawnpoint = { x: spawnPos.x, y: spawnPos.y + 1, z: spawnPos.z };
			ctx.objects.setPosition(player.id, { x: spawnPos.x, y: spawnPos.y + 1, z: spawnPos.z });
			if (mesh.animations.length > 0) {
				ctx.objects.playAnimation(player.id, mesh.animations[1].name);
			}
			ctx.logger.log("INFO", "PlayerBodyModule", `Attached character to player ${player.id}`);
		}
	}
	update(_delta: number): void {
	}
	dispose(): void {
		this.ctx = null;
	}
}
