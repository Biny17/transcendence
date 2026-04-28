import { createMessage, SERVER_MSG, PHASE_EVENTS } from "shared/index";
import { broadcast } from "./state";
export const FAIL_REASON = {
    NO_ACTIVE_FRAME: "no_active_frame",
    NO_ACTIVE_PHASE: "no_active_phase",
    WRONG_PHASE_TYPE: "wrong_phase_type",
    NO_ACTIVE_GAME: "no_active_game",
    PLAYER_NOT_ACTIVE: "player_not_active",
    PLAYER_IS_SPECTATOR: "player_is_spectator",
    WRONG_WIN_CONDITION: "wrong_win_condition",
    WRONG_TRIGGER: "wrong_trigger",
    EVENT_MISMATCH: "event_mismatch",
};
export class Sequencer {
    config;
    lives = new Map();
    spectators = new Set();
    currentGame = null;
    roundsPlayed = 0;
    stack = [];
    waitCollected = new Set();
    waitTimer = null;
    frame = null;
    phase = null;
    gameRunning = false;
    constructor(config) {
        this.config = config;
    }
    reset() {
        this.lives.clear();
        this.spectators.clear();
        this.currentGame = null;
        this.roundsPlayed = 0;
        this.stack = [];
        this.waitCollected.clear();
        if (this.waitTimer)
            clearTimeout(this.waitTimer);
        this.waitTimer = null;
        this.frame = null;
        this.phase = null;
        this.gameRunning = false;
    }
    addPlayer(playerId) {
        this.lives.set(playerId, this.config.globalLives);
    }
    removePlayer(playerId) {
        this.lives.delete(playerId);
        this.spectators.delete(playerId);
        this.currentGame?.activePlayers.delete(playerId);
        this.currentGame?.winPlayers.delete(playerId);
        this.currentGame?.lostPlayers.delete(playerId);
    }
    getActivePlayers() {
        return [...this.lives.keys()].filter((id) => !this.spectators.has(id) && (this.lives.get(id) ?? 0) > 0);
    }
    hasPlayer(playerId) {
        return this.lives.has(playerId);
    }
    getLives(playerId) {
        return this.lives.get(playerId) ?? 0;
    }
    isStarted() {
        return this.stack.length > 0;
    }
    isInLobbyWait() {
        if (!this.frame)
            return true;
        const phase = this.frame.phases[this.frame.index];
        return phase?.type === "wait" && phase.id === this.config.phases[0]?.id;
    }
    getCurrentPhaseId() {
        if (!this.frame)
            return null;
        return this.frame.phases[this.frame.index]?.id ?? null;
    }
    start() {
        this.stack = [{ phases: this.config.phases, index: -1 }];
        this.frame = this.stack[this.stack.length - 1];
        this.phase = null;
        this.advance();
    }
    isSpectator(playerId) {
        return this.spectators.has(playerId);
    }
    hasActiveFrame() {
        const frame = this.stack[this.stack.length - 1];
        return frame !== undefined && frame.index >= 0;
    }
    isPhaseType(expected) {
        return this.phase !== null && this.phase.type === expected;
    }
    hasActiveGame() {
        return this.currentGame !== null;
    }
    isInGamePhase() {
        return this.phase?.type === "game";
    }
    isActivePlayer(playerId) {
        return this.currentGame?.activePlayers.has(playerId) ?? false;
    }
    hasWinConditionType(type) {
        return (this.currentGame?.winCondition.type ?? null) === type;
    }
    waitEventMismatch(event, waitFor) {
        return event !== waitFor;
    }
    onWin(playerId) {
        if (!this.isPhaseType("game"))
            return { processed: false, reason: FAIL_REASON.WRONG_PHASE_TYPE };
        if (!this.hasActiveGame())
            return { processed: false, reason: FAIL_REASON.NO_ACTIVE_GAME };
        if (!this.isActivePlayer(playerId))
            return { processed: false, reason: FAIL_REASON.PLAYER_NOT_ACTIVE };
        const game = this.currentGame;
        if (game.winCondition.type !== "quorum_win")
            return { processed: false, reason: FAIL_REASON.WRONG_WIN_CONDITION };
        const phase = this.phase;
        const wc = game.winCondition;
        if (wc.trigger !== "player_won")
            return { processed: false, reason: FAIL_REASON.WRONG_TRIGGER };
        game.winPlayers.add(playerId);
        const needed = this.resolveQuorum(wc.quorum, game.activePlayers.size);
        const quorumMet = game.winPlayers.size >= needed;
        if (quorumMet)
            this.finishGamePhase(phase);
        return { processed: true, data: { currentWins: game.winPlayers.size, needed, quorumMet } };
    }
    onLost(playerId) {
        if (!this.isPhaseType("game"))
            return { processed: false, reason: FAIL_REASON.WRONG_PHASE_TYPE };
        if (!this.hasActiveGame())
            return { processed: false, reason: FAIL_REASON.NO_ACTIVE_GAME };
        if (!this.isActivePlayer(playerId))
            return { processed: false, reason: FAIL_REASON.PLAYER_NOT_ACTIVE };
        const game = this.currentGame;
        if (game.winCondition.type !== "timer_survival")
            return { processed: false, reason: FAIL_REASON.WRONG_WIN_CONDITION };
        const phase = this.phase;
        game.lostPlayers.add(playerId);
        const allLost = game.lostPlayers.size >= game.activePlayers.size;
        if (allLost) {
            if (game.timer)
                clearTimeout(game.timer);
            this.finishGamePhase(phase);
        }
        return { processed: true, data: { currentLosses: game.lostPlayers.size, total: game.activePlayers.size, allLost } };
    }
    onPlayerEliminated(_playerId) {
        if (this.isSpectator(_playerId))
            return { processed: false, reason: FAIL_REASON.PLAYER_IS_SPECTATOR };
        return { processed: true, data: {} };
    }
    onResultsAck(_playerId) {
        return { processed: true, data: {} };
    }
    onWaitEvent(playerId, event) {
        if (!this.isPhaseType("wait"))
            return { processed: false, reason: FAIL_REASON.WRONG_PHASE_TYPE };
        const phase = this.phase;
        if (this.waitEventMismatch(event, phase.waitFor))
            return { processed: false, reason: FAIL_REASON.EVENT_MISMATCH };
        if (this.isSpectator(playerId))
            return { processed: false, reason: FAIL_REASON.PLAYER_IS_SPECTATOR };
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
    advance() {
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
                                phases: parentPhase.phases,
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
            if (phase.type === "wait" || phase.type === "game")
                return;
        }
    }
    executePhase(phase) {
        console.log(`[Sequencer] Phase: ${phase.id} (${phase.type})`);
        broadcast(JSON.stringify(createMessage(SERVER_MSG.PHASE_CHANGED, {
            phaseId: phase.id,
            phaseType: phase.type
        })));
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
                this.endLobby();
                break;
        }
    }
    startWaitPhase(phase) {
        this.waitCollected.clear();
        if (this.waitTimer)
            clearTimeout(this.waitTimer);
        if (phase.timeout > 0) {
            this.waitTimer = setTimeout(() => {
                console.log(`[Sequencer] Wait phase "${phase.id}" timed out`);
                this.finishWaitPhase();
            }, phase.timeout * 1000);
        }
        const players = [...this.lives.entries()].map(([id, lives]) => ({
            id,
            lives,
            isSpectator: lives <= 0
        }));
        if (phase.worldId) {
            broadcast(JSON.stringify(createMessage(SERVER_MSG.LOAD_WORLD, { worldId: phase.worldId, players })));
        }
        else if (phase.waitFor === "WORLD_LOADED" && this.currentGame?.modeId) {
            broadcast(JSON.stringify(createMessage(SERVER_MSG.LOAD_WORLD, { worldId: this.currentGame.modeId, players })));
            console.log(`[Sequencer] Broadcasting LOAD_WORLD for game: ${this.currentGame.modeId}`);
        }
    }
    finishWaitPhase() {
        this.waitCollected.clear();
        this.advance();
    }
    startGamePhase(phase) {
        const activePlayers = this.getActivePlayers();
        const selected = this.selectGameMode(phase, activePlayers.length);
        if (!selected) {
            console.error("[Sequencer] No gamemode matched conditions");
            this.advance();
            return;
        }
        const { candidate } = selected;
        this.currentGame = {
            modeId: candidate.modeId,
            winCondition: candidate.winCondition,
            activePlayers: new Set(activePlayers),
            winPlayers: new Set(),
            lostPlayers: new Set(),
            timer: null,
            candidate
        };
        console.log(`[Sequencer] startGamePhase created game | modeId=${candidate.modeId} | winCondition=${candidate.winCondition.type}`);
        if (phase.beforeStart && phase.beforeStart.length > 0) {
            this.stack.push({ phases: phase.beforeStart, index: -1, gamePhase: phase });
            this.advance();
            return;
        }
        this.broadcastStartWorld(phase);
    }
    broadcastStartWorld(phase) {
        if (!this.currentGame?.winCondition)
            return;
        console.log(`[Sequencer] broadcastStartWorld | modeId: ${this.currentGame?.modeId} | winCondition: ${this.currentGame?.winCondition.type}`);
        broadcast(JSON.stringify(createMessage(SERVER_MSG.START_WORLD, {})));
        if (this.currentGame.winCondition.type === "timer_survival") {
            this.currentGame.timer = setTimeout(() => {
                if (this.currentGame)
                    this.finishGamePhase(phase);
            }, this.currentGame.winCondition.duration * 1000);
        }
        console.log(`[Sequencer] Game started: ${this.currentGame.modeId}`);
        this.gameRunning = true;
        this.phase = phase;
    }
    startCinematicPhase(phase) {
        console.log(`[Sequencer] Cinematic phase: ${phase.id} (${phase.timeout}s)`);
        setTimeout(() => {
            console.log(`[Sequencer] Cinematic phase "${phase.id}" finished`);
            this.advance();
        }, phase.timeout * 1000);
    }
    finishGamePhase(phase) {
        console.log(`[Sequencer] finishGamePhase called | gameMode: ${this.currentGame?.modeId} | winPlayers: ${[...this.currentGame?.winPlayers ?? []]} | lostPlayers: ${[...this.currentGame?.lostPlayers ?? []]}`);
        this.gameRunning = false;
        const game = this.currentGame;
        if (game.timer)
            clearTimeout(game.timer);
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
        const rankings = [
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
        const livesRemaining = {};
        for (const [id, lives] of this.lives) {
            livesRemaining[id] = lives;
        }
        broadcast(JSON.stringify(createMessage(SERVER_MSG.PHASE_CHANGED, {
            phaseId: phase.id,
            phaseType: "end",
            data: { rankings, livesRemaining }
        })));
        if (this.isLobbyOver()) {
            console.log(`[Sequencer] isLobbyOver check | activePlayers: ${this.getActivePlayers()} | lobbyWinCondition: ${this.config.lobbyWinCondition.type}`);
            this.endLobby();
            return;
        }
        this.advance();
    }
    computeLosers(game) {
        if (game.winCondition.type === "quorum_win") {
            return new Set([...game.activePlayers].filter((id) => !game.winPlayers.has(id)));
        }
        return new Set(game.lostPlayers);
    }
    applyElimination(losers, livesLost) {
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
    isLobbyOver() {
        const wc = this.config.lobbyWinCondition;
        const active = this.getActivePlayers();
        if (wc.type === "last_with_lives")
            return active.length <= 1;
        if (wc.type === "fixed_rounds")
            return this.roundsPlayed >= wc.value;
        if (wc.type === "best_cumulative_score")
            return active.length <= 1;
        return false;
    }
    shouldContinueLoop() {
        return !this.isLobbyOver();
    }
    endLobby() {
        this.gameRunning = false;
        console.log(`[Sequencer] endLobby called | activePlayers: ${this.getActivePlayers()} | frame: ${this.frame?.index}/${this.frame?.phases.length} | phase: ${this.phase?.id}`);
        const active = this.getActivePlayers();
        const winner = active[0] ?? null;
        console.log(`[Sequencer] Lobby ended. Winner: ${winner}`);
        broadcast(JSON.stringify(createMessage(SERVER_MSG.LOBBY_END, {
            scores: [],
            rankings: winner ? [{ playerId: winner, rank: 1, score: 0 }] : []
        })));
        for (const ws of sockets.values()) {
            ws.close();
        }
        this.reset();
        this.start();
        console.log("[Sequencer] Lobby reset, waiting for new connections");
    }
    resolveQuorum(quorum, total) {
        if (typeof quorum === "number")
            return quorum;
        const pct = parseInt(quorum, 10) / 100;
        return Math.max(1, Math.ceil(total * pct));
    }
    selectGameMode(phase, activeCount) {
        const count = activeCount ?? this.getActivePlayers().length;
        for (const entry of phase.gameModeSelect) {
            if (this.evalCondition(entry.condition, count)) {
                const candidate = entry.pick === "random" ? entry.candidates[Math.floor(Math.random() * entry.candidates.length)] : entry.candidates[0];
                return { entry, candidate };
            }
        }
        return null;
    }
    evalCondition(condition, activePlayers) {
        if (condition === "true")
            return true;
        const m = condition.match(/^activePlayers\s*(>|>=|<|<=|==|!=)\s*(\d+)$/);
        if (!m)
            return false;
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
    peekNextGamePhase() {
        for (let s = this.stack.length - 1; s >= 0; s--) {
            const frame = this.stack[s];
            for (let i = frame.index + 1; i < frame.phases.length; i++) {
                const p = frame.phases[i];
                if (p.type === "game")
                    return p;
                if (p.type === "loop") {
                    const inner = p.phases.find((x) => x.type === "game");
                    if (inner)
                        return inner;
                }
            }
        }
        return null;
    }
}
//# sourceMappingURL=sequencer.js.map