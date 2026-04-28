import { createElement } from "react";
import * as THREE from "three";
import type { Module, WorldContext } from "@/ThreeWrapper/4.module";
import { ModuleKey } from "@/ThreeWrapper/4.module";
import type { UIModule } from "@/ThreeWrapper/4.module/modules/ui/UIModule";
import type { ComponentPreviewModule } from "./ComponentPreviewModule";
import type { ComponentState } from "./components/ComponentCreatorUI";
import { ComponentCreatorUI } from "./components/ComponentCreatorUI";
import { downloadYaml, downloadZip } from "./componentExport";
export class ComponentCreatorUIModule implements Module {
	readonly type = ModuleKey.componentCreatorUI;
	readonly requires = [ModuleKey.ui, ModuleKey.componentCreatorPreview] as const;
	private ui: UIModule | null = null;
	private preview: ComponentPreviewModule | null = null;
	private lastWireframe = false;
	private physicsTestActive = false;
	private gltfSceneRef: THREE.Group | null = null;
	constructor(_dep1: typeof ModuleKey.ui, _dep2: typeof ModuleKey.componentCreatorPreview) {}
	async init(ctx: WorldContext): Promise<void> {
		this.ui = ctx.getModule<UIModule>(ModuleKey.ui) ?? null;
		this.preview = ctx.getModule<ComponentPreviewModule>(ModuleKey.componentCreatorPreview) ?? null;
		const defaultMeshId = crypto.randomUUID();
		const defaultState: ComponentState = {
			id: "my_component",
			meshes: [
				{
					localId: defaultMeshId,
					name: "mesh_1",
					meshKind: "primitive",
					primitive: "box",
					sizeX: 1,
					sizeY: 1,
					sizeZ: 1,
					color: "#888888",
					textures: {
						map: { file: null, previewUrl: null, exportPath: "" },
						normalMap: { file: null, previewUrl: null, exportPath: "" },
						roughnessMap: { file: null, previewUrl: null, exportPath: "" },
						metalnessMap: { file: null, previewUrl: null, exportPath: "" },
						emissiveMap: { file: null, previewUrl: null, exportPath: "" },
						aoMap: { file: null, previewUrl: null, exportPath: "" },
						displacementMap: { file: null, previewUrl: null, exportPath: "" }
					},
					displacementScale: 0.2,
					normalScale: 1.0,
					offsetX: 0,
					offsetY: 0,
					offsetZ: 0,
					relativeOffsetX: 0,
					relativeOffsetY: 0,
					relativeOffsetZ: 0,
					rotationX: 0,
					rotationY: 0,
					rotationZ: 0,
					gltfPath: "",
					gltfPreviewUrl: null,
					gltfScaleX: 1,
					gltfScaleY: 1,
					gltfScaleZ: 1
				}
			],
			wireframe: false,
			bodyType: "static",
			gravityScale: 1,
			mass: 1,
			restitution: 0.1,
			friction: 0.5,
			hitboxes: [],
			animations: []
		};
		const gltfLoadedMeshes = new Map<string, string>(); 
		this.ui?.show(
			"component-creator",
			createElement(ComponentCreatorUI, {
				onMount: (updater) => {
					updater(defaultState);
					this.preview?.rebuild(defaultState);
				},
				onStateChange: (state: ComponentState) => {
					if (this.physicsTestActive) {
						this.preview?.stopPhysicsTest();
						this.physicsTestActive = false;
					}
					if (state.wireframe !== this.lastWireframe) {
						this.preview?.setWireframe(state.wireframe);
						this.lastWireframe = state.wireframe;
					}
					this.preview?.rebuild(state);
					for (const mesh of state.meshes) {
						if (mesh.meshKind === "gltf" && mesh.gltfPreviewUrl) {
							const prevUrl = gltfLoadedMeshes.get(mesh.localId);
							if (prevUrl !== mesh.gltfPreviewUrl) {
								this.preview?.loadGltfModel(mesh.localId, mesh.gltfPreviewUrl);
								gltfLoadedMeshes.set(mesh.localId, mesh.gltfPreviewUrl);
							}
							this.preview?.setGltfScale(mesh.localId, mesh.gltfScaleX, mesh.gltfScaleY, mesh.gltfScaleZ);
							this.preview?.setGltfOffset(mesh.localId, mesh.offsetX, mesh.offsetY, mesh.offsetZ);
						}
					}
					for (const [meshId] of gltfLoadedMeshes) {
						if (!state.meshes.find((m) => m.localId === meshId)) {
							gltfLoadedMeshes.delete(meshId);
						}
					}
				},
				onExportYaml: (state: ComponentState) => {
					downloadYaml(state);
				},
				onExportZip: (state: ComponentState) => {
					return downloadZip(state);
				},
				onGltfLoad: async (meshLocalId: string, url: string, manager) => {
					gltfLoadedMeshes.set(meshLocalId, url);
					return this.preview?.loadGltfModel(meshLocalId, url, manager) ?? [];
				},
				onPlayAnimation: (clipName) => {
					const firstAnimMesh = defaultState.meshes[0]?.localId;
					if (firstAnimMesh) {
						this.preview?.playAnimation(firstAnimMesh, clipName);
					}
				},
				onStopAnimation: () => {
					this.preview?.stopAnimation();
				},
				onAnimSpeedChange: (speed) => {
					this.preview?.setAnimationSpeed(speed);
				},
				onHelpersChange: (config) => {
					this.preview?.setHelpers(config);
				},
				onStartPhysicsTest: (state) => {
					this.physicsTestActive = true;
					this.preview?.startPhysicsTest(state);
				},
				onStopPhysicsTest: () => {
					this.physicsTestActive = false;
					this.preview?.stopPhysicsTest();
				},
				onGenerateHitboxes: async () => {
					this.gltfSceneRef = this.preview?.getPreviewRoot() ?? null;
					return this.gltfSceneRef;
				},
				onHitboxHover: (idx) => {
				},
				onHitboxSelect: (idx) => {
				}
			})
		);
		this.ui?.enablePointer("component-creator");
	}
	update(delta: number): void {
		this.preview?.update(delta);
	}
	dispose(): void {
		this.ui?.hide("component-creator");
		this.ui = null;
		this.preview = null;
	}
}
