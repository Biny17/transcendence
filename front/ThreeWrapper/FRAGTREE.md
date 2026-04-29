# ThreeWrapper — TREEFRAG (LOD 1+4)

> Node names + tag lines. ASCII format. ~12:1 compression over raw source.
> **Update rule:**
> - Always use `...` notation for `examples/`, `envs/` and similar preset/variant directories (never list individual files)
> - Omit detailed methods for world variants, example worlds, and environment presets
> - List only base classes, main implementations, and core utilities—not concrete variants

```
ThreeWrapper                                    # Three.js engine wrapper for game client
├── 1.engine
│   ├── Engine                                  # Core render loop, owns renderer + active world + persistent DebugControlModule
│   │   ├── constructor                         # Init renderer, server (online), keymap, DebugControlModule (persists across world loads)
│   │   ├── load                                # Dispose active world, inject server scope + services + players, re-init debug with new world ctx
│   │   ├── startActive                         # Trigger world.start() with optional initial state
│   │   ├── loadAndStart                        # load() then startActive() in sequence
│   │   ├── connect                             # Open WebSocket via ServerHandler (online mode only)
│   │   ├── start                               # Begin rAF render loop with delta time + calls debug.update()
│   │   ├── stop                                # Cancel rAF loop
│   │   ├── resize                              # Update renderer size and camera aspect ratio
│   │   └── dispose                             # Stop loop, dispose world, server, renderer
│   ├── EngineCanvas                            # React component mounting the WebGL canvas + persistent DebugPanel (F1 toggle)
│   ├── hooks
│   │   └── useLocalKeybinds                    # React hook: load/save KeyBinding[] from localStorage
│   ├── tools.ts                                # Barrel: re-exports ServerHandler, KeymapHandler, Logger, Self
│   └── tools
│       ├── KeymapHandler                       # Key binding registry, maps key codes to actions
│       ├── Logger                              # Singleton debug logger with phase tracking + ring buffer
│       │   ├── types
│       │   │   ├── LogLevel                    # 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'
│       │   │   └── LogEntry                    # { level, namespace, msg, data?, timestamp }
│       │   ├── getInstance                     # Return or create singleton instance
│       │   ├── setDebugConfig                  # Configure debug flags (bool or DebugConfig)
│       │   ├── for                             # Create namespaced LoggerInstance
│       │   ├── pushPhase                       # Open a named phase on the stack, returns tracker
│       │   ├── popPhase                        # Close topmost phase, log duration if enabled
│       │   ├── log                             # Emit a leveled log entry + dispatch debug:logs event
│       │   ├── logVariable                     # Log a named variable value (debug only)
│       │   ├── shouldLogThisFrame              # True if current frame matches logFrameCount cadence
│       │   ├── incrementFrameCounter           # Advance internal frame counter each tick
│       │   ├── getEntries (static)             # Return copy of ring buffer
│       │   ├── clearEntries (static)            # Clear ring buffer
│       │   └── setBufferSize (static)           # Set max ring buffer size (default 1000)
│       ├── Self                                # Client's own connection state (id, name, isHost)
│       │   ├── setId / setHost                # Mutate connection fields on server events
│       │   └── (fields) id, name, isHost      # name set from LOAD_WORLD player list
│       ├── ServerHandler                       # WebSocket client + server event router
│       │   ├── constructor                     # Init WebSocket config, register internal handlers (CONNECTED, LOAD_WORLD, START_WORLD)
│       │   ├── setWorldResolver                # Set world factory function for LOAD_WORLD handling
│       │   ├── connect                         # Open WebSocket, register open/message/close/error
│       │   ├── disconnect                      # Clear reconnect timer, close socket
│       │   ├── on                              # Subscribe to typed server message (GameEventMap)
│       │   ├── addIncomingInterceptor          # Register incoming interceptor (msg:WSMessage→bool); returns unsub InterceptorHandle
│       │   ├── addOutgoingInterceptor          # Register outgoing interceptor (type,payload→bool); returns unsub InterceptorHandle
│       │   ├── dispatch(msg: WSMessage)        # Route incoming WSMessage; runs incoming interceptors first; blocks if any returns false
│       │   ├── sendRaw(type, payload)          # Low-level send; runs outgoing interceptors first; blocks if any returns false
│       │   ├── scope                           # Create scoped handle; scope.on()/addInterceptor()/dispose() — auto-cleans all on world dispose
│       │   ├── send.playerReady / assetsReady  # Send PLAYER_READY / ASSETS_READY
│       │   ├── send.playerInput                # Send PLAYER_INPUT with pos/rot/action
│       │   ├── send.playerWon/Lost/Eliminated  # Send PHASE_EVENT: win / lost / player_eliminated
│       │   ├── send.resultsAck                  # Send PHASE_EVENT: results_ack
│       │   ├── send.playerInteract/Choose       # Send PLAYER_INTERACT / PLAYER_CHOOSE
│       │   └── dispose                          # Disconnect, clear all handlers
│       └── communication
│           └── NetworkManager                   # Low-level WebSocket wrapper with reconnect logic
├── 2.world
│   ├── WorldClass (abstract)                    # Scene container; manages modules, lifecycle, NO-LOGIC
│   │   ├── constructor                         # Init scene, camera, loader tools → calls setupEnvironment()
│   │   ├── setupEnvironment (abstract)         # Subclass must call applyEnvironment() here; no logic allowed
│   │   ├── _bindEngine                         # Engine-internal: injects EngineContext + players, builds WorldContext
│   │   ├── scene / getCamera                   # Accessors used by Engine for render loop and resize
│   │   ├── addModule                           # Register module by type string
│   │   ├── getModule                           # Typed lookup by module type string
│   │   ├── removeModule                        # Dispose and deregister module
│   │   ├── applyEnvironment                    # Bulk-add all modules from an Environment preset
│   │   ├── init                                # Validate requires → init all modules (ordered) → onLoad()
│   │   ├── start                               # Guard-once call to onStart()
│   │   ├── update                              # Per-frame: updatePhysics(delta) + delegate to all module.update()
│   │   ├── dispose                             # Dispose modules + gltf + objects + scene; calls onDispose() + server.dispose()
│   │   ├── onLoad                              # Override: async scene setup (load assets, maps, lights — NO game logic)
│   │   ├── onStart                             # Override: begin gameplay (subscribe to events, start timers)
│   │   └── onDispose                           # Override: custom teardown
│   ├── WorldRegistry                            # Lazy world factory map (worldId → async World constructor)
│   │   └── resolveWorld                         # Lookup + instantiate by worldId
│   ├── worlds
│   │   ├── LobbyWorld                          # Pre-game lobby
│   │   ├── DemoWorld                           # Standalone demo / development sandbox
│   │   ├── EditorWorld                          # Visual map editor; places/deletes components, exports YAML
│   │   ├── LoadingWorld                         # Loading screen world
│   │   ├── UIWorld                              # UI-only overlay world (no 3D scene)
│   │   └── VisualizerWorld                      # Visualizer world for debugging/development
│   ├── examples/...                             # (Example worlds)
│   ├── tools.ts                                 # Barrel: re-exports all tools world tools + COLLISION_LAYER
│   └── tools
│       ├── GLTFLoader                           # Async GLTF/GLB asset loader with cache
│       ├── ComponentLoader                       # Load + cache component YAML/JSON prefab files
│       │   ├── load(url)                        # Fetch + parse component file (YAML or JSON), cached by URL
│       │   ├── get(url)                         # Sync cache lookup
│       │   └── types: ComponentDef
│       │       ├── MeshDef                      # { gltf } | { primitive, size?, color?, textures? }
│       │       ├── TextureDef                   # string | { all } | { map,normalMap,… } | { faces:{px,nx,…} }
│       │       ├── HitboxDef                    # { shape, size:'auto'|'full'|Vec3, offset?, collidesWith?, isSensor?, tag? }
│       │       ├── PhysicsDef                   # { bodyType, gravityScale, mass, restitution, friction }
│       │       └── AnimationDef                 # WaypointAnimDef | ClipAnimDef
│       ├── MapLoader                             # YAML/JSON map loader + scene spawner
│       │   ├── loadFile(url)                    # Parse YAML or JSON map file → MapDef
│       │   ├── generate(fn)                    # Programmatic MapDef builder
│       │   ├── spawn(def, components, gltf, objects, onSensorEnter?, onSensorExit?)
│       │   │                                   # Instantiates all objects, lights, fog, sky; returns dispose()
│       │   └── types: MapDef                   # { id, sky?, fog?, lights?, objects:MapObjectInstance[] }
│       │       ├── SkyDef                       # { preset:'day' } | { equirect:'.png|.hdr' } | { cubemap:{px,nx,…} }
│       │       ├── FogDef                       # { kind:'linear'|'exponential', color, near?, far?, density? }
│       │       ├── LightDef                     # ambient | directional | point | spot | hemisphere
│       │       └── MapObjectInstance            # { id, component, type?, position, rotation?, scale?, extraData? }
│       ├── ObjectManager                         # Typed registry for scene objects; wraps scene + physics
│       │   ├── add(input)                       # Register ManagedObjectInput → ManagedObject; adds pieces to scene + registers with physics
│       │   ├── addSimple(input)                 # Shorthand for single-piece objects; relativePosition/rotation, auto hitbox, auto-static for MAP
│       │   ├── addPiece(objectId, piece)        # Append a piece to an existing managed object at runtime
│       │   ├── addHitbox(objectId, pieceIndex, hitbox)  # Add hitbox to an existing piece at runtime
│       │   ├── remove(id)                      # Remove piece assets from scene + unregister from physics
│       │   ├── addRaw(obj3d)                   # Add unmanaged Three.js object directly to scene (ephemeral)
│       │   ├── removeRaw(obj3d)                 # Remove unmanaged raw object from scene
│       │   ├── attachPhysics(pw)               # Internal: bind PhysicsWorld (called by WorldClass.init)
│       │   ├── get(name, type?)                # Lookup managed object by name (optional type filter)
│       │   ├── getById(id, type?)              # Lookup managed object by id (optional type filter)
│       │   ├── getByType(type)                 # All managed objects of given type
│       │   ├── getAll()                        # Flat array of all registered managed objects
│       │   ├── has(id)                         # Existence check by id
│       │   ├── setExtra / getExtra            # Read/write a single extraData field by key
│       │   ├── setPosition / getPosition       # Set/get world position (updates visuals + physics body)
│       │   ├── setRotation                      # Set world rotation (updates visuals + physics body)
│       │   ├── setVelocity / getVelocity        # Physics: set/get linear velocity
│       │   ├── applyImpulse                    # Physics: apply instantaneous impulse force
│       │   ├── getMass                          # Physics: get rigid body mass
│       │   ├── setGravityScale                  # Physics: change gravity scale on live body
│       │   ├── isGrounded(threshold?)           # Physics: ray cast downward, true if surface within threshold
│       │   ├── isColliding(idA, idB)           # Physics: contact-pair check between two registered bodies
│       │   ├── addZone / removeZone             # Register/remove a proximity zone
│       │   ├── isInZone(id, zoneId)            # True if object is currently inside zone
│       │   ├── getZonesForObject(id)           # All zones the object is currently inside
│       │   ├── getObjectsInZone(zoneId)         # All object ids currently inside the zone
│       │   ├── playAnimation / stopAnimation / crossFadeAnimation
│       │   ├── removeByName                     # Remove by name (resolves id then calls remove)
│       │   ├── update(delta)                   # Advance all AnimationMixers each frame
│       │   ├── updatePhysics(delta)            # Advance physics simulation + sync piece positions
│       │   └── dispose()                        # Remove all piece assets, dispose physics
│       └── types
│           ├── ManagedObject<T>                  # { id, name?, type, componentId, pieces, cosmetics, position, rotation,
│           │                                    #   velocity?, isGrounded?, physics?, activeZones, extraData, mixers, animationClips }
│           ├── ManagedObjectInput<T>             # Input shape for add(); pieces, cosmetics, physics, position, rotation, extraData
│           ├── SimpleObjectInput<T>              # Input shape for addSimple(); asset, relativePosition/rotation, hitbox, auto-static
│           ├── Piece                            # { asset:THREE.Object3D|THREE.Group, relativePosition, hitboxes:PieceHitbox[] }
│           ├── PieceHitbox                       # { shape, relativeOffset, collidesWith?, isSensor?, tag? }
│           ├── PhysicsDescriptor                # { bodyType, gravityScale?, mass?, restitution?, friction?, lockRotations? }
│           ├── HitboxShape                      # { kind:'box', halfExtents? } | { kind:'sphere', radius? }
│           │                                    # | { kind:'capsule', radius?, height? } | { kind:'auto' }
│           ├── Vec3                             # { x, y, z }
│           ├── OBJECT_TYPE (enum)              # PLAYER | NPC | MAP
│           ├── PlayerExtraData                  # { serverData, life, spawnpoint, dieCounter, score, killCounter, team?, … }
│           ├── NPCExtraData                     # { behavior?, aggression? }
│           └── MapExtraData                     # { difficulty? }
│       ├── PhysicsWorld                         # Rapier physics simulation; internal to ObjectManager
│       │   ├── constructor(scene, config?)       # Accept gravity override + debug flag; does NOT call RAPIER.init()
│       │   ├── init()                          # async — load RAPIER WASM and create World instance
│       │   ├── step(delta, allObjects)        # Advance simulation; call sync callbacks; update zones
│       │   ├── registerPiece(pieceId, desc, hitboxes, sync)
│       │   │                                   # Create rigid body + colliders for one piece; sync callback for position updates
│       │   ├── unregister(id)                  # Destroy all bodies + colliders for this object's pieces
│       │   ├── setVelocity / getVelocity        # Set/get linear velocity on all piece bodies of an object
│       │   ├── applyImpulse                    # Apply instantaneous impulse to all piece bodies of an object
│       │   ├── setPosition / setRotation        # Teleport all piece bodies; no visual sync (ObjectManager handles that)
│       │   ├── isGrounded / isColliding         # Check across all pieces of an object
│       │   ├── addZone / removeZone             # Register/remove a proximity zone
│       │   ├── isInZone / getZonesForObject / getObjectsInZone
│       │   ├── getMass / setGravityScale        # Per-object physics helpers
│       │   └── dispose()                        # Remove debug meshes, free RAPIER World
│       ├── GeometryFactory                      # Builder helpers for common Three.js geometries (scale only, no position)
│       └── LightFactory                         # Builder helpers for common Three.js lights
├── 3.environment
│   ├── EnvironmentClass                         # Base: holds module list for a preset; consumed by World.applyEnvironment()
│   │   ├── constructor                          # Accept config, init empty module array
│   │   ├── addModule (protected)               # Push module to internal list
│   │   └── getModules                         # Return module list (read by World.applyEnvironment)
│   ├── envs/...                               # Default, Minimal, Online, Editor, UI, Visualizer presets
│   └── examples/...                            # (Example environments)
└── 4.module
    ├── ModuleClass                              # Module interface + ModuleKey enum + WorldContext type
    │   ├── ModuleKey (enum)                     # Canonical string keys for all built-in modules
    │   ├── WorldContext                         # Full ctx object passed to every module.init(); see below
    │   │   ├── (engine-level)                  # renderer, canvas, keymap, logger, selfServerClient, debug (persistent), server?
    │   │   └── (world-level)                  # scene(read-only), camera, gltf, objects, map, selfWorldPlayer, getModule
    │   └── Module (interface)                  # { type, requires?, init(ctx), update?(delta), dispose() }
    ├── index                                    # Module + type exports; barrel for all built-in modules
    ├── examples/...                             # (Example modules; use server.on/send for network, ctx.objects for scene)
    └── modules
        ├── camera
        │   ├── FPVModule                       # First-person view: camera at target + eyeHeight, mouse look + WASD
        │   ├── TPVModule                       # Third-person view camera controller
        │   └── FreecamModule                   # Free-flying camera (no physics)
        ├── debug
        │   ├── StatsModule                     # FPS / draw-call / geometry overlay (DOM, configurable corner)
        │   ├── PhysicsDebugModule             # Render Rapier physics collider wireframes
        │   ├── InspectorModule                # Scene inspector / object picker overlay
        │   ├── DebugControlModule             # Bridge (window.__debugCtrl): hover picking, 11 visual debug groups, object manipulation (teleport/clone/freeze/delete/pieces). Engine-owned (persists across world changes) — re-inits with new WorldContext on Engine.load(), update() called in Engine render loop
        │   ├── NetworkLogger.ts               # Packet capture via ServerHandler interceptors (no monkey-patching); attach/detach, fakeIncoming/fakeOutgoing, sendRealOutgoing, packetStates (allow/hide/block), onNetworkEntry(listener)
        │   └── TraceRecorder.ts              # Perfect Trace recording engine
        ├── editor
        │   ├── EditorOrbitCameraModule         # Orbit camera controlled by mouse drag + scroll (editor only)
        │   ├── EditorPlacementModule           # Place / delete / undo components; exports placed objects as YAML map
        │   └── EditorHotbarModule              # Hotbar UI for selecting component palette items
        └── ui
            └── DebugPanel                     # 5-tab dev panel: Logs & Tracing (with PerfectTrace), World Inspector, Visual Debug, Networking, Engine Controls
                ├── DebugPanel.tsx               # Persistent parent shell (F1 toggle): drag/drop, 5 tabs, window.__debugCtrl bridge
                ├── LoggingSection.tsx            # Log Level selector, type checkboxes, tag filters, Perfect Trace recorder embedded
                ├── PerfectTraceSection.tsx       # Record modes (now/until event/N frames/manual), HTML+JSON export
                ├── WorldInspectorSection.tsx    # Object list sidebar, ObjectInspector, Save/Load Snapshot, Hover overlay toggle
                ├── VisualDebugSection.tsx        # Hitbox/bounds/names/grid/shadows/fog/raycast/LOD/wireframe toggles
                ├── NetworkingSection.tsx          # Packet capture/filters, simulation (lag/loss/dup), blocked types, quick send
                ├── EngineControlsSection.tsx      # Time/pause/step, render settings, physics overrides, cheats, quick save/load
                ├── ObjectInspector.tsx            # Live property editor: position/rotation/velocity/extra/pieces
                ├── LogConsole.tsx                # Ring-buffer (1000) console: monkey-patches log/debug/info/warn/error on mount; captures network-in/out via networkLogger; filterable by level/search/tags, expandable entries, TXT/JSON export, font size
                ├── ConsoleWindow.tsx             # Detachable console window with resize/collapse
                ├── StatsOverlay.tsx              # FPS/draw/tri graphs overlay
                └── DebugPanel.css                # Styles for all debug panel components
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
│   ├── debug: DebugControlModule          # persistent debug: re-inits on each world load, survives world changes (hover picking, visual groups, window.__debugCtrl bridge)
│   └── server?: ServerHandlerScope       # online only — guard with server?.; auto-unsubbed on world dispose
└── World-level
    ├── scene: Omit<THREE.Scene,'add'|'remove'|'clear'>  # read-only; mutate via ctx.objects only
    ├── camera: THREE.PerspectiveCamera    # move/reparent freely; ResizeModule keeps aspect in sync
    ├── gltf: GLTFLoader                   # gltf.load(url) → LoadedModel; cached per world lifetime
    ├── objects: ObjectManager             # managed object registry + physics proxy; see ObjectManager section
    ├── map: MapLoader                    # map.loadFile(url) → MapDef; map.spawn(...) populates scene
    ├── selfWorldPlayer: ManagedObject<PLAYER> | null  # local player object; null if spectator
    └── getModule: <T>(type: string) => T | undefined  # cross-module lookup by ModuleKey or custom type string
```

> `ctx.objects.add/remove` — tracked (scene + physics). `ctx.objects.addRaw/removeRaw` — ephemeral, untracked.
> Never call `ctx.scene.add()` directly — TypeScript will reject it.
> It also has access to geometryFactory (helpers to create basic shapes) and lightFactory (helpers to create lights).
> Then they can be added to scene using `ctx.objects.add()`

# World
> Not for logic or gameplay. Loads tools, one environment, assets, maps, and sets them as managed objects with ObjectManager.

```
Rules
├── setupEnvironment()     # constructor-time only: call applyEnvironment(new XEnvironment({})) — exactly one env, no ctx yet
├── onLoad()              # async: load GLTF, spawn maps, add lights via ctx.gltf / ctx.map / ctx.objects — NO game logic
├── onStart()             # Automatically called when server sends START_WORLD
└── onDispose()           # When world is deleted.
Tools (use ctx.X — never instantiate directly)
├── ctx.gltf              # load models
├── ctx.map               # load maps
└── ctx.objects           # add/remove managed objects; all physics via ctx.objects helper methods (never direct PhysicsWorld)
```

# Modules
## Isolation rules

> Each module should be responsible for a **single, well-defined slice of behaviour**. The
> key constraint is: **a module does not handle actions that belong to another module**.

## Requires — dependency validation

> `requires` is checked by `World.init()` **before** any module is initialised. If a required
> module is absent, the world throws immediately — fail fast.

# Environment
> Environment is where all modules are imported with initial configuration.
> Modules are initialised in **insertion order** (the order `addModule` / `applyEnvironment`
> was called). If module B requires module A, A must be added to the world first — typically
> handled by the Environment's constructor, this should look like this `this.addModule(new BModule(ModuleKey.A));`
