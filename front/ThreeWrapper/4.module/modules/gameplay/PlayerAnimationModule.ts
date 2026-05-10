import * as THREE from "three";
import type { Module, WorldContext } from "@/ThreeWrapper/4.module";
import { ModuleKey } from "@/ThreeWrapper/4.module";
import type { ManagedObject } from "@/ThreeWrapper/2.world/tools/ObjectManager";
import { OBJECT_TYPE } from "@/ThreeWrapper/2.world/tools/ObjectManager";
import type { LagCompensationModule } from "@/ThreeWrapper/4.module/modules/online/LagCompensationModule";

export type PlayerAnimationModuleOptions = {
	walkSpeedThreshold?: number;
	fallTimeThreshold?: number;
	fadeInDuration?: number;
	fadeOutDuration?: number;
};

type PlayerAnimState = {
	id: string;
	state: "idle" | "walking" | "jumping" | "falling";
	timeInAir: number;
	isRagdoll: boolean;
};

export class PlayerAnimationModule implements Module {
	readonly type = "player_animation";
	readonly requires = [ModuleKey.input] as const;

	private ctx: WorldContext | null = null;
	private playerStates = new Map<string, PlayerAnimState>();
	private lagComp: LagCompensationModule | null = null;
	private walkSpeedThreshold = 0.5;
	private fallTimeThreshold = 0.5;
	private fadeInDuration = 0.2;
	private fadeOutDuration = 0.3;

	// Animation clip names
	private animIdle = "FG_Idle_A";
	private animWalk = "FG_Walk_A";
	private animJump = "FG_emote_HONK_01_A";
	private animFall = "FG_Loading_Falling_A";

	constructor(options: PlayerAnimationModuleOptions = {}) {
		this.walkSpeedThreshold = options.walkSpeedThreshold ?? 0.5;
		this.fallTimeThreshold = options.fallTimeThreshold ?? 0.5;
		this.fadeInDuration = options.fadeInDuration ?? 0.2;
		this.fadeOutDuration = options.fadeOutDuration ?? 0.3;
	}

	init(ctx: WorldContext): void {
		this.ctx = ctx;
		this.lagComp = ctx.getModule<LagCompensationModule>(ModuleKey.lagCompensation) ?? null;
	}

	update(delta: number): void {
		if (!this.ctx) return;

		const players = this.ctx.objects.getByType(OBJECT_TYPE.PLAYER);

		for (const player of players) {
			if (player.pieces.length === 0) continue;

			if (player.id === this.ctx?.selfWorldPlayer?.id) {
				this.updateLocalPlayer(delta, player);
			} else if (this.lagComp) {
				this.updateRemotePlayer(delta, player);
			}
		}
	}

	private ensureState(playerId: string): PlayerAnimState | null {
		let state = this.playerStates.get(playerId);
		if (state) return state;
		if (!this.ctx) return null;
		state = {
			id: playerId,
			state: "idle",
			timeInAir: 0,
			isRagdoll: false
		};
		this.playerStates.set(playerId, state);
		this.ctx.objects.playAnimation(playerId, this.animIdle, {
			loop: THREE.LoopRepeat
		});
		return state;
	}

	private updateLocalPlayer(delta: number, player: ManagedObject): void {
		if (!this.ctx) return;
		const state = this.ensureState(player.id);
		if (!state) return;

		const isGrounded = this.ctx.objects.isGrounded(player.id);
		if (isGrounded) {
			state.timeInAir = 0;
		} else {
			state.timeInAir += delta;
		}

		if (state.isRagdoll) return;

		const velocity = this.ctx.objects.getVelocity(player.id);
		const horizontalSpeed = Math.sqrt(velocity.x ** 2 + velocity.z ** 2);

		const prevState = state.state;
		let newState: typeof state.state = "idle";

		if (!isGrounded) {
			newState = state.timeInAir < this.fallTimeThreshold ? "jumping" : "falling";
		} else if (horizontalSpeed > this.walkSpeedThreshold) {
			newState = "walking";
		}

		if (newState !== prevState) {
			this.transitionAnimation(player, prevState, newState);
			state.state = newState;
		}
	}

	private updateRemotePlayer(delta: number, player: ManagedObject): void {
		if (!this.lagComp) return;
		const state = this.ensureState(player.id);
		if (!state) return;

		const data = this.lagComp.getRemotePlayerData(player.id);
		if (!data) return;

		if (state.isRagdoll) return;

		state.timeInAir = data.isGrounded ? 0 : state.timeInAir + delta;

		const prevState = state.state;
		let newState: typeof state.state = "idle";

		if (!data.isGrounded) {
			newState = state.timeInAir < this.fallTimeThreshold ? "jumping" : "falling";
		} else if (data.horizontalSpeed > this.walkSpeedThreshold) {
			newState = "walking";
		}

		if (newState !== prevState) {
			this.transitionAnimation(player, prevState, newState);
			state.state = newState;
		}
	}

	private transitionAnimation(player: ManagedObject, from: string, to: string): void {
		if (!this.ctx) return;

		switch (to) {
			case "idle":
				this.ctx.objects.crossFadeAnimation(player.id, this.animIdle, this.fadeOutDuration);
				break;
			case "walking":
				this.ctx.objects.crossFadeAnimation(player.id, this.animWalk, this.fadeInDuration);
				break;
			case "jumping":
				this.ctx.objects.crossFadeAnimation(player.id, this.animJump, this.fadeInDuration, {
					loop: THREE.LoopOnce
				});
				break;
			case "falling":
				this.ctx.objects.crossFadeAnimation(player.id, this.animFall, this.fadeInDuration);
				break;
		}
	}

	setRagdoll(playerId: string, enabled: boolean): void {
		const state = this.playerStates.get(playerId);
		if (!state) return;

		state.isRagdoll = enabled;
		if (enabled) {
			this.ctx?.objects.stopAnimation(playerId, this.animWalk, {
				fadeOut: this.fadeOutDuration
			});
			this.ctx?.objects.stopAnimation(playerId, this.animFall, {
				fadeOut: this.fadeOutDuration
			});
			this.ctx?.objects.stopAnimation(playerId, this.animJump, {
				fadeOut: this.fadeOutDuration
			});
			this.ctx?.objects.stopAnimation(playerId, this.animIdle, {
				fadeOut: this.fadeOutDuration
			});
		} else {
			state.state = "idle";
			this.ctx?.objects.playAnimation(playerId, this.animIdle, {
				loop: THREE.LoopRepeat,
				fadeIn: this.fadeInDuration
			});
		}
	}

	isRagdoll(playerId: string): boolean {
		return this.playerStates.get(playerId)?.isRagdoll ?? false;
	}

	dispose(): void {
		this.playerStates.clear();
		this.lagComp = null;
		this.ctx = null;
	}
}
