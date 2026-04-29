import * as THREE from "three";
import { load as yamlLoad } from "js-yaml";
import { LightFactory } from "./LightFactory";
import type { GLTFLoader } from "./GLTFLoader";
import type { ObjectManager, PhysicsDescriptor, HitboxShape, Piece, PieceHitbox } from "./ObjectManager";
import type { ZoneShape } from "./PhysicsWorld";
import type { ComponentLoader, ComponentDef, HitboxDef, Vec3, TextureDef, TextureAll, TexturePBR, TextureFaces, MeshPrimitive, AnimationDef } from "./ComponentLoader";
export type SkyPreset = { preset: string };
export type SkyEquirect = {
	equirect: string;
};
export type SkyCubemap = {
	cubemap: {
		top: string;
		bottom: string;
		left: string;
		right: string;
		front: string;
		back: string;
	};
};
export type SkyDef = SkyPreset | SkyEquirect | SkyCubemap;
const SKYBOX_PRESETS: Record<string, SkyCubemap["cubemap"]> = {
	day: {
		top: "/game/skybox/sunset/top.png",
		bottom: "/game/skybox/sunset/bottom.png",
		left: "/game/skybox/sunset/left.png",
		right: "/game/skybox/sunset/right.png",
		front: "/game/skybox/sunset/front.png",
		back: "/game/skybox/sunset/back.png"
	}
};
export type FogDef = {
	kind?: "linear" | "exponential";
	color: number;
	near?: number;
	far?: number;
	density?: number;
};
export type ShadowDef = {
	mapSize?: number;
	near?: number;
	far?: number;
	bias?: number;
	normalBias?: number;
	radius?: number;
	camera?: { left?: number; right?: number; top?: number; bottom?: number };
};
export type AmbientLightDef = { type: "ambient"; color?: number; intensity?: number; name?: string };
export type DirectionalLightDef = { type: "directional"; color?: number; intensity?: number; position?: Vec3; target?: Vec3; castShadow?: boolean; shadow?: ShadowDef; name?: string };
export type PointLightDef = { type: "point"; color?: number; intensity?: number; position?: Vec3; distance?: number; decay?: number; castShadow?: boolean; shadow?: ShadowDef; name?: string };
export type SpotLightDef = { type: "spot"; color?: number; intensity?: number; position?: Vec3; target?: Vec3; angle?: number; penumbra?: number; distance?: number; decay?: number; castShadow?: boolean; shadow?: ShadowDef; name?: string };
export type HemisphereLightDef = { type: "hemisphere"; skyColor?: number; groundColor?: number; intensity?: number; name?: string };
export type LightDef = AmbientLightDef | DirectionalLightDef | PointLightDef | SpotLightDef | HemisphereLightDef;
export type MapObjectInstance = {
	id: string;
	component: string;
	type?: string;
	position: Vec3;
	rotation?: Vec3;
	scale?: Vec3;
	extraData?: Record<string, unknown>;
};
export type MapDef = {
	id: string;
	sky?: SkyDef;
	fog?: FogDef;
	lights?: LightDef[];
	objects: MapObjectInstance[];
};
export class MapLoader {
	private readonly scene: THREE.Scene;
	private current: MapDef | null = null;
	constructor(scene: THREE.Scene) {
		this.scene = scene;
	}
	get definition(): MapDef | null {
		return this.current;
	}
	async loadFile(url: string): Promise<MapDef> {
		const res = await fetch(url);
		if (!res.ok) throw new Error(`[MapLoader] Failed to fetch map: ${url} (${res.status})`);
		const text = await res.text();
		const isYaml = /\.ya?ml(\?.*)?$/i.test(url);
		const def = isYaml ? (yamlLoad(text) as MapDef) : (JSON.parse(text) as MapDef);
		this.current = def;
		return def;
	}
	generate(fn: (scene: THREE.Scene) => MapDef): MapDef {
		const def = fn(this.scene);
		this.current = def;
		return def;
	}
	async spawn(def: MapDef, components: ComponentLoader, gltf: GLTFLoader, objects: ObjectManager, onSensorEnter?: (tag: string, objectId: string) => void, onSensorExit?: (tag: string, objectId: string) => void): Promise<() => void> {
		this.current = def;
		const disposables: Array<() => void> = [];
		if (def.fog) {
			applyFog(this.scene, def.fog);
			disposables.push(() => {
				this.scene.fog = null;
			});
		}
		if (def.sky) {
			const disposeSky = await applySky(this.scene, def.sky);
			if (disposeSky) disposables.push(disposeSky);
		}
		const spawnedLights: THREE.Light[] = [];
		for (const lightDef of def.lights ?? []) {
			const light = buildLight(lightDef);
			if (!light) continue;
			this.scene.add(light);
			spawnedLights.push(light);
			if (light instanceof THREE.DirectionalLight || light instanceof THREE.SpotLight) {
				this.scene.add(light.target);
			}
		}
		disposables.push(() => {
			for (const light of spawnedLights) {
				this.scene.remove(light);
				if (light instanceof THREE.DirectionalLight || light instanceof THREE.SpotLight) {
					this.scene.remove(light.target);
				}
			}
		});
		const compMap = new Map<string, ComponentDef>();
		await Promise.all(
			def.objects.map(async (inst) => {
				if (!compMap.has(inst.component)) {
					compMap.set(inst.component, await components.load(inst.component));
				}
			})
		);
		const spawnedIds: string[] = [];
		for (const inst of def.objects) {
			const comp = compMap.get(inst.component);
			if (!comp) continue;
			await spawnObject(inst, comp, gltf, objects, onSensorEnter, onSensorExit);
			spawnedIds.push(inst.id);
		}
		disposables.push(() => {
			for (const id of spawnedIds) objects.remove(id);
		});
		return () => {
			for (const fn of disposables) fn();
		};
	}
}
function applyFog(scene: THREE.Scene, fog: FogDef): void {
	if (fog.kind === "exponential") {
		scene.fog = new THREE.FogExp2(fog.color, fog.density ?? 0.01);
	} else {
		scene.fog = new THREE.Fog(fog.color, fog.near ?? 10, fog.far ?? 200);
	}
}
async function applySky(scene: THREE.Scene, sky: SkyDef): Promise<(() => void) | undefined> {
	if ("equirect" in sky) {
		return new Promise((resolve) => {
			const onLoad = (tex: THREE.Texture) => {
				tex.mapping = THREE.EquirectangularReflectionMapping;
				scene.background = tex;
				resolve(() => {
					scene.background = null;
					tex.dispose();
				});
			};
			if (sky.equirect.endsWith(".hdr")) {
				import("three/examples/jsm/loaders/RGBELoader.js").then(({ RGBELoader }) => {
					new RGBELoader().load(sky.equirect, onLoad);
				});
			} else {
				new THREE.TextureLoader().load(sky.equirect, onLoad);
			}
		});
	}
	const faces = "preset" in sky ? SKYBOX_PRESETS[sky.preset] : sky.cubemap;
	if (!faces) {
		console.warn(`[MapLoader] Unknown sky preset: ${"preset" in sky ? sky.preset : "?"}`);
		return undefined;
	}
	const urls = [faces.front, faces.back, faces.top, faces.bottom, faces.right, faces.left] as [string, string, string, string, string, string];
	const texture = new THREE.CubeTextureLoader().load(urls);
	scene.background = texture;
	return () => {
		scene.background = null;
		texture.dispose();
	};
}
async function spawnObject(inst: MapObjectInstance, comp: ComponentDef, gltf: GLTFLoader, objects: ObjectManager, onSensorEnter?: (tag: string, objectId: string) => void, onSensorExit?: (tag: string, objectId: string) => void): Promise<void> {
	const meshDefs = comp.meshes ?? (comp.mesh ? [comp.mesh] : []);
	if (meshDefs.length === 0) return;
	const pieces: Piece[] = [];
	let gltfModel: { scene: THREE.Group; animations?: THREE.AnimationClip[]; mixer?: THREE.AnimationMixer } | null = null;
	for (const meshDef of meshDefs) {
		let asset: THREE.Object3D;
		if ("gltf" in meshDef) {
			const loaded = await gltf.load(inst.id, meshDef.gltf);
			if (!loaded) continue;
			gltfModel = loaded;
			asset = gltfModel.scene;
			if (meshDef.scale) {
				asset.scale.set(meshDef.scale.x ?? 1, meshDef.scale.y ?? 1, meshDef.scale.z ?? 1);
			}
		} else {
			asset = buildPrimitive(meshDef);
			if (inst.scale) asset.scale.set(inst.scale.x, inst.scale.y, inst.scale.z);
		}
		const meshOffset = (meshDef as any).offset ?? { x: 0, y: 0, z: 0 };
		pieces.push({
			asset,
			relativePosition: { x: meshOffset.x, y: meshOffset.y, z: meshOffset.z },
			hitboxes: []
		});
	}
	const sensorHitboxes = (comp.hitboxes ?? []).filter((h) => h.isSensor);
	const solidHitboxes = (comp.hitboxes ?? []).filter((h) => !h.isSensor);
	for (let i = 0; i < solidHitboxes.length; i++) {
		const hb = solidHitboxes[i];
		const pieceIndex = Math.min(i, pieces.length - 1);
		pieces[pieceIndex].hitboxes.push({
			shape: hitboxToShape(hb),
			relativeOffset: hb.offset ?? { x: 0, y: 0, z: 0 },
			collidesWith: hb.collidesWith,
			isSensor: false,
			tag: hb.tag
		});
	}
	const physDesc: PhysicsDescriptor | undefined =
		solidHitboxes.length > 0 || comp.physics
			? {
					bodyType: comp.physics?.bodyType ?? "static",
					gravityScale: comp.physics?.gravityScale,
					mass: comp.physics?.mass,
					restitution: comp.physics?.restitution,
					friction: comp.physics?.friction
				}
			: undefined;
	const instRotation = inst.rotation;
	const quatRotation = instRotation
		? new THREE.Quaternion().setFromEuler(new THREE.Euler(instRotation.x, instRotation.y, instRotation.z))
		: new THREE.Quaternion();
	const added = objects.add({
		id: inst.id,
		name: inst.id,
		type: (inst.type ?? "map") as any,
		componentId: comp.id,
		pieces,
		physics: physDesc,
		position: inst.position,
		rotation: { x: quatRotation.x, y: quatRotation.y, z: quatRotation.z, w: quatRotation.w },
		extraData: { ...inst.extraData, componentId: comp.id }
	});
	const compAnimations = comp.animations;
	if (gltfModel && gltfModel.animations?.length && compAnimations) {
		for (const [clipName, animDef] of Object.entries(compAnimations)) {
			if (animDef.kind !== "clip") continue;
			const clip = THREE.AnimationClip.findByName(gltfModel.animations, clipName);
			if (!clip) continue;
			const targetMeshIndex = (animDef as any).targetMesh ?? 0;
			let target: THREE.Object3D = pieces[targetMeshIndex]?.asset ?? pieces[0]?.asset;
			if (!target) continue;
			const mixer = new THREE.AnimationMixer(target);
			added.mixers.push(mixer);
			added.animationClips.push(clip);
			if (animDef.autoPlay) {
				const action = mixer.clipAction(clip);
				action.loop = animDef.loop ? THREE.LoopRepeat : THREE.LoopOnce;
				action.play();
			}
		}
	}
	for (const hitbox of sensorHitboxes) {
		const center = {
			x: inst.position.x + (hitbox.offset?.x ?? 0),
			y: inst.position.y + (hitbox.offset?.y ?? 0),
			z: inst.position.z + (hitbox.offset?.z ?? 0)
		};
		const shape = hitboxToZoneShape(hitbox);
		if (!shape) continue;
		const tag = hitbox.tag ?? inst.id;
		objects.addZone({
			id: `sensor_${inst.id}_${tag}`,
			center,
			shape,
			onEnter: (obj) => onSensorEnter?.(tag, obj.id),
			onExit: (obj) => onSensorExit?.(tag, obj.id)
		});
	}
}
function buildPrimitive(mesh: MeshPrimitive): THREE.Mesh {
	const s = mesh.size ?? { x: 1, y: 1, z: 1 };
	let geo: THREE.BufferGeometry;
	switch (mesh.primitive) {
		case "sphere":
			geo = new THREE.SphereGeometry(s.x / 2, 64, 32);
			break;
		case "plane":
			geo = new THREE.PlaneGeometry(s.x, s.z ?? s.x, 64, 64);
			break;
		case "cylinder":
			geo = new THREE.CylinderGeometry(s.x / 2, s.x / 2, s.y, 32, 8);
			break;
		default:
			geo = new THREE.BoxGeometry(s.x, s.y, s.z, 4, 4, 4);
	}
	const m = new THREE.Mesh(geo, buildMaterial(mesh.textures, mesh.color, mesh.displacementScale));
	m.castShadow = true;
	m.receiveShadow = true;
	return m;
}
function buildMaterial(textures: TextureDef | undefined, color?: number, displacementScale?: number): THREE.Material | THREE.Material[] {
	const loader = new THREE.TextureLoader();
	if (!textures) {
		return new THREE.MeshStandardMaterial({ color: color ?? 0xcccccc });
	}
	if (typeof textures === "string") {
		return new THREE.MeshStandardMaterial({ map: loader.load(textures), color: color ?? 0xffffff });
	}
	if ("all" in textures) {
		return new THREE.MeshStandardMaterial({ map: loader.load((textures as TextureAll).all), color: color ?? 0xffffff });
	}
	if ("faces" in textures) {
		const f = (textures as TextureFaces).faces;
		const keys: (keyof typeof f)[] = ["px", "nx", "py", "ny", "pz", "nz"];
		return keys.map((k) => new THREE.MeshStandardMaterial({ color: color ?? 0xffffff, map: f[k] ? loader.load(f[k]!) : undefined }));
	}
	const pbr = textures as TexturePBR;
	return new THREE.MeshStandardMaterial({
		color: color ?? 0xffffff,
		map: pbr.map ? loader.load(pbr.map) : undefined,
		normalMap: pbr.normalMap ? loader.load(pbr.normalMap) : undefined,
		roughnessMap: pbr.roughnessMap ? loader.load(pbr.roughnessMap) : undefined,
		metalnessMap: pbr.metalnessMap ? loader.load(pbr.metalnessMap) : undefined,
		emissiveMap: pbr.emissiveMap ? loader.load(pbr.emissiveMap) : undefined,
		aoMap: pbr.aoMap ? loader.load(pbr.aoMap) : undefined,
		displacementMap: pbr.displacementMap ? loader.load(pbr.displacementMap) : undefined,
		displacementScale: displacementScale ?? 0.1
	});
}
function hitboxToShape(hitbox: HitboxDef): HitboxShape {
	if (hitbox.shape === "sphere") {
		return { kind: "sphere", radius: hitbox.radius };
	}
	if (hitbox.shape === "capsule") {
		return { kind: "capsule", radius: hitbox.radius, height: hitbox.height };
	}
	const size = hitbox.size;
	if (!size || size === "auto" || size === "full") {
		return { kind: "auto" };
	}
	return { kind: "box", halfExtents: { x: size.x / 2, y: size.y / 2, z: size.z / 2 } };
}
function hitboxToZoneShape(hitbox: HitboxDef): ZoneShape | null {
	if (hitbox.shape === "sphere") {
		return { kind: "sphere", radius: hitbox.radius ?? 1 };
	}
	if (hitbox.shape === "capsule") {
		return { kind: "cylinder", radius: hitbox.radius ?? 0.5, height: hitbox.height ?? 2 };
	}
	const size = hitbox.size;
	if (!size || size === "auto" || size === "full") {
		return null;
	}
	return { kind: "box", halfExtents: { x: size.x / 2, y: size.y / 2, z: size.z / 2 } };
}
function buildLight(def: LightDef): THREE.Light | null {
	switch (def.type) {
		case "ambient":
			return LightFactory.createAmbientLight({ color: def.color, intensity: def.intensity, name: def.name });
		case "directional": {
			const sh = def.shadow;
			return LightFactory.createDirectionalLight({
				color: def.color,
				intensity: def.intensity,
				position: def.position,
				target: def.target,
				castShadow: def.castShadow,
				name: def.name,
				shadow: sh
					? {
							mapSize: sh.mapSize ? { width: sh.mapSize, height: sh.mapSize } : undefined,
							camera: sh.camera ? { ...sh.camera, near: sh.near, far: sh.far } : undefined,
							bias: sh.bias,
							normalBias: sh.normalBias,
							radius: sh.radius
						}
					: undefined
			});
		}
		case "point":
			return LightFactory.createPointLight({
				color: def.color,
				intensity: def.intensity,
				position: def.position,
				distance: def.distance,
				decay: def.decay,
				castShadow: def.castShadow,
				name: def.name
			});
		case "spot":
			return LightFactory.createSpotLight({
				color: def.color,
				intensity: def.intensity,
				position: def.position,
				target: def.target,
				angle: def.angle,
				penumbra: def.penumbra,
				distance: def.distance,
				decay: def.decay,
				castShadow: def.castShadow,
				name: def.name
			});
		case "hemisphere":
			return LightFactory.createHemisphereLight({
				skyColor: def.skyColor,
				groundColor: def.groundColor,
				intensity: def.intensity,
				name: def.name
			});
		default:
			return null;
	}
}
