# ThreeWrapper — TREEFRAG (LOD 1+4)

> Node names + tag lines. ASCII format. ~12:1 compression over raw source.
> **Update rule:**
> - Always use `...` notation for `examples/`, `envs/` and similar preset/variant directories (never list individual files)
> - Omit detailed methods for world variants, example worlds, and environment presets
> - List only base classes, main implementations, and core utilities—not concrete variants
> - Last updated: 2026-05-06

```
ThreeWrapper                                    # Three.js engine wrapper for game client
├── 1.engine
│   ├── Engine                                  # Core render loop, owns renderer + active world + persistent DebugControlModule + UIModule
│   │   ├── (public fields)                     # mode, renderer, keymap, logger, selfServerClient, server?, debug, uiModule
│   │   ├── (public state)                      # paused, timeScale, gravity, stepRequested
│   │   ├── constructor(config, defaultKeymap?) # Init renderer, server (online), keymap, UIModule (window.__uiModule singleton), DebugControlModule
│   │   ├── preload(world, players?)            # Bind engine ctx + players + debug, then world.init()
│   │   ├── load(world, players?)               # Dispose active world, then preload()
│   │   ├── activate(world)                     # Dispose active world, set new active (no init)
│   │   ├── startActive(initialState?)          # Trigger world.start()
│   │   ├── loadAndStart(world)                 # load() then startActive() in sequence
│   │   ├── connect                             # Open WebSocket via ServerHandler (online mode only)
│   │   ├── start                               # Begin rAF render loop; reads window.__engine state (paused/timeScale/gravity/wireframe/shadows/fog/ambient)
│   │   ├── stop                                # Cancel rAF loop
│   │   ├── resize(width, height)               # Update renderer size and camera aspect ratio
│   │   └── dispose                             # Stop loop, dispose world, server, renderer
│   ├── EngineCanvas                            # React component mounting the WebGL canvas; onReady callback prop
│   ├── EventHandler                            # Generic event system (on/off/emit/onAction/dispatchAction); GameConfigAction routing
│   ├── hooks
│   │   └── useLocalKeybinds                    # React hook: load/save KeyBinding[] from localStorage
│   ├── tools.ts                                # Barrel: re-exports ServerHandler, KeymapHandler, Logger, Self + types (ServerHandlerScope, ServerSend)
│   ├── tools
│   │   ├── KeymapHandler                       # Key binding registry, maps key codes to actions
│   │   │   ├── register / unregister / rebind  # Manage individual bindings
│   │   │   ├── isPressed / on / off            # Query and subscribe to actions
│   │   │   ├── getAltKey / getBinding          # Lookup helpers
│   │   │   └── registerMany                    # Bulk register bindings
│   │   ├── Logger                              # Singleton debug logger with phase tracking + ring buffer
│   │   │   ├── types: LogLevel, LogEntry, DebugConfig, VerbosityLevel, PhaseTracker, LoggerInstance
│   │   │   ├── getInstance                     # Return or create singleton instance
│   │   │   ├── setDebugConfig / getDebugConfig # Configure debug flags (bool or DebugConfig)
│   │   │   ├── for(name)                       # Create namespaced LoggerInstance
│   │   │   ├── pushPhase / popPhase            # Stack-based phase tracking with duration logging
│   │   │   ├── log / debug / info / warn / error  # Emit leveled log entries + dispatch debug:logs event
│   │   │   ├── logVariable                     # Log a named variable value (debug only)
│   │   │   ├── interceptConsole                # Monkey-patch window.console methods
│   │   │   ├── shouldLogThisFrame              # True if current frame matches logFrameCount cadence
│   │   │   ├── incrementFrameCounter           # Advance internal frame counter each tick
│   │   │   ├── getEntries / clearEntries / setBufferSize (static)  # Ring buffer management
│   │   │   ├── serializeValue                  # Stringify arbitrary values for console display
│   │   │   └── inferCallerName                 # Extract calling function name from stack
│   │   ├── Self                                # Client's own connection state (id, name, isHost)
│   │   │   ├── setId / setHost                 # Mutate connection fields on server events
│   │   │   └── (fields) id, name, isHost
│   │   ├── ServerHandler                       # WebSocket client + server event router
│   │   │   ├── constructor(url, engine)         # Init WebSocket config, register internal handlers (CONNECTED, LOAD_WORLD, START_WORLD)
│   │   │   ├── setWorldResolver                # Set world factory function for LOAD_WORLD handling
│   │   │   ├── connect / disconnect            # Open/close WebSocket
│   │   │   ├── on / addIncomingInterceptor / addOutgoingInterceptor  # Subscribe + intercept
│   │   │   ├── dispatch(msg) / sendRaw(type, payload)  # Route/send WSMessage; runs interceptors
│   │   │   ├── scope                           # Create scoped handle; auto-cleans all on world dispose
│   │   │   ├── send.playerReady / assetsReady / playerInput  # Typed sends
│   │   │   ├── send.playerWon/Lost/Eliminated / resultsAck   # PHASE_EVENT sends
│   │   │   ├── send.playerInteract/Choose / join / worldLoaded
│   │   │   └── dispose                         # Disconnect, clear all handlers
│   │   └── communication
│   │       └── NetworkManager                  # Low-level WebSocket wrapper with reconnect + simulation
│   │           ├── (sim fields)                # simulateLagMs, simulatePacketLossPercent, simulatePacketDuplication
│   │           ├── setSimulateLag / setSimulatePacketLoss / setSimulatePacketDuplication
│   │           ├── forceDisconnectAndReconnect
│   │           ├── getSimulationState
│   │           ├── sendJoin / sendWorldLoaded
│   │           └── (base) connect/disconnect/send/onMessage/onOpen/onClose/onError
│   ├── Logger.ts (legacy)                      # Superseded by tools/Logger.ts
│   ├── KeymapHandler.ts (legacy)               # Superseded by tools/KeymapHandler.ts
│   ├── network (legacy)
│   │   ├── NetworkManager.ts                   # Superseded by tools/communication/NetworkManager.ts
│   │   └── protocol.ts                         # Re-export from @/shared/protocol
│   └── ServerMessageHandler.ts (legacy)        # Superseded by tools/ServerHandler.ts
├── 2.world
│   ├── World (abstract)                        # Scene container; manages modules, lifecycle, NO-LOGIC
│   │   ├── constructor(config: WorldConfig)    # Init scene, camera, loader tools → calls setupEnvironment()
│   │   ├── (fields)                            # config, ctx, scene, camera, gltf, objects, map, modules, _appliedEnvironments[]
│   │   ├── setupEnvironment (abstract)         # Subclass must call applyEnvironment(); no logic allowed
│   │   ├── _bindEngine(engineCtx, players)     # Engine-internal: injects EngineContext + players, builds WorldContext
│   │   ├── scene / getCamera                   # Accessors used by Engine for render loop and resize
│   │   ├── addModule / getModule / removeModule # Module registry
│   │   ├── applyEnvironment(env)               # Bulk-add all modules from an Environment preset; tracks applied env names
│   │   ├── init                                # Async: Physics init (RAPIER WASM) + progress localStorage → validate requires → init all modules → onLoad()
│   │   ├── start(initialState?)                # Guard-once call to onStart()
│   │   ├── update(delta)                       # Per-frame: updatePhysics + all module.update() + objects.update()
│   │   ├── dispose                             # Dispose modules + gltf + objects + scene; calls onDispose() + server.dispose()
│   │   ├── onLoad (protected, async)           # Override: async scene setup (load assets, maps, lights — NO game logic)
│   │   ├── onStart (protected)                 # Override: begin gameplay (subscribe to events, start timers)
│   │   └── onDispose (protected)               # Override: custom teardown
│   ├── EngineContext (type)                    # { renderer, keymap, logger, selfServerClient, server?, debug?, uiModule? }
│   ├── WorldRegistry (Map)                     # Map<string, () => Promise<World>> — lazy world factory map
│   │   └── resolveWorld(worldId)               # Lookup + instantiate by worldId
│   ├── worlds
│   │   ├── LobbyWorld                          # Pre-game lobby
│   │   ├── DemoWorld                           # Standalone demo / development sandbox
│   │   ├── EditorWorld                         # Visual map editor; places/deletes components, exports YAML
│   │   ├── LoadingWorld.tsx                    # Loading screen world (React component)
│   │   ├── UIWorld                             # UI-only overlay world (no 3D scene)
│   │   ├── VisualizerWorld                     # Visualizer world for debugging/development
│   │   ├── ConnectingWorld.tsx                 # Connection screen (React component)
│   │   ├── ParkourWorld                        # Parkour gameplay world
│   │   ├── ComponentCreatorWorld               # Component creator/editor world
│   │   ├── CharacterCustomizerWorld            # Character customization world
│   │   └── CharacterVisualizerWorld            # Character preview/visualizer world
│   ├── WorldTemplate.ts                        # Template for creating new worlds
│   ├── examples/...                            # InteractiveWorld, MinimalWorld, NetworkedWorld
│   ├── tools.ts                                # Barrel: re-exports all world tools + COLLISION_LAYER + makeZoneSphere/Box/Cylinder + LightFactory + GameConfigLoader
│   ├── tools
│   │   ├── GLTFLoader                          # Async GLTF/GLB asset loader with cache; ColorSwapConfig, applyTextureWithColorSwap()
│   │   ├── ComponentLoader                     # Load + cache component YAML/JSON prefab files; getLoadedIds(), clear()
│   │   ├── MapLoader                           # YAML/JSON map loader + scene spawner; types: MapDef, SkyDef, FogDef, LightDef, MapObjectInstance
│   │   ├── ObjectManager                       # Typed registry for scene objects; wraps scene + physics
│   │   │   ├── add / addSimple / addPiece / addHitbox / addRaw
│   │   │   ├── remove / removeByName / removeRaw
│   │   │   ├── get / getById / getByType / getAll / has
│   │   │   ├── setExtra / getExtra
│   │   │   ├── setPosition / getPosition / setRotation
│   │   │   ├── setVelocity / getVelocity / applyImpulse / getMass / setGravityScale
│   │   │   ├── isGrounded / isColliding
│   │   │   ├── addZone / removeZone / isInZone / getZonesForObject / getObjectsInZone
│   │   │   ├── playAnimation / stopAnimation / crossFadeAnimation
│   │   │   ├── attachPhysics / update / updatePhysics / dispose
│   │   │   └── types: ManagedObject, ManagedObjectInput, SimpleObjectInput, Piece, PieceHitbox, PhysicsDescriptor, HitboxShape, Vec3, OBJECT_TYPE, PlayerExtraData, NPCExtraData, MapExtraData
│   │   ├── PhysicsWorld                        # Rapier physics simulation; internal to ObjectManager
│   │   │   ├── constructor(scene, config?)     # Accept gravity override + debug flag; does NOT call RAPIER.init()
│   │   │   ├── init()                          # async — load RAPIER WASM and create World instance
│   │   │   ├── step(delta, allObjects)         # Advance simulation; sync callbacks; update zones
│   │   │   ├── registerPiece / unregister      # Create/destroy rigid body + colliders
│   │   │   ├── setVelocity / getVelocity / applyImpulse / setPosition / setRotation
│   │   │   ├── isGrounded / isColliding
│   │   │   ├── addZone / removeZone / isInZone / getZonesForObject / getObjectsInZone
│   │   │   ├── getMass / setGravityScale
│   │   │   ├── dispose
│   │   │   └── types: PhysicsWorldConfig, Zone, ZoneShape; makeZoneSphere/Box/Cylinder
│   │   ├── GeometryFactory                     # Builder helpers for common Three.js geometries (scale only, no position)
│   │   ├── LightFactory                        # Builder helpers for common Three.js lights
│   │   └── GameConfigLoader                    # Loads YAML/JSON game configs, registers event→action bindings via EventHandler
│   └── util
│       └── autoMeshHitbox                      # Auto-generates hitboxes from mesh geometry (OBB, merging, shape detection)
├── 3.environment
│   ├── Environment (base)                      # Holds module list for a preset; consumed by World.applyEnvironment()
│   │   ├── constructor(config)                 # Accept config (typically {}), init empty module array
│   │   ├── addModule (protected)               # Push module to internal list
│   │   └── getModules                          # Return module list (read by World.applyEnvironment)
│   ├── envs                                    # Preset environments (10 total)
│   │   ├── DefaultEnvironment                  # Standard gameplay environment
│   │   ├── MinimalEnvironment                  # Minimal (loading screen) environment
│   │   ├── OnlineEnvironement                  # Online multiplayer environment
│   │   ├── EditorEnvironment                   # Map editor environment
│   │   ├── LobbyEnvironment                    # Lobby environment
│   │   ├── UIEnvironment                       # UI-only environment
│   │   ├── VisualizerEnvironment               # Visualizer/debug environment
│   │   ├── ParkourEnvironment                  # Parkour game environment
│   │   ├── ComponentCreatorEnvironment         # Component creator environment
│   │   └── CharacterCustomizerEnvironment      # Character customizer environment
│   └── examples/...                            # DebugEnvironment, FPSEnvironment, InputEnvironment, InteractiveEnvironment, MinimalEnvironment, NetworkEnvironment
└── 4.module
    ├── ModuleClass                              # Module interface + ModuleKey enum + WorldContext type
    │   ├── ModuleKey (enum, 44 entries)         # Canonical string keys for all built-in modules
    │   ├── WorldContext                         # Full ctx object passed to every module.init()
    │   │   ├── (engine-level)                  # renderer, canvas, keymap, logger, selfServerClient, debug, server?, uiModule?
    │   │   └── (world-level)                  # scene (read-only), camera, gltf, objects, map, selfWorldPlayer, getModule<ModuleKey>
    │   └── Module (interface)                  # { type, requires?: ModuleKey[], init(ctx): void|Promise<void>, update?(delta), dispose() }
    ├── index                                    # Barrel: re-exports all built-in modules + ModuleKey + WorldContext + Module
    ├── examples/...                             # AssetPreloaderModule, EventListenerModule, NetworkPlayerModule, ObjectInteractionModule, PhysicsInteractionModule, SimpleTimerModule, StateTrackerModule
    ├── ModuleTemplate.ts                        # Template for creating new modules
    ├── core/                                    # (empty)
    ├── assets
    │   ├── AudioModule                         # Sound/audio management
    │   └── SkyboxModule                        # Skybox rendering
    ├── camera
    │   ├── FPVModule                           # First-person view: camera at target + eyeHeight, mouse look + WASD
    │   ├── TPVModule                           # Third-person view camera controller
    │   └── FreecamModule                       # Free-flying camera (no physics)
    ├── debug
    │   ├── StatsModule                         # FPS / draw-call / geometry overlay (DOM, configurable corner)
    │   ├── PhysicsDebugModule                  # Render Rapier physics collider wireframes
    │   ├── InspectorModule                     # Scene inspector / object picker overlay
    │   ├── DebugControlModule                  # Bridge (window.__debugCtrl): hover picking, 11 visual debug groups, object manipulation. Engine-owned (persists across world changes)
    │   ├── NetworkLogger                       # Packet capture via ServerHandler interceptors; attach/detach, fakeIncoming/fakeOutgoing, sendRealOutgoing, packetStates, onNetworkEntry
    │   └── TraceRecorder                       # Perfect Trace recording engine
    ├── editor
    │   ├── EditorOrbitCameraModule             # Orbit camera (mouse drag + scroll, editor only)
    │   ├── EditorPlacementModule               # Place / delete / undo components; exports YAML map
    │   ├── EditorHotbarModule                  # Hotbar UI for selecting component palette items
    │   ├── ComponentOrbitCameraModule          # Orbit camera for component preview
    │   ├── ComponentPreviewModule              # Component preview rendering
    │   ├── ComponentCreatorUIModule            # UI for component creation
    │   ├── CharacterCustomizerModule           # Character customization logic; AccessoryConfig type
    │   ├── CharacterCustomizerUIModule         # Character customization UI
    │   ├── CharacterOrbitCameraModule          # Orbit camera for character preview
    │   ├── componentExport                     # Export utilities for components
    │   ├── gltfVirtualFs                       # Virtual filesystem for GLTF assets
    │   └── components                          # React UI components
    │       ├── EditorUI.tsx
    │       ├── ComponentCreatorUI.tsx
    │       └── CharacterCustomizerUI.tsx
    ├── gameplay
    │   ├── PlayerAnimationModule               # Player animation handling
    │   ├── RagdollModule                       # Ragdoll physics
    │   ├── ScoreModule                         # Score tracking
    │   ├── SpectatorModule                     # Spectator mode
    │   ├── CheckpointModule                    # Checkpoint system
    │   ├── CountdownModule                     # Countdown timer
    │   └── EndLineModule                       # End line / finish line
    ├── input
    │   ├── InputModule                         # Raw input handling
    │   └── PlayerControlModule                 # Player movement controls
    ├── online
    │   ├── PlayerSyncModule                    # Player state synchronization
    │   ├── LagCompensationModule               # Lag compensation
    │   └── PingDisplayModule                   # Network ping display
    ├── physics
    │   ├── AntiFallModule                      # Anti-fall / boundary detection
    │   ├── MovingPlatformModule                # Moving platform logic
    │   ├── RespawnModule                       # Player respawn
    │   └── TriggerZoneModule                   # Trigger zones
    ├── players
    │   ├── PlayerBodyModule                    # Player body/character mesh
    │   ├── TeamModule                          # Team management (Team, TeamColor)
    │   └── LobbyReadyModule                    # Lobby ready state
    ├── rendering
    │   └── ResizeModule                        # Window resize handling
    └── ui
        ├── UIModule                            # UI overlay management; show/hide React panels; window.__uiModule singleton
        ├── EscapeUIModule                      # ESC menu UI
        ├── LoadingUI.tsx                       # Loading screen component
        ├── ConnectingUI.tsx                    # Connecting screen component
        ├── components
        │   ├── HUD.tsx
        │   ├── EscapeMenu.tsx
        │   └── KeybindsMenu.tsx
        └── DebugPanel                          # 5-tab dev panel (F1 toggle)
            ├── DebugPanel.tsx                  # Persistent parent shell: drag/drop, 5 tabs, window.__debugCtrl bridge, DebugControl interface (46 methods)
            ├── LoggingSection.tsx              # Log Level + Verbosity dropdown, LOG_CATEGORIES groups, tag filters, Perfect Trace recorder embedded
            ├── PerfectTraceSection.tsx         # Record modes (now/until event/N frames/manual), timeline, filters, HTML+JSON export
            ├── WorldInspectorSection.tsx       # Object list sidebar, ObjectInspector, Save/Load Snapshot, Hover overlay toggle
            ├── VisualDebugSection.tsx          # Hitbox/bounds/names/grid/shadows/fog/wireframe/noTextures/exposure/ambient/GI toggles
            ├── NetworkingSection.tsx           # Packet capture/filters, simulation (lag/loss/dup), blocked types, quick send, fake message
            ├── EngineControlsSection.tsx       # Time/pause/step, stats overlay, render/physics/cheats sections
            ├── ObjectInspector.tsx             # Live property editor: position/rotation/velocity/extra/pieces
            ├── LogConsole.tsx                  # Ring-buffer (1000) console: monkey-patches console methods; filterable, expandable, TXT/JSON export
            ├── ConsoleWindow.tsx               # Detachable console window with resize/collapse, localStorage state
            ├── StatsOverlay.tsx                # Canvas-based FPS/draw/tri graph overlay
            └── DebugPanel.css                  # Styles for all debug panel components
```

# WorldContext
> Single object passed to every `module.init(ctx)`. Store it, use it in `update`.

```
WorldContext
├── Engine-level
│   ├── renderer: THREE.WebGLRenderer      # size queries only — Engine owns render loop
│   ├── canvas: HTMLCanvasElement          # pointer-lock, getBoundingClientRect
│   ├── keymap: KeymapHandler             # keymap.isPressed(action) or keymap.on(action, cb)
│   ├── logger: Logger                     # logger.for('Name') → .info/.warn/.error/.debug
│   ├── selfServerClient: Self             # client identity: id, name, isHost
│   ├── debug: DebugControlModule          # persistent debug: re-inits on each world load, survives world changes
│   ├── uiModule?: UIModule               # persistent UI module (window.__uiModule singleton); show/hide React panels
│   └── server?: ServerHandlerScope       # online only — guard with server?.; auto-unsubbed on world dispose
└── World-level
    ├── scene: Omit<THREE.Scene,'add'|'remove'|'clear'>  # read-only; mutate via ctx.objects only
    ├── camera: THREE.PerspectiveCamera    # move/reparent freely; ResizeModule keeps aspect in sync
    ├── gltf: GLTFLoader                   # gltf.load(url) → LoadedModel; cached per world lifetime
    ├── objects: ObjectManager             # managed object registry + physics proxy; see ObjectManager section
    ├── map: MapLoader                    # map.loadFile(url) → MapDef; map.spawn(...) populates scene
    ├── selfWorldPlayer: ManagedObject<PLAYER> | null  # local player object; null if spectator
    └── getModule: <T extends Module>(type: ModuleKey) => T | undefined  # typed cross-module lookup
```

> `ctx.objects.add/remove` — tracked (scene + physics). `ctx.objects.addRaw/removeRaw` — ephemeral, untracked.
> Never call `ctx.scene.add()` directly — TypeScript will reject it.
> geometryFactory and lightFactory are available via their respective modules for helpers.

# World
> Not for logic or gameplay. Loads tools, one environment, assets, maps, and sets them as managed objects.

```
Rules
├── constructor(config)         # Init scene, camera, tools → calls setupEnvironment() — no ctx yet
├── setupEnvironment()          # constructor-time only: call applyEnvironment(new XEnvironment({})) — exactly one env
├── onLoad() (async)            # Load GLTF, spawn maps, add lights via ctx.gltf / ctx.map / ctx.objects — NO game logic
├── onStart(initialState?)      # Called when server sends START_WORLD or world.start() is called
└── onDispose()                 # When world is deleted
Tools (use ctx.X — never instantiate directly)
├── ctx.gltf                    # load models
├── ctx.map                     # load maps
└── ctx.objects                 # add/remove managed objects; all physics via ctx.objects helper methods
```

# Modules
## Isolation rules
> Each module should be responsible for a **single, well-defined slice of behaviour**.
> A module does not handle actions that belong to another module.

## Requires — dependency validation
> `requires` is checked by `World.init()` **before** any module is initialised. If a required
> module is absent, the world throws immediately — fail fast. `init()` is now async (returns `void | Promise<void>`).

# Environment
> Environment is where all modules are imported with initial configuration.
> Modules are initialised in **insertion order** (the order `addModule` was called).
> If module B requires module A, A must be added first — typically handled by the Environment's constructor:
> `this.addModule(new BModule(ModuleKey.A))`

# ModuleKey (enum — 44 entries)
> Canonical identifier for each built-in module type. Used for `requires` and `getModule<T>()`.

```
input, playerControl, playerSync, playerBody, ui, escapeUI,
resize, skybox, team, objectManager,
countdown, score, spectator, checkpoint, triggerZone,
movingPlatform, respawn, lagCompensation, pingDisplay,
audio, stats, physicsDebug, inspector,
fpv, tpv, freecam, editorOrbitCamera, editorPlacement, editorHotbar,
componentCreatorPreview, componentCreatorUI,
playerAnimation, ragdoll, endlineModule,
characterOrbitCamera, characterCustomizerPreview, characterCustomizerUI,
debugControl
```

# EngineContext (type)
> Passed from Engine to World._bindEngine(). Used to construct WorldContext.

```
EngineContext
├── renderer: THREE.WebGLRenderer
├── keymap: KeymapHandler
├── logger: Logger
├── selfServerClient: Self
├── server?: ServerHandlerScope
├── debug?: any
└── uiModule?: UIModule
```
