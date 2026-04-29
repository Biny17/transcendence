import * as THREE from "three";
import { GLTFLoader as ThreeGLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
export type LoadedModel = {
	scene: THREE.Group;
	animations: THREE.AnimationClip[];
	mixer?: THREE.AnimationMixer;
};
const BODY_ORIGINAL = { r: 0xff, g: 0x00, b: 0x00 };
const FACE_ORIGINAL = { r: 0x00, g: 0x80, b: 0xff };
const BODY_NEW = { r: 0xc0, g: 0x00, b: 0xc0 };
const FACE_NEW = { r: 0xff, g: 0xff, b: 0xff };
function applyTextureWithColorSwap(group: THREE.Group, textureUrl: string): Promise<void> {
	return new Promise((resolve) => {
		const loader = new THREE.TextureLoader();
		loader.load(textureUrl, (texture) => {
			texture.colorSpace = THREE.SRGBColorSpace;
			const img = texture.image;
			const canvas = document.createElement("canvas");
			canvas.width = img.width;
			canvas.height = img.height;
			const ctx = canvas.getContext("2d")!;
			ctx.fillStyle = "#ffffff";
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.drawImage(img, 0, 0);
			const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			const data = imageData.data;
			for (let i = 0; i < data.length; i += 4) {
				const r = data[i];
				const g = data[i + 1];
				const b = data[i + 2];
				if (r === BODY_ORIGINAL.r && g === BODY_ORIGINAL.g && b === BODY_ORIGINAL.b) {
					data[i] = BODY_NEW.r;
					data[i + 1] = BODY_NEW.g;
					data[i + 2] = BODY_NEW.b;
				} else if (r === FACE_ORIGINAL.r && g === FACE_ORIGINAL.g && b === FACE_ORIGINAL.b) {
					data[i] = FACE_NEW.r;
					data[i + 1] = FACE_NEW.g;
					data[i + 2] = FACE_NEW.b;
				}
			}
			ctx.putImageData(imageData, 0, 0);
			const newTexture = new THREE.CanvasTexture(canvas);
			newTexture.colorSpace = THREE.SRGBColorSpace;
			group.traverse((child) => {
				if (child instanceof THREE.SkinnedMesh && child.material) {
					const original = child.material as THREE.MeshStandardMaterial;
					child.material = new THREE.MeshStandardMaterial({
						map: newTexture,
						roughness: original.roughness ?? 0.9,
						metalness: original.metalness ?? 0,
						side: THREE.DoubleSide
					});
				} else if (child instanceof THREE.Mesh && child.material) {
					const mat = child.material as THREE.MeshStandardMaterial;
					mat.map = newTexture;
					mat.colorSpace = THREE.SRGBColorSpace;
					mat.needsUpdate = true;
				}
			});
			resolve();
		});
	});
}
export class GLTFLoader {
	private readonly loader = new ThreeGLTFLoader();
	private readonly cache = new Map<string, LoadedModel>();
	async load(id: string, url: string, textureUrl?: string): Promise<LoadedModel> {
		if (this.cache.has(id)) return this.cache.get(id)!;
		const gltf: GLTF = await new Promise((resolve, reject) => {
			this.loader.load(url, resolve, undefined, reject);
		});
		const model: LoadedModel = {
			scene: gltf.scene,
			animations: gltf.animations
		};
		if (textureUrl) {
			await applyTextureWithColorSwap(model.scene, textureUrl);
		}
		if (gltf.animations.length > 0) {
			model.mixer = new THREE.AnimationMixer(model.scene);
		}
		this.cache.set(id, model);
		return model;
	}
	get(id: string): LoadedModel | undefined {
		return this.cache.get(id);
	}
	dispose(): void {
		this.cache.clear();
	}
}
