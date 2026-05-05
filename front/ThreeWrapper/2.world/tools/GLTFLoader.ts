import * as THREE from "three";
import { GLTFLoader as ThreeGLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
export type LoadedModel = {
	scene: THREE.Group;
	animations: THREE.AnimationClip[];
	mixer?: THREE.AnimationMixer;
};
export type ColorSwapConfig = {
	bodyColor?: string;
	faceColor?: string;
	eyeColor?: string;
};
const BODY_ORIGINAL = { r: 0xff, g: 0x00, b: 0x00 };
const FACE_ORIGINAL = { r: 0x00, g: 0x80, b: 0xff };
const EYE_ORIGINAL = { r: 0x00, g: 0x00, b: 0x00 };
function hexToRgb(hex: string): { r: number; g: number; b: number } {
	const clean = hex.replace("#", "");
	const num = parseInt(clean, 16);
	return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}
function applyTextureWithColorSwap(group: THREE.Group, textureUrl: string, config?: ColorSwapConfig): Promise<void> {
	const bodyNew = config?.bodyColor ? hexToRgb(config.bodyColor) : { r: 0xc0, g: 0x00, b: 0xc0 };
	const faceNew = config?.faceColor ? hexToRgb(config.faceColor) : { r: 0xff, g: 0xff, b: 0xff };
	const eyeNew = config?.eyeColor ? hexToRgb(config.eyeColor) : { r: 0xff, g: 0xff, b: 0xff };
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
					data[i] = bodyNew.r;
					data[i + 1] = bodyNew.g;
					data[i + 2] = bodyNew.b;
				} else if (r === FACE_ORIGINAL.r && g === FACE_ORIGINAL.g && b === FACE_ORIGINAL.b) {
					data[i] = faceNew.r;
					data[i + 1] = faceNew.g;
					data[i + 2] = faceNew.b;
				} else if (r === EYE_ORIGINAL.r && g === EYE_ORIGINAL.g && b === EYE_ORIGINAL.b) {
					data[i] = eyeNew.r;
					data[i + 1] = eyeNew.g;
					data[i + 2] = eyeNew.b;
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
	async load(id: string, url: string, textureUrl?: string, colorSwap?: ColorSwapConfig): Promise<LoadedModel> {
		const cacheKey = colorSwap ? `${id}_${colorSwap.bodyColor ?? ""}_${colorSwap.faceColor ?? ""}_${colorSwap.eyeColor ?? ""}` : id;
		if (this.cache.has(cacheKey)) return this.cache.get(cacheKey)!;
		const gltf: GLTF = await new Promise((resolve, reject) => {
			this.loader.load(url, resolve, undefined, reject);
		});
		const model: LoadedModel = {
			scene: gltf.scene,
			animations: gltf.animations
		};
		if (textureUrl) {
			await applyTextureWithColorSwap(model.scene, textureUrl, colorSwap);
		}
		if (gltf.animations.length > 0) {
			model.mixer = new THREE.AnimationMixer(model.scene);
		}
		this.cache.set(cacheKey, model);
		return model;
	}
	get(id: string): LoadedModel | undefined {
		return this.cache.get(id);
	}
	dispose(): void {
		this.cache.clear();
	}
}
