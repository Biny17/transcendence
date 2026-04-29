import type * as THREE from "three";
import type { ServerHandlerScope, KeymapHandler, Logger, Self } from "@/ThreeWrapper/1.engine/tools";
import type { GLTFLoader, MapLoader, ObjectManager, ManagedObject, OBJECT_TYPE } from "@/ThreeWrapper/2.world/tools";
import type { UIModule } from "@/ThreeWrapper/4.module/modules/ui/UIModule";
export enum ModuleKey {
	input = "input",
	playerControl = "player_control",
	playerSync = "player_sync",
	playerBody = "player_body",
	ui = "ui",
	escapeUI = "escape_ui",
	resize = "resize",
	skybox = "skybox",
	team = "team",
	objectManager = "object_manager",
	countdown = "countdown",
	score = "score",
	spectator = "spectator",
	checkpoint = "checkpoint",
	triggerZone = "trigger_zone",
	movingPlatform = "moving_platform",
	respawn = "respawn",
	lagCompensation = "lag_compensation",
	pingDisplay = "ping_display",
	audio = "audio",
	stats = "stats",
	physicsDebug = "physics_debug",
	inspector = "inspector",
	fpv = "fpv",
	tpv = "tpv",
	freecam = "freecam",
	editorOrbitCamera = "editor_orbit_camera",
	editorPlacement = "editor_placement",
	editorHotbar = "editor_hotbar",
	componentCreatorPreview = "component_creator_preview",
	componentCreatorUI = "component_creator_ui",
	playerAnimation = "player_animation",
	ragdoll = "ragdoll",
	endlineModule = "endline",
	characterOrbitCamera = "character_orbit_camera",
	characterCustomizerPreview = "character_customizer_preview",
	characterCustomizerUI = "character_customizer_ui",
	debugControl = "debug_control"
}
export type WorldContext = {
	renderer: THREE.WebGLRenderer;
	canvas: HTMLCanvasElement;
	keymap: KeymapHandler;
	logger: Logger;
	selfServerClient: Self;
	debug?: any;
	server?: ServerHandlerScope;
	scene: Omit<THREE.Scene, "add" | "remove" | "clear">;
	camera: THREE.PerspectiveCamera;
	gltf: GLTFLoader;
	objects: ObjectManager;
	map: MapLoader;
	selfWorldPlayer: ManagedObject<typeof OBJECT_TYPE.PLAYER> | null;
	getModule: <T extends Module>(type: ModuleKey) => T | undefined;
	uiModule?: UIModule;
};
export interface Module {
	readonly type: string;
	readonly requires?: readonly ModuleKey[];
	init(ctx: WorldContext): void | Promise<void>;
	update?(delta: number): void;
	dispose(): void;
}
