import { Sequencer, type EventResult } from "./sequencer";
import { addPlayer, removePlayer, positions, sockets, broadcast, broadcastExcept, sendTo, usernames, cosmetics, findPlayerByUsername, resetState } from "./state";
import { fetchUserProfile } from "./api-client";
import { createMessage, parseMessage, SERVER_MSG, CLIENT_MSG, PHASE_EVENTS } from "shared/protocol";
import type { WSMessage, JoinPayload, PlayerInputPayload, PhaseEventPayload, LoadWorldPlayer } from "shared/protocol";
import type { LobbySequenceConfig } from "shared/config";
import type { PlayerState } from "shared/state";
import yaml from "js-yaml";
const PORT = parseInt(Bun.env.PORT ?? "3000");
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
	fetch(req: Request, server: any) {
		const url = new URL(req.url);
		if (url.pathname === "/") {
			const upgraded = server.upgrade(req, { data: { playerId: "" } });
			if (upgraded) return;
			return new Response("WebSocket upgrade failed", { status: 400 });
		}
		return new Response("Engine Server OK", { status: 200 });
	},
	websocket: {
		open(ws: any) {
			const playerId = `player_${crypto.randomUUID().slice(0, 8)}`;
			ws.data.playerId = playerId;
			addPlayer(playerId, ws as any);
			ws.send(JSON.stringify(createMessage(SERVER_MSG.CONNECTED, { playerId })));
			console.log(`[Server] Socket opened: ${playerId} (awaiting JOIN)`);
		},
		async message(ws: any, raw: string) {
			const msg = parseMessage(raw as string) as WSMessage;
			const playerId = ws.data.playerId;
			switch (msg.type) {
				case CLIENT_MSG.JOIN: {
					const { username } = msg.payload as JoinPayload;
					if (!username) break;
					console.log(`[Server] JOIN received | playerId=${playerId} username=${username}`);
					console.log(`[Server] sequencer.isStarted()=${sequencer.isStarted()} sequencer.isInLobbyWait()=${sequencer.isInLobbyWait()}`);
					const profile = await fetchUserProfile(username);
					cosmetics.set(playerId, { skinColor: profile?.skin_color ?? "#FFDBAC", faceColor: profile?.face_color ?? "#222222" });
					if (!sequencer.isStarted()) {
						sequencer.start();
					}
					const existingId = findPlayerByUsername(username);
					console.log(`[Server] existingId=${existingId}`);
					const knownBySequencer = existingId && sequencer.hasPlayer(existingId);
					console.log(`[Server] knownBySequencer=${knownBySequencer}`);
					const hasLives = existingId ? sequencer.getLives(existingId) > 0 : false;
					console.log(`[Server] hasLives=${hasLives} existingId=${existingId} existingLives=${existingId ? sequencer.getLives(existingId) : "N/A"}`);
					if (existingId && existingId !== playerId) {
						console.log(`[Server] BRANCH: lobby_wait - duplicate username "${username}" — replacing old player ${existingId} with ${playerId}`);
						usernames.delete(existingId);
						sequencer.removePlayer(existingId);
						broadcast(JSON.stringify(createMessage(SERVER_MSG.PLAYER_DISCONNECT, { playerId: existingId, reason: "duplicate_username" })));
						sockets.get(existingId)?.close();
					}
					function playerData(id: string): LoadWorldPlayer {
						const c = cosmetics.get(id);
						return {
							id,
							name: usernames.get(id) ?? id,
							skin: c?.skinColor,
							cosmetics: c ? [c.faceColor] : undefined,
							skinColor: c?.skinColor,
							faceColor: c?.faceColor,
							lives: sequencer.getLives(id),
							isSpectator: sequencer.getLives(id) <= 0
						};
					}
					if (sequencer.isInLobbyWait()) {
						console.log(`[Server] BRANCH: lobby_wait - adding new player`);
						usernames.set(playerId, username);
						sequencer.addPlayer(playerId);
						broadcastExcept(playerId, JSON.stringify(createMessage(SERVER_MSG.PLAYER_JOIN, playerData(playerId))));
						const loadWorldId = "Lobby";
						sendTo(
							playerId,
							JSON.stringify(
								createMessage(SERVER_MSG.LOAD_WORLD, {
									worldId: loadWorldId,
									players: [...sequencer.getActivePlayers()].map(playerData)
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
						broadcastExcept(playerId, JSON.stringify(createMessage(SERVER_MSG.PLAYER_JOIN, playerData(playerId))));
						sendTo(
							playerId,
							JSON.stringify(
								createMessage(SERVER_MSG.LOAD_WORLD, {
									worldId,
									players: activePlayers.map(playerData)
								})
							)
						);
						console.log(`[Server] ${username} re-synced as ${playerId}`);
					} else {
						if (existingId && existingId !== playerId) {
							console.log(`[Server] BRANCH: spectator - duplicate username "${username}" — replacing old player ${existingId} with ${playerId}`);
							usernames.delete(existingId);
							sequencer.removePlayer(existingId);
							broadcast(JSON.stringify(createMessage(SERVER_MSG.PLAYER_DISCONNECT, { playerId: existingId, reason: "duplicate_username" })));
							sockets.get(existingId)?.close();
						}
						usernames.set(playerId, username);
						sendTo(
							playerId,
							JSON.stringify(
								createMessage(SERVER_MSG.LOAD_WORLD, {
									worldId: sequencer.getLoadWorldId(),
									players: [...sequencer.getActivePlayers()]
										.map(playerData)
										.concat([playerData(playerId)])
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
				case CLIENT_MSG.PLAYER_EMOTE: {
					const emotePayload = msg.payload as { clipName: string };
					broadcastExcept(playerId, JSON.stringify(createMessage(SERVER_MSG.PLAYER_EMOTE, { playerId, clipName: emotePayload.clipName })));
					break;
				}
				case CLIENT_MSG.WORLD_LOADED: {
					const username = usernames.get(playerId) ?? playerId;
					console.log(`[Server] ${username} loaded world`);
					if (sequencer.isInLobbyWait()) {
						sendTo(playerId, JSON.stringify(createMessage(SERVER_MSG.START_WORLD, { worldId: "Lobby" })));
					} else if (sequencer.isInGamePhase()) {
						const result = sequencer.onGameWorldLoaded(playerId);
						if (result.processed) {
							const data = result.data as { loaded?: number; total?: number; allLoaded?: boolean; gameAlreadyRunning?: boolean };
							if (data?.gameAlreadyRunning) {
								const worldId = sequencer.getCurrentGameMode();
								if (worldId) {
									sendTo(playerId, JSON.stringify(createMessage(SERVER_MSG.START_WORLD, { worldId })));
									console.log(`[Server] ${username} → re-synced to running game (worldId=${worldId})`);
								}
							} else {
								console.log(`[Server] ${username} → game_world_loaded (loaded=${data?.loaded}/${data?.total})`);
							}
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
		if (sockets.size === 0) {
			tick = 0;
			sequencer.reset();
			sequencer.start();
			console.log("[Server] All clients disconnected - sequence reset, waiting in lobby");
		}
	},
	close(ws: any) {
		const playerId = ws.data.playerId;
		const username = usernames.get(playerId);
		console.log(`[Server] ${username ?? playerId} disconnected`);
		broadcast(JSON.stringify(createMessage(SERVER_MSG.PLAYER_DISCONNECT, { playerId, reason: "client_disconnect" })));
		removePlayer(playerId);
		if (sequencer.isInLobbyWait()) {
			sequencer.removePlayer(playerId);
			usernames.delete(playerId);
		}
		if (sockets.size === 0) {
			tick = 0;
			sequencer.reset();
			sequencer.start();
			console.log("[Server] Last client disconnected - sequence reset, waiting in lobby");
		}
	}
	}
});
console.log(`[Server] Running on ws://localhost:${PORT}`);
