import * as THREE from "three";
import type { Module, WorldContext } from "@/ThreeWrapper/4.module";
import { ModuleKey } from "@/ThreeWrapper/4.module";
import type { ManagedObject } from "@/ThreeWrapper/2.world/tools/ObjectManager";
import { OBJECT_TYPE } from "@/ThreeWrapper/2.world/tools/ObjectManager";
import type { LagCompensationModule } from "@/ThreeWrapper/4.module/modules/online/LagCompensationModule";
import type { InputModule } from "@/ThreeWrapper/4.module/modules/input/InputModule";
import { KeyAction } from "shared/config";
import { SERVER_MSG } from "shared/protocol";

export type PlayerAnimationModuleOptions = {
	walkSpeedThreshold?: number;
	fallTimeThreshold?: number;
	fadeInDuration?: number;
	fadeOutDuration?: number;
};

type PlayerAnimState = {
	id: string;
	state: "idle" | "walking" | "jumping" | "falling" | "emoting";
	timeInAir: number;
	isRagdoll: boolean;
	emoteClipName: string | null;
};

export class PlayerAnimationModule implements Module {
	readonly type = "player_animation";
	readonly requires = [ModuleKey.input] as const;

	private ctx: WorldContext | null = null;
	private playerStates = new Map<string, PlayerAnimState>();
	private lagComp: LagCompensationModule | null = null;
	private input: InputModule | null = null;
	private walkSpeedThreshold = 0.5;
	private fallTimeThreshold = 0.5;
	private fadeInDuration = 0.2;
	private fadeOutDuration = 0.3;

	// Animation clip names
	private animIdle = "FG_Idle_A";
	private animWalk = "FG_Walk_A";
	private animJump = "FG_emote_HONK_01_A";
	private animFall = "FG_Loading_Falling_A";

	private emoteKeyToClip: Record<string, string> = {
		[KeyAction.EMOTE_1]: "FG_Emote_Wave_A",
		[KeyAction.EMOTE_2]: "FG_Emote_PirateDance_A",
		[KeyAction.EMOTE_3]: "FG_Emote_ThumbsUp_A",
		[KeyAction.EMOTE_4]: "FG_Emote_slowclap_A",
		[KeyAction.EMOTE_5]: "FG_Emote_Chicken_A",
		[KeyAction.EMOTE_6]: "FG_Emote_RobotDance_A"
	};

	constructor(options: PlayerAnimationModuleOptions = {}) {
		this.walkSpeedThreshold = options.walkSpeedThreshold ?? 0.5;
		this.fallTimeThreshold = options.fallTimeThreshold ?? 0.5;
		this.fadeInDuration = options.fadeInDuration ?? 0.2;
		this.fadeOutDuration = options.fadeOutDuration ?? 0.3;
	}

	init(ctx: WorldContext): void {
		this.ctx = ctx;
		this.lagComp = ctx.getModule<LagCompensationModule>(ModuleKey.lagCompensation) ?? null;
		this.input = ctx.getModule<InputModule>(ModuleKey.input) ?? null;
		if (ctx.server) {
			ctx.server.on(SERVER_MSG.PLAYER_EMOTE, (payload: { playerId: string; clipName: string }) => {
				this.playEmote(payload.playerId, payload.clipName);
			});
		}
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

	playEmote(playerId: string, clipName: string): void {
		const state = this.playerStates.get(playerId);
		if (!state || state.isRagdoll) return;
		const player = this.ctx?.objects.getById<OBJECT_TYPE.PLAYER>(playerId, OBJECT_TYPE.PLAYER);
		if (!player) return;
		state.state = "emoting";
		state.emoteClipName = clipName;
		this.ctx?.objects.crossFadeAnimation(playerId, clipName, this.fadeInDuration, {
			loop: THREE.LoopOnce
		});
	}

	private ensureState(playerId: string): PlayerAnimState | null {
		let state = this.playerStates.get(playerId);
		if (state) return state;
		if (!this.ctx) return null;
		state = {
			id: playerId,
			state: "idle",
			timeInAir: 0,
			isRagdoll: false,
			emoteClipName: null
		};
		this.playerStates.set(playerId, state);
		this.ctx.objects.playAnimation(playerId, this.animIdle, {
			loop: THREE.LoopRepeat
		});
		return state;
	}

	private isEmotePlaying(player: ManagedObject, clipName: string): boolean {
		for (const mixer of player.mixers) {
			const clip = THREE.AnimationClip.findByName(player.animationClips, clipName);
			if (clip) {
				const action = mixer.existingAction(clip);
				if (action && action.isRunning()) return true;
			}
		}
		return false;
	}

	private startEmote(player: ManagedObject, state: PlayerAnimState, clipName: string): void {
		state.state = "emoting";
		state.emoteClipName = clipName;
		this.ctx?.objects.crossFadeAnimation(player.id, clipName, this.fadeInDuration, {
			loop: THREE.LoopOnce
		});
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

		if (state.state === "emoting") {
			if (!this.isEmotePlaying(player, state.emoteClipName!)) {
				state.state = "idle";
				state.emoteClipName = null;
				this.ctx.objects.crossFadeAnimation(player.id, this.animIdle, this.fadeOutDuration);
			}
			return;
		}

		if (isGrounded && horizontalSpeed < this.walkSpeedThreshold) {
			for (const [action, clipName] of Object.entries(this.emoteKeyToClip)) {
				if (this.input?.isActionJustPressed(action)) {
					this.startEmote(player, state, clipName);
					if (this.ctx?.server) {
						this.ctx.server.send.playerEmote({ clipName });
					}
					return;
				}
			}
		}

		const prevState = state.state;
		let newState: "idle" | "walking" | "jumping" | "falling" = "idle";

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

		if (state.state === "emoting") {
			if (!this.isEmotePlaying(player, state.emoteClipName!)) {
				state.state = "idle";
				state.emoteClipName = null;
				this.ctx?.objects.crossFadeAnimation(player.id, this.animIdle, this.fadeOutDuration);
			}
			return;
		}

		const prevState = state.state;
		let newState: "idle" | "walking" | "jumping" | "falling" = "idle";

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
			if (state.emoteClipName) {
				this.ctx?.objects.stopAnimation(playerId, state.emoteClipName, {
					fadeOut: this.fadeOutDuration
				});
				state.emoteClipName = null;
			}
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
			state.emoteClipName = null;
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
