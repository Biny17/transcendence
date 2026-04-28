import type { Module, WorldContext } from "@/ThreeWrapper/4.module"
import { ModuleKey } from "@/ThreeWrapper/4.module"
import { KeyAction } from "shared/config"
import { OBJECT_TYPE } from "@/ThreeWrapper/2.world/tools/ObjectManager"

export type RagdollModuleOptions = {
	minRagdollDuration?: number
	normalGravityScale?: number
	ragdollGravityScale?: number
	onRagdollToggle?: (playerId: string, enabled: boolean) => void
}

type RagdollState = {
	enabled: boolean
	timeInRagdoll: number
}

export class RagdollModule implements Module {
	readonly type = 'ragdoll'
	readonly requires = [ModuleKey.input] as const

	private ctx: WorldContext | null = null
	private ragdollStates = new Map<string, RagdollState>()
	private minDuration = 15
	private normalGravityScale = 1
	private ragdollGravityScale = 1
	private onToggle: ((playerId: string, enabled: boolean) => void) | null = null

	constructor(options: RagdollModuleOptions = {}) {
		this.minDuration = options.minRagdollDuration ?? 15
		this.normalGravityScale = options.normalGravityScale ?? 1
		this.ragdollGravityScale = options.ragdollGravityScale ?? 1
		this.onToggle = options.onRagdollToggle ?? null
	}

	init(ctx: WorldContext): void {
		this.ctx = ctx
		// Initialize ragdoll states for all players
		const players = ctx.objects.getByType(OBJECT_TYPE.PLAYER)
		for (const player of players) {
			this.ragdollStates.set(player.id, {
				enabled: false,
				timeInRagdoll: 0,
			})
		}
	}

	update(delta: number): void {
		if (!this.ctx) return

		const input = this.ctx.getModule(ModuleKey.input) as any
		const players = this.ctx.objects.getByType(OBJECT_TYPE.PLAYER)
		const animModule = this.ctx.getModule(ModuleKey.playerAnimation) as any

		for (const player of players) {
			let state = this.ragdollStates.get(player.id)
			if (!state) {
				state = {
					enabled: false,
					timeInRagdoll: 0,
				}
				this.ragdollStates.set(player.id, state)
			}

			if (state.enabled) {
				// Increment time in ragdoll
				state.timeInRagdoll += delta

				// Check if jump input pressed and minimum duration passed
				if (
					input?.isActionPressed?.(KeyAction.JUMP) &&
					state.timeInRagdoll >= this.minDuration
				) {
					this.disableRagdoll(player.id, animModule)
				}
			}
		}
	}

	enableRagdoll(playerId: string): void {
		if (!this.ctx) return

		const state = this.ragdollStates.get(playerId) ?? {
			enabled: false,
			timeInRagdoll: 0,
		}

		if (state.enabled) return // Already in ragdoll

		state.enabled = true
		state.timeInRagdoll = 0
		this.ragdollStates.set(playerId, state)

		// Set ragdoll gravity scale
		this.ctx.objects.setGravityScale(playerId, this.ragdollGravityScale)

		// Notify animation module to disable animations
		const animModule = this.ctx.getModule(ModuleKey.playerAnimation) as any
		animModule?.setRagdoll?.(playerId, true)

		this.onToggle?.(playerId, true)
	}

	disableRagdoll(playerId: string, animModule?: any): void {
		if (!this.ctx) return

		const state = this.ragdollStates.get(playerId) ?? {
			enabled: false,
			timeInRagdoll: 0,
		}

		if (!state.enabled) return // Not in ragdoll

		state.enabled = false
		state.timeInRagdoll = 0
		this.ragdollStates.set(playerId, state)

		// Restore normal gravity scale
		this.ctx.objects.setGravityScale(playerId, this.normalGravityScale)

		// Notify animation module to re-enable animations
		const anim = animModule ?? (this.ctx.getModule(ModuleKey.playerAnimation) as any)
		anim?.setRagdoll?.(playerId, false)

		this.onToggle?.(playerId, false)
	}

	isRagdoll(playerId: string): boolean {
		return this.ragdollStates.get(playerId)?.enabled ?? false
	}

	getRagdollTimeRemaining(playerId: string): number {
		const state = this.ragdollStates.get(playerId)
		if (!state?.enabled) return 0
		const remaining = this.minDuration - state.timeInRagdoll
		return Math.max(0, remaining)
	}

	dispose(): void {
		this.ragdollStates.clear()
		this.ctx = null
		this.onToggle = null
	}
}
