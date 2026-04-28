import * as THREE from "three";
import { createRoot, type Root } from "react-dom/client";
import type { Module, WorldContext } from "@/ThreeWrapper/4.module";
import { DebugPanel, type DebugControl, type ObjectSummary } from "@/ThreeWrapper/4.module/modules/ui/DebugPanel/DebugPanel";
import { Logger } from "@/ThreeWrapper/1.engine/tools/Logger";
import { networkLogger } from "@/ThreeWrapper/4.module/modules/debug/NetworkLogger";
import { traceRecorder } from "@/ThreeWrapper/4.module/modules/debug/TraceRecorder";
import type { ManagedObject, Piece, PieceHitbox } from "@/ThreeWrapper/2.world/tools/ObjectManager";
import { ComponentLoader, type ComponentDef } from "@/ThreeWrapper/2.world/tools/ComponentLoader";
import type { MeshPrimitive, MeshGLTF } from "@/ThreeWrapper/2.world/tools/ComponentLoader";
const _hitboxColor = 0x00ff00;
const _boundsColor = 0xff8800;
const _centerColor = 0x0088ff;
const _raycastColor = 0xff00ff;
const _pathfindColor = 0x00ffff;
const _frustumColor = 0xffff00;
const _lightVolumeColor = 0xffa500;
const _gridOriginColor = 0x888888;
function makeTextSprite(text: string, color = "#ffffff"): THREE.Sprite {
	const canvas = document.createElement("canvas");
	canvas.width = 256;
	canvas.height = 64;
	const ctx = canvas.getContext("2d")!;
	ctx.clearRect(0, 0, 256, 64);
	ctx.fillStyle = color;
	ctx.font = "bold 32px monospace";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillText(text, 128, 32);
	const tex = new THREE.CanvasTexture(canvas);
	tex.needsUpdate = true;
	const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
	const sprite = new THREE.Sprite(mat);
	sprite.scale.set(2, 0.5, 1);
	return sprite;
}
export class DebugControlModule implements Module {
	readonly type = "debug_control";
	private toggleKey: string;
	private ctx: WorldContext | null = null;
	private _panelRoot: Root | null = null;
	private _panelContainer: HTMLDivElement | null = null;
	private _panelVisible = false;
	private hitboxGroup = new THREE.Group();
	private boundsGroup = new THREE.Group();
	private namesGroup = new THREE.Group();
	private centersGroup = new THREE.Group();
	private raycastGroup = new THREE.Group();
	private pathfindGroup = new THREE.Group();
	private skeletonGroup = new THREE.Group();
	private frustumGroup = new THREE.Group();
	private lightVolumeGroup = new THREE.Group();
	private gridOriginGroup = new THREE.Group();
	private lodGroup = new THREE.Group();
	private registered = false;
	private componentLoader = new ComponentLoader();
	private loadedComponentDefs = new Map<string, ComponentDef>();
	private highlightGroup = new THREE.Group();
	private highlightMesh: THREE.Mesh | null = null;
	private highlightMaterial = new THREE.MeshBasicMaterial({
		color: 0xffff00,
		wireframe: true,
		transparent: true,
		opacity: 0.5
	});
	private raycaster = new THREE.Raycaster();
	private _hoveredObject: ManagedObject | null = null;
	private _hoverDistance = 0;
	private _mouseClient = { x: 0, y: 0 };
	private _onMouseMove: ((e: MouseEvent) => void) | null = null;
	constructor(toggleKey = "F1") {
		this.toggleKey = toggleKey;
	}
	init(ctx: WorldContext): void {
		this.ctx = ctx;
		this._ensurePanelContainer();
		this.hitboxGroup.name = "debug-hitboxes";
		this.boundsGroup.name = "debug-bounds";
		this.namesGroup.name = "debug-names";
		this.centersGroup.name = "debug-centers";
		this.raycastGroup.name = "debug-raycast";
		this.pathfindGroup.name = "debug-pathfinding";
		this.skeletonGroup.name = "debug-skeleton";
		this.frustumGroup.name = "debug-frustum";
		this.lightVolumeGroup.name = "debug-light-volumes";
		this.gridOriginGroup.name = "debug-grid-origin";
		this.lodGroup.name = "debug-lod";
		this.hitboxGroup.visible = false;
		this.boundsGroup.visible = false;
		this.namesGroup.visible = false;
		this.centersGroup.visible = false;
		this.raycastGroup.visible = false;
		this.pathfindGroup.visible = false;
		this.skeletonGroup.visible = false;
		this.frustumGroup.visible = false;
		this.lightVolumeGroup.visible = false;
		this.gridOriginGroup.visible = false;
		this.lodGroup.visible = false;
		ctx.objects.addRaw(this.hitboxGroup);
		ctx.objects.addRaw(this.boundsGroup);
		ctx.objects.addRaw(this.namesGroup);
		ctx.objects.addRaw(this.centersGroup);
		ctx.objects.addRaw(this.raycastGroup);
		ctx.objects.addRaw(this.pathfindGroup);
		ctx.objects.addRaw(this.skeletonGroup);
		ctx.objects.addRaw(this.frustumGroup);
		ctx.objects.addRaw(this.lightVolumeGroup);
		ctx.objects.addRaw(this.gridOriginGroup);
		ctx.objects.addRaw(this.lodGroup);
		this.registered = true;
		const ctrl: DebugControl = {
			open: () => {
				this._ensurePanelContainer();
				if (!this._panelVisible) {
					this._panelRoot!.render(<DebugPanel />);
					this._panelVisible = true;
				}
			},
			close: () => {
				if (this._panelVisible && this._panelRoot) {
					this._panelRoot.render(null);
					this._panelVisible = false;
				}
			},
			toggle: () => {
				if (this._panelVisible) ctrl.close();
				else ctrl.open();
			},
			setObjectPosition: (_id, _pos) => {
			},
			setObjectRotation: (_id, _rot) => {
			},
			setObjectExtra: (_id, _key, _value) => {
			},
			setObjectVelocity: (_id, _vel) => {
			},
			pinObject: (_id) => {
			},
			getObjectById: (_id) => null,
			getAllObjects: () => [],
			removeObject: (_id) => {
			},
			teleportToObject: (_id) => {
			},
			teleportObjectToPlayer: (_id) => {
			},
			cloneObject: (_id) => {
			},
			freezeObject: (_id, _freeze) => {
			},
			addPiece: (_id, _piece) => {
			},
			removePiece: (_id, _pieceIndex) => {
			},
			setPieceRelativePosition: (_id, _pieceIndex, _relPos) => {
			},
			setPieceHitbox: (_id, _pieceIndex, _hitboxIndex, _hitbox) => {
			},
			setGravityScale: (_scale) => {
			},
			setSubStepping: (_steps) => {
			},
			setGodMode: (_enabled) => {
			},
			setNoclip: (_enabled) => {
			},
			setInfiniteResources: (_enabled) => {
			},
			quickSave: () => ({ success: false, message: "Not initialized" }),
			quickLoad: () => ({ success: false, message: "Not initialized" }),
			getSnapshotList: () => [],
			saveWorldSnapshot: (_name: string) => ({ success: false, message: "Not initialized" }),
			loadWorldSnapshot: (_name: string) => ({ success: false, message: "Not initialized" }),
			getCameraPosition: () => ({ x: 0, y: 0, z: 0 }),
			getAvailableObjectTypes: () => ["player", "npc", "map"],
			spawnObject: (_type, _pos, _componentUrl): Promise<string | null> => {
				return Promise.resolve(null);
			},
			getSelfPlayerId: () => null
		};
		this._ctrl = ctrl;
		window.__debugCtrl = {
			...ctrl,
			setObjectPosition: (id, pos) => this.setObjectPosition(id, pos),
			setObjectRotation: (id, rot) => this.setObjectRotation(id, rot),
			setObjectExtra: (id, key, value) => this.setObjectExtra(id, key, value),
			setObjectVelocity: (id, vel) => this.setObjectVelocity(id, vel),
			pinObject: (id) => this.pinObject(id),
			getObjectById: (id) => this.getObjectById(id),
			getAllObjects: () => this.getAllObjects(),
			removeObject: (id) => this.removeObject(id),
			teleportToObject: (id) => this.teleportToObject(id),
			teleportObjectToPlayer: (id) => this.teleportObjectToPlayer(id),
			cloneObject: (id) => this.cloneObject(id),
			freezeObject: (id, freeze) => this.freezeObject(id, freeze),
			addPiece: (id, piece) => this.addPiece(id, piece),
			removePiece: (id, pieceIndex) => this.removePiece(id, pieceIndex),
			setPieceRelativePosition: (id, pieceIndex, relPos) => this.setPieceRelativePosition(id, pieceIndex, relPos),
			setPieceHitbox: (id, pieceIndex, hitboxIndex, hitbox) => this.setPieceHitbox(id, pieceIndex, hitboxIndex, hitbox),
			setGravityScale: (scale) => this.setGravityScale(scale),
			setSubStepping: (steps) => this.setSubStepping(steps),
			setGodMode: (enabled) => this.setGodMode(enabled),
			setNoclip: (enabled) => this.setNoclip(enabled),
			setInfiniteResources: (enabled) => this.setInfiniteResources(enabled),
			quickSave: () => this.quickSave(),
			quickLoad: () => this.quickLoad(),
			saveWorldSnapshot: (name) => this.saveWorldSnapshot(name),
			loadWorldSnapshot: (name) => this.loadWorldSnapshot(name),
			getCameraPosition: () => this.getCameraPosition(),
			getAvailableObjectTypes: () => this.getAvailableObjectTypes(),
			spawnObject: (type, pos, componentUrl) => this.spawnObject(type, pos, componentUrl),
			getSelfPlayerId: () => this.getSelfPlayerId()
		};
		this.highlightGroup.name = "debug-control-highlight";
		this.highlightGroup.visible = false;
		ctx.objects.addRaw(this.highlightGroup);
		this._onMouseMove = (e: MouseEvent) => {
			if (!this.ctx) return;
			const rect = this.ctx.canvas.getBoundingClientRect();
			const mouse = new THREE.Vector2();
			mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
			mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
			this._mouseClient = { x: e.clientX, y: e.clientY };
			this.updateHover(mouse);
		};
		window.addEventListener("mousemove", this._onMouseMove);
		window.addEventListener("keydown", this._handler);
		this._cleanup = () => {
			window.removeEventListener("mousemove", this._onMouseMove!);
			window.removeEventListener("keydown", this._handler);
		};
	}
	private _ensurePanelContainer(): void {
		if (this._panelContainer || this._panelRoot) return;
		this._panelContainer = document.createElement("div");
		this._panelContainer.dataset.debugPanel = "true";
		document.body.appendChild(this._panelContainer);
		this._panelRoot = createRoot(this._panelContainer);
	}
	update(_delta: number): void {
		if (!this.registered || !this.ctx) return;
		const cfg = Logger.getDebugConfig();
		networkLogger.setEnabledFromConfig();
		if (traceRecorder.isRecording()) {
			const entries = Logger.getEntries();
			for (const e of entries) traceRecorder.record(e);
		}
		this.hitboxGroup.visible = cfg.showHitboxes ?? false;
		if (cfg.showHitboxes) this.updateHitboxes();
		this.ctx.objects.setDebugEnabled(cfg.showHitboxes ?? false);
		this.boundsGroup.visible = cfg.showBounds ?? false;
		if (cfg.showBounds) this.updateBounds();
		this.namesGroup.visible = cfg.showNames ?? false;
		if (cfg.showNames) this.updateNames();
		this.centersGroup.visible = cfg.showObjectCenters ?? false;
		if (cfg.showObjectCenters) this.updateCenters();
		this.raycastGroup.visible = cfg.showRaycast ?? false;
		if (cfg.showRaycast) this.updateRaycast();
		this.pathfindGroup.visible = cfg.showPathfinding ?? false;
		if (cfg.showPathfinding) this.updatePathfinding();
		this.skeletonGroup.visible = cfg.showSkeleton ?? false;
		if (cfg.showSkeleton) this.updateSkeleton();
		this.frustumGroup.visible = cfg.showFrustum ?? false;
		if (cfg.showFrustum) this.updateFrustum();
		this.lightVolumeGroup.visible = cfg.showLightVolumes ?? false;
		if (cfg.showLightVolumes) this.updateLightVolumes();
		this.gridOriginGroup.visible = cfg.showGridOrigin ?? false;
		if (cfg.showGridOrigin) this.updateGridOrigin();
		this.lodGroup.visible = cfg.showLOD ?? false;
		if (cfg.showLOD) this.updateLOD();
		this.highlightGroup.visible = (cfg.showHoverOverlay ?? false) && this._hoveredObject !== null;
		const eng = window.__engine;
		if (eng) {
			if (eng.gravityScale !== this._lastGravityScale) {
				this.setGravityScale(eng.gravityScale);
				this._lastGravityScale = eng.gravityScale;
			}
			if (eng.godMode !== this._lastGodMode) {
				this.setGodMode(eng.godMode);
				this._lastGodMode = eng.godMode;
			}
			if (eng.noclip !== this._lastNoclip) {
				this.setNoclip(eng.noclip);
				this._lastNoclip = eng.noclip;
			}
			if (eng.infiniteResources !== this._lastInfiniteResources) {
				this.setInfiniteResources(eng.infiniteResources);
				this._lastInfiniteResources = eng.infiniteResources;
			}
			if (eng.quickSaveRequested) {
				this.quickSave();
			}
			if (eng.quickLoadRequested) {
				this.quickLoad();
			}
		}
	}
	private _lastGravityScale = 1.0;
	private _lastGodMode = false;
	private _lastNoclip = false;
	private _lastInfiniteResources = false;
	private getManagedObjects(): ManagedObject[] {
		if (!this.ctx) return [];
		return this.ctx.objects.getAll();
	}
	private updateHitboxes(): void {
		const objects = this.getManagedObjects();
		while (this.hitboxGroup.children.length > 0) {
			const c = this.hitboxGroup.children[0];
			this.hitboxGroup.remove(c);
			if (c instanceof THREE.Mesh || c instanceof THREE.LineSegments) {
				c.geometry.dispose();
				(c.material as THREE.Material).dispose();
			}
		}
		for (const obj of objects) {
			if (!obj.physics || obj.pieces.length === 0) continue;
			for (const piece of obj.pieces) {
				if (!piece || piece.hitboxes.length === 0) continue;
				for (const hitbox of piece.hitboxes) {
					const shape = hitbox.shape;
					let geo: THREE.BufferGeometry;
					if (shape.kind === "sphere") {
						geo = new THREE.SphereGeometry(shape.radius ?? 0.5, 8, 6);
					} else if (shape.kind === "capsule") {
						geo = new THREE.CapsuleGeometry(shape.radius ?? 0.4, shape.height ?? 0.8, 4, 8);
					} else if (shape.kind === "auto") {
						const box = new THREE.Box3().setFromObject(piece.asset);
						const size = box.getSize(new THREE.Vector3());
						geo = new THREE.BoxGeometry(size.x, size.y, size.z);
					} else {
						const he = shape.halfExtents ?? { x: 0.5, y: 0.5, z: 0.5 };
						geo = new THREE.BoxGeometry(he.x * 2, he.y * 2, he.z * 2);
					}
					const edges = new THREE.EdgesGeometry(geo);
					geo.dispose();
					const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: _hitboxColor }));
					line.position
						.copy(piece.asset.position)
						.add(piece.relativePosition)
						.add(new THREE.Vector3(hitbox.relativeOffset?.x ?? 0, hitbox.relativeOffset?.y ?? 0, hitbox.relativeOffset?.z ?? 0));
					line.quaternion.copy(piece.asset.quaternion);
					this.hitboxGroup.add(line);
					if (hitbox.tag) {
						const text = makeTextSprite(hitbox.tag, "#ffffff");
						text.position.copy(line.position);
						text.position.y += 1;
						this.hitboxGroup.add(text);
					}
				}
			}
		}
	}
	private updateBounds(): void {
		const objects = this.getManagedObjects();
		while (this.boundsGroup.children.length > 0) {
			const c = this.boundsGroup.children[0];
			this.boundsGroup.remove(c);
			if (c instanceof THREE.Mesh || c instanceof THREE.LineSegments) {
				c.geometry.dispose();
				(c.material as THREE.Material).dispose();
			}
		}
		for (const obj of objects) {
			for (const piece of obj.pieces) {
				const box = new THREE.Box3().setFromObject(piece.asset);
				const geo = new THREE.BoxGeometry(box.max.x - box.min.x, box.max.y - box.min.y, box.max.z - box.min.z);
				const edges = new THREE.EdgesGeometry(geo);
				geo.dispose();
				const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: _boundsColor }));
				const center = new THREE.Vector3();
				box.getCenter(center);
				line.position.copy(center);
				this.boundsGroup.add(line);
			}
		}
	}
	private updateNames(): void {
		const objects = this.getManagedObjects();
		while (this.namesGroup.children.length > 0) {
			const c = this.namesGroup.children[0];
			this.namesGroup.remove(c);
			if (c instanceof THREE.Sprite) {
				(c.material as THREE.SpriteMaterial).map?.dispose();
				(c.material as THREE.Material).dispose();
			}
		}
		for (const obj of objects) {
			const label = obj.name ?? obj.id;
			const sprite = makeTextSprite(label, "#ffffff");
			if (obj.pieces[0]) {
				const worldPos = new THREE.Vector3();
				obj.pieces[0].asset.getWorldPosition(worldPos);
				sprite.position.copy(worldPos);
				sprite.position.y += 0.5;
			}
			this.namesGroup.add(sprite);
		}
	}
	private updateCenters(): void {
		const objects = this.getManagedObjects();
		while (this.centersGroup.children.length > 0) {
			const c = this.centersGroup.children[0];
			this.centersGroup.remove(c);
			if (c instanceof THREE.Mesh) {
				c.geometry.dispose();
				(c.material as THREE.Material).dispose();
			}
		}
		for (const obj of objects) {
			if (obj.pieces[0]) {
				const center = new THREE.Vector3();
				obj.pieces[0].asset.getWorldPosition(center);
				const geo = new THREE.SphereGeometry(0.05, 6, 4);
				const line = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: _centerColor }));
				line.position.copy(center);
				this.centersGroup.add(line);
			}
		}
	}
	private updateRaycast(): void {
		while (this.raycastGroup.children.length > 0) {
			const c = this.raycastGroup.children[0];
			this.raycastGroup.remove(c);
			if (c instanceof THREE.Line) {
				c.geometry.dispose();
				(c.material as THREE.Material).dispose();
			}
		}
		if (!this.ctx) return;
		const ray = this.raycaster.ray;
		const points = [ray.origin.clone(), ray.origin.clone().add(ray.direction.clone().multiplyScalar(100))];
		const geo = new THREE.BufferGeometry().setFromPoints(points);
		const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: _raycastColor }));
		this.raycastGroup.add(line);
	}
	private updatePathfinding(): void {
		while (this.pathfindGroup.children.length > 0) {
			const c = this.pathfindGroup.children[0];
			this.pathfindGroup.remove(c);
			if (c instanceof THREE.LineSegments) {
				c.geometry.dispose();
				(c.material as THREE.Material).dispose();
			}
		}
		const objects = this.getManagedObjects();
		for (const obj of objects) {
			const extra = obj.extraData as Record<string, unknown>;
			if (extra && extra["pathNodes"]) {
				const pathNodes = extra["pathNodes"] as Array<{ x: number; y: number; z: number }>;
				if (pathNodes.length > 1) {
					const points: THREE.Vector3[] = [];
					for (const node of pathNodes) {
						points.push(new THREE.Vector3(node.x, node.y, node.z));
					}
					const geo = new THREE.BufferGeometry().setFromPoints(points);
					const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: _pathfindColor }));
					this.pathfindGroup.add(line);
				}
			}
		}
	}
	private updateSkeleton(): void {
		while (this.skeletonGroup.children.length > 0) {
			const c = this.skeletonGroup.children[0];
			this.skeletonGroup.remove(c);
			if (c instanceof THREE.LineSegments) {
				c.geometry.dispose();
				(c.material as THREE.Material).dispose();
			}
		}
		const objects = this.getManagedObjects();
		for (const obj of objects) {
			for (const piece of obj.pieces) {
				piece.asset.traverse((child) => {
					if (child instanceof THREE.SkinnedMesh && child.skeleton) {
						const bones = child.skeleton.bones;
						const boneGeo = new THREE.BufferGeometry();
						const bonePoints: THREE.Vector3[] = [];
						for (const bone of bones) {
							if (bone.parent instanceof THREE.Bone) {
								bonePoints.push(bone.getWorldPosition(new THREE.Vector3()));
								bonePoints.push(bone.parent.getWorldPosition(new THREE.Vector3()));
							}
						}
						if (bonePoints.length > 0) {
							boneGeo.setFromPoints(bonePoints);
							const line = new THREE.LineSegments(boneGeo, new THREE.LineBasicMaterial({ color: 0xffffff }));
							this.skeletonGroup.add(line);
						}
					}
				});
			}
		}
	}
	private updateFrustum(): void {
		while (this.frustumGroup.children.length > 0) {
			const c = this.frustumGroup.children[0];
			this.frustumGroup.remove(c);
			if (c instanceof THREE.Mesh) {
				c.geometry.dispose();
				(c.material as THREE.Material).dispose();
			}
		}
		if (!this.ctx) return;
		const camera = this.ctx.camera;
		const frustum = new THREE.Frustum();
		const mat = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
		frustum.setFromProjectionMatrix(mat);
		const planes = frustum.planes;
		const vertices: number[] = [];
		for (let i = 0; i < 6; i++) {
			const plane = planes[i];
			if (!plane) continue;
			const normal = plane.normal;
			const planeConst = plane.constant;
			const worldPos = new THREE.Vector3();
			const d = -planeConst / (normal.x * normal.x + normal.y * normal.y + normal.z * normal.z + 0.0001);
			worldPos.set(normal.x * d, normal.y * d, normal.z * d);
			const edges = [
				worldPos.clone().add(new THREE.Vector3(10, 0, 0)),
				worldPos.clone().add(new THREE.Vector3(-10, 0, 0)),
				worldPos.clone().add(new THREE.Vector3(0, 10, 0)),
				worldPos.clone().add(new THREE.Vector3(0, -10, 0)),
				worldPos.clone().add(new THREE.Vector3(0, 0, 10)),
				worldPos.clone().add(new THREE.Vector3(0, 0, -10))
			];
			for (const v of edges) {
				vertices.push(v.x, v.y, v.z, worldPos.x, worldPos.y, worldPos.z);
			}
		}
		const geo = new THREE.BufferGeometry();
		geo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
		const line = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: _frustumColor, transparent: true, opacity: 0.5 }));
		this.frustumGroup.add(line);
	}
	private updateLightVolumes(): void {
		while (this.lightVolumeGroup.children.length > 0) {
			const c = this.lightVolumeGroup.children[0];
			this.lightVolumeGroup.remove(c);
			if (c instanceof THREE.Mesh || c instanceof THREE.LineSegments) {
				c.geometry.dispose();
				(c.material as THREE.Material).dispose();
			}
		}
		if (!this.ctx) return;
		this.ctx.scene.traverse((child) => {
			if (child instanceof THREE.Light) {
				if (child instanceof THREE.PointLight) {
					const geo = new THREE.SphereGeometry(child.distance > 0 ? child.distance : 10, 16, 8);
					const edges = new THREE.EdgesGeometry(geo);
					geo.dispose();
					const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: _lightVolumeColor, transparent: true, opacity: 0.3 }));
					line.position.copy(child.position);
					this.lightVolumeGroup.add(line);
				} else if (child instanceof THREE.SpotLight) {
					const coneHeight = child.distance > 0 ? child.distance : 20;
					const coneRadius = coneHeight * Math.tan(child.angle);
					const geo = new THREE.ConeGeometry(coneRadius, coneHeight, 16, 1, true);
					const edges = new THREE.EdgesGeometry(geo);
					geo.dispose();
					const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: _lightVolumeColor, transparent: true, opacity: 0.3 }));
					line.position.copy(child.position);
					line.quaternion.copy(child.quaternion);
					this.lightVolumeGroup.add(line);
				}
			}
		});
	}
	private updateGridOrigin(): void {
		while (this.gridOriginGroup.children.length > 0) {
			const c = this.gridOriginGroup.children[0];
			this.gridOriginGroup.remove(c);
			if (c instanceof THREE.LineSegments) {
				c.geometry.dispose();
				(c.material as THREE.Material).dispose();
			}
		}
		const gridHelper = new THREE.GridHelper(20, 20, _gridOriginColor, _gridOriginColor);
		this.gridOriginGroup.add(gridHelper);
		const axesGeo = new THREE.BufferGeometry();
		const axesPoints = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 1)];
		axesGeo.setFromPoints(axesPoints);
		const axesLine = new THREE.LineSegments(axesGeo, new THREE.LineBasicMaterial({ color: 0xff0000 }));
		axesLine.position.set(0.01, 0.01, 0.01);
		this.gridOriginGroup.add(axesLine);
	}
	private updateLOD(): void {
		while (this.lodGroup.children.length > 0) {
			const c = this.lodGroup.children[0];
			this.lodGroup.remove(c);
			if (c instanceof THREE.Sprite) {
				(c.material as THREE.SpriteMaterial).map?.dispose();
				(c.material as THREE.Material).dispose();
			}
		}
		const objects = this.getManagedObjects();
		for (const obj of objects) {
			if ("LOD" in obj) {
				const lod = (obj as unknown as { LOD: THREE.LOD }).LOD;
				if (lod && lod.levels.length > 0) {
					const level = lod.getCurrentLevel();
					const worldPos = new THREE.Vector3();
					if (obj.pieces[0]) {
						obj.pieces[0].asset.getWorldPosition(worldPos);
					}
					const sprite = makeTextSprite(`LOD:${level}`, "#ffff00");
					sprite.position.copy(worldPos);
					sprite.position.y += 1.5;
					this.lodGroup.add(sprite);
				}
			}
		}
	}
	get hoveredObject(): ManagedObject | null {
		return this._hoveredObject;
	}
	setObjectPosition(id: string, pos: { x: number; y: number; z: number }): void {
		this.ctx?.objects.setPosition(id, pos);
	}
	setObjectRotation(id: string, rot: { x: number; y: number; z: number; w: number }): void {
		this.ctx?.objects.setRotation(id, rot);
	}
	setObjectExtra(id: string, key: string, value: unknown): void {
		this.ctx?.objects.setExtra(id, key, value);
	}
	setObjectVelocity(id: string, vel: { x: number; y: number; z: number }): void {
		this.ctx?.objects.setVelocity(id, vel);
	}
	pinObject(id: string): void {
		const obj = this.ctx?.objects.getById(id);
		if (!obj) return;
		window.dispatchEvent(new CustomEvent("debug:pin", { detail: { object: this.serializeManagedObject(obj) } }));
	}
	getObjectById(id: string) {
		const obj = this.ctx?.objects.getById(id);
		if (!obj) return null;
		return this.serializeManagedObject(obj);
	}
	getAllObjects(): ObjectSummary[] {
		if (!this.ctx) return [];
		return this.ctx.objects.getAll().map((obj) => ({
			id: obj.id,
			name: obj.name,
			type: obj.type,
			position: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
			active: true
		}));
	}
	getCameraPosition(): { x: number; y: number; z: number } {
		if (!this.ctx) return { x: 0, y: 0, z: 0 };
		return {
			x: this.ctx.camera.position.x,
			y: this.ctx.camera.position.y,
			z: this.ctx.camera.position.z
		};
	}
	getSelfPlayerId(): string | null {
		return this.ctx?.selfServerClient.id ?? null;
	}
	getAvailableObjectTypes(): string[] {
		const ids = this.componentLoader.getLoadedIds();
		if (ids.length > 0) return ids;
		return ["player", "npc", "map", "weapon", "pickup"];
	}
	async spawnObject(type: string, position?: { x: number; y: number; z: number }, componentUrl?: string): Promise<string | null> {
		if (!this.ctx) return null;
		const pos = position ?? this.getCameraPosition();
		const id = `spawn_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
		if (componentUrl) {
			try {
				const comp = await this.componentLoader.load(componentUrl);
				this.loadedComponentDefs.set(componentUrl, comp);
				await this.spawnFromComponent(id, type, comp, pos);
				return id;
			} catch (e) {
				console.warn("[DebugControlModule] Failed to load component for spawn:", e);
			}
		}
		const meshDefs = this.loadedComponentDefs.get(type);
		if (meshDefs) {
			await this.spawnFromComponent(id, type, meshDefs, pos);
			return id;
		}
		this.spawnPrimitiveBox(id, type, pos);
		return id;
	}
	private async spawnFromComponent(id: string, objType: string, comp: ComponentDef, position: { x: number; y: number; z: number }): Promise<void> {
		if (!this.ctx) return;
		const pieces: Piece[] = [];
		const meshDefs = comp.meshes ?? (comp.mesh ? [comp.mesh] : []);
		for (const meshDef of meshDefs) {
			let asset: THREE.Object3D;
			if ("gltf" in meshDef) {
				const loaded = await this.ctx.gltf.load(`debug_${id}_${pieces.length}`, (meshDef as MeshGLTF).gltf);
				if (!loaded) {
					asset = new THREE.Group();
				} else {
					asset = loaded.scene;
				}
			} else {
				asset = this.buildPrimitive(meshDef as MeshPrimitive);
			}
			asset.position.set(position.x, position.y, position.z);
			pieces.push({ asset, relativePosition: { x: 0, y: 0, z: 0 }, hitboxes: [] });
		}
		const solidHitboxes = (comp.hitboxes ?? []).filter((h) => !h.isSensor);
		for (let i = 0; i < solidHitboxes.length; i++) {
			const hb = solidHitboxes[i];
			const pieceIndex = Math.min(i, pieces.length - 1);
			pieces[pieceIndex].hitboxes.push({
				shape: this.hitboxDefToShape(hb),
				relativeOffset: hb.offset ?? { x: 0, y: 0, z: 0 },
				collidesWith: hb.collidesWith,
				isSensor: false,
				tag: hb.tag
			});
		}
		const physDesc =
			solidHitboxes.length > 0 || comp.physics
				? {
						bodyType: comp.physics?.bodyType ?? "static",
						gravityScale: comp.physics?.gravityScale,
						mass: comp.physics?.mass,
						restitution: comp.physics?.restitution,
						friction: comp.physics?.friction
					}
				: undefined;
		this.ctx.objects.add({
			id,
			type: objType as any,
			name: `${objType}_${id.slice(-6)}`,
			componentId: comp.id,
			pieces,
			physics: physDesc,
			position,
			extraData: { componentId: comp.id }
		});
	}
	private spawnPrimitiveBox(id: string, type: string, position: { x: number; y: number; z: number }): void {
		if (!this.ctx) return;
		const geo = new THREE.BoxGeometry(1, 1, 1);
		const mat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
		const mesh = new THREE.Mesh(geo, mat);
		mesh.position.set(position.x, position.y, position.z);
		this.ctx.objects.addSimple({
			asset: mesh,
			type: type as any,
			position,
			hitbox: { kind: "auto" },
			physics: { bodyType: type === "map" ? "static" : "dynamic" }
		});
	}
	private buildPrimitive(mesh: MeshPrimitive): THREE.Mesh {
		const s = mesh.size ?? { x: 1, y: 1, z: 1 };
		let geo: THREE.BufferGeometry;
		switch (mesh.primitive) {
			case "sphere":
				geo = new THREE.SphereGeometry(s.x / 2, 32, 16);
				break;
			case "plane":
				geo = new THREE.PlaneGeometry(s.x, s.z ?? s.x, 32, 32);
				break;
			case "cylinder":
				geo = new THREE.CylinderGeometry(s.x / 2, s.x / 2, s.y, 16, 4);
				break;
			default:
				geo = new THREE.BoxGeometry(s.x, s.y, s.z, 4, 4, 4);
		}
		const mat = new THREE.MeshStandardMaterial({ color: mesh.color ?? 0xcccccc });
		return new THREE.Mesh(geo, mat);
	}
	private hitboxDefToShape(hitbox: { shape: string; size?: any; radius?: number; height?: number }): any {
		if (hitbox.shape === "sphere") return { kind: "sphere", radius: hitbox.radius };
		if (hitbox.shape === "capsule") return { kind: "capsule", radius: hitbox.radius, height: hitbox.height };
		const size = hitbox.size;
		if (!size || size === "auto" || size === "full") return { kind: "auto" };
		return { kind: "box", halfExtents: { x: size.x / 2, y: size.y / 2, z: size.z / 2 } };
	}
	registerComponentUrl(url: string): void {
		if (!this.loadedComponentDefs.has(url)) {
			this.componentLoader
				.load(url)
				.then((comp) => {
					this.loadedComponentDefs.set(url, comp);
					window.dispatchEvent(new CustomEvent("debug:componentsUpdated"));
				})
				.catch((e) => {
					console.warn("[DebugControlModule] Failed to prefetch component:", url, e);
				});
		}
	}
	getLoadedComponents(): string[] {
		return [...this.loadedComponentDefs.keys()];
	}
	removeObject(id: string): void {
		this.ctx?.objects.remove(id);
	}
	teleportToObject(id: string): void {
		if (!this.ctx) return;
		const selfId = this.ctx.selfServerClient.id;
		if (!selfId) return;
		const player = this.ctx.objects.getById(selfId);
		const target = this.ctx.objects.getById(id);
		if (!player || !target) return;
		this.ctx.objects.setPosition(player.id, { x: target.position.x, y: target.position.y, z: target.position.z });
	}
	teleportObjectToPlayer(id: string): void {
		if (!this.ctx) return;
		const selfId = this.ctx.selfServerClient.id;
		if (!selfId) return;
		const player = this.ctx.objects.getById(selfId);
		const target = this.ctx.objects.getById(id);
		if (!player || !target) return;
		this.ctx.objects.setPosition(target.id, { x: player.position.x, y: player.position.y, z: player.position.z });
	}
	cloneObject(id: string): void {
		if (!this.ctx) return;
		const original = this.ctx.objects.getById(id);
		if (!original) return;
		this.ctx.objects.add({
			type: original.type,
			name: `${original.name ?? original.id}_clone`,
			pieces: original.pieces.map((p) => ({
				asset: p.asset.clone(),
				relativePosition: { ...p.relativePosition },
				hitboxes: p.hitboxes.map((h) => ({ ...h }))
			})),
			position: { x: original.position.x + 2, y: original.position.y, z: original.position.z },
			rotation: { x: original.rotation.x, y: original.rotation.y, z: original.rotation.z, w: original.rotation.w },
			extraData: { ...original.extraData }
		});
	}
	freezeObject(id: string, freeze: boolean): void {
		if (!this.ctx) return;
		const obj = this.ctx.objects.getById(id);
		if (!obj) return;
		if (freeze) {
			this.ctx.objects.setVelocity(id, { x: 0, y: 0, z: 0 });
			this.ctx.objects.setGravityScale(id, 0);
		} else {
			this.ctx.objects.setGravityScale(id, 1);
		}
	}
	addPiece(id: string, piece: { assetName?: string; relativePosition: { x: number; y: number; z: number }; hitboxes?: PieceHitbox[] }): void {
		if (!this.ctx) return;
		const obj = this.ctx.objects.getById(id);
		if (!obj) return;
		this.ctx.objects.addPiece(id, {
			asset: piece.assetName ? new THREE.Group() : (obj.pieces[0]?.asset.clone() ?? new THREE.Group()),
			relativePosition: piece.relativePosition,
			hitboxes: piece.hitboxes ?? []
		});
	}
	removePiece(id: string, pieceIndex: number): void {
		if (!this.ctx) return;
		const obj = this.ctx.objects.getById(id);
		if (!obj || pieceIndex < 0 || pieceIndex >= obj.pieces.length) return;
		const piece = obj.pieces[pieceIndex];
		if (piece?.asset) {
			piece.asset.traverse((child) => {
				if (child instanceof THREE.Mesh) {
					child.geometry?.dispose();
					if (Array.isArray(child.material)) {
						child.material.forEach((m) => m.dispose());
					} else {
						child.material?.dispose();
					}
				}
			});
			if (obj.pieces[pieceIndex].asset instanceof THREE.Group) {
				obj.pieces[pieceIndex].asset.clear();
			}
		}
		obj.pieces.splice(pieceIndex, 1);
	}
	setPieceRelativePosition(id: string, pieceIndex: number, relPos: { x: number; y: number; z: number }): void {
		if (!this.ctx) return;
		const obj = this.ctx.objects.getById(id);
		if (!obj || pieceIndex < 0 || pieceIndex >= obj.pieces.length) return;
		obj.pieces[pieceIndex].relativePosition = relPos;
		if (obj.pieces[pieceIndex].asset) {
			obj.pieces[pieceIndex].asset.position.set(relPos.x, relPos.y, relPos.z);
		}
	}
	setPieceHitbox(id: string, pieceIndex: number, hitboxIndex: number, hitbox: { shape: PieceHitbox["shape"]; relativeOffset: PieceHitbox["relativeOffset"]; collidesWith?: string[]; isSensor?: boolean; tag?: string }): void {
		if (!this.ctx) return;
		const obj = this.ctx.objects.getById(id);
		if (!obj || pieceIndex < 0 || pieceIndex >= obj.pieces.length) return;
		const piece = obj.pieces[pieceIndex];
		if (hitboxIndex < 0 || hitboxIndex >= piece.hitboxes.length) return;
		piece.hitboxes[hitboxIndex] = {
			shape: hitbox.shape,
			relativeOffset: hitbox.relativeOffset,
			collidesWith: hitbox.collidesWith,
			isSensor: hitbox.isSensor,
			tag: hitbox.tag
		};
	}
	setGravityScale(scale: number): void {
		if (!this.ctx) return;
		const objects = this.ctx.objects.getAll();
		for (const obj of objects) {
			this.ctx.objects.setGravityScale(obj.id, scale);
		}
	}
	setSubStepping(steps: number): void {
		const eng = window.__engine;
		if (eng) {
			eng.subStepping = steps;
		}
	}
	setGodMode(enabled: boolean): void {
		if (!this.ctx) return;
		const selfId = this.ctx.selfServerClient.id;
		if (!selfId) return;
		const player = this.ctx.objects.getById(selfId);
		if (!player) return;
		if (enabled) {
			this.ctx.objects.setVelocity(player.id, { x: 0, y: 0, z: 0 });
			this.ctx.objects.setGravityScale(player.id, 0);
			this.ctx.objects.setExtra(player.id, "godMode", true);
		} else {
			this.ctx.objects.setGravityScale(player.id, 1);
			this.ctx.objects.setExtra(player.id, "godMode", false);
		}
	}
	setNoclip(enabled: boolean): void {
		if (!this.ctx) return;
		const selfId = this.ctx.selfServerClient.id;
		if (!selfId) return;
		const player = this.ctx.objects.getById(selfId);
		if (!player) return;
		this.ctx.objects.setExtra(player.id, "noclip", enabled);
	}
	setInfiniteResources(enabled: boolean): void {
		if (!this.ctx) return;
		const selfId = this.ctx.selfServerClient.id;
		if (!selfId) return;
		const player = this.ctx.objects.getById(selfId);
		if (!player) return;
		this.ctx.objects.setExtra(player.id, "infiniteResources", enabled);
	}
	quickSave(): { success: boolean; message: string } {
		if (!this.ctx) return { success: false, message: "No context" };
		const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
		const name = `quicksave_${timestamp}`;
		const result = this.ctx.objects.saveFullSnapshot(name);
		if (result.success) {
			localStorage.setItem("debugQuickSave_latest", name);
		}
		return {
			success: result.success,
			message: result.success ? `Quick saved ${result.objectCount} objects as "${name}"` : `Quick save failed: ${result.error}`
		};
	}
	quickLoad(): { success: boolean; message: string } {
		if (!this.ctx) return { success: false, message: "No context" };
		const latestName = localStorage.getItem("debugQuickSave_latest");
		if (!latestName) return { success: false, message: "No quick save found" };
		const result = this.ctx.objects.loadFullSnapshot(latestName);
		return {
			success: result.success,
			message: result.success ? `Quick loaded ${result.objectCount} objects${result.unrestoredObjects ? ` (${result.unrestoredObjects.length} not restored)` : ""}` : `Quick load failed: ${result.error}`
		};
	}
	getSnapshotList(): string[] {
		const snapshots: string[] = [];
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key?.startsWith("debugWorldSnapshot_")) {
				snapshots.push(key.replace("debugWorldSnapshot_", ""));
			}
		}
		return snapshots.sort().reverse();
	}
	saveWorldSnapshot(name: string): { success: boolean; message: string } {
		if (!this.ctx) return { success: false, message: "No context" };
		const result = this.ctx.objects.saveFullSnapshot(name);
		return {
			success: result.success,
			message: result.success ? `Saved snapshot "${name}" with ${result.objectCount} objects` : `Save failed: ${result.error}`
		};
	}
	loadWorldSnapshot(name: string): { success: boolean; message: string } {
		if (!this.ctx) return { success: false, message: "No context" };
		const result = this.ctx.objects.loadFullSnapshot(name);
		return {
			success: result.success,
			message: result.success ? `Loaded snapshot "${name}" (${result.objectCount} objects)${result.unrestoredObjects ? `. Warning: ${result.unrestoredObjects.length} objects could not be restored: ${result.unrestoredObjects.join(", ")}` : ""}` : `Load failed: ${result.error}`
		};
	}
	private serializeManagedObject(obj: ManagedObject) {
		return {
			id: obj.id,
			name: obj.name,
			type: obj.type,
			componentId: obj.componentId,
			position: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
			rotation: { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z, w: 1 },
			velocity: obj.velocity ? { x: obj.velocity.x, y: obj.velocity.y, z: obj.velocity.z } : undefined,
			isGrounded: obj.isGrounded,
			extraData: obj.extraData ?? {},
			pieces: obj.pieces.map((p: Piece) => ({
				asset: { position: { x: p.asset.position.x, y: p.asset.position.y, z: p.asset.position.z } },
				relativePosition: { ...p.relativePosition },
				hitboxes: p.hitboxes.map((h: PieceHitbox) => ({ ...h }))
			}))
		};
	}
	private updateHover(mouse: THREE.Vector2): void {
		if (!this.ctx) return;
		this.raycaster.setFromCamera(mouse, this.ctx.camera);
		const allObjects = this.ctx.objects.getAll();
		const assetObjects: THREE.Object3D[] = [];
		for (const obj of allObjects) {
			for (const piece of obj.pieces) {
				piece.asset.traverse((child) => {
					if (child instanceof THREE.Mesh) assetObjects.push(child);
				});
			}
		}
		const intersects = this.raycaster.intersectObjects(assetObjects, true);
		this.clearHighlight();
		if (intersects.length === 0) {
			this._hoveredObject = null;
			this._hoverDistance = 0;
			this.dispatchHover();
			return;
		}
		const hit = intersects[0];
		const hitMesh = hit.object as THREE.Mesh;
		const managed = allObjects.find((m) => {
			for (const piece of m.pieces) {
				let current: THREE.Object3D | null = piece.asset;
				while (current) {
					if (current === hitMesh || (current instanceof THREE.Mesh && current.geometry === hitMesh.geometry)) {
						return true;
					}
					current = current.parent;
				}
			}
			return false;
		});
		this._hoveredObject = managed ?? null;
		this._hoverDistance = hit.distance;
		if (managed && hitMesh) {
			this.highlightMesh = new THREE.Mesh(hitMesh.geometry, this.highlightMaterial);
			this.highlightMesh.position.copy(hitMesh.position);
			this.highlightMesh.rotation.copy(hitMesh.rotation);
			this.highlightMesh.scale.copy(hitMesh.scale);
			this.highlightGroup.add(this.highlightMesh);
			this.highlightGroup.visible = Logger.getDebugConfig().showHoverOverlay ?? false;
		}
		this.dispatchHover();
	}
	private dispatchHover(): void {
		window.dispatchEvent(
			new CustomEvent("debug:hover", {
				detail: {
					object: this._hoveredObject,
					mouseX: this._mouseClient.x,
					mouseY: this._mouseClient.y,
					distance: this._hoverDistance
				}
			})
		);
	}
	private clearHighlight(): void {
		if (this.highlightMesh && this.highlightGroup) {
			this.highlightGroup.remove(this.highlightMesh);
			this.highlightMesh.geometry.dispose();
			(this.highlightMesh.material as THREE.Material).dispose();
			this.highlightMesh = null;
		}
		this.highlightGroup.visible = false;
	}
	private _handler = (e: KeyboardEvent) => {
		if (e.key === this.toggleKey) {
			e.preventDefault();
			this._ctrl.toggle();
		}
	};
	private _cleanup: (() => void) | null = null;
	private _ctrl: DebugControl = {
		open: () => {},
		close: () => {},
		toggle: () => {},
		setObjectPosition: () => {},
		setObjectRotation: () => {},
		setObjectExtra: () => {},
		setObjectVelocity: () => {},
		pinObject: () => {},
		getObjectById: () => null,
		getAllObjects: () => [],
		removeObject: () => {},
		teleportToObject: () => {},
		teleportObjectToPlayer: () => {},
		cloneObject: () => {},
		freezeObject: () => {},
		addPiece: () => {},
		removePiece: () => {},
		setPieceRelativePosition: () => {},
		setPieceHitbox: () => {},
		setGravityScale: () => {},
		setSubStepping: () => {},
		setGodMode: () => {},
		setNoclip: () => {},
		setInfiniteResources: () => {},
		quickSave: () => ({ success: false, message: "Not initialized" }),
		quickLoad: () => ({ success: false, message: "Not initialized" }),
		getSnapshotList: () => [],
		saveWorldSnapshot: (_name: string) => ({ success: false, message: "Not initialized" }),
		loadWorldSnapshot: (_name: string) => ({ success: false, message: "Not initialized" }),
		getCameraPosition: () => {
			if (this.ctx?.camera) {
				return { x: this.ctx.camera.position.x, y: this.ctx.camera.position.y, z: this.ctx.camera.position.z };
			}
			return { x: 0, y: 0, z: 0 };
		},
		getAvailableObjectTypes: () => ["player", "npc", "map"],
		spawnObject: async (type: string, position: { x: number; y: number; z: number }, componentUrl?: string): Promise<string | null> => {
			return await this.spawnObject(type, position, componentUrl);
		},
		getSelfPlayerId: () => this.getSelfPlayerId()
	};
	dispose(): void {
		this._cleanup?.();
		this._cleanup = null;
		this.clearHighlight();
		if (this.highlightGroup && this.ctx) {
			this.ctx.objects.removeRaw(this.highlightGroup);
		}
		if (this._panelRoot) {
			this._panelRoot.render(null);
			this._panelRoot = null;
		}
		if (this._panelContainer && document.body.contains(this._panelContainer)) {
			this._panelContainer.remove();
			this._panelContainer = null;
		}
		this.registered = false;
		for (const group of [this.hitboxGroup, this.boundsGroup, this.namesGroup, this.centersGroup, this.raycastGroup, this.pathfindGroup, this.skeletonGroup, this.frustumGroup, this.lightVolumeGroup, this.gridOriginGroup, this.lodGroup]) {
			while (group.children.length > 0) {
				const c = group.children[0];
				group.remove(c);
				if (c instanceof THREE.Sprite) {
					(c.material as THREE.SpriteMaterial).map?.dispose();
					(c.material as THREE.Material).dispose();
				} else if (c instanceof THREE.Line) {
					c.geometry.dispose();
					(c.material as THREE.Material).dispose();
				} else if (c instanceof THREE.Mesh || c instanceof THREE.LineSegments) {
					c.geometry.dispose();
					(c.material as THREE.Material).dispose();
				} else if (c instanceof THREE.GridHelper) {
					c.dispose();
				}
			}
		}
		if (this.ctx) {
			this.ctx.objects.removeRaw(this.hitboxGroup);
			this.ctx.objects.removeRaw(this.boundsGroup);
			this.ctx.objects.removeRaw(this.namesGroup);
			this.ctx.objects.removeRaw(this.centersGroup);
			this.ctx.objects.removeRaw(this.raycastGroup);
			this.ctx.objects.removeRaw(this.pathfindGroup);
			this.ctx.objects.removeRaw(this.skeletonGroup);
			this.ctx.objects.removeRaw(this.frustumGroup);
			this.ctx.objects.removeRaw(this.lightVolumeGroup);
			this.ctx.objects.removeRaw(this.gridOriginGroup);
			this.ctx.objects.removeRaw(this.lodGroup);
		}
		this.ctx = null;
	}
}
