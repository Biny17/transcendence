import * as THREE from "three";
import type { PhysicsWorld, Zone } from "./PhysicsWorld";
import type { LoadWorldPlayer } from "shared/state";
import type { LoadedModel } from "./GLTFLoader";
export type Vec3 = { x: number; y: number; z: number };
export enum OBJECT_TYPE {
	PLAYER = "player",
	NPC = "npc",
	MAP = "map"
}
export type ObjectType = OBJECT_TYPE | string;
export type HitboxShape =
	| { kind: "box"; halfExtents?: Vec3 }
	| { kind: "sphere"; radius?: number }
	| { kind: "capsule"; radius?: number; height?: number }
	| { kind: "auto" };
export type PieceHitbox = {
	shape: HitboxShape;
	relativeOffset: Vec3;
	collidesWith?: string[];
	isSensor?: boolean;
	tag?: string;
};
export type Piece = {
	asset: THREE.Object3D | THREE.Group;
	relativePosition: Vec3;
	hitboxes: PieceHitbox[];
};
export type PhysicsDescriptor = {
	bodyType?: "dynamic" | "static" | "kinematic";
	gravityScale?: number;
	mass?: number;
	restitution?: number;
	friction?: number;
	lockRotations?: boolean;
};
export type PlayerExtraData = {
	serverData: LoadWorldPlayer;
	life: number;
	spawnpoint: Vec3;
	dieCounter: number;
	score: number;
	killCounter: number;
	team?: string;
	isSpectator: boolean;
	[key: string]: unknown;
};
export type NPCExtraData = {
	behavior?: string;
	aggression?: number;
	[key: string]: unknown;
};
export type MapExtraData = {
	[key: string]: unknown;
};
export type ExtraDataByType = {
	[OBJECT_TYPE.PLAYER]: PlayerExtraData;
	[OBJECT_TYPE.NPC]: NPCExtraData;
	[OBJECT_TYPE.MAP]: MapExtraData;
	[key: string]: Record<string, unknown>;
};
export type ManagedObject<T extends ObjectType = ObjectType> = {
	id: string;
	name?: string;
	type: T;
	componentId: string;
	pieces: Piece[];
	cosmetics: THREE.Object3D[];
	position: THREE.Vector3;
	rotation: THREE.Quaternion;
	velocity?: THREE.Vector3;
	isGrounded?: boolean;
	physics?: PhysicsDescriptor;
	activeZones: string[];
	extraData: T extends keyof ExtraDataByType ? ExtraDataByType[T] : Record<string, unknown>;
	mixers: THREE.AnimationMixer[];
	animationClips: THREE.AnimationClip[];
};
export type Quat = { x: number; y: number; z: number; w: number };
export type ManagedObjectInput<T extends ObjectType = ObjectType> = {
	id?: string;
	type: T;
	name?: string;
	componentId?: string;
	pieces?: Piece[];
	cosmetics?: THREE.Object3D[];
	physics?: PhysicsDescriptor;
	position?: Vec3;
	rotation?: Quat;
	extraData?: Partial<ExtraDataByType[T]> | Record<string, unknown>;
};
export type SimpleObjectInput<T extends ObjectType = ObjectType> = {
	type: T;
	name?: string;
	asset: THREE.Object3D | THREE.Group;
	relativePosition?: Vec3;
	relativeRotation?: Quat;
	hitbox?: HitboxShape;
	hitboxOffset?: Vec3;
	physics?: PhysicsDescriptor;
	position?: Vec3;
	rotation?: Quat;
	extraData?: Partial<ExtraDataByType[T]> | Record<string, unknown>;
};
export type AssetDefinition =
	| { type: 'primitive'; kind: 'box'; size: Vec3; color?: number }
	| { type: 'primitive'; kind: 'sphere'; radius: number; color?: number }
	| { type: 'primitive'; kind: 'plane' | 'cylinder'; size?: Vec3; color?: number }
	| { type: 'gltf'; path: string; scale?: Vec3; offset?: Vec3 }
	| { type: 'unknown' };
export type SerializedPiece = {
	relativePosition: Vec3;
	hitboxes: PieceHitbox[];
	assetWorldPosition?: Vec3;
	assetWorldRotation?: Vec3;
	assetDefinition: AssetDefinition | null;
};
export type SerializedManagedObject = {
	id: string;
	name?: string;
	type: ObjectType;
	componentId?: string;
	position: Vec3;
	rotation: Quat;
	velocity?: Vec3;
	isGrounded?: boolean;
	physics?: PhysicsDescriptor;
	extraData: Record<string, unknown>;
	activeZones: string[];
	pieces: SerializedPiece[];
	canRecreate: boolean;
};
export type WorldSnapshot = {
	version: number;
	objects: SerializedManagedObject[];
	timestamp: number;
};
export type SnapshotResult = {
	success: boolean;
	objectCount?: number;
	error?: string;
	unrestoredObjects?: string[];
};
export class ObjectManager {
	private readonly scene: THREE.Scene;
	private readonly registry = new Map<string, ManagedObject>();
	private physicsWorld: PhysicsWorld | null = null;
	constructor(scene: THREE.Scene) {
		this.scene = scene;
	}
	attachPhysics(pw: PhysicsWorld): void {
		this.physicsWorld = pw;
	}
	setDebugEnabled(enabled: boolean): void {
		this.physicsWorld?.setDebugEnabled(enabled);
	}
	addRaw(obj: THREE.Object3D): void {
		this.scene.add(obj);
	}
	removeRaw(obj: THREE.Object3D): void {
		this.scene.remove(obj);
	}
	private generateId(): string {
		return `obj_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
	}
	private getDefaultExtraData(type: ObjectType): Record<string, unknown> {
		switch (type) {
			case OBJECT_TYPE.PLAYER:
				return {
					life: 100,
					spawnpoint: { x: 0, y: 0, z: 0 },
					dieCounter: 0,
					score: 0,
					killCounter: 0
				};
			case OBJECT_TYPE.NPC:
				return {
					behavior: "idle",
					aggression: 0
				};
			case OBJECT_TYPE.MAP:
				return {
					difficulty: "medium"
				};
			default:
				return {};
		}
	}
	add<T extends ObjectType>(input: ManagedObjectInput<T>): ManagedObject<T> {
		const id = input.id ?? this.generateId();
		const defaults = this.getDefaultExtraData(input.type);
		const managed: ManagedObject<T> = {
			id,
			name: input.name,
			type: input.type,
			componentId: input.componentId ?? input.type,
			pieces: input.pieces ?? [],
			cosmetics: input.cosmetics ?? [],
			position: input.position ? new THREE.Vector3(input.position.x, input.position.y, input.position.z) : new THREE.Vector3(),
			rotation: input.rotation ? new THREE.Quaternion(input.rotation.x, input.rotation.y, input.rotation.z, input.rotation.w) : new THREE.Quaternion(),
			physics: input.physics,
			activeZones: [],
			extraData: { ...defaults, ...input.extraData } as any,
			mixers: [],
			animationClips: []
		};
		for (const piece of managed.pieces) {
			piece.asset.position.set(
				managed.position.x + piece.relativePosition.x,
				managed.position.y + piece.relativePosition.y,
				managed.position.z + piece.relativePosition.z
			);
			piece.asset.quaternion.copy(managed.rotation);
			this.scene.add(piece.asset);
		}
		for (const cosmetic of managed.cosmetics) {
			cosmetic.position.set(managed.position.x, managed.position.y, managed.position.z);
			this.scene.add(cosmetic);
		}
		if (this.physicsWorld) {
			for (let i = 0; i < managed.pieces.length; i++) {
				const piece = managed.pieces[i];
const solidHitboxes = piece.hitboxes.filter(h => !h.isSensor).map(h => this.resolveAutoHitbox(piece.asset, h));
				if (solidHitboxes.length > 0 || managed.physics) {
					this.physicsWorld.registerPiece(
						`${id}_${i}`,
						managed.physics ?? {},
						solidHitboxes,
						(pos, rot) => {
							managed.position.set(pos.x, pos.y, pos.z);
							if (rot) {
								managed.rotation.set(rot.x, rot.y, rot.z, rot.w);
							}
						},
						managed.type as string
					);
				}
			}
		}
		this.registry.set(id, managed);
		return managed;
	}
	addSimple<T extends ObjectType>(input: SimpleObjectInput<T>): ManagedObject<T> {
		const relPos = input.relativePosition ?? { x: 0, y: 0, z: 0 };
		const relRot = input.relativeRotation ?? { x: 0, y: 0, z: 0, w: 1 };
		const worldPos = input.position ?? { x: 0, y: 0, z: 0 };
		const worldRot = input.rotation ?? { x: 0, y: 0, z: 0, w: 1 };
		const piece: Piece = {
			asset: input.asset,
			relativePosition: relPos,
			hitboxes: []
		};
		if (input.hitbox || input.physics) {
			piece.hitboxes.push({
				shape: input.hitbox ?? { kind: 'auto' },
				relativeOffset: input.hitboxOffset ?? { x: 0, y: 0, z: 0 }
			});
		}
		const physics: PhysicsDescriptor = {
			...(input.type === 'map' && !input.physics ? { bodyType: 'static' as const } : {}),
			...input.physics
		};
		return this.add({
			type: input.type,
			name: input.name,
			pieces: [piece],
			physics: Object.keys(physics).length > 0 ? physics : undefined,
			position: worldPos,
			rotation: worldRot,
			extraData: input.extraData
		});
	}
		addPiece(objectId: string, piece: { asset: THREE.Object3D | THREE.Group | LoadedModel; relativePosition: Vec3; hitboxes: PieceHitbox[] }, physics?: PhysicsDescriptor, noSync = false): void {
		const managed = this.registry.get(objectId);
		if (!managed) return;
		const pieceIndex = managed.pieces.length;
		const isLoadedModel = (asset: unknown): asset is LoadedModel => {
			return typeof asset === 'object' && asset !== null && 'scene' in asset && Array.isArray((asset as LoadedModel).animations);
		};
		let sceneAsset: THREE.Object3D | THREE.Group;
		if (isLoadedModel(piece.asset)) {
			sceneAsset = piece.asset.scene;
			if (piece.asset.animations.length > 0) {
				const mixer = new THREE.AnimationMixer(sceneAsset);
				managed.mixers.push(mixer);
				managed.animationClips.push(...piece.asset.animations);
			}
		} else {
			sceneAsset = piece.asset;
		}
		managed.pieces.push({ asset: sceneAsset, relativePosition: piece.relativePosition, hitboxes: piece.hitboxes });
		sceneAsset.position.set(
			managed.position.x + piece.relativePosition.x,
			managed.position.y + piece.relativePosition.y,
			managed.position.z + piece.relativePosition.z
		);
		sceneAsset.quaternion.copy(managed.rotation);
		this.scene.add(sceneAsset);
		const solidHitboxes = piece.hitboxes.filter(h => !h.isSensor).map(h => this.resolveAutoHitbox(sceneAsset, h));
		if (this.physicsWorld && (solidHitboxes.length > 0 || physics)) {
			this.physicsWorld.registerPiece(
				`${objectId}_${pieceIndex}`,
				physics ?? managed.physics ?? {},
				solidHitboxes,
				noSync ? undefined : ((pos, rot) => {
					managed.position.set(pos.x, pos.y, pos.z);
					if (rot) {
						managed.rotation.set(rot.x, rot.y, rot.z, rot.w);
					}
				}),
				managed.type as string
			);
		}
	}
	addHitbox(objectId: string, pieceIndex: number, hitbox: PieceHitbox, physics?: PhysicsDescriptor): void {
		const managed = this.registry.get(objectId);
		if (!managed) return;
		const piece = managed.pieces[pieceIndex];
		if (!piece) return;
		piece.hitboxes.push(hitbox);
		const solidHitboxes = piece.hitboxes.filter(h => !h.isSensor).map(h => this.resolveAutoHitbox(piece.asset, h));
		if (this.physicsWorld && solidHitboxes.length > 0) {
			this.physicsWorld.registerPiece(
				`${objectId}_${pieceIndex}`,
				physics ?? managed.physics ?? {},
				solidHitboxes,
				(pos, rot) => {
					managed.position.set(pos.x, pos.y, pos.z);
					if (rot) {
						managed.rotation.set(rot.x, rot.y, rot.z, rot.w);
					}
				},
				managed.type as string
			);
		}
	}
	setPosition(id: string, pos: Vec3): void {
		const obj = this.registry.get(id);
		if (!obj) return;
		obj.position.set(pos.x, pos.y, pos.z);
		for (const piece of obj.pieces) {
			piece.asset.position.set(
				pos.x + piece.relativePosition.x,
				pos.y + piece.relativePosition.y,
				pos.z + piece.relativePosition.z
			);
		}
		for (const cosmetic of obj.cosmetics) {
			cosmetic.position.set(pos.x, pos.y, pos.z);
		}
		this.physicsWorld?.setPosition(id, pos);
	}
	getPosition(id: string): Vec3 | undefined {
		return this.registry.get(id)?.position;
	}
	setRotation(id: string, rot: Quat): void {
		const obj = this.registry.get(id);
		if (!obj) return;
		obj.rotation.set(rot.x, rot.y, rot.z, rot.w);
		for (const piece of obj.pieces) {
			piece.asset.quaternion.set(rot.x, rot.y, rot.z, rot.w);
		}
		this.physicsWorld?.setRotation(id, rot);
	}
	setVelocity(id: string, v: Vec3): void {
		this.physicsWorld?.setVelocity(id, v);
	}
	getVelocity(id: string): Vec3 {
		return this.physicsWorld?.getVelocity(id) ?? { x: 0, y: 0, z: 0 };
	}
	applyImpulse(id: string, impulse: Vec3): void {
		this.physicsWorld?.applyImpulse(id, impulse);
	}
	getMass(id: string): number {
		return this.physicsWorld?.getMass(id) ?? 1;
	}
	setGravityScale(id: string, scale: number): void {
		this.physicsWorld?.setGravityScale(id, scale);
	}
	isGrounded(id: string, threshold = 0.15): boolean {
		return this.physicsWorld?.isGrounded(id, threshold) ?? false;
	}
	isColliding(idA: string, idB: string): boolean {
		return this.physicsWorld?.isColliding(idA, idB) ?? false;
	}
	addZone(zone: Zone): void {
		this.physicsWorld?.addZone(zone);
	}
	removeZone(zoneId: string): void {
		this.physicsWorld?.removeZone(zoneId);
	}
	isInZone(id: string, zoneId: string): boolean {
		return this.physicsWorld?.isInZone(id, zoneId) ?? false;
	}
	getZonesForObject(id: string): Zone[] {
		return this.physicsWorld?.getZonesForObject(id) ?? [];
	}
	getObjectsInZone(zoneId: string): string[] {
		return this.physicsWorld?.getObjectsInZone(zoneId) ?? [];
	}
	playAnimation(
		id: string,
		clipName: string,
		options: { loop?: THREE.AnimationActionLoopStyles; fadeIn?: number } = {}
	): THREE.AnimationAction | null {
		const obj = this.registry.get(id);
		if (!obj) return null;
		for (const mixer of obj.mixers) {
			const clip = THREE.AnimationClip.findByName(obj.animationClips, clipName);
			if (!clip) continue;
			const action = mixer.clipAction(clip);
			action.loop = options.loop ?? THREE.LoopRepeat;
			if (options.fadeIn) action.fadeIn(options.fadeIn);
			action.play();
			return action;
		}
		return null;
	}
	stopAnimation(id: string, clipName: string, options: { fadeOut?: number } = {}): void {
		const obj = this.registry.get(id);
		if (!obj) return;
		for (const mixer of obj.mixers) {
			const clip = THREE.AnimationClip.findByName(obj.animationClips, clipName);
			if (!clip) continue;
			const action = mixer.existingAction(clip);
			if (!action) continue;
			if (options.fadeOut) action.fadeOut(options.fadeOut);
			else action.stop();
		}
	}
	crossFadeAnimation(
		id: string,
		toClipName: string,
		duration: number,
		options: { loop?: THREE.AnimationActionLoopStyles } = {}
	): THREE.AnimationAction | null {
		const obj = this.registry.get(id);
		if (!obj) return null;
		for (const mixer of obj.mixers) {
			const clip = THREE.AnimationClip.findByName(obj.animationClips, toClipName);
			if (!clip) continue;
			for (const animClip of obj.animationClips) {
				if (animClip === clip) continue;
				const action = mixer.existingAction(animClip);
				if (action) {
					action.fadeOut(duration);
				}
			}
			const next = mixer.clipAction(clip);
			next.loop = options.loop ?? THREE.LoopRepeat;
			next.reset().play();
			return next;
		}
		return null;
	}
	update(delta: number): void {
		for (const obj of this.registry.values()) {
			for (const mixer of obj.mixers) {
				mixer.update(delta);
			}
			for (const piece of obj.pieces) {
				piece.asset.position.set(
					obj.position.x + piece.relativePosition.x,
					obj.position.y + piece.relativePosition.y,
					obj.position.z + piece.relativePosition.z
				);
				piece.asset.quaternion.copy(obj.rotation);
			}
		}
	}
	private hasPhysicsEntry(id: string): boolean {
		if (!this.physicsWorld) return false;
		for (const pieceId of this.physicsWorld['entries'].keys()) {
			if (pieceId.startsWith(id + '_') || pieceId === id) return true;
		}
		return false;
	}
	updatePhysics(delta: number): void {
		for (const obj of this.registry.values()) {
			if (obj.physics?.bodyType === 'static' || obj.physics?.bodyType === 'kinematic') {
				if (this.hasPhysicsEntry(obj.id)) {
					this.physicsWorld?.setPosition(obj.id, { x: obj.position.x, y: obj.position.y, z: obj.position.z });
				}
			}
		}
		this.physicsWorld?.step(delta, this.getAll());
	}
	remove(id: string): void {
		const obj = this.registry.get(id);
		if (!obj) return;
		for (const piece of obj.pieces) this.scene.remove(piece.asset);
		for (const cosmetic of obj.cosmetics) this.scene.remove(cosmetic);
		this.physicsWorld?.unregister(id);
		this.registry.delete(id);
	}
	removeByName(name: string): void {
		const obj = this.get(name);
		if (obj) this.remove(obj.id);
	}
	get<T extends ObjectType = ObjectType>(name: string, type?: T): ManagedObject<T> | undefined {
		for (const obj of this.registry.values()) {
			if (obj.name === name && (type === undefined || obj.type === type)) {
				return obj as ManagedObject<T>;
			}
		}
		return undefined;
	}
	getById<T extends ObjectType = ObjectType>(id: string, type?: T): ManagedObject<T> | undefined {
		const obj = this.registry.get(id);
		if (!obj) return undefined;
		if (type !== undefined && obj.type !== type) return undefined;
		return obj as ManagedObject<T>;
	}
	getByType<T extends ObjectType = ObjectType>(type: T): ManagedObject<T>[] {
		const result: ManagedObject<T>[] = [];
		for (const obj of this.registry.values()) {
			if (obj.type === type) result.push(obj as ManagedObject<T>);
		}
		return result;
	}
	getAll(): ManagedObject[] {
		return [...this.registry.values()];
	}
	has(id: string): boolean {
		return this.registry.has(id);
	}
	setExtra(id: string, key: string, value: unknown): void {
		const obj = this.registry.get(id);
		if (!obj) return;
		obj.extraData = { ...obj.extraData, [key]: value };
	}
	getExtra<T = unknown>(id: string, key: string): T | undefined {
		return this.registry.get(id)?.extraData?.[key] as T | undefined;
	}
	private resolveAutoHitbox(asset: THREE.Object3D | THREE.Group, hitbox: PieceHitbox): PieceHitbox {
		if (hitbox.shape.kind !== 'auto') return hitbox;
		const savedPosition = asset.position.clone();
		const savedRotation = asset.rotation.clone();
		const savedMatrixAutoUpdate = asset.matrixAutoUpdate;
		asset.position.set(0, 0, 0);
		asset.rotation.set(0, 0, 0);
		asset.updateMatrixWorld(true);
		const box = new THREE.Box3().setFromObject(asset);
		const size = new THREE.Vector3();
		box.getSize(size);
		asset.position.copy(savedPosition);
		asset.rotation.copy(savedRotation);
		asset.matrixAutoUpdate = savedMatrixAutoUpdate;
		if (savedMatrixAutoUpdate) asset.updateMatrixWorld(true);
		return {
			...hitbox,
			shape: { kind: 'box', halfExtents: { x: size.x / 2, y: size.y / 2, z: size.z / 2 } }
		};
	}
	saveFullSnapshot(name: string): SnapshotResult {
		const state: WorldSnapshot = {
			version: 1,
			objects: Array.from(this.registry.values()).map(obj => this.serializeFullObject(obj)),
			timestamp: Date.now(),
		}
		localStorage.setItem(`debugWorldSnapshot_${name}`, JSON.stringify(state))
		return { success: true, objectCount: state.objects.length }
	}
	loadFullSnapshot(name: string): SnapshotResult {
		const saved = localStorage.getItem(`debugWorldSnapshot_${name}`)
		if (!saved) return { success: false, error: 'Snapshot not found' }
		try {
			const state = JSON.parse(saved) as WorldSnapshot
			if (!state.objects) return { success: false, error: 'Invalid snapshot format' }
			const unrestored: string[] = []
			const existingIds = new Set(this.registry.keys())
			const snapshotIds = new Set(state.objects.map(o => o.id))
			for (const id of existingIds) {
				if (!snapshotIds.has(id)) this.remove(id)
			}
			for (const objState of state.objects) {
				const existing = this.registry.get(objState.id)
				if (existing) {
					this.applyFullObjectState(existing, objState)
				} else {
					if (objState.canRecreate && objState.componentId) {
						const recreated = this.recreateFromSnapshot(objState)
						if (recreated) {
							this.registry.set(recreated.id, recreated)
						} else {
							unrestored.push(objState.id)
						}
					} else {
						unrestored.push(objState.id)
					}
				}
			}
			return {
				success: true,
				objectCount: state.objects.length,
				unrestoredObjects: unrestored.length > 0 ? unrestored : undefined
			}
		} catch (e) {
			return { success: false, error: String(e) }
		}
	}
	private serializeFullObject(obj: ManagedObject): SerializedManagedObject {
		const pieces = obj.pieces.map((p, pieceIdx) => {
			const worldPos = new THREE.Vector3()
			p.asset.getWorldPosition(worldPos)
			const worldRot = new THREE.Euler()
			p.asset.getWorldQuaternion(new THREE.Quaternion()).setFromEuler(worldRot)
			return {
				relativePosition: { ...p.relativePosition },
				hitboxes: p.hitboxes.map(h => ({ ...h })),
				assetWorldPosition: { x: worldPos.x, y: worldPos.y, z: worldPos.z },
				assetWorldRotation: { x: worldRot.x, y: worldRot.y, z: worldRot.z },
				assetDefinition: this.extractAssetDefinition(p.asset, obj.componentId, pieceIdx),
			}
		})
		return {
			id: obj.id,
			name: obj.name,
			type: obj.type,
			componentId: obj.componentId,
			position: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
			rotation: { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z, w: obj.rotation.w },
			velocity: obj.velocity ? { x: obj.velocity.x, y: obj.velocity.y, z: obj.velocity.z } : undefined,
			isGrounded: obj.isGrounded,
			physics: obj.physics ? { ...obj.physics } : undefined,
			extraData: { ...obj.extraData },
			activeZones: [...obj.activeZones],
			pieces,
			canRecreate: true,
		}
	}
	private extractAssetDefinition(asset: THREE.Object3D | THREE.Group, componentId: string, pieceIdx: number): AssetDefinition | null {
		if (asset instanceof THREE.Mesh) {
			const geo = asset.geometry
			const mat = asset.material
			if (geo instanceof THREE.BoxGeometry) {
				const params = geo.parameters
				return {
					type: 'primitive',
					kind: 'box',
					size: { x: params.width ?? 1, y: params.height ?? 1, z: params.depth ?? 1 },
					color: mat instanceof THREE.MeshBasicMaterial ? mat.color.getHex() : 0xff0000,
				}
			}
			if (geo instanceof THREE.SphereGeometry) {
				return {
					type: 'primitive',
					kind: 'sphere',
					radius: geo.parameters.radius ?? 0.5,
					color: mat instanceof THREE.MeshBasicMaterial ? mat.color.getHex() : 0xff0000,
				}
			}
		}
		return null
	}
	private applyFullObjectState(obj: ManagedObject, state: SerializedManagedObject): void {
		obj.name = state.name
		obj.position.set(state.position.x, state.position.y, state.position.z)
		obj.rotation.set(state.rotation.x, state.rotation.y, state.rotation.z, state.rotation.w)
		if (state.velocity && obj.velocity) {
			obj.velocity.set(state.velocity.x, state.velocity.y, state.velocity.z)
		}
		if (state.physics) {
			obj.physics = { ...state.physics }
		}
		obj.extraData = { ...state.extraData }
		obj.activeZones = [...state.activeZones]
		for (let i = 0; i < obj.pieces.length && i < state.pieces.length; i++) {
			const pieceState = state.pieces[i]
			const piece = obj.pieces[i]
			if (pieceState.assetWorldPosition && piece?.asset instanceof THREE.Mesh) {
				piece.asset.position.set(
					state.position.x + pieceState.relativePosition.x,
					state.position.y + pieceState.relativePosition.y,
					state.position.z + pieceState.relativePosition.z
				)
				piece.asset.quaternion.set(state.rotation.x, state.rotation.y, state.rotation.z, state.rotation.w)
			}
		}
		this.physicsWorld?.setPosition(obj.id, state.position)
		this.physicsWorld?.setRotation(obj.id, state.rotation)
		if (state.velocity) {
			this.physicsWorld?.setVelocity(obj.id, state.velocity)
		}
	}
	private recreateFromSnapshot(state: SerializedManagedObject): ManagedObject | null {
		try {
			const pieces: Piece[] = state.pieces.map((p, idx) => {
				let asset: THREE.Object3D | THREE.Group
				if (p.assetDefinition) {
					const def = p.assetDefinition
					if (def.type === 'primitive') {
						let geo: THREE.BufferGeometry
						if (def.kind === 'box') {
							geo = new THREE.BoxGeometry(def.size.x, def.size.y, def.size.z)
						} else if (def.kind === 'sphere') {
							geo = new THREE.SphereGeometry(def.radius, 16, 12)
						} else {
							geo = new THREE.BoxGeometry(1, 1, 1)
						}
						const mat = new THREE.MeshBasicMaterial({ color: def.color ?? 0xff0000 })
						const mesh = new THREE.Mesh(geo, mat)
						mesh.position.set(
							state.position.x + p.relativePosition.x,
							state.position.y + p.relativePosition.y,
							state.position.z + p.relativePosition.z
						)
						asset = mesh
					} else {
						asset = new THREE.Group()
					}
				} else {
					asset = new THREE.Group()
				}
				return {
					asset,
					relativePosition: p.relativePosition,
					hitboxes: p.hitboxes.map(h => ({ ...h })),
				}
			})
			const managed: ManagedObject = {
				id: state.id,
				name: state.name,
				type: state.type as ObjectType,
				componentId: state.componentId ?? state.type,
				pieces,
				cosmetics: [],
				position: new THREE.Vector3(state.position.x, state.position.y, state.position.z),
				rotation: new THREE.Quaternion(state.rotation.x, state.rotation.y, state.rotation.z, state.rotation.w),
				physics: state.physics,
				activeZones: [...state.activeZones],
				extraData: { ...state.extraData },
				mixers: [],
				animationClips: [],
			}
			for (const piece of managed.pieces) {
				this.scene.add(piece.asset)
			}
			if (state.velocity && managed.velocity) {
				managed.velocity.set(state.velocity.x, state.velocity.y, state.velocity.z)
			}
			return managed
		} catch (e) {
			console.warn(`[ObjectManager] Failed to recreate object ${state.id}:`, e)
			return null
		}
	}
	dispose(): void {
		for (const obj of this.registry.values()) {
			for (const piece of obj.pieces) this.scene.remove(piece.asset);
			for (const cosmetic of obj.cosmetics) this.scene.remove(cosmetic);
		}
		this.registry.clear();
		this.physicsWorld?.dispose();
	}
}
