import * as THREE from "three";
import type { Module, WorldContext } from "../../ModuleClass";
import { ModuleKey } from "../../ModuleClass";
import type { InputModule } from "./InputModule";
import { KeyAction } from "shared/config";
import { ManagedObject, OBJECT_TYPE } from "@/ThreeWrapper/2.world/tools";
export type PlayerControlOptions = {
	moveSpeed?: number;
	jumpImpulse?: number;
	rotationSmoothing?: number;
};
export class PlayerControlModule implements Module {
	readonly type = "player_control";
	readonly requires = [ModuleKey.input] as const;
	private input: InputModule | null = null;
	private ctx: WorldContext | undefined;
	private readonly moveSpeed: number;
	private readonly jumpImpulse: number;
	private readonly rotationSmoothing: number;
	private currentYaw = 0;
	constructor(options: PlayerControlOptions = {}, ..._requires: [typeof ModuleKey.input]) {
		this.moveSpeed = options.moveSpeed ?? 5;
		this.jumpImpulse = options.jumpImpulse ?? 8;
		this.rotationSmoothing = options.rotationSmoothing ?? 10;
	}
	init(ctx: WorldContext): void {
		this.ctx = ctx;
		this.input = ctx.getModule<InputModule>(ModuleKey.input) ?? null;
		if (!this.input) {
			console.warn("[PlayerControlModule] InputModule not found on world.");
		}
	}
	update(delta: number): void {
		if (!this.input || !this.ctx) return;
		const player: ManagedObject<OBJECT_TYPE.PLAYER> | null = this.ctx.selfWorldPlayer;
		if (!player || player.pieces.length === 0) return;
		const fwd = this.input.isActionPressed(KeyAction.MOVE_FORWARD);
		const back = this.input.isActionPressed(KeyAction.MOVE_BACKWARD);
		const left = this.input.isActionPressed(KeyAction.MOVE_LEFT);
		const right = this.input.isActionPressed(KeyAction.MOVE_RIGHT);
		const forward = new THREE.Vector3();
		const rightVec = new THREE.Vector3();
		this.ctx.camera.getWorldDirection(forward);
		forward.y = 0;
		forward.normalize();
		rightVec.crossVectors(forward, THREE.Object3D.DEFAULT_UP).normalize();
		const vel = this.ctx.objects.getVelocity(player.id);
		const moveDir = new THREE.Vector3();
		if (fwd) moveDir.addScaledVector(forward, 1);
		if (back) moveDir.addScaledVector(forward, -1);
		if (right) moveDir.addScaledVector(rightVec, 1);
		if (left) moveDir.addScaledVector(rightVec, -1);
		if (moveDir.lengthSq() > 0) moveDir.normalize();
		const grounded = this.ctx.objects.isGrounded(player.id);
		const blendFactor = grounded ? 0.2 : 0.02;
		const targetVelX = moveDir.x * this.moveSpeed;
		const targetVelZ = moveDir.z * this.moveSpeed;
		this.ctx.objects.setVelocity(player.id, {
			x: vel.x + (targetVelX - vel.x) * blendFactor,
			y: vel.y,
			z: vel.z + (targetVelZ - vel.z) * blendFactor
		});
		if (moveDir.lengthSq() > 0) {
			const targetAngle = Math.atan2(moveDir.x, moveDir.z);
			let diff = targetAngle - this.currentYaw;
			while (diff < -Math.PI) diff += Math.PI * 2;
			while (diff > Math.PI) diff -= Math.PI * 2;
			this.currentYaw += diff * Math.min(1, this.rotationSmoothing * delta);
			const quat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.currentYaw);
			this.ctx.objects.setRotation(player.id, { x: quat.x, y: quat.y, z: quat.z, w: quat.w });
		}
		if (this.input.isActionJustPressed(KeyAction.JUMP) && this.ctx.objects.isGrounded(player.id)) {
			const mass = this.ctx.objects.getMass(player.id);
			this.ctx.objects.applyImpulse(player.id, { x: 0, y: this.jumpImpulse * mass, z: 0 });
		}
		const isMoving = moveDir.lengthSq() > 0 || Math.abs(vel.y) > 0.1;
		if (this.ctx.server && isMoving) {
			const rot = player.pieces[0]?.asset.quaternion;
			this.ctx.server.send.playerInput({
				pos: player.position,
				rot: { x: rot.x, y: rot.y, z: rot.z, w: rot.w },
			});
		}
	}
	dispose(): void {
		this.input = null;
	}
}
