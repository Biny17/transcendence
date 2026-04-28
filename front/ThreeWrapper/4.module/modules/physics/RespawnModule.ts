import type { Module, WorldContext } from "@/ThreeWrapper/4.module";
import type { ZoneShape } from "@/ThreeWrapper/2.world/tools/PhysicsWorld";
import { PhaseChangedPayload } from "shared/protocol";
export type SpawnPoint = { x: number; y: number; z: number };
export type RespawnModuleOptions = {
	spawnPoints?: SpawnPoint[];
	fallZone?: { center: { x: number; y: number; z: number }; shape: ZoneShape };
	fallThresholdY?: number;
	onRespawn?: (playerId: string, spawnPoint: SpawnPoint) => void;
};
export class RespawnModule implements Module {
	readonly type = "respawn";
	private ctx: WorldContext | null = null;
	private spawnPoints: SpawnPoint[];
	private fallThresholdY: number;
	private fallZone: RespawnModuleOptions["fallZone"];
	private onRespawn: ((playerId: string, spawnPoint: SpawnPoint) => void) | null;
	private spawnIndex = 0;
	constructor(options: RespawnModuleOptions = {}) {
		this.spawnPoints = options.spawnPoints ?? [{ x: 0, y: 5, z: 0 }];
		this.fallThresholdY = options.fallThresholdY ?? -50;
		this.fallZone = options.fallZone;
		this.onRespawn = options.onRespawn ?? null;
	}
	init(ctx: WorldContext): void {
		this.ctx = ctx;
		const spawnObjs = ctx.objects.getByType("map").filter((o) => o.extraData?.componentId === "spawn_point");
		for (const obj of spawnObjs) {
			const spawnPos = obj.extraData?.spawnpoint as SpawnPoint | undefined;
			if (spawnPos) {
				this.addSpawnPoint(spawnPos);
			} else if (obj.pieces.length > 0) {
				const pos = obj.pieces[0].asset.position;
				this.addSpawnPoint({ x: pos.x, y: pos.y, z: pos.z });
			}
		}
		if (this.fallZone) {
			this.ctx.objects.addZone({
				id: "respawn_fall_zone",
				center: this.fallZone.center,
				shape: this.fallZone.shape,
				onEnter: (obj) => {
					if (obj.type !== "player") return;
					const playerId = obj.extraData?.playerId as string | undefined;
					if (playerId) this.respawn(playerId);
				}
			});
		}
		this.ctx.server?.on("PHASE_CHANGED", (payload: PhaseChangedPayload) => {
			if (payload?.phaseType == "wait") {
			}
		});
	}
	update(_delta: number): void {
		if (!this.ctx) return;
		const players = this.ctx.objects.getByType("player");
		for (const player of players) {
			if (player.pieces.length === 0) continue;
			const pos = player.pieces[0].asset.position;
			if (pos.y < this.fallThresholdY) {
				const playerId = player.extraData?.playerId as string | undefined;
				if (playerId) this.respawn(playerId);
			}
		}
	}
	respawn(playerId: string): void {
		if (!this.ctx) return;
		const obj = this.ctx.objects.get(`player-${playerId}`);
		if (!obj || obj.pieces.length === 0) return;
		const spawn = this.getNextSpawnPoint();
		this.ctx.objects.setPosition(obj.id, spawn);
		this.ctx.objects.setVelocity(obj.id, { x: 0, y: 0, z: 0 });
		this.onRespawn?.(playerId, spawn);
	}
	private getNextSpawnPoint(): SpawnPoint {
		const spawn = this.spawnPoints[this.spawnIndex % this.spawnPoints.length];
		this.spawnIndex++;
		return spawn;
	}
	addSpawnPoint(point: SpawnPoint): void {
		this.spawnPoints.push(point);
	}
	setFallThreshold(y: number): void {
		this.fallThresholdY = y;
	}
	dispose(): void {
		this.ctx?.objects.removeZone("respawn_fall_zone");
		this.onRespawn = null;
		this.ctx = null;
	}
}
