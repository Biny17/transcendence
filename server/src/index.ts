import { Sequencer, type EventResult } from "./sequencer";
import { addPlayer, removePlayer, positions, sockets, broadcast, broadcastExcept, sendTo, usernames, findPlayerByUsername, resetState } from "./state";
import { createMessage, parseMessage, SERVER_MSG, CLIENT_MSG, PHASE_EVENTS } from "shared/protocol";
import type { WSMessage, JoinPayload, PlayerInputPayload, PhaseEventPayload } from "shared/protocol";
import type { LobbySequenceConfig } from "shared/config";
import type { PlayerState } from "shared/state";
import yaml from "js-yaml";
const PORT = parseInt(Bun.env.PORT ?? "3002");
const TICK_MS = 50;
const configName = Bun.env.LOBBY_CONFIG ?? "one_game";
const configPath = `${import.meta.dir}/../configs/${configName}.yaml`;
const configFile = await Bun.file(configPath).text();
const sequenceConfig = yaml.load(configFile) as LobbySequenceConfig;
const sequencer = new Sequencer(sequenceConfig);
let tick = 0;
setInterval(() => {
	if (sockets.size === 0) return;
	tick++;
	const players: PlayerState[] = [];
	for (const [id, p] of positions) {
		players.push({ id, pos: p.pos, rot: p.rot, action: p.action });
	}
	broadcast(JSON.stringify(createMessage(SERVER_MSG.WORLD_STATE, { tick, players, events: [] })));
}, TICK_MS);
const server = Bun.serve<{ playerId: string }>({
	port: PORT,
	fetch(req, server) {
		const url = new URL(req.url);
		if (url.pathname === "/ws") {
			const upgraded = server.upgrade(req, { data: { playerId: "" } });
			if (upgraded) return;
			return new Response("WebSocket upgrade failed", { status: 400 });
		}
		return new Response("Engine Server OK", { status: 200 });
	},
	websocket: {
		open(ws) {
			const playerId = `player_${crypto.randomUUID().slice(0, 8)}`;
			ws.data.playerId = playerId;
			addPlayer(playerId, ws as any);
			ws.send(JSON.stringify(createMessage(SERVER_MSG.CONNECTED, { playerId })));
			console.log(`[Server] Socket opened: ${playerId} (awaiting JOIN)`);
		},
		message(ws, raw) {
			const msg = parseMessage(raw as string) as WSMessage;
			const playerId = ws.data.playerId;
			switch (msg.type) {
				case CLIENT_MSG.JOIN: {
					const { username } = msg.payload as JoinPayload;
					if (!username) break;
					console.log(`[Server] JOIN received | playerId=${playerId} username=${username}`);
					console.log(`[Server] sequencer.isStarted()=${sequencer.isStarted()} sequencer.isInLobbyWait()=${sequencer.isInLobbyWait()}`);
					if (!sequencer.isStarted()) {
						sequencer.start();
					}
					const existingId = findPlayerByUsername(username);
					console.log(`[Server] existingId=${existingId}`);
					const knownBySequencer = existingId && sequencer.hasPlayer(existingId);
					console.log(`[Server] knownBySequencer=${knownBySequencer}`);
					const hasLives = existingId ? sequencer.getLives(existingId) > 0 : false;
					console.log(`[Server] hasLives=${hasLives} existingId=${existingId} existingLives=${existingId ? sequencer.getLives(existingId) : 'N/A'}`);
					if (sequencer.isInLobbyWait()) {
						console.log(`[Server] BRANCH: lobby_wait - adding new player`);
						usernames.set(playerId, username);
						sequencer.addPlayer(playerId);
						const loadWorldId = "Lobby";
						broadcast(
							JSON.stringify(
								createMessage(SERVER_MSG.LOAD_WORLD, {
									worldId: loadWorldId,
									players: [...sequencer.getActivePlayers()].map((id) => ({
										id,
										name: usernames.get(id) ?? id,
										lives: sequencer.getLives(id),
										isSpectator: sequencer.getLives(id) <= 0
									}))
								})
							)
						);
						console.log(`[Server] ${username} joined lobby as ${playerId}`);
					} else if (knownBySequencer && hasLives) {
						console.log(`[Server] BRANCH: reconnect/re-sync`);
						usernames.delete(existingId);
						usernames.set(playerId, username);
						console.log(`[Server] removePlayer(${existingId})`);
						sequencer.removePlayer(existingId);
						console.log(`[Server] addPlayer(${playerId})`);
						sequencer.addPlayer(playerId);
						console.log(`[Server] addActivePlayer(${playerId})`);
						sequencer.addActivePlayer(playerId);
						const activePlayers = sequencer.getActivePlayers();
						const worldId = sequencer.isInGamePhase() && sequencer.getCurrentGameMode() ? sequencer.getCurrentGameMode() : sequencer.getLoadWorldId();
						broadcastExcept(
							playerId,
							JSON.stringify(createMessage(SERVER_MSG.PLAYER_JOIN, { id: playerId, name: username }))
						);
						sendTo(
							playerId,
							JSON.stringify(
								createMessage(SERVER_MSG.LOAD_WORLD, {
									worldId,
									players: activePlayers.map((id) => ({
										id,
										name: usernames.get(id) ?? id,
										lives: sequencer.getLives(id),
										isSpectator: sequencer.getLives(id) <= 0
									}))
								})
							)
						);
						console.log(`[Server] ${username} re-synced as ${playerId}`);
					} else {
						usernames.set(playerId, username);
						sendTo(
							playerId,
							JSON.stringify(
								createMessage(SERVER_MSG.LOAD_WORLD, {
									worldId: sequencer.getLoadWorldId(),
									players: [...sequencer.getActivePlayers()]
										.map((id) => ({
											id,
											name: usernames.get(id) ?? id,
											lives: sequencer.getLives(id),
											isSpectator: false
										}))
										.concat([{ id: playerId, name: username, lives: 0, isSpectator: true }])
								})
							)
						);
						console.log(`[Server] ${username} joined as spectator`);
					}
					break;
				}
				case CLIENT_MSG.PLAYER_INPUT: {
					const input = msg.payload as PlayerInputPayload;
					positions.set(playerId, {
						pos: input.pos,
						rot: input.rot,
						action: input.action
					});
					break;
				}
				case CLIENT_MSG.WORLD_LOADED: {
					const username = usernames.get(playerId) ?? playerId;
					console.log(`[Server] ${username} loaded world`);
					if (sequencer.isInLobbyWait()) {
						sendTo(
							playerId,
							JSON.stringify(createMessage(SERVER_MSG.START_WORLD, { worldId: "Lobby" }))
						);
					} else if (sequencer.isInGamePhase()) {
						const result = sequencer.onGameWorldLoaded(playerId);
						if (result.processed) {
							const data = result.data as { loaded?: number; total?: number; allLoaded?: boolean };
							console.log(`[Server] ${username} → game_world_loaded (loaded=${data?.loaded}/${data?.total})`);
						}
					}
					break;
				}
				case CLIENT_MSG.PLAYER_READY: {
					if (sequencer.isInLobbyWait()) {
						sequencer.onWaitEvent(playerId, CLIENT_MSG.PLAYER_READY);
					}
					break;
				}
				case CLIENT_MSG.PHASE_EVENT: {
					const payload = msg.payload as PhaseEventPayload;
					const { event } = payload;
					const username = usernames.get(playerId) ?? playerId;
					if (event === PHASE_EVENTS.WIN) console.log(`[Server] onWin called | playerId: ${playerId} | currentPhase: ${sequencer.getCurrentPhaseId()}`);
					if (event === PHASE_EVENTS.LOST) console.log(`[Server] onLost called | playerId: ${playerId} | currentPhase: ${sequencer.getCurrentPhaseId()}`);
					let result: EventResult;
					switch (event) {
						case PHASE_EVENTS.WIN: {
							result = sequencer.onWin(playerId);
							break;
						}
						case PHASE_EVENTS.LOST: {
							result = sequencer.onLost(playerId);
							break;
						}
						case PHASE_EVENTS.PLAYER_ELIMINATED: {
							result = sequencer.onPlayerEliminated(playerId);
							break;
						}
						case PHASE_EVENTS.RESULTS_ACK: {
							result = sequencer.onResultsAck(playerId);
							break;
						}
						default: {
							console.warn(`[Server] Unknown phase event: "${event}" from ${username}`);
							result = { processed: false };
							break;
						}
					}
					if (result.processed) {
						console.log(`[Server] ${username} → ${event} (ok)`);
						if (result.data?.quorumMet) {
							console.log(`[Server] Quorum met!`);
						}
					} else {
						console.warn(`[Server] ${username} → ${event} rejected: ${result.reason}`);
					}
					break;
				}
				case CLIENT_MSG.RESET: {
					tick = 0;
					resetState();
					sequencer.reset();
					sequencer.start();
					broadcast(
						JSON.stringify(
							createMessage(SERVER_MSG.PHASE_CHANGED, {
								phaseId: "Lobby",
								phaseType: "wait"
							})
						)
					);
					console.log("[Server] State reset by admin");
					break;
				}
			}
		},
		close(ws) {
			const playerId = ws.data.playerId;
			const username = usernames.get(playerId);
			console.log(`[Server] ${username ?? playerId} disconnected`);
			broadcast(JSON.stringify(createMessage(SERVER_MSG.PLAYER_DISCONNECT, { playerId, reason: "client_disconnect" })));
			removePlayer(playerId);
			if (sequencer.isInLobbyWait()) {
				sequencer.removePlayer(playerId);
				usernames.delete(playerId);
			}
		}
	}
});
console.log(`[Server] Running on ws://localhost:${PORT}/ws`);
