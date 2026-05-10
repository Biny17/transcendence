import * as THREE from "three";
import { SERVER_MSG } from "shared/protocol";
import type { PlayerJoinPayload, PlayerDisconnectPayload } from "shared/protocol";
import type { Quat } from "shared/math";
import type { Module, WorldContext } from "../../ModuleClass";
import { ModuleKey } from "../../ModuleClass";
import { OBJECT_TYPE } from "@/ThreeWrapper/2.world/tools";
import { PlayerBodyModule } from "@/ThreeWrapper/4.module/modules/players/PlayerBodyModule";
export class PlayerSyncModule implements Module {
	readonly type = "player_sync";
	readonly requires: readonly ModuleKey[] = [];
	private ctx: WorldContext | null = null;
	private playerMeshes: Map<string, THREE.Object3D> = new Map();
	private unsubs: (() => void)[] = [];
	init(ctx: WorldContext): void {
		this.ctx = ctx;
		console.log("[PlayerSync] init called, ctx.server?", !!ctx.server);
		this.unsubs.push(
			ctx.server?.on(SERVER_MSG.PLAYER_JOIN, (payload: PlayerJoinPayload) => {
				console.log("[PlayerSync] PLAYER_JOIN received:", payload);
				void this.handlePlayerJoin(payload);
			}) ?? (() => {}),
			ctx.server?.on(SERVER_MSG.PLAYER_DISCONNECT, (payload: PlayerDisconnectPayload) => {
				console.log("[PlayerSync] PLAYER_DISCONNECT received:", payload);
				this.handlePlayerDisconnect(payload);
			}) ?? (() => {})
		);
	}
	private async handlePlayerJoin(payload: PlayerJoinPayload): Promise<void> {
		if (!this.ctx) return;
		if (this.ctx.objects.has(payload.id)) {
			console.log("[PlayerSync] PLAYER_JOIN: object already exists, re-associating:", payload.id);
			return;
		}
		console.log("[PlayerSync] PLAYER_JOIN: adding new player object:", payload.id);
		this.ctx.objects.add({
			id: payload.id,
			type: OBJECT_TYPE.PLAYER,
			position: { x: 0, y: 2, z: 0 },
			rotation: { x: 0, y: 0, z: 0, w: 1 } as Quat,
			extraData: { serverData: payload }
		});
		const bodyModule = this.ctx.getModule<PlayerBodyModule>(ModuleKey.playerBody);
		if (bodyModule) {
			await bodyModule.createBody(payload.id);
		} else {
			console.warn("[PlayerSync] PlayerBodyModule not found, cannot create body for:", payload.id);
		}
	}
	private handlePlayerDisconnect(payload: PlayerDisconnectPayload): void {
		if (!this.ctx) return;
		console.log("[PlayerSync] PLAYER_DISCONNECT: removing player:", payload.playerId);
		this.ctx.objects.remove(payload.playerId);
		this.playerMeshes.delete(payload.playerId);
	}
	update(_delta: number): void {}
	dispose(): void {
		this.unsubs.forEach(unsub => unsub());
		this.unsubs = [];
		this.playerMeshes.clear();
		this.ctx = null;
	}
}
