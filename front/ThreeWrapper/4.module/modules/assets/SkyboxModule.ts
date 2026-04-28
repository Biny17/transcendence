import * as THREE from "three";
import type { Module, WorldContext } from "@/ThreeWrapper/4.module";
export interface SkyboxModuleOptions {
	files?: {
		top: string;
		bottom: string;
		left: string;
		right: string;
		front: string;
		back: string;
	};
	preset?: "day";
	equirect?: string;
}
const SKYBOX_PRESETS = {
	day: {
		top: "/game/skybox/sunset/top.png",
		bottom: "/game/skybox/sunset/bottom.png",
		left: "/game/skybox/sunset/left.png",
		right: "/game/skybox/sunset/right.png",
		front: "/game/skybox/sunset/front.png",
		back: "/game/skybox/sunset/back.png"
	}
} as const;
export class SkyboxModule implements Module {
	readonly type = "skybox";
	private options: SkyboxModuleOptions;
	private texture: THREE.CubeTexture | THREE.Texture | null = null;
	private ctx: WorldContext | null = null;
	constructor(options: SkyboxModuleOptions = {}) {
		this.options = options;
	}
	init(ctx: WorldContext): void {
		this.ctx = ctx;
		if (this.options.equirect) {
			const url = this.options.equirect;
			const onLoad = (tex: THREE.Texture) => {
				tex.mapping = THREE.EquirectangularReflectionMapping;
				if (this.ctx) this.ctx.scene.background = tex;
				this.texture = tex;
			};
			if (url.endsWith(".hdr")) {
				import("three/examples/jsm/loaders/RGBELoader.js").then(({ RGBELoader }) => {
					new RGBELoader().load(url, onLoad);
				});
			} else {
				new THREE.TextureLoader().load(url, onLoad);
			}
			return;
		}
		const files = this.options.files ?? SKYBOX_PRESETS[this.options.preset ?? "day"];
		const urls = [files.right ?? (files as any).right, files.left ?? (files as any).left, files.top, files.bottom, files.front, files.back] as [string, string, string, string, string, string];
		const cubeTexture = new THREE.CubeTextureLoader().load(urls);
		this.texture = cubeTexture;
		ctx.scene.background = cubeTexture;
	}
	update(_delta: number): void {}
	dispose(): void {
		if (this.ctx && this.ctx.scene.background === this.texture) {
			this.ctx.scene.background = null;
		}
		this.texture?.dispose();
		this.texture = null;
		this.ctx = null;
	}
}
