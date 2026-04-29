import * as THREE from "three";
import type { Module, WorldContext } from "@/ThreeWrapper/4.module";
import { ModuleKey } from "@/ThreeWrapper/4.module";
import type { InputModule } from "../input/InputModule";
import { ManagedObject } from "@/ThreeWrapper/2.world/tools";
export type TPVModuleOptions = {
	distance?: number;
	height?: number;
	smoothing?: number;
	minPitch?: number;
	maxPitch?: number;
};
export class TPVModule implements Module {
	readonly type = "tpv";
	readonly requires = [ModuleKey.input] as const;
	private ctx: WorldContext | null = null;
	private input: InputModule | null = null;
	private target: ManagedObject | null = null;
	private distance: number;
	private height: number;
	private smoothing: number;
	private minPitch: number;
	private maxPitch: number;
	private yaw = 0;
	private pitch = 0.3;
	constructor(options: TPVModuleOptions = {}, ...requires: [typeof ModuleKey.input]) {
		this.distance = options.distance ?? 5;
		this.height = options.height ?? 2;
		this.smoothing = options.smoothing ?? 8;
		this.minPitch = options.minPitch ?? -0.5;
		this.maxPitch = options.maxPitch ?? 1.2;
	}
	init(ctx: WorldContext): void {
		this.ctx = ctx;
		this.input = ctx.getModule<InputModule>(ModuleKey.input) ?? null;
	}
	setTarget(object: ManagedObject): void {
		this.target = object;
	}
	setDistance(d: number): void {
		this.distance = d;
	}
	update(delta: number): void {
		if (!this.input || !this.ctx) return;
		const target = this.target ?? this.ctx.selfWorldPlayer ?? null;
		if (!target) return;
		const camera = this.ctx.camera;
		const mouse = this.input.getMouseDelta();
		this.yaw -= mouse.x;
		this.pitch -= mouse.y;
		this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));
		const offset = new THREE.Vector3(0, 0, this.distance);
		offset.applyAxisAngle(new THREE.Vector3(1, 0, 0), this.pitch);
		offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
		const targetPos = target.position.clone();
		targetPos.y += this.height;
		const desiredPos = targetPos.clone().add(offset);
		const t = Math.min(1, this.smoothing * delta);
		camera.position.lerp(desiredPos, t);
		camera.lookAt(targetPos);
	}
	dispose(): void {
		this.input = null;
		this.target = null;
		this.ctx = null;
	}
}
