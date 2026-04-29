import { ManagedObject, OBJECT_TYPE } from "@/ThreeWrapper/2.world/tools";
import type { Module, WorldContext } from "@/ThreeWrapper/4.module";
export type AntiFallModuleOptions = {
	fallThresholdY?: number;
};
export class AntiFallModule implements Module {
	readonly type = "anti-fall";
	private ctx: WorldContext | null = null;
	private fallThresholdY: number;
	constructor(options: AntiFallModuleOptions = {}) {
		this.fallThresholdY = options.fallThresholdY ?? -20;
	}
	init(ctx: WorldContext): void {
		this.ctx = ctx;
	}
	update(_delta: number): void {
		if (!this.ctx) return;
		const players = this.ctx.objects.getByType(OBJECT_TYPE.PLAYER);
		for (const player of players) {
			if (player.pieces.length === 0) continue;
			const pos = player.position;
			if (pos.y < this.fallThresholdY) {
				this.teleportToSpawn(player);
			}
		}
	}
	private teleportToSpawn(obj: ManagedObject<OBJECT_TYPE.PLAYER>): void {
		if (!this.ctx) return;
		const spawnPos = obj.extraData?.spawnpoint as { x: number; y: number; z: number } | undefined;
		if (spawnPos) {
			this.ctx.objects.setPosition(obj.id, spawnPos);
		} else {
			this.ctx.objects.setPosition(obj.id, { x: 0, y: 5, z: 0 });
		}
		this.ctx.objects.setVelocity(obj.id, { x: 0, y: 0, z: 0 });
	}
	dispose(): void {
		this.ctx = null;
	}
}
