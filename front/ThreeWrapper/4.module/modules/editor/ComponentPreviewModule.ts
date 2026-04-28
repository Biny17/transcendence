import * as THREE from "three";
import type { Module, WorldContext } from "@/ThreeWrapper/4.module";
import { ModuleKey } from "@/ThreeWrapper/4.module";
import type { ComponentState, HitboxState, AnimationState, MeshPartState } from "./components/ComponentCreatorUI";
import type { HitboxShape } from "@/ThreeWrapper/2.world/tools/ObjectManager";

function buildPrimitiveGeometry(mesh: MeshPartState): THREE.BufferGeometry {
	const { primitive, sizeX, sizeY, sizeZ } = mesh;
	switch (primitive) {
		case "box":
			return new THREE.BoxGeometry(sizeX, sizeY, sizeZ, 4, 4, 4);
		case "sphere":
			return new THREE.SphereGeometry(sizeX / 2, 64, 32);
		case "cylinder":
			return new THREE.CylinderGeometry(sizeX / 2, sizeX / 2, sizeY, 32, 8);
		case "plane":
			return new THREE.PlaneGeometry(sizeX, sizeZ, 64, 64);
		default:
			return new THREE.BoxGeometry(1, 1, 1, 4, 4, 4);
	}
}

function buildHitboxHelper(hb: HitboxState, meshBounds?: THREE.Vector3 | null, defaultSize?: { x: number; y: number; z: number }): THREE.Object3D {
	const color = hb.isSensor ? 0xffaa00 : 0x00ff88;
	const group = new THREE.Group();
	group.name = "hitbox";

	if (hb.shape === "box") {
		let w = hb.sizeX,
			h = hb.sizeY,
			d = hb.sizeZ;
		if (hb.sizeKind === "full" || hb.sizeKind === "auto") {
			if (meshBounds) {
				w = meshBounds.x;
				h = meshBounds.y;
				d = meshBounds.z;
			} else if (defaultSize) {
				w = defaultSize.x;
				h = defaultSize.y;
				d = defaultSize.z;
			}
		}
		const geo = new THREE.BoxGeometry(w, h, d);
		const edges = new THREE.EdgesGeometry(geo);
		const mat = new THREE.LineBasicMaterial({ color });
		const segments = new THREE.LineSegments(edges, mat);
		group.add(segments);
	}

	if (hb.shape === "sphere") {
		let radius = hb.radius;
		if (hb.sizeKind === "auto" || hb.sizeKind === "full") {
			if (meshBounds) {
				radius = Math.max(meshBounds.x, meshBounds.y, meshBounds.z) / 2;
			} else if (defaultSize) {
				radius = Math.max(defaultSize.x, defaultSize.y, defaultSize.z) / 2;
			}
		}
		const geo = new THREE.SphereGeometry(radius, 16, 8);
		const edges = new THREE.EdgesGeometry(geo);
		const mat = new THREE.LineBasicMaterial({ color });
		const segments = new THREE.LineSegments(edges, mat);
		group.add(segments);
	}

	if (hb.shape === "capsule") {
		const geo = new THREE.CapsuleGeometry(hb.radius, hb.height * 2, 8, 16);
		const edges = new THREE.EdgesGeometry(geo);
		const mat = new THREE.LineBasicMaterial({ color });
		const segments = new THREE.LineSegments(edges, mat);
		group.add(segments);
	}

	if (hb.rotationX !== undefined || hb.rotationY !== undefined || hb.rotationZ !== undefined) {
		group.rotation.set(
			THREE.MathUtils.degToRad(hb.rotationX ?? 0),
			THREE.MathUtils.degToRad(hb.rotationY ?? 0),
			THREE.MathUtils.degToRad(hb.rotationZ ?? 0)
		);
	}

	return group;
}

export type HelpersConfig = {
	player: boolean;
	unitCube: boolean;
};

type WaypointAnimTracker = {
	waypoints: THREE.Vector3[];
	rotations: THREE.Euler[];
	speed: number;
	loop: boolean;
	targetIdx: number;
	direction: number;
	progress: number;
};

export class ComponentPreviewModule implements Module {
	readonly type = ModuleKey.componentCreatorPreview;
	private ctx: WorldContext | null = null;
	private meshGroups = new Map<string, THREE.Group>(); // localId -> group
	private hitboxHelpers: THREE.Object3D[] = [];
	private proportionHelpers: THREE.Object3D[] = [];
	private textureCache = new Map<string, THREE.Texture>();
	private gltfScenes = new Map<string, THREE.Group>(); // localId -> gltf scene
	private gltfMixers = new Map<string, THREE.AnimationMixer>(); // localId -> mixer
	private gltfClips = new Map<string, THREE.AnimationClip[]>(); // localId -> clips
	private activeActions = new Map<string, THREE.AnimationAction>(); // localId -> action
	private _wireframe = false;
	private waypointAnims = new Map<string, WaypointAnimTracker>(); // animId -> tracker
	private gltfBounds = new Map<string, THREE.Vector3>(); // localId -> bounds
	private _physicsTestActive = false;
	private _physicsTestFloorId = "__cc_floor__";
	private _physicsTestObjectId = "__cc_drop__";

	init(ctx: WorldContext): void {
		this.ctx = ctx;
	}

	dispose(): void {
		this.stopPhysicsTest();
		this._clearScene();
		this._clearGltf();
		this._clearHelpers();
		for (const tex of this.textureCache.values()) {
			tex.dispose();
		}
		this.textureCache.clear();
		this.ctx = null;
	}

	update(delta: number): void {
		// Update all GLTF mixers
		for (const mixer of this.gltfMixers.values()) {
			mixer.update(delta);
		}

		if (this._physicsTestActive && this.ctx) {
			this.ctx.objects.updatePhysics(delta);
		}

		// Update waypoint animations for each mesh
		for (const [animId, anim] of this.waypointAnims) {
			const meshGroup = this.meshGroups.get(animId);
			if (!meshGroup) continue;

			if (anim.waypoints.length < 2) continue;

			const srcIdx = Math.max(0, Math.min(anim.targetIdx - anim.direction, anim.waypoints.length - 1));
			const from = anim.waypoints[srcIdx];
			const to = anim.waypoints[anim.targetIdx];
			if (!from || !to) continue;

			const dist = from.distanceTo(to);
			anim.progress += (anim.speed * delta) / Math.max(dist, 0.001);

			while (anim.progress >= 1) {
				anim.progress -= 1;
				const next = anim.targetIdx + anim.direction;
				if (next >= anim.waypoints.length) {
					if (anim.loop) {
						anim.direction = -1;
						anim.targetIdx = anim.waypoints.length - 2;
					} else {
						anim.progress = 1;
						break;
					}
				} else if (next < 0) {
					if (anim.loop) {
						anim.direction = 1;
						anim.targetIdx = 1;
					} else {
						anim.progress = 1;
						break;
					}
				} else {
					anim.targetIdx = next;
				}
			}

			const newSrc = Math.max(0, Math.min(anim.waypoints.length - 1, anim.targetIdx - anim.direction));
			const newTo = anim.waypoints[anim.targetIdx];
			if (newTo) {
				meshGroup.position.lerpVectors(from, newTo, Math.min(anim.progress, 1));
			}
			// Interpolate rotation
			if (anim.rotations && anim.rotations.length >= 2) {
				const rotFrom = anim.rotations[srcIdx];
				const rotTo = anim.rotations[anim.targetIdx];
				if (rotFrom && rotTo) {
					meshGroup.rotation.x = rotFrom.x + (rotTo.x - rotFrom.x) * Math.min(anim.progress, 1);
					meshGroup.rotation.y = rotFrom.y + (rotTo.y - rotFrom.y) * Math.min(anim.progress, 1);
					meshGroup.rotation.z = rotFrom.z + (rotTo.z - rotFrom.z) * Math.min(anim.progress, 1);
				}
			}
		}
	}

	rebuild(state: ComponentState): void {
		if (!this.ctx) return;
		this._clearScene();

		// Build all meshes
		for (const mesh of state.meshes) {
			if (mesh.meshKind === "primitive") {
				const geo = buildPrimitiveGeometry(mesh);
				const colorHex = parseInt(mesh.color.replace("#", ""), 16);

				const material = new THREE.MeshStandardMaterial({
					color: colorHex,
					roughness: 0.5,
					metalness: 0.0
				});

				const textureLoader = new THREE.TextureLoader();
				const slots = ["map", "normalMap", "roughnessMap", "metalnessMap", "emissiveMap", "aoMap"] as const;
				for (const key of slots) {
					const slot = mesh.textures[key];
					if (slot?.previewUrl) {
						let tex = this.textureCache.get(slot.previewUrl);
						if (!tex) {
							tex = textureLoader.load(slot.previewUrl);
							tex.colorSpace = THREE.SRGBColorSpace;
							this.textureCache.set(slot.previewUrl, tex);
						}
						(material as any)[key] = tex;
					}
				}
				if (mesh.textures.displacementMap?.previewUrl) {
					const slot = mesh.textures.displacementMap;
					const previewUrl = slot.previewUrl!;
					let tex = this.textureCache.get(previewUrl);
					if (!tex) {
						tex = textureLoader.load(previewUrl);
						tex.colorSpace = THREE.LinearSRGBColorSpace;
						this.textureCache.set(previewUrl, tex);
					}
					material.displacementMap = tex;
					material.displacementScale = mesh.displacementScale;
				}
				if (mesh.textures.normalMap?.previewUrl) {
					const normalScaleValue = mesh.normalScale ?? 1.0;
					material.normalScale = new THREE.Vector2(normalScaleValue, normalScaleValue);
				}
				material.needsUpdate = true;

				const meshObj = new THREE.Mesh(geo, material);
				meshObj.position.set(mesh.offsetX, mesh.offsetY, mesh.offsetZ);
				const group = new THREE.Group();
				group.name = mesh.name;
				group.rotation.set(
					THREE.MathUtils.degToRad(mesh.rotationX ?? 0),
					THREE.MathUtils.degToRad(mesh.rotationY ?? 0),
					THREE.MathUtils.degToRad(mesh.rotationZ ?? 0)
				);
				group.add(meshObj);
				this.meshGroups.set(mesh.localId, group);
				this.ctx.objects.addRaw(group);

				if (this._wireframe) {
					this._applyWireframe(group, true);
				}
			} else if (mesh.meshKind === "gltf") {
				// GLTF meshes are loaded separately via loadGltfModel
				// Just create an empty group for now
				const group = new THREE.Group();
				group.name = mesh.name;
				group.position.set(mesh.offsetX, mesh.offsetY, mesh.offsetZ);
				this.meshGroups.set(mesh.localId, group);
				this.ctx.objects.addRaw(group);
			}
		}

		// Build hitboxes - use combined bounds of all meshes
		let combinedBounds: THREE.Vector3 | undefined;
		if (this.gltfBounds.size > 0) {
			const firstBounds = this.gltfBounds.values().next().value;
			if (firstBounds) combinedBounds = firstBounds.clone();
		}

		for (const hb of state.hitboxes) {
			const helper = buildHitboxHelper(hb, combinedBounds);
			helper.position.set(hb.offsetX, hb.offsetY, hb.offsetZ);
			this.ctx.objects.addRaw(helper);
			this.hitboxHelpers.push(helper);
		}

		// Setup waypoint animations per mesh
		this.waypointAnims.clear();
		for (const anim of state.animations) {
			if (anim.autoPlay) {
				const meshGroup = this.meshGroups.get(anim.targetMeshId);
				if (meshGroup) {
					this.waypointAnims.set(anim.targetMeshId, {
						waypoints: anim.waypoints.map((w) => new THREE.Vector3(w.position.x, w.position.y, w.position.z)),
						rotations: anim.waypoints.map((w) => new THREE.Euler(
							w.rotation?.x ?? 0,
							w.rotation?.y ?? 0,
							w.rotation?.z ?? 0
						)),
						speed: anim.speed || 2,
						loop: anim.loop,
						targetIdx: 1,
						direction: 1,
						progress: 0
					});
				}
			}
		}
	}

	async loadGltfModel(meshLocalId: string, url: string, manager?: THREE.LoadingManager): Promise<string[]> {
		// Clear existing GLTF for this mesh
		this._clearGltfForMesh(meshLocalId);

		const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
		const loader = new GLTFLoader(manager);
		const gltf = await new Promise<any>((resolve, reject) => {
			loader.load(url, resolve, undefined, reject);
		});

		const scene = gltf.scene;
		this.gltfScenes.set(meshLocalId, scene);
		const box = new THREE.Box3().setFromObject(scene);
		this.gltfBounds.set(meshLocalId, box.getSize(new THREE.Vector3()));
		this.gltfClips.set(meshLocalId, gltf.animations);

		if (gltf.animations.length > 0) {
			this.gltfMixers.set(meshLocalId, new THREE.AnimationMixer(scene));
		}

		if (this._wireframe) {
			this._applyWireframe(scene, true);
		}

		if (this.ctx) {
			// Add to existing group if primitive was already added, otherwise add directly
			const group = this.meshGroups.get(meshLocalId);
			if (group) {
				// Remove the empty group we created earlier
				this.ctx.objects.removeRaw(group);
				this.meshGroups.delete(meshLocalId);
			}
			this.ctx.objects.addRaw(scene);
		}

		return gltf.animations.map((a: any) => a.name);
	}

	playAnimation(meshLocalId: string, clipName: string): void {
		const mixer = this.gltfMixers.get(meshLocalId);
		const clips = this.gltfClips.get(meshLocalId);
		if (!mixer || !clips) return;

		const prevAction = this.activeActions.get(meshLocalId);
		if (prevAction) prevAction.stop();

		const clip = clips.find((c) => c.name === clipName);
		if (!clip) return;
		const action = mixer.clipAction(clip);
		action.play();
		this.activeActions.set(meshLocalId, action);
	}

	stopAnimation(meshLocalId?: string): void {
		if (meshLocalId) {
			const action = this.activeActions.get(meshLocalId);
			if (action) {
				action.stop();
				this.activeActions.delete(meshLocalId);
			}
		} else {
			// Stop all
			for (const action of this.activeActions.values()) {
				action.stop();
			}
			this.activeActions.clear();
		}
	}

	setAnimationSpeed(speed: number): void {
		for (const mixer of this.gltfMixers.values()) {
			mixer.timeScale = speed;
		}
	}

	setGltfScale(meshLocalId: string, x: number, y: number, z: number): void {
		const scene = this.gltfScenes.get(meshLocalId);
		if (scene) {
			scene.scale.set(x, y, z);
		}
	}

	setGltfOffset(meshLocalId: string, x: number, y: number, z: number): void {
		const scene = this.gltfScenes.get(meshLocalId);
		if (scene) {
			scene.position.set(x, y, z);
		}
	}

	async setHelpers(config: HelpersConfig): Promise<void> {
		this._clearHelpers();
		if (!this.ctx) return;

		if (config.player) {
			await this._loadPlayerHelper();
		}

		if (config.unitCube) {
			const geo = new THREE.BoxGeometry(1, 1, 1);
			const mat = new THREE.MeshBasicMaterial({
				color: 0xffffff,
				transparent: true,
				opacity: 0.25,
				wireframe: false,
				depthWrite: false
			});
			const helper = new THREE.Mesh(geo, mat);
			helper.position.y = 0.5;
			this.ctx.objects.addRaw(helper);
			this.proportionHelpers.push(helper);
		}
	}

	private async _loadPlayerHelper(): Promise<void> {
		if (!this.ctx) return;

		try {
			const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
			const loader = new GLTFLoader();
			const gltf = await new Promise<any>((resolve, reject) => {
				loader.load("/game/modeles/charactere/scene.gltf", resolve, undefined, reject);
			});

			const model = gltf.scene;
			model.traverse((child: THREE.Object3D) => {
				if (child instanceof THREE.Mesh) {
					const materials = Array.isArray(child.material) ? child.material : [child.material];
					materials.forEach((material) => {
						(material as THREE.Material).transparent = true;
						(material as THREE.Material).opacity = 0.4;
						(material as THREE.Material).depthWrite = false;
					});
				}
			});
			model.position.y = 0;

			this.ctx.objects.addRaw(model);
			this.proportionHelpers.push(model);
		} catch (error) {
			console.error("Failed to load player helper model:", error);
		}
	}

	setWireframe(enabled: boolean): void {
		this._wireframe = enabled;
		for (const group of this.meshGroups.values()) {
			this._applyWireframe(group, enabled);
		}
		for (const scene of this.gltfScenes.values()) {
			this._applyWireframe(scene, enabled);
		}
	}

	startPhysicsTest(state: ComponentState): void {
		if (!this.ctx) return;
		this.stopPhysicsTest();

		// Hide the regular preview meshes during drop test to avoid duplication
		this._hidePreviewMeshes();

		const floorGeo = new THREE.BoxGeometry(20, 0.2, 20);
		const floorMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
		const floorMesh = new THREE.Mesh(floorGeo, floorMat);
		floorMesh.position.y = -0.1;

		this.ctx.objects.add({
			id: this._physicsTestFloorId,
			type: "map",
			name: "cc_floor",
			pieces: [{
				asset: floorMesh,
				relativePosition: { x: 0, y: 0, z: 0 },
				hitboxes: [{ shape: { kind: "box", halfExtents: { x: 10, y: 0.1, z: 10 } }, relativeOffset: { x: 0, y: 0, z: 0 } }]
			}],
			physics: {
				bodyType: "static",
				gravityScale: 0,
				mass: 0,
				restitution: 0,
				friction: 0.5
			}
		});

		// Use first mesh for physics test
		const firstMesh = state.meshes[0];
		if (!firstMesh) return;

		let geo: THREE.BufferGeometry;
		const { primitive, sizeX, sizeY, sizeZ } = firstMesh;
		switch (primitive) {
			case "box":
				geo = new THREE.BoxGeometry(sizeX, sizeY, sizeZ);
				break;
			case "sphere":
				geo = new THREE.SphereGeometry(sizeX / 2, 32, 16);
				break;
			case "cylinder":
				geo = new THREE.CylinderGeometry(sizeX / 2, sizeX / 2, sizeY, 32);
				break;
			case "plane":
				geo = new THREE.PlaneGeometry(sizeX, sizeZ);
				break;
			default:
				geo = new THREE.BoxGeometry(1, 1, 1);
		}
		const colorHex = parseInt(firstMesh.color.replace("#", ""), 16);
		const material = new THREE.MeshStandardMaterial({ color: colorHex });
		const mesh = new THREE.Mesh(geo, material);
		mesh.position.y = 5;

		let shape: HitboxShape;
		switch (primitive) {
			case "box":
				shape = { kind: "box", halfExtents: { x: sizeX / 2, y: sizeY / 2, z: sizeZ / 2 } };
				break;
			case "sphere":
				shape = { kind: "sphere", radius: sizeX / 2 };
				break;
			case "cylinder":
				shape = { kind: "capsule", radius: sizeX / 2, height: sizeY };
				break;
			case "plane":
				shape = { kind: "box", halfExtents: { x: sizeX / 2, y: 0.01, z: sizeZ / 2 } };
				break;
			default:
				shape = { kind: "box", halfExtents: { x: sizeX / 2, y: sizeY / 2, z: sizeZ / 2 } };
		}

		this.ctx.objects.add({
			id: this._physicsTestObjectId,
			type: "map",
			name: "cc_drop",
			pieces: [{
				asset: mesh,
				relativePosition: { x: 0, y: 0, z: 0 },
				hitboxes: [{ shape, relativeOffset: { x: 0, y: 0, z: 0 } }]
			}],
			physics: {
				bodyType: state.bodyType,
				gravityScale: state.gravityScale,
				mass: state.mass,
				restitution: state.restitution,
				friction: state.friction
			}
		});

		this._physicsTestActive = true;
	}

	stopPhysicsTest(): void {
		if (!this.ctx) return;
		try {
			this.ctx.objects.remove(this._physicsTestFloorId);
		} catch {}
		try {
			this.ctx.objects.remove(this._physicsTestObjectId);
		} catch {}
		this._physicsTestActive = false;
		// Restore the regular preview meshes
		this._restorePreviewMeshes();
	}

	private _hidePreviewMeshes(): void {
		for (const group of this.meshGroups.values()) {
			group.visible = false;
		}
		for (const scene of this.gltfScenes.values()) {
			scene.visible = false;
		}
		for (const helper of this.hitboxHelpers) {
			helper.visible = false;
		}
		for (const helper of this.proportionHelpers) {
			helper.visible = false;
		}
	}

	private _restorePreviewMeshes(): void {
		for (const group of this.meshGroups.values()) {
			group.visible = true;
		}
		for (const scene of this.gltfScenes.values()) {
			scene.visible = true;
		}
		for (const helper of this.hitboxHelpers) {
			helper.visible = true;
		}
		for (const helper of this.proportionHelpers) {
			helper.visible = true;
		}
	}

	private _applyWireframe(root: THREE.Object3D, enabled: boolean): void {
		root.traverse((c) => {
			if (c instanceof THREE.Mesh) {
				const mats = Array.isArray(c.material) ? c.material : [c.material];
				for (const m of mats) {
					if (m instanceof THREE.MeshStandardMaterial || m instanceof THREE.MeshBasicMaterial) {
						m.wireframe = enabled;
					}
				}
			}
		});
	}

	private _clearScene(): void {
		this.stopPhysicsTest();
		if (!this.ctx) return;

		for (const group of this.meshGroups.values()) {
			this.ctx.objects.removeRaw(group);
			group.traverse((c) => {
				if (c instanceof THREE.Mesh) {
					c.geometry.dispose();
					if (Array.isArray(c.material)) {
						c.material.forEach((m) => m.dispose());
					} else {
						c.material.dispose();
					}
				}
			});
		}
		this.meshGroups.clear();

		for (const helper of this.hitboxHelpers) {
			this.ctx.objects.removeRaw(helper);
			helper.traverse((c) => {
				if (c instanceof THREE.LineSegments) {
					c.geometry.dispose();
					if (Array.isArray(c.material)) {
						c.material.forEach((m) => m.dispose());
					} else {
						c.material.dispose();
					}
				}
			});
		}
		this.hitboxHelpers = [];

		this.waypointAnims.clear();
	}

	private _clearGltfForMesh(meshLocalId: string): void {
		if (!this.ctx) return;

		const scene = this.gltfScenes.get(meshLocalId);
		if (scene) {
			this.ctx.objects.removeRaw(scene);
			scene.traverse((c) => {
				if (c instanceof THREE.Mesh) {
					c.geometry.dispose();
					if (Array.isArray(c.material)) {
						c.material.forEach((m) => m.dispose());
					} else {
						c.material.dispose();
					}
				}
			});
			this.gltfScenes.delete(meshLocalId);
		}

		this.gltfBounds.delete(meshLocalId);

		const action = this.activeActions.get(meshLocalId);
		if (action) {
			action.stop();
			this.activeActions.delete(meshLocalId);
		}

		const mixer = this.gltfMixers.get(meshLocalId);
		if (mixer) {
			mixer.stopAllAction();
			this.gltfMixers.delete(meshLocalId);
		}
		this.gltfClips.delete(meshLocalId);
	}

	private _clearGltf(): void {
		if (!this.ctx) return;

		for (const meshLocalId of this.gltfScenes.keys()) {
			this._clearGltfForMesh(meshLocalId);
		}
		this.gltfScenes.clear();
		this.gltfBounds.clear();
		this.activeActions.clear();
		this.gltfMixers.clear();
		this.gltfClips.clear();
	}

	private _clearHelpers(): void {
		if (!this.ctx) return;

		for (const helper of this.proportionHelpers) {
			this.ctx.objects.removeRaw(helper);
			helper.traverse((c) => {
				if (c instanceof THREE.LineSegments || c instanceof THREE.Mesh) {
					c.geometry.dispose();
					if (Array.isArray(c.material)) {
						c.material.forEach((m) => m.dispose());
					} else {
						c.material.dispose();
					}
				}
			});
		}
		this.proportionHelpers = [];
	}

	getGltfScene(): THREE.Group | null {
		if (this.gltfScenes.size === 0) return null;
		const firstKey = this.gltfScenes.keys().next().value;
		return firstKey ? this.gltfScenes.get(firstKey) ?? null : null;
	}

	getPreviewRoot(): THREE.Object3D | null {
		if (this.gltfScenes.size > 0) {
			const firstKey = this.gltfScenes.keys().next().value;
			return firstKey ? this.gltfScenes.get(firstKey) ?? null : null;
		}
		if (this.meshGroups.size > 0) {
			const firstKey = this.meshGroups.keys().next().value;
			return firstKey ? this.meshGroups.get(firstKey) ?? null : null;
		}
		return null;
	}

	setHitboxHighlight(indices: number[], hoveredIdx: number | null, selectedIdx: number | null): void {
		for (let i = 0; i < this.hitboxHelpers.length; i++) {
			const helper = this.hitboxHelpers[i];
			let color = 0x00ff88;
			if (i === selectedIdx) color = 0xff3366;
			else if (i === hoveredIdx) color = 0xffaa00;
			helper.traverse((c) => {
				if (c instanceof THREE.LineSegments) {
					const mat = c.material as THREE.LineBasicMaterial;
					mat.color.setHex(color);
				}
			});
		}
	}
}
