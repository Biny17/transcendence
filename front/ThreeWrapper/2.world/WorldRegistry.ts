import type { World } from "./WorldClass";
const registry = new Map<string, () => Promise<World>>();
registry.set("Demo", async () => new (await import("./worlds/DemoWorld")).DemoWorld());
registry.set("Loading", async () => new (await import("./worlds/LoadingWorld")).LoadingWorld());
registry.set("Lobby", async () => new (await import("./worlds/LobbyWorld")).LobbyWorld());
registry.set("UI", async () => new (await import("./worlds/UIWorld")).UIWorld());
registry.set("Visualizer", async () => new (await import("./worlds/VisualizerWorld")).VisualizerWorld());
registry.set("Editor", async () => new (await import("./worlds/EditorWorld")).EditorWorld());
registry.set("ComponentCreator", async () => new (await import("./worlds/ComponentCreatorWorld")).ComponentCreatorWorld());
registry.set("Parkour", async () => new (await import("./worlds/ParkourWorld")).ParkourWorld());
registry.set("CharacterCustomizer", async () => new (await import("./worlds/CharacterCustomizerWorld")).CharacterCustomizerWorld());
export { registry as WorldRegistry };
export function resolveWorld(worldId: string): Promise<World> {
	const factory = registry.get(worldId);
	if (!factory) throw new Error(`[WorldRegistry] Unknown world: "${worldId}"`);
	return factory();
}
