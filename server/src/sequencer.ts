import { createMessage, SERVER_MSG, PHASE_EVENTS } from "shared/index";
import type { LobbySequenceConfig, SequencePhase, WaitPhase, GamePhase, LoopPhase, GameModeSelectEntry, GameModeCandidate, WinCondition, WinConditionQuorumWin, WinConditionTimerSurvival, CinematicPhase, EndPhase } from "shared/config";
import type { Ranking } from "shared/state";
import { broadcast, sockets, usernames } from "./state";
export type ActiveGame = {
	modeId: string;
	winCondition: WinCondition;
	activePlayers: Set<string>;
	winPlayers: Set<string>;
	lostPlayers: Set<string>;
	timer: ReturnType<typeof setTimeout> | null;
	candidate: GameModeCandidate;
};
export type ValidationFailure = "no_active_frame" | "no_active_phase" | "wrong_phase_type" | "no_active_game" | "player_not_active" | "player_is_spectator" | "wrong_win_condition" | "wrong_trigger" | "event_mismatch";
export const FAIL_REASON = {
	NO_ACTIVE_FRAME: "no_active_frame",
	NO_ACTIVE_PHASE: "no_active_phase",
	WRONG_PHASE_TYPE: "wrong_phase_type",
	NO_ACTIVE_GAME: "no_active_game",
	PLAYER_NOT_ACTIVE: "player_not_active",
	PLAYER_IS_SPECTATOR: "player_is_spectator",
	WRONG_WIN_CONDITION: "wrong_win_condition",
	WRONG_TRIGGER: "wrong_trigger",
	EVENT_MISMATCH: "event_mismatch"
} as const;
export type EventResult = {
	processed: boolean;
	reason?: ValidationFailure;
	data?: Record<string, unknown>;
};
export class Sequencer {
	private config: LobbySequenceConfig;
	private lives = new Map<string, number>();
	private spectators = new Set<string>();
	private currentGame: ActiveGame | null = null;
	private roundsPlayed = 0;
	private stack: Array<{ phases: SequencePhase[]; index: number; gamePhase?: GamePhase }> = [];
	private waitCollected = new Set<string>();
	private waitTimer: ReturnType<typeof setTimeout> | null = null;
	private frame: { phases: SequencePhase[]; index: number } | null = null;
	private phase: SequencePhase | null = null;
	private gameRunning = false;
	private gameLoaded = new Set<string>();
	private gameLoadTimer: ReturnType<typeof setTimeout> | null = null;
	constructor(config: LobbySequenceConfig) {
		this.config = config;
	}
	reset(): void {
		this.lives.clear();
		this.spectators.clear();
		this.currentGame = null;
		this.roundsPlayed = 0;
		this.stack = [];
		this.waitCollected.clear();
		if (this.waitTimer) clearTimeout(this.waitTimer);
		this.waitTimer = null;
		this.frame = null;
		this.phase = null;
		this.gameRunning = false;
		if (this.gameLoadTimer) clearTimeout(this.gameLoadTimer);
		this.gameLoadTimer = null;
		this.gameLoaded.clear();
	}
	addPlayer(playerId: string): void {
		console.log(`[Sequencer] addPlayer(${playerId}) globalLives=${this.config.globalLives}`);
		this.lives.set(playerId, this.config.globalLives);
		console.log(`[Sequencer] lives map after addPlayer: ${[...this.lives.entries()].map(([id, l]) => `${id}:${l}`).join(', ')}`);
	}
	removePlayer(playerId: string): void {
		console.log(`[Sequencer] removePlayer(${playerId})`);
		this.lives.delete(playerId);
		this.spectators.delete(playerId);
		this.currentGame?.activePlayers.delete(playerId);
		this.currentGame?.winPlayers.delete(playerId);
		this.currentGame?.lostPlayers.delete(playerId);
		console.log(`[Sequencer] lives map after removePlayer: ${[...this.lives.entries()].map(([id, l]) => `${id}:${l}`).join(', ')}`);
	}
	getActivePlayers(): string[] {
		return [...this.lives.keys()].filter((id) => !this.spectators.has(id) && (this.lives.get(id) ?? 0) > 0);
	}
	hasPlayer(playerId: string): boolean {
		return this.lives.has(playerId);
	}
	getLives(playerId: string): number {
		return this.lives.get(playerId) ?? 0;
	}
	isStarted(): boolean {
		return this.stack.length > 0;
	}
	isInLobbyWait(): boolean {
		if (!this.frame) return true;
		const phase = this.frame.phases[this.frame.index] as any;
		return phase?.type === "wait" && phase.worldId === "Lobby";
	}
	getCurrentPhaseId(): string | null {
		if (!this.frame) return null;
		const phase = this.frame.phases[this.frame.index] as any;
		return phase?.worldId ?? null;
	}
	getLoadWorldId(): string {
		if (this.isInLobbyWait()) return "Lobby";
		const phase = this.frame?.phases[this.frame.index] as any;
		return phase?.worldId ?? "Lobby";
	}
	start(): void {
		this.stack = [{ phases: this.config.phases, index: -1 }];
		this.frame = this.stack[this.stack.length - 1];
		this.phase = null;
		this.advance();
	}
	private isSpectator(playerId: string): boolean {
		return this.spectators.has(playerId);
	}
	private hasActiveFrame(): boolean {
		const frame = this.stack[this.stack.length - 1];
		return frame !== undefined && frame.index >= 0;
	}
	private isPhaseType(expected: "wait" | "game"): boolean {
		return this.phase !== null && this.phase.type === expected;
	}
	private hasActiveGame(): boolean {
		return this.currentGame !== null;
	}
	isInGamePhase(): boolean {
		return this.phase?.type === "game";
	}
	getCurrentGameMode(): string | null {
		return this.currentGame?.modeId ?? null;
	}
	getCurrentGame(): ActiveGame | null {
		return this.currentGame;
	}
	addActivePlayer(playerId: string): void {
		console.log(`[Sequencer] addActivePlayer(${playerId}) currentGame=${this.currentGame ? 'exists' : 'null'}`);
		if (this.currentGame) {
			console.log(`[Sequencer] activePlayers before: ${[...this.currentGame.activePlayers]}`);
			this.currentGame.activePlayers.add(playerId);
			console.log(`[Sequencer] activePlayers after: ${[...this.currentGame.activePlayers]}`);
		} else {
			console.log(`[Sequencer] addActivePlayer called but no currentGame - skipping`);
		}
	}
	private isActivePlayer(playerId: string): boolean {
		return this.currentGame?.activePlayers.has(playerId) ?? false;
	}
	private hasWinConditionType(type: "quorum_win" | "timer_survival"): boolean {
		return (this.currentGame?.winCondition.type ?? null) === type;
	}
	private waitEventMismatch(event: string, waitFor: string): boolean {
		return event !== waitFor;
	}
	onWin(playerId: string): EventResult {
		if (!this.isPhaseType("game")) return { processed: false, reason: FAIL_REASON.WRONG_PHASE_TYPE };
		if (!this.hasActiveGame()) return { processed: false, reason: FAIL_REASON.NO_ACTIVE_GAME };
		if (!this.isActivePlayer(playerId)) return { processed: false, reason: FAIL_REASON.PLAYER_NOT_ACTIVE };
		const game = this.currentGame!;
		if (game.winCondition.type !== "quorum_win") return { processed: false, reason: FAIL_REASON.WRONG_WIN_CONDITION };
		const phase = this.phase as GamePhase;
		const wc = game.winCondition as WinConditionQuorumWin;
		if (wc.trigger !== "player_won") return { processed: false, reason: FAIL_REASON.WRONG_TRIGGER };
		game.winPlayers.add(playerId);
		const needed = this.resolveQuorum(wc.quorum, game.activePlayers.size);
		const quorumMet = game.winPlayers.size >= needed;
		if (quorumMet) this.finishGamePhase(phase);
		return { processed: true, data: { currentWins: game.winPlayers.size, needed, quorumMet } };
	}
	onLost(playerId: string): EventResult {
		if (!this.isPhaseType("game")) return { processed: false, reason: FAIL_REASON.WRONG_PHASE_TYPE };
		if (!this.hasActiveGame()) return { processed: false, reason: FAIL_REASON.NO_ACTIVE_GAME };
		if (!this.isActivePlayer(playerId)) return { processed: false, reason: FAIL_REASON.PLAYER_NOT_ACTIVE };
		const game = this.currentGame!;
		if (game.winCondition.type !== "timer_survival") return { processed: false, reason: FAIL_REASON.WRONG_WIN_CONDITION };
		const phase = this.phase as GamePhase;
		game.lostPlayers.add(playerId);
		const allLost = game.lostPlayers.size >= game.activePlayers.size;
		if (allLost) {
			if (game.timer) clearTimeout(game.timer);
			this.finishGamePhase(phase);
		}
		return { processed: true, data: { currentLosses: game.lostPlayers.size, total: game.activePlayers.size, allLost } };
	}
	onPlayerEliminated(_playerId: string): EventResult {
		if (this.isSpectator(_playerId)) return { processed: false, reason: FAIL_REASON.PLAYER_IS_SPECTATOR };
		return { processed: true, data: {} };
	}
	onResultsAck(_playerId: string): EventResult {
		return { processed: true, data: {} };
	}
	onWaitEvent(playerId: string, event: string): EventResult {
		if (!this.isPhaseType("wait")) return { processed: false, reason: FAIL_REASON.WRONG_PHASE_TYPE };
		const phase = this.phase as WaitPhase;
		if (this.waitEventMismatch(event, phase.waitFor)) return { processed: false, reason: FAIL_REASON.EVENT_MISMATCH };
		if (this.isSpectator(playerId)) return { processed: false, reason: FAIL_REASON.PLAYER_IS_SPECTATOR };
		this.waitCollected.add(playerId);
		const active = this.getActivePlayers();
		const needed = this.resolveQuorum(phase.quorum, active.length);
		const quorumMet = this.waitCollected.size >= needed;
		if (quorumMet) {
			if (this.waitTimer) {
				clearTimeout(this.waitTimer);
				this.waitTimer = null;
			}
			this.finishWaitPhase();
		}
		return { processed: true, data: { currentCount: this.waitCollected.size, needed, quorumMet } };
	}
	onGameWorldLoaded(playerId: string): EventResult {
		if (!this.isPhaseType("game")) return { processed: false, reason: FAIL_REASON.WRONG_PHASE_TYPE };
		if (this.isSpectator(playerId)) return { processed: false, reason: FAIL_REASON.PLAYER_IS_SPECTATOR };
		if (this.gameLoaded.has(playerId)) return { processed: true, data: {} };
		this.gameLoaded.add(playerId);
		const total = this.getActivePlayers().length;
		const allLoaded = this.gameLoaded.size >= total;
		if (allLoaded) {
			console.log(`[Sequencer] All clients loaded game world - ending load timeout early`);
			if (this.gameLoadTimer) {
				clearTimeout(this.gameLoadTimer);
				this.gameLoadTimer = null;
			}
			const phase = this.phase as GamePhase;
			this.broadcastStartWorld(phase);
		}
		return { processed: true, data: { loaded: this.gameLoaded.size, total, allLoaded } };
	}
	private advance(): void {
		if (this.gameRunning) {
			console.log(`[Sequencer] advance() blocked – gameRunning=true`);
			return;
		}
		while (this.stack.length > 0) {
			const frame = this.stack[this.stack.length - 1];
			frame.index++;
			if (frame.index >= frame.phases.length) {
				const popped = this.stack.pop();
				if (popped?.gamePhase) {
					this.broadcastStartWorld(popped.gamePhase);
					return;
				}
				if (this.stack.length > 0) {
					const parent = this.stack[this.stack.length - 1];
					const parentPhase = parent.phases[parent.index];
					if (parentPhase?.type === "loop") {
						if (this.shouldContinueLoop()) {
							this.stack.push({
								phases: (parentPhase as LoopPhase).phases,
								index: -1
							});
							continue;
						}
						this.stack[this.stack.length - 1].index++;
					}
				}
				this.frame = this.stack.length > 0 ? this.stack[this.stack.length - 1] : null;
				this.phase = this.frame ? this.frame.phases[this.frame.index] : null;
				continue;
			}
			const phase = frame.phases[frame.index];
			this.frame = frame;
			this.phase = phase;
			this.executePhase(phase);
			if (phase.type === "wait" || phase.type === "game") return;
		}
	}
	private executePhase(phase: SequencePhase): void {
		const phaseId = (phase as any).worldId ?? (phase as any).id ?? "unknown";
		console.log(`[Sequencer] Phase: ${phaseId} (${phase.type})`);
		broadcast(
			JSON.stringify(
				createMessage(SERVER_MSG.PHASE_CHANGED, {
					phaseId,
					phaseType: phase.type
				})
			)
		);
		switch (phase.type) {
			case "wait":
				this.startWaitPhase(phase);
				break;
			case "game":
				this.startGamePhase(phase);
				break;
			case "loop":
				this.stack.push({ phases: phase.phases, index: -1 });
				this.advance();
				break;
			case "cinematic":
				this.startCinematicPhase(phase);
				break;
			case "end":
				this.startEndPhase(phase as EndPhase);
				break;
		}
	}
	private startWaitPhase(phase: WaitPhase): void {
		this.waitCollected.clear();
		if (this.waitTimer) clearTimeout(this.waitTimer);
		this.waitTimer = setTimeout(() => {
			console.log(`[Sequencer] Wait phase for "${phase.worldId}" timed out - starting game`);
			this.finishWaitPhase();
		}, phase.timeout * 1000);
		const players = [...this.lives.entries()].map(([id, lives]) => ({
			id,
			name: usernames.get(id) ?? id,
			lives,
			isSpectator: lives <= 0
		}));
		broadcast(JSON.stringify(createMessage(SERVER_MSG.LOAD_WORLD, { worldId: phase.worldId, players })));
		console.log(`[Sequencer] Broadcasting LOAD_WORLD for ${phase.worldId}`);
	}
	private finishWaitPhase(): void {
		this.waitCollected.clear();
		if (this.waitTimer) {
			clearTimeout(this.waitTimer);
			this.waitTimer = null;
		}
		this.advance();
	}
	private startGamePhase(phase: GamePhase): void {
		const activePlayers = this.getActivePlayers();
		const selected = this.selectGameMode(phase, activePlayers.length);
		if (!selected) {
			console.error("[Sequencer] No gamemode matched conditions");
			this.advance();
			return;
		}
		const { candidate } = selected;
		this.currentGame = {
			modeId: candidate.worldId,
			winCondition: candidate.winCondition,
			activePlayers: new Set(activePlayers),
			winPlayers: new Set(),
			lostPlayers: new Set(),
			timer: null,
			candidate
		};
		console.log(`[Sequencer] startGamePhase created game | worldId=${candidate.worldId} | winCondition=${candidate.winCondition.type}`);
		this.gameLoaded.clear();
		if (this.gameLoadTimer) clearTimeout(this.gameLoadTimer);
		const timeout = candidate.loadTimeout ?? 60;
		this.gameLoadTimer = setTimeout(() => {
			console.log(`[Sequencer] Game load timeout fired for ${candidate.worldId}`);
			this.broadcastStartWorld(phase);
		}, timeout * 1000);
		const players = [...this.lives.entries()].map(([id, lives]) => ({
			id,
			name: usernames.get(id) ?? id,
			lives,
			isSpectator: lives <= 0
		}));
		broadcast(JSON.stringify(createMessage(SERVER_MSG.LOAD_WORLD, { worldId: candidate.worldId, players })));
		console.log(`[Sequencer] Broadcasting LOAD_WORLD for game: ${candidate.worldId} (loadTimeout=${timeout}s)`);
	}
	private broadcastStartWorld(phase: GamePhase): void {
		if (this.gameLoadTimer) {
			clearTimeout(this.gameLoadTimer);
			this.gameLoadTimer = null;
		}
		if (!this.currentGame?.winCondition) return;
		if (this.isInLobbyWait()) {
			console.log(`[Sequencer] broadcastStartWorld skipped - in lobby_wait phase`);
			return;
		}
		console.log(`[Sequencer] broadcastStartWorld | worldId: ${this.currentGame?.modeId} | winCondition: ${this.currentGame?.winCondition.type}`);
		broadcast(JSON.stringify(createMessage(SERVER_MSG.START_WORLD, { worldId: this.currentGame.modeId })));
		if (this.currentGame.winCondition.type === "timer_survival") {
			this.currentGame.timer = setTimeout(
				() => {
					if (this.currentGame) this.finishGamePhase(phase);
				},
				(this.currentGame.winCondition as WinConditionTimerSurvival).duration * 1000
			);
		}
		console.log(`[Sequencer] Game started: ${this.currentGame.modeId}`);
		this.gameRunning = true;
		this.phase = phase;
	}
	private startCinematicPhase(phase: CinematicPhase): void {
		console.log(`[Sequencer] Cinematic phase: ${phase.id} (${phase.timeout}s)`);
		setTimeout(() => {
			console.log(`[Sequencer] Cinematic phase "${phase.id}" finished`);
			this.advance();
		}, phase.timeout * 1000);
	}
	private startEndPhase(phase: EndPhase): void {
		if (phase.timeout > 0) {
			setTimeout(() => {
				this.endLobby();
			}, phase.timeout * 1000);
		}
		broadcast(JSON.stringify(createMessage(SERVER_MSG.LOAD_WORLD, {
			worldId: phase.worldId,
			players: [...this.lives.entries()].map(([id, lives]) => ({
				id, name: usernames.get(id) ?? id, lives, isSpectator: lives <= 0
			}))
		})));
	}
	private finishGamePhase(phase: GamePhase): void {
		console.log(`[Sequencer] finishGamePhase called | gameMode: ${this.currentGame?.modeId} | winPlayers: ${[...(this.currentGame?.winPlayers ?? [])]} | lostPlayers: ${[...(this.currentGame?.lostPlayers ?? [])]}`);
		this.gameRunning = false;
		if (this.gameLoadTimer) clearTimeout(this.gameLoadTimer);
		this.gameLoadTimer = null;
		this.gameLoaded.clear();
		const game = this.currentGame!;
		if (game.timer) clearTimeout(game.timer);
		this.currentGame = null;
		this.roundsPlayed++;
		const losers = this.computeLosers(game);
		this.applyElimination(losers, game.candidate.elimination.livesLost);
		const winners = [...game.activePlayers].filter((id) => !losers.has(id));
		for (const winnerId of winners) {
			broadcast(JSON.stringify(createMessage(SERVER_MSG.PHASE_EVENT, { event: PHASE_EVENTS.WIN })));
		}
		for (const loserId of losers) {
			broadcast(JSON.stringify(createMessage(SERVER_MSG.PHASE_EVENT, { event: PHASE_EVENTS.LOST })));
		}
		const rankings: Ranking[] = [
			...winners.map((id, i) => ({
				playerId: id,
				rank: i + 1,
				score: 0
			})),
			...[...losers].map((id, i) => ({
				playerId: id,
				rank: winners.length + i + 1,
				score: 0
			}))
		];
		const livesRemaining: Record<string, number> = {};
		for (const [id, lives] of this.lives) {
			livesRemaining[id] = lives;
		}
		const phaseId = (phase as any).worldId ?? this.getCurrentPhaseId() ?? "game";
		broadcast(
			JSON.stringify(
				createMessage(SERVER_MSG.PHASE_CHANGED, {
					phaseId,
					phaseType: "end",
					data: { rankings, livesRemaining }
				})
			)
		);
		if (this.isLobbyOver()) {
			console.log(`[Sequencer] isLobbyOver check | activePlayers: ${this.getActivePlayers()} | lobbyWinCondition: ${this.config.lobbyWinCondition.type}`);
			this.endLobby();
			return;
		}
		const nextPhase = this.frame!.phases[this.frame!.index + 1];
		if (nextPhase && nextPhase.type === "wait") {
			this.advance();
			return;
		}
		this.startGamePhase(phase);
	}
	private computeLosers(game: ActiveGame): Set<string> {
		if (game.winCondition.type === "quorum_win") {
			return new Set([...game.activePlayers].filter((id) => !game.winPlayers.has(id)));
		}
		return new Set(game.lostPlayers);
	}
	private applyElimination(losers: Set<string>, livesLost: number): void {
		for (const id of losers) {
			const current = this.lives.get(id) ?? 0;
			const next = Math.max(0, current - livesLost);
			this.lives.set(id, next);
			if (next <= 0) {
				this.spectators.add(id);
				broadcast(JSON.stringify(createMessage(SERVER_MSG.PHASE_EVENT, { event: PHASE_EVENTS.PLAYER_ELIMINATED })));
				console.log(`[Sequencer] Player ${id} eliminated → spectator (reflected in next LOAD_WORLD)`);
			}
		}
	}
	private isLobbyOver(): boolean {
		const gamePhase = this.phase as GamePhase;
		if (gamePhase?.endCondition) {
			const wc = gamePhase.endCondition;
			const active = this.getActivePlayers();
			if (wc.type === "last_with_lives") return active.length <= 1;
			if (wc.type === "fixed_rounds") return this.roundsPlayed >= wc.value;
			if (wc.type === "best_cumulative_score") return active.length <= 1;
		}
		const wc = this.config.lobbyWinCondition;
		const active = this.getActivePlayers();
		if (wc.type === "last_with_lives") return active.length <= 1;
		if (wc.type === "fixed_rounds") return this.roundsPlayed >= wc.value;
		if (wc.type === "best_cumulative_score") return active.length <= 1;
		return false;
	}
	private shouldContinueLoop(): boolean {
		return !this.isLobbyOver();
	}
	private endLobby(): void {
		this.gameRunning = false;
		console.log(`[Sequencer] endLobby called | activePlayers: ${this.getActivePlayers()}`);
		const active = this.getActivePlayers();
		const winner = active[0] ?? null;
		console.log(`[Sequencer] Lobby ended. Winner: ${winner}`);
		broadcast(
			JSON.stringify(
				createMessage(SERVER_MSG.LOBBY_END, {
					scores: [],
					rankings: winner ? [{ playerId: winner, rank: 1, score: 0 }] : []
				})
			)
		);
		for (const ws of sockets.values()) {
			ws.close();
		}
		this.reset();
		this.start();
		console.log("[Sequencer] Lobby reset, waiting for new connections");
	}
	private resolveQuorum(quorum: number | string, total: number): number {
		if (typeof quorum === "number") return quorum;
		const pct = parseInt(quorum, 10) / 100;
		return Math.max(1, Math.ceil(total * pct));
	}
	private selectGameMode(phase: GamePhase, activeCount?: number): { entry: GameModeSelectEntry; candidate: GameModeCandidate } | null {
		const count = activeCount ?? this.getActivePlayers().length;
		for (const entry of phase.gameModeSelect) {
			if (this.evalCondition(entry.condition, count)) {
				const candidate = entry.pick === "random" ? entry.candidates[Math.floor(Math.random() * entry.candidates.length)] : entry.candidates[0];
				return { entry, candidate };
			}
		}
		return null;
	}
	private evalCondition(condition: string, activePlayers: number): boolean {
		if (condition === "true") return true;
		const m = condition.match(/^activePlayers\s*(>|>=|<|<=|==|!=)\s*(\d+)$/);
		if (!m) return false;
		const rhs = parseInt(m[2], 10);
		switch (m[1]) {
			case ">":
				return activePlayers > rhs;
			case ">=":
				return activePlayers >= rhs;
			case "<":
				return activePlayers < rhs;
			case "<=":
				return activePlayers <= rhs;
			case "==":
				return activePlayers === rhs;
			case "!=":
				return activePlayers !== rhs;
		}
		return false;
	}
	private peekNextGamePhase(): GamePhase | null {
		for (let s = this.stack.length - 1; s >= 0; s--) {
			const frame = this.stack[s];
			for (let i = frame.index + 1; i < frame.phases.length; i++) {
				const p = frame.phases[i];
				if (p.type === "game") return p as GamePhase;
				if (p.type === "loop") {
					const inner = (p as LoopPhase).phases.find((x) => x.type === "game");
					if (inner) return inner as GamePhase;
				}
			}
		}
		return null;
	}
}