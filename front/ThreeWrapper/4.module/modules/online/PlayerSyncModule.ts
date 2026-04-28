import * as THREE from "three";
import { SERVER_MSG } from "shared/protocol";
import type { WorldStatePayload, PlayerJoinPayload, PlayerDisconnectPayload } from "shared/protocol";
import type { Quat } from "shared/math";
import type { Module, WorldContext, ModuleKey } from "../../ModuleClass";
import { OBJECT_TYPE } from "@/ThreeWrapper/2.world/tools";
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
				this.handlePlayerJoin(payload);
			}) ?? (() => {}),
			ctx.server?.on(SERVER_MSG.PLAYER_DISCONNECT, (payload: PlayerDisconnectPayload) => {
				console.log("[PlayerSync] PLAYER_DISCONNECT received:", payload);
				this.handlePlayerDisconnect(payload);
			}) ?? (() => {}),
			ctx.server?.on(SERVER_MSG.WORLD_STATE, (payload: WorldStatePayload) => {
				this.syncPlayers(payload);
			}) ?? (() => {})
		);
	}
	private handlePlayerJoin(payload: PlayerJoinPayload): void {
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
	}
	private handlePlayerDisconnect(payload: PlayerDisconnectPayload): void {
		if (!this.ctx) return;
		console.log("[PlayerSync] PLAYER_DISCONNECT: removing player:", payload.playerId);
		this.ctx.objects.remove(payload.playerId);
		this.playerMeshes.delete(payload.playerId);
	}
	private syncPlayers(state: WorldStatePayload): void {
		if (!this.ctx) return;
		if (!state) {
			console.log("[PlayerSync] state is falsy, returning");
			return;
		}
		for (const playerState of state.players) {
			if (playerState.id === this.ctx.selfWorldPlayer?.id) continue;
			this.ctx.objects.setPosition(playerState.id, playerState.pos);
			this.ctx.objects.setRotation(playerState.id, playerState.rot);
		}
	}
	update(_delta: number): void {}
	dispose(): void {
		this.unsubs.forEach(unsub => unsub());
		this.unsubs = [];
		this.playerMeshes.clear();
		this.ctx = null;
	}
}
