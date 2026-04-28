import { createElement } from "react";
import type { Module, WorldContext } from "@/ThreeWrapper/4.module";
import { ModuleKey } from "@/ThreeWrapper/4.module";
import type { UIModule } from "@/ThreeWrapper/4.module/modules/ui/UIModule";
import type { EditorPlacementModule } from "./EditorPlacementModule";
import type { EditorUIState } from "./components/EditorUI";
import { EditorUI } from "./components/EditorUI";
const COMPONENT_PATHS: string[] = []
export class EditorHotbarModule implements Module {
	readonly type = ModuleKey.editorHotbar;
	readonly requires = [ModuleKey.ui, ModuleKey.editorPlacement] as const;
	private ui: UIModule | null = null;
	private updateUI: ((state: EditorUIState) => void) | null = null;
	constructor(_dep1: typeof ModuleKey.ui, _dep2: typeof ModuleKey.editorPlacement) {}
	async init(ctx: WorldContext): Promise<void> {
		this.ui = ctx.getModule<UIModule>(ModuleKey.ui) ?? null;
		const placement = ctx.getModule<EditorPlacementModule>(ModuleKey.editorPlacement) ?? null;
		const res = await fetch('/api/components')
		const components: string[] = res.ok ? await res.json() : COMPONENT_PATHS;
		if (placement) {
			placement.onStateChange = () => {
				this.updateUI?.({
					canUndo: placement.canUndo,
					canRedo: placement.canRedo,
					placedCount: placement.placedCount,
					placementY: placement.currentY,
					selectedRotation: placement.selectedRotationDeg,
					selectedAnimations: placement.selectedAnimationNames,
					playingAnimationName: placement.playingAnimationName,
					isPlayingAll: placement.isPlayingAll,
					hasAnyAnimations: placement.hasAnyAnimations,
					env: placement.env
				});
			};
		}
		this.ui?.show(
			"editor-hotbar",
			createElement(EditorUI, {
				components,
				onSelect: (path: string) => placement?.selectComponent(path),
				onDeselect: () => placement?.selectComponent(null),
				onExport: () => placement?.downloadYaml(),
				onUndo: () => placement?.undo(),
				onRedo: () => placement?.redo(),
				onDelete: () => placement?.deleteSelected(),
				onHeightChange: (y: number) => placement?.setPlacementY(y),
				onLoadMap: (text: string) => {
					placement?.loadMap(text);
				},
				onMount: (updater) => {
					this.updateUI = updater;
					updater({ canUndo: false, canRedo: false, placedCount: 0, placementY: 0, selectedRotation: null, selectedAnimations: [], playingAnimationName: null, isPlayingAll: false, hasAnyAnimations: false, env: { sky: null, fog: null, lights: [], clouds: false } });
				},
				onRotationChange: (rot) => placement?.setSelectedRotation(rot.x, rot.y, rot.z),
				onPlayAnimation: (name) => placement?.playAnimation(name),
				onStopAnimation: () => placement?.stopAnimation(),
				onPlayAll: () => placement?.playAllAnimations(),
				onStopAll: () => placement?.stopAllAnimations(),
				onEnvChange: (env) => placement?.setEnv(env)
			})
		);
		this.ui?.enablePointer("editor-hotbar");
	}
	dispose(): void {
		this.ui?.hide("editor-hotbar");
		this.ui = null;
		this.updateUI = null;
	}
}
