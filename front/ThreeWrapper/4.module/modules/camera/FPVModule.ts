import type { Module, WorldContext } from "@/ThreeWrapper/4.module";
import { ModuleKey } from "@/ThreeWrapper/4.module";
import type { InputModule } from "../input/InputModule";
import { ManagedObject } from "@/ThreeWrapper/2.world/tools";
export type FPVModuleOptions = {
	eyeHeight?: number;
	backwardOffset?: number;
};
export class FPVModule implements Module {
	readonly type = "fpv";
	private ctx: WorldContext | null = null;
	private input: InputModule | null = null;
	private target: ManagedObject | null = null;
	private eyeHeight: number;
	private backwardOffset: number;
	private yaw = 0;
	private pitch = 0;
	constructor(options: FPVModuleOptions = {}, ..._requires: [typeof ModuleKey.input]) {
		this.eyeHeight = options.eyeHeight ?? 0.6;
		this.backwardOffset = options.backwardOffset ?? 0.65;
	}
	init(ctx: WorldContext): void {
		this.ctx = ctx;
		this.input = ctx.getModule<InputModule>(ModuleKey.input) ?? null;
	}
	setTarget(object: ManagedObject): void {
		this.target = object;
	}
	setEyeHeight(h: number): void {
		this.eyeHeight = h;
	}
	update(_delta: number): void {
		if (!this.input || !this.ctx) return;
		const target = this.target ?? this.ctx.selfWorldPlayer ?? null;
		if (!target) return;
		const camera = this.ctx.camera;
		const mouse = this.input.getMouseDelta();
		this.yaw -= mouse.x;
		this.pitch -= mouse.y;
		this.pitch = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, this.pitch));
		camera.rotation.order = "YXZ";
		camera.rotation.y = this.yaw;
		camera.rotation.x = this.pitch;
		const offsetX = -Math.sin(this.yaw) * this.backwardOffset;
		const offsetZ = -Math.cos(this.yaw) * this.backwardOffset;
		camera.position.set(target.position.x + offsetX, target.position.y + this.eyeHeight, target.position.z + offsetZ);
	}
	dispose(): void {
		this.input = null;
		this.target = null;
		this.ctx = null;
	}
}
