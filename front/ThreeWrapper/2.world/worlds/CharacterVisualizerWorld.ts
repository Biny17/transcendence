import * as THREE from "three";
import { VisualizerEnvironment } from "@/ThreeWrapper/3.environment/envs/VisualizerEnvironment";
import { World } from "../WorldClass";
import { LightFactory, OBJECT_TYPE } from "../tools";
export type CharacterVisualizerWorldArgs = {
	bodyColor?: string;
	faceColor?: string;
	eyeColor?: string;
	cameraPos?: { x: number; y: number; z: number };
	cameraTarget?: { x: number; y: number; z: number };
	animation?: string;
	background?: boolean;
};
const DEFAULT_BODY_COLOR = "#c000c0";
const DEFAULT_FACE_COLOR = "#ffffff";
const DEFAULT_EYE_COLOR = "#00ff00";
const MODEL_URL = "/game/modeles/charactere/scene.gltf";
const TEXTURE_URL = "/game/modeles/charactere/character_texture.png";
export class CharacterVisualizerWorld extends World {
	private cameraPos: { x: number; y: number; z: number };
	private cameraTarget: { x: number; y: number; z: number };
	private bodyColor: string;
	private faceColor: string;
	private eyeColor: string;
	private initialAnimation: string;
	private characterObjId: string | null = null;
	private currentAnimation: string | null = null;
	private background: boolean = false;
	constructor(args: CharacterVisualizerWorldArgs = {}) {
		super({ id: "character_visualizer" });
		this.cameraPos = { x: 0, y: 2.5, z: 3.5, ...args.cameraPos };
		this.cameraTarget = { x: 0, y: 1.2, z: 0, ...args.cameraTarget };
		this.bodyColor = args.bodyColor ?? DEFAULT_BODY_COLOR;
		this.faceColor = args.faceColor ?? DEFAULT_FACE_COLOR;
		this.eyeColor = args.eyeColor ?? DEFAULT_EYE_COLOR;
		this.initialAnimation = args.animation ?? "FG_Idle_A";
		this.background = args.background ?? false;
	}
	protected setupEnvironment(): void {
		this.applyEnvironment(new VisualizerEnvironment());
	}
	getCharacterObjectId(): string | null {
		return this.characterObjId;
	}
	playAnimation(clipName: string): void {
		if (!this.characterObjId) return;
		if (this.currentAnimation === clipName) return;
		if (this.currentAnimation) {
			this.ctx.objects.stopAnimation(this.characterObjId, this.currentAnimation);
		}
		const result = this.ctx.objects.playAnimation(this.characterObjId, clipName);
		if (result) {
			this.currentAnimation = clipName;
		}
	}
	stopAnimation(): void {
		if (this.characterObjId && this.currentAnimation) {
			this.ctx.objects.stopAnimation(this.characterObjId, this.currentAnimation, { fadeOut: 0.2 });
			this.currentAnimation = null;
		}
	}
	setBodyColor(color: string): void {
		this.bodyColor = color;
		this._reloadCharacter();
	}
	setFaceColor(color: string): void {
		this.faceColor = color;
		this._reloadCharacter();
	}
	setEyeColor(color: string): void {
		this.eyeColor = color;
		this._reloadCharacter();
	}
	private async _reloadCharacter(): Promise<void> {
		if (!this.characterObjId) return;
		this.ctx.objects.remove(this.characterObjId);
		const model = await this.ctx.gltf.load("character_preview_" + Date.now(), MODEL_URL, TEXTURE_URL, {
			bodyColor: this.bodyColor,
			faceColor: this.faceColor,
			eyeColor: this.eyeColor
		});
		const obj = this.ctx.objects.add({
			type: OBJECT_TYPE.PLAYER,
			name: "character_preview"
		});
		this.ctx.objects.addPiece(obj.id, {
			asset: model,
			relativePosition: { x: 0, y: 0, z: 0 },
			hitboxes: []
		});
		this.characterObjId = obj.id;
		if (this.currentAnimation) {
			this.ctx.objects.playAnimation(obj.id, this.currentAnimation, { fadeIn: 0.2 });
		} else if (model.animations.length > 0) {
			const clipName = model.animations.find((a) => a.name === this.initialAnimation)?.name ?? model.animations[0]?.name;
			if (clipName) {
				this.ctx.objects.playAnimation(obj.id, clipName);
				this.currentAnimation = clipName;
			}
		}
	}
	protected override async onLoad(): Promise<void> {
		const ambient = LightFactory.createAmbientLight({ color: 0xffffff, intensity: 0.7 });
		this.ctx.objects.add({
			type: OBJECT_TYPE.MAP,
			name: "ambient",
			pieces: [{ asset: ambient, relativePosition: { x: 0, y: 0, z: 0 }, hitboxes: [] }]
		});
		const key = LightFactory.createDirectionalLight({
			color: 0xffffff,
			intensity: 1.2,
			position: { x: 5, y: 8, z: 6 },
			castShadow: false
		});
		this.ctx.objects.add({
			type: OBJECT_TYPE.MAP,
			name: "key_light",
			pieces: [{ asset: key, relativePosition: { x: 0, y: 0, z: 0 }, hitboxes: [] }]
		});
		const fill = LightFactory.createDirectionalLight({
			color: 0x8899cc,
			intensity: 0.4,
			position: { x: -4, y: 3, z: -5 },
			castShadow: false
		});
		this.ctx.objects.add({
			type: OBJECT_TYPE.MAP,
			name: "fill_light",
			pieces: [{ asset: fill, relativePosition: { x: 0, y: 0, z: 0 }, hitboxes: [] }]
		});
		this.ctx.camera.position.set(this.cameraPos.x, this.cameraPos.y, this.cameraPos.z);
		this.ctx.camera.lookAt(this.cameraTarget.x, this.cameraTarget.y, this.cameraTarget.z);
		const model = await this.ctx.gltf.load("character_preview", MODEL_URL, TEXTURE_URL, {
			bodyColor: this.bodyColor,
			faceColor: this.faceColor,
			eyeColor: this.eyeColor
		});
		const obj = this.ctx.objects.add({
			type: OBJECT_TYPE.PLAYER,
			name: "character_preview"
		});
		this.ctx.objects.addPiece(obj.id, {
			asset: model,
			relativePosition: { x: 0, y: 0, z: 0 },
			hitboxes: []
		});
		this.characterObjId = obj.id;
		if (model.animations.length > 0) {
			const clipName = model.animations.find((a) => a.name === this.initialAnimation)?.name ?? model.animations[0]?.name;
			if (clipName) {
				this.ctx.objects.playAnimation(obj.id, clipName);
				this.currentAnimation = clipName;
			}
		}
		if (this.background) this.ctx.scene.background = new THREE.Color(0x87ceeb);
	}
}
