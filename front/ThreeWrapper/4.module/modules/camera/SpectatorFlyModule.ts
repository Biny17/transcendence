import * as THREE from "three";
import type { Module, WorldContext } from "@/ThreeWrapper/4.module";
import { ModuleKey } from "@/ThreeWrapper/4.module";
import { OBJECT_TYPE } from "@/ThreeWrapper/2.world/tools";
import type { InputModule } from "../input/InputModule";

export class SpectatorFlyModule implements Module {
	readonly type = "spectator_fly";
	readonly requires = [ModuleKey.input] as const;
	private ctx: WorldContext | null = null;
	private input: InputModule | null = null;
	private active = false;
	private yaw = 0;
	private pitch = 0;
	private moveSpeed = 15;
	private fastMultiplier = 3;

	init(ctx: WorldContext): void {
		this.ctx = ctx;
		this.input = ctx.getModule<InputModule>(ModuleKey.input) ?? null;
		const selfId = ctx.selfServerClient.id;
		if (!selfId) return;
		const selfPlayer = ctx.objects.getById(selfId, OBJECT_TYPE.PLAYER);
		this.active = selfPlayer?.extraData.serverData.isSpectator ?? false;
		if (this.active) {
			ctx.camera.rotation.order = "YXZ";
			const euler = new THREE.Euler().setFromQuaternion(ctx.camera.quaternion, "YXZ");
			this.yaw = euler.y;
			this.pitch = euler.x;
		}
	}

	update(delta: number): void {
		if (!this.active || !this.input || !this.ctx) return;
		const camera = this.ctx.camera;
		const mouse = this.input.getMouseDelta();
		this.yaw -= mouse.x;
		this.pitch -= mouse.y;
		this.pitch = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, this.pitch));
		camera.rotation.y = this.yaw;
		camera.rotation.x = this.pitch;
		const fast = this.input.isActionPressed("sprint") ? this.fastMultiplier : 1;
		const speed = this.moveSpeed * fast * delta;
		const forward = new THREE.Vector3();
		camera.getWorldDirection(forward);
		forward.y = 0;
		forward.normalize();
		const right = new THREE.Vector3();
		right.crossVectors(forward, THREE.Object3D.DEFAULT_UP).normalize();
		if (this.input.isActionPressed("move_forward")) camera.position.addScaledVector(forward, speed);
		if (this.input.isActionPressed("move_backward")) camera.position.addScaledVector(forward, -speed);
		if (this.input.isActionPressed("move_right")) camera.position.addScaledVector(right, speed);
		if (this.input.isActionPressed("move_left")) camera.position.addScaledVector(right, -speed);
		if (this.input.isActionPressed("jump")) camera.position.y += speed;
		if (this.input.isActionPressed("crouch")) camera.position.y -= speed;
	}

	dispose(): void {
		this.input = null;
		this.ctx = null;
	}
}
