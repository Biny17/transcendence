# server — TREEFRAG (LOD 1+4)
> Node names + tag lines. ASCII format. Bun WebSocket game server.

```
server                                          # Bun WebSocket game server
├── src/
│   ├── index.ts                                # Entry: Bun.serve, WebSocket lifecycle, tick loop
│   │   ├── config loading                      # Read YAML lobby config (js-yaml), build Sequencer
│   │   ├── tick interval (50ms)                # Aggregate all positions → broadcast WORLD_STATE
│   │   ├── fetch                               # Upgrade /ws to WebSocket; returns "Engine Server OK" on other routes
│   │   ├── open                                # Assign playerId via UUID, register in state, send CONNECTED
│   │   ├── message                             # switch(msg.type):
│   │   │   ├── JOIN                            #   → lobby wait? join; reconnect w/ lives? re-sync; else spectate
│   │   │   ├── PLAYER_INPUT                    #   → store pos/rot/action in state (relayed via tick)
│   │   │   ├── WORLD_LOADED                    #   → broadcast START_WORLD (commented out: forward to sequencer)
│   │   │   ├── PHASE_EVENT                     #   → route event to onWin/onLost/onPlayerEliminated/onResultsAck
│   │   │   └── RESET                          #   → reset state + sequencer, restart lobby
│   │   └── close                               # Remove from state; if lobby wait, also remove from sequencer
│   ├── state.ts                                # Shared mutable server state (single lobby)
│   │   ├── sockets: Map<id, ClientWS>          # Connected WebSocket handles
│   │   ├── positions: Map<id, pos+rot+action>  # Latest position per player (written by PLAYER_INPUT)
│   │   ├── usernames: Map<id, string>          # Player display names (set on JOIN)
│   │   ├── hostId                              # First connected player = host
│   │   ├── setHost                             # Manually override host
│   │   ├── resetState                          # Clear all state (sockets/positions/usernames/hostId)
│   │   ├── addPlayer / removePlayer            # Register/unregister socket + position + host rotation
│   │   ├── findPlayerByUsername                # Reverse lookup id by username (for reconnect)
│   │   └── sendTo / broadcast / broadcastExcept # Message helpers
│   └── sequencer.ts                            # Phase-based lobby orchestrator (class Sequencer)
│       ├── addPlayer / removePlayer            # Register with globalLives; clean up on disconnect
│       ├── getActivePlayers / hasPlayer / getLives # Query player state
│       ├── isStarted / isInLobbyWait / getCurrentPhaseId # Query sequencer state
│       ├── start                               # Push config phases onto stack, begin advancing
│       ├── onWin                               # Handle quorum_win: collect wins, resolve quorum → finishGamePhase
│       ├── onLost                              # Handle timer_survival: collect losses, all lost → finishGamePhase
│       ├── onPlayerEliminated                  # Mark spectator (no-op, handled by applyElimination)
│       ├── onResultsAck                        # Results acknowledgment (no-op)
│       ├── onWaitEvent                         # Collect wait phase acks; resolve quorum → finishWaitPhase
│       ├── advance                             # Step through phase stack; push loop phases; re-enter when shouldContinueLoop
│       ├── executePhase                        # Dispatch phase by type (wait/game/loop/end); broadcast PHASE_CHANGED
│       ├── startWaitPhase                      # Init quorum collector, optional timeout; LOAD_WORLD if worldId or waitFor=WORLD_LOADED
│       ├── finishWaitPhase                     # Clear collected, advance to next phase
│       ├── startGamePhase                      # Select gamemode via selectGameMode, broadcast START_WORLD; arm timer if timer_survival
│       ├── finishGamePhase                     # Compute losers, apply elimination, broadcast ROUND_END with rankings
│       ├── computeLosers                       # quorum_win → non-winners; timer_survival → lost set
│       ├── applyElimination                    # Deduct lives; mark eliminated as spectators; broadcast PLAYER_ELIMINATED
│       ├── isLobbyOver / shouldContinueLoop    # Check lobbyWinCondition (last_with_lives / fixed_rounds / best_cumulative_score)
│       ├── endLobby                            # Broadcast LOBBY_END with winner rankings
│       ├── selectGameMode / evalCondition      # Dynamic gamemode selection based on active player count
│       ├── peekNextGamePhase                   # Look ahead in stack for next game phase (for LOAD_WORLD in wait phase)
│       └── resolveQuorum                       # Convert "80%" or integer to player count
├── configs/
│   ├── battle_royale.yaml                      # Multi-round elimination: loop(load→game→results) until last alive
│   └── one_game.yaml                          # Single game, 1 life, first to finish wins (was: no_life_one_game)
├── package.json                                # bun scripts: dev (--watch), start
├── tsconfig.json                               # paths: shared/* → ../shared/*
├── Dockerfile                                  # oven/bun:slim, copies server + shared
├── .dockerignore
├── bun.lock
└── FRAGTREE.md
```
