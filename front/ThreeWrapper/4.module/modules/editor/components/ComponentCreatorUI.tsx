"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { extractGltfZip } from "../gltfVirtualFs";
import type { AutoMeshOptions } from "@/ThreeWrapper/2.world/util/autoMeshHitbox";
import { mergeAABBHitboxes, removeContainedHitboxes } from "@/ThreeWrapper/2.world/util/autoMeshHitbox";
import * as THREE from "three";
export type TextureSlot = {
	file: File | null;
	previewUrl: string | null;
	exportPath: string;
};
export type HitboxState = {
	localId: string;
	shape: "box" | "sphere" | "capsule";
	sizeKind: "full" | "auto" | "explicit";
	sizeX: number;
	sizeY: number;
	sizeZ: number;
	radius: number;
	height: number;
	offsetX: number;
	offsetY: number;
	offsetZ: number;
	relativeOffsetX: number;
	relativeOffsetY: number;
	relativeOffsetZ: number;
	rotationX: number;
	rotationY: number;
	rotationZ: number;
	collidesWith: string[];
	isSensor: boolean;
	tag: string;
};
export type MeshPartState = {
	localId: string;
	name: string;
	meshKind: "primitive" | "gltf";
	primitive: "box" | "sphere" | "plane" | "cylinder";
	sizeX: number;
	sizeY: number;
	sizeZ: number;
	color: string;
	textures: Record<string, TextureSlot>;
	displacementScale: number;
	normalScale: number;
	offsetX: number;
	offsetY: number;
	offsetZ: number;
	relativeOffsetX: number;
	relativeOffsetY: number;
	relativeOffsetZ: number;
	rotationX: number;
	rotationY: number;
	rotationZ: number;
	gltfPath: string;
	gltfPreviewUrl: string | null;
	gltfScaleX: number;
	gltfScaleY: number;
	gltfScaleZ: number;
};
export type AnimationState = {
	localId: string;
	name: string;
	targetMeshId: string;
	type: 'waypoints' | 'clip';
	waypoints: { position: { x: number; y: number; z: number }; rotation?: { x: number; y: number; z: number } }[];
	clipName: string;
	speed: number;
	loop: boolean;
	autoPlay: boolean;
	pauseAtWaypoint: number;
};
export type ComponentState = {
	id: string;
	meshes: MeshPartState[];
	wireframe: boolean;
	bodyType: "static" | "dynamic" | "kinematic";
	gravityScale: number;
	mass: number;
	restitution: number;
	friction: number;
	hitboxes: HitboxState[];
	animations: AnimationState[];
};
type Props = {
	onMount: (updater: (state: ComponentState) => void) => void;
	onStateChange: (state: ComponentState) => void;
	onSave: (state: ComponentState) => Promise<void>;
	onLoadComponentList: () => Promise<string[]>;
	onLoadComponent: (path: string) => Promise<ComponentState | null>;
	onGltfLoad: (meshLocalId: string, url: string, manager?: THREE.LoadingManager) => Promise<string[]>;
	onPlayAnimation: (meshLocalId: string, clipName: string, speed?: number, loop?: boolean) => void;
	onStopAnimation: (meshLocalId?: string) => void;
	onPlayAnimationItem: (anim: AnimationState) => void;
	onHelpersChange: (config: { player: boolean; unitCube: boolean }) => void;
	onStartPhysicsTest: (state: ComponentState) => void;
	onStopPhysicsTest: () => void;
	onAutoGenerateHitboxes: (state: ComponentState, options?: AutoMeshOptions) => HitboxState[];
	onSceneHitboxSelect?: (onSelect: (id: string | null) => void) => void;
};
const C = {
	bg: "rgba(10, 10, 28, 0.88)",
	border: "rgba(68, 170, 255, 0.2)",
	text: "#aac8ee",
	textDim: "#557799",
	textBright: "#88ccff",
	accent: "#44aaff",
	selectedBg: "rgba(68,170,255,0.18)",
	btnBg: "rgba(68,170,255,0.12)",
	btnBorder: "rgba(68,170,255,0.35)",
	btnDisabledText: "#334455",
	btnDisabledBorder: "rgba(68,170,255,0.1)"
};
function Btn({ onClick, disabled, children, style }: { onClick: () => void; disabled?: boolean; children: React.ReactNode; style?: React.CSSProperties }) {
	return (
		<button
			onClick={onClick}
			disabled={disabled}
			style={{
				flex: 1,
				padding: "6px 4px",
				background: disabled ? "transparent" : C.btnBg,
				border: `1px solid ${disabled ? C.btnDisabledBorder : C.btnBorder}`,
				borderRadius: "3px",
				color: disabled ? C.btnDisabledText : C.textBright,
				cursor: disabled ? "default" : "pointer",
				fontFamily: "monospace",
				fontSize: "11px",
				letterSpacing: "0.04em",
				...style
			}}>
			{children}
		</button>
	);
}
function ModeBtn({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
	return (
		<button
			onClick={onClick}
			style={{
				flex: 1,
				padding: "5px 8px",
				background: selected ? C.selectedBg : C.btnBg,
				border: `1px solid ${selected ? C.accent : C.btnBorder}`,
				borderRadius: "3px",
				color: selected ? C.textBright : C.text,
				cursor: "pointer",
				fontFamily: "monospace",
				fontSize: "11px",
				fontWeight: selected ? "bold" : "normal"
			}}>
			{label}
		</button>
	);
}
export function ComponentCreatorUI({ onMount, onStateChange, onSave, onLoadComponentList, onLoadComponent, onGltfLoad, onPlayAnimation, onStopAnimation, onPlayAnimationItem, onHelpersChange, onStartPhysicsTest, onStopPhysicsTest, onAutoGenerateHitboxes, onSceneHitboxSelect }: Props) {
	const [state, _setState] = useState<ComponentState>({
		id: "my_component",
		meshes: [
			{
				localId: crypto.randomUUID(),
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
	});
	const stateRef = useRef(state);
	stateRef.current = state;
	const histRef = useRef({ past: [] as ComponentState[], future: [] as ComponentState[] });
	const [canUndo, setCanUndo] = useState(false);
	const [canRedo, setCanRedo] = useState(false);
	const [componentList, setComponentList] = useState<string[]>([]);
	const [selectedLoadPath, setSelectedLoadPath] = useState<string>("");
	const [loadedPath, setLoadedPath] = useState<string | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [loadError, setLoadError] = useState<string | null>(null);
	const setState = useCallback((updater: ComponentState | ((prev: ComponentState) => ComponentState)) => {
		histRef.current.past.push(structuredClone(stateRef.current));
		histRef.current.future = [];
		if (histRef.current.past.length > 100) histRef.current.past.shift();
		setCanUndo(true);
		setCanRedo(false);
		const next = typeof updater === "function" ? updater(stateRef.current) : updater;
		_setState(next);
	}, []);
	const undo = useCallback(() => {
		const { past, future } = histRef.current;
		if (past.length === 0) return;
		const prev = past.pop()!;
		future.push(structuredClone(stateRef.current));
		setCanUndo(past.length > 0);
		setCanRedo(true);
		_setState(prev);
	}, []);
	const redo = useCallback(() => {
		const { past, future } = histRef.current;
		if (future.length === 0) return;
		const next = future.pop()!;
		past.push(structuredClone(stateRef.current));
		setCanUndo(true);
		setCanRedo(future.length > 0);
		_setState(next);
	}, []);
	const [expandedMeshParts, setExpandedMeshParts] = useState<Set<string>>(new Set());
	const [expandedHitboxes, setExpandedHitboxes] = useState<Set<string>>(new Set());
	const [expandedAnimations, setExpandedAnimations] = useState<Set<string>>(new Set());
	const [autoGenOptions, setAutoGenOptions] = useState<AutoMeshOptions>({
		mode: "single", minSize: 0.05,
	});
	const [showAutoGenPanel, setShowAutoGenPanel] = useState(false);
	const [autoGenStatus, setAutoGenStatus] = useState<string | null>(null);
	const [autoGenReplace, setAutoGenReplace] = useState(true);
	const [selectedHitboxId, setSelectedHitboxId] = useState<string | null>(null);
	const [mergeMode, setMergeMode] = useState<"idle" | "select-target">("idle");
	const [mergeSourceId, setMergeSourceId] = useState<string | null>(null);
	const [gltfLoadMode, setGltfLoadMode] = useState<"upload" | "server">("upload");
	const [gltfClipsByMesh, setGltfClipsByMesh] = useState<Record<string, string[]>>({});
	const [activeClip, setActiveClip] = useState<string | null>(null);
	const [gltfLoading, setGltfLoading] = useState(false);
	const [gltfError, setGltfError] = useState<string | null>(null);
	const [gltfFileName, setGltfFileName] = useState<string | null>(null);
	const [gltfZipFileName, setGltfZipFileName] = useState<string | null>(null);
	const [helpers, setHelpers] = useState({ player: false, unitCube: false });
	const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
	const gltfUploadRefs = useRef<Record<string, HTMLInputElement | null>>({});
	const gltfZipRefs = useRef<Record<string, HTMLInputElement | null>>({});
	useEffect(() => {
		onMount(setState);
	}, [onMount]);
	useEffect(() => {
		onLoadComponentList().then(list => {
			setComponentList(list);
		}).catch(() => {
			setComponentList([]);
		});
	}, [onLoadComponentList]);
	useEffect(() => {
		onStateChange(state);
	}, [state, onStateChange]);
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if ((e.target as HTMLElement).tagName === "INPUT") return;
			if (e.ctrlKey && !e.shiftKey && e.key === "z") { e.preventDefault(); undo(); }
			if (e.ctrlKey && e.shiftKey && e.key === "Z") { e.preventDefault(); redo(); }
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [undo, redo]);
	useEffect(() => {
		onSceneHitboxSelect?.((id: string | null) => {
			if (mergeMode === "select-target" && mergeSourceId && id && id !== mergeSourceId) {
				const hbA = state.hitboxes.find(h => h.localId === mergeSourceId);
				const hbB = state.hitboxes.find(h => h.localId === id);
				if (hbA && hbB) {
					setState(prev => {
						const others = prev.hitboxes.filter(h => h.localId !== mergeSourceId && h.localId !== id);
						const aMinX = hbA.offsetX - hbA.sizeX / 2, aMaxX = hbA.offsetX + hbA.sizeX / 2;
						const aMinY = hbA.offsetY - hbA.sizeY / 2, aMaxY = hbA.offsetY + hbA.sizeY / 2;
						const aMinZ = hbA.offsetZ - hbA.sizeZ / 2, aMaxZ = hbA.offsetZ + hbA.sizeZ / 2;
						const bMinX = hbB.offsetX - hbB.sizeX / 2, bMaxX = hbB.offsetX + hbB.sizeX / 2;
						const bMinY = hbB.offsetY - hbB.sizeY / 2, bMaxY = hbB.offsetY + hbB.sizeY / 2;
						const bMinZ = hbB.offsetZ - hbB.sizeZ / 2, bMaxZ = hbB.offsetZ + hbB.sizeZ / 2;
						const merged: HitboxState = {
							...hbA,
							localId: crypto.randomUUID(),
							sizeX: Math.max(aMaxX, bMaxX) - Math.min(aMinX, bMinX),
							sizeY: Math.max(aMaxY, bMaxY) - Math.min(aMinY, bMinY),
							sizeZ: Math.max(aMaxZ, bMaxZ) - Math.min(aMinZ, bMinZ),
							offsetX: (Math.min(aMinX, bMinX) + Math.max(aMaxX, bMaxX)) / 2,
							offsetY: (Math.min(aMinY, bMinY) + Math.max(aMaxY, bMaxY)) / 2,
							offsetZ: (Math.min(aMinZ, bMinZ) + Math.max(aMaxZ, bMaxZ)) / 2,
						};
						return { ...prev, hitboxes: [...others, merged] };
					});
				}
				setMergeMode("idle");
				setMergeSourceId(null);
				setSelectedHitboxId(null);
				return;
			}
			if (mergeMode === "select-target" && !id) {
				setMergeMode("idle");
				setMergeSourceId(null);
				return;
			}
			setSelectedHitboxId(id);
		});
	}, [onSceneHitboxSelect, mergeMode, mergeSourceId, state.hitboxes, onAutoGenerateHitboxes]);
	const toggleMeshPart = (localId: string) => {
		setExpandedMeshParts((prev) => {
			const next = new Set(prev);
			if (next.has(localId)) next.delete(localId);
			else next.add(localId);
			return next;
		});
	};
	const toggleHitbox = (localId: string) => {
		setExpandedHitboxes((prev) => {
			const next = new Set(prev);
			if (next.has(localId)) next.delete(localId);
			else next.add(localId);
			return next;
		});
	};
	const toggleAnimation = (localId: string) => {
		setExpandedAnimations((prev) => {
			const next = new Set(prev);
			if (next.has(localId)) next.delete(localId);
			else next.add(localId);
			return next;
		});
	};
	useEffect(() => {
		if (state.meshes.every((m) => m.meshKind === "primitive")) {
			setGltfClipsByMesh({});
			setActiveClip(null);
			setGltfLoading(false);
			setGltfError(null);
			setGltfFileName(null);
			setGltfZipFileName(null);
		}
	}, [state.meshes]);
	const handleStateChange = (updates: Partial<ComponentState>) => {
		setState((prev) => ({ ...prev, ...updates }));
	};

	const handleAddMeshPart = () => {
		const newMesh: MeshPartState = {
			localId: crypto.randomUUID(),
			name: `mesh_${state.meshes.length + 1}`,
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
		};
		setState((prev) => ({ ...prev, meshes: [...prev.meshes, newMesh] }));
	};
	const handleDeleteMeshPart = (localId: string) => {
		setState((prev) => ({
			...prev,
			meshes: prev.meshes.filter((m) => m.localId !== localId),
			animations: prev.animations.filter((a) => a.targetMeshId !== localId)
		}));
	};
	const handleDuplicateMeshPart = (localId: string) => {
		setState((prev) => {
			const meshToCopy = prev.meshes.find((m) => m.localId === localId);
			if (!meshToCopy) return prev;
			const newMesh: MeshPartState = {
				...meshToCopy,
				localId: crypto.randomUUID(),
				name: `${meshToCopy.name}_copy`,
				textures: {
					...meshToCopy.textures,
					map: { file: null, previewUrl: null, exportPath: "" },
					normalMap: { file: null, previewUrl: null, exportPath: "" },
					roughnessMap: { file: null, previewUrl: null, exportPath: "" },
					metalnessMap: { file: null, previewUrl: null, exportPath: "" },
					emissiveMap: { file: null, previewUrl: null, exportPath: "" },
					aoMap: { file: null, previewUrl: null, exportPath: "" },
					displacementMap: { file: null, previewUrl: null, exportPath: "" }
				},
				displacementScale: meshToCopy.displacementScale,
				normalScale: meshToCopy.normalScale,
				gltfPreviewUrl: null,
				gltfPath: ""
			};
			return { ...prev, meshes: [...prev.meshes, newMesh] };
		});
	};
	const handleMeshPartChange = (localId: string, updates: Partial<MeshPartState>) => {
		setState((prev) => ({
			...prev,
			meshes: prev.meshes.map((m) => (m.localId === localId ? { ...m, ...updates } : m))
		}));
	};
	const handleMeshGltfUpload = async (meshLocalId: string, file: File | null) => {
		if (!file) return;
		setGltfLoading(true);
		setGltfError(null);
		setActiveClip(null);
		try {
			const url = URL.createObjectURL(file);
			setGltfFileName(file.name);
			handleMeshPartChange(meshLocalId, { gltfPreviewUrl: url, gltfPath: file.name });
			const clips = await onGltfLoad(meshLocalId, url);
			setGltfClipsByMesh(prev => ({ ...prev, [meshLocalId]: clips }));
			setState(prev => addClipAnimations(prev, meshLocalId, clips));
		} catch (e) {
			setGltfError((e as Error).message || "Failed to load GLTF");
			setGltfFileName(null);
		} finally {
			setGltfLoading(false);
		}
	};
	const handleMeshGltfZipUpload = async (meshLocalId: string, file: File | null) => {
		if (!file) return;
		setGltfLoading(true);
		setGltfError(null);
		setActiveClip(null);
		try {
			const vfs = await extractGltfZip(file);
			setGltfZipFileName(file.name);
			handleMeshPartChange(meshLocalId, { gltfPreviewUrl: vfs.mainUrl, gltfPath: file.name });
			const clips = await onGltfLoad(meshLocalId, vfs.mainUrl, vfs.manager);
			setGltfClipsByMesh(prev => ({ ...prev, [meshLocalId]: clips }));
			setState(prev => addClipAnimations(prev, meshLocalId, clips));
		} catch (e) {
			setGltfError((e as Error).message || "Failed to load ZIP");
			setGltfZipFileName(null);
		} finally {
			setGltfLoading(false);
		}
	};
	const handleMeshGltfServerPath = async (meshLocalId: string) => {
		const mesh = stateRef.current.meshes.find((m) => m.localId === meshLocalId);
		if (!mesh?.gltfPath) return;
		setGltfLoading(true);
		setGltfError(null);
		setActiveClip(null);
		try {
			const clips = await onGltfLoad(meshLocalId, mesh.gltfPath);
			setGltfClipsByMesh(prev => ({ ...prev, [meshLocalId]: clips }));
			setState(prev => addClipAnimations(prev, meshLocalId, clips));
			setGltfFileName(null);
			setGltfZipFileName(null);
			handleMeshPartChange(meshLocalId, { gltfPreviewUrl: mesh.gltfPath });
		} catch (e) {
			setGltfError((e as Error).message || "Failed to load GLTF");
		} finally {
			setGltfLoading(false);
		}
	};
	const handleMeshTextureFile = (meshLocalId: string, key: string, file: File | null) => {
		const previewUrl = file ? URL.createObjectURL(file) : null;
		const exportPath = file ? `/game/textures/${file.name}` : "";
		setState((prev) => ({
			...prev,
			meshes: prev.meshes.map((m) =>
				m.localId === meshLocalId
					? {
							...m,
							textures: {
								...m.textures,
								[key]: { file, previewUrl, exportPath }
							}
						}
					: m
			)
		}));
	};
	const handleRemoveTexture = (meshLocalId: string, key: string) => {
		setState((prev) => ({
			...prev,
			meshes: prev.meshes.map((m) =>
				m.localId === meshLocalId
					? {
							...m,
							textures: {
								...m.textures,
								[key]: { file: null, previewUrl: null, exportPath: "" }
							}
						}
					: m
			)
		}));
	};
	const handleAddHitbox = () => {
		const newHitbox: HitboxState = {
			localId: crypto.randomUUID(),
			shape: "box",
			sizeKind: "explicit",
			sizeX: 1,
			sizeY: 1,
			sizeZ: 1,
			radius: 0.5,
			height: 1,
			offsetX: 0,
			offsetY: 0.5,
			offsetZ: 0,
			relativeOffsetX: 0,
			relativeOffsetY: 0,
			relativeOffsetZ: 0,
			rotationX: 0,
			rotationY: 0,
			rotationZ: 0,
			collidesWith: [],
			isSensor: false,
			tag: ""
		};
		setState((prev) => ({ ...prev, hitboxes: [...prev.hitboxes, newHitbox] }));
	};
	const handleDeleteHitbox = (localId: string) => {
		setState((prev) => ({
			...prev,
			hitboxes: prev.hitboxes.filter((h) => h.localId !== localId)
		}));
	};
	const handleHitboxChange = (localId: string, updates: Partial<HitboxState>) => {
		setState((prev) => ({
			...prev,
			hitboxes: prev.hitboxes.map((h) => (h.localId === localId ? { ...h, ...updates } : h))
		}));
	};
	const handleToggleCollidesWith = (localId: string, layer: string) => {
		setState((prev) => ({
			...prev,
			hitboxes: prev.hitboxes.map((h) =>
				h.localId === localId
					? {
							...h,
							collidesWith: h.collidesWith.includes(layer) ? h.collidesWith.filter((l) => l !== layer) : [...h.collidesWith, layer]
						}
					: h
			)
		}));
	};
	const handleGlobalCollidesWith = (layer: string) => {
		setState((prev) => ({
			...prev,
			hitboxes: prev.hitboxes.map((h) => ({
				...h,
				collidesWith: h.collidesWith.includes(layer)
					? h.collidesWith.filter((l) => l !== layer)
					: [...h.collidesWith, layer],
			})),
		}));
	};
	const addClipAnimations = (prev: ComponentState, meshLocalId: string, clips: string[]): ComponentState => {
		const existingClipNames = new Set(
			prev.animations.filter(a => a.targetMeshId === meshLocalId && a.type === 'clip').map(a => a.clipName)
		);
		const newClips = clips
			.filter(c => !existingClipNames.has(c))
			.map(clipName => ({
				localId: crypto.randomUUID(),
				name: clipName,
				targetMeshId: meshLocalId,
				type: 'clip' as const,
				clipName,
				waypoints: [],
				speed: 1,
				loop: true,
				autoPlay: false,
				pauseAtWaypoint: 0,
			}));
		if (newClips.length === 0) return prev;
		return { ...prev, animations: [...prev.animations, ...newClips] };
	};
	const handleAddAnimation = () => {
		const firstMeshId = state.meshes[0]?.localId ?? "";
		const newAnim: AnimationState = {
			localId: crypto.randomUUID(),
			name: `anim_${state.animations.length + 1}`,
			targetMeshId: firstMeshId,
			type: 'waypoints',
			waypoints: [{ position: { x: 0, y: 0, z: 0 } }],
			clipName: '',
			speed: 2,
			loop: true,
			autoPlay: true,
			pauseAtWaypoint: 0
		};
		setState((prev) => ({ ...prev, animations: [...prev.animations, newAnim] }));
	};
	const handleAddClipAnimation = () => {
		const gltfMeshIds = state.meshes.filter(m => gltfClipsByMesh[m.localId]?.length > 0);
		if (gltfMeshIds.length === 0) return;
		const meshLocalId = gltfMeshIds[0].localId;
		const clips = gltfClipsByMesh[meshLocalId];
		const newAnim: AnimationState = {
			localId: crypto.randomUUID(),
			name: clips[0],
			targetMeshId: meshLocalId,
			type: 'clip',
			clipName: clips[0],
			waypoints: [],
			speed: 1,
			loop: true,
			autoPlay: false,
			pauseAtWaypoint: 0,
		};
		setState((prev) => ({ ...prev, animations: [...prev.animations, newAnim] }));
	};
	const handleDeleteAnimation = (localId: string) => {
		setState((prev) => ({
			...prev,
			animations: prev.animations.filter((a) => a.localId !== localId)
		}));
	};
	const handleAnimationChange = (localId: string, updates: Partial<AnimationState>) => {
		setState((prev) => ({
			...prev,
			animations: prev.animations.map((a) => (a.localId === localId ? { ...a, ...updates } : a))
		}));
	};
	const getMeshName = (localId: string): string => {
		const mesh = state.meshes.find((m) => m.localId === localId);
		return mesh?.name ?? localId;
	};
	const handleAddWaypoint = (localId: string) => {
		setState((prev) => ({
			...prev,
			animations: prev.animations.map((a) =>
				a.localId === localId
					? {
							...a,
							waypoints: [...a.waypoints, { position: { x: 0, y: 0, z: 0 } }]
						}
					: a
			)
		}));
	};
	const handleDeleteWaypoint = (localId: string, idx: number) => {
		setState((prev) => ({
			...prev,
			animations: prev.animations.map((a) =>
				a.localId === localId
					? {
							...a,
							waypoints: a.waypoints.filter((_, i) => i !== idx)
						}
					: a
			)
		}));
	};
	const handleWaypointChange = (localId: string, idx: number, field: "x" | "y" | "z", value: number, target: "position" | "rotation" = "position") => {
		setState((prev) => ({
			...prev,
			animations: prev.animations.map((a) =>
				a.localId === localId
					? {
							...a,
							waypoints: a.waypoints.map((w, i) => (i === idx ? { ...w, [target]: { ...w[target], [field]: value } } : w))
						}
					: a
			)
		}));
	};
	const handleSave = async () => {
		setIsSaving(true);
		setLoadError(null);
		try {
			await onSave(state);
			setLoadedPath(`/game/components/${state.id}.yaml`);
		} catch (e) {
			setLoadError((e as Error).message || 'Failed to save');
		} finally {
			setIsSaving(false);
		}
	};
	const handleLoad = async () => {
		if (!selectedLoadPath) return;
		setLoadError(null);
		try {
			const loaded = await onLoadComponent(selectedLoadPath);
			if (loaded) {
				setState(loaded);
				setLoadedPath(selectedLoadPath);
			} else {
				setLoadError('Failed to load component');
			}
		} catch (e) {
			setLoadError((e as Error).message || 'Failed to load component');
		}
	};
	useEffect(() => {
		return () => {
			for (const mesh of state.meshes) {
				for (const key in mesh.textures) {
					const slot = mesh.textures[key];
					if (slot.previewUrl) URL.revokeObjectURL(slot.previewUrl);
				}
				if (mesh.gltfPreviewUrl) URL.revokeObjectURL(mesh.gltfPreviewUrl);
			}
		};
	}, [state.meshes]);
	const labelStyle: React.CSSProperties = {
		fontSize: "10px",
		color: C.textDim,
		marginBottom: "4px",
		letterSpacing: "0.05em",
		textTransform: "uppercase"
	};
	const inputStyle: React.CSSProperties = {
		background: "rgba(0,0,0,0.3)",
		border: `1px solid ${C.btnBorder}`,
		borderRadius: "3px",
		color: C.textBright,
		fontFamily: "monospace",
		fontSize: "12px",
		padding: "4px 6px",
		outline: "none",
		boxSizing: "border-box"
	};
	const rowStyle: React.CSSProperties = {
		display: "flex",
		gap: "6px",
		marginBottom: "6px"
	};
	return (
		<div
			style={{
				position: "absolute",
				top: 0,
				left: 0,
				width: "320px",
				height: "100vh",
				display: "flex",
				flexDirection: "column",
				background: C.bg,
				borderRight: `1px solid ${C.border}`,
				fontFamily: "monospace",
				fontSize: "12px",
				color: C.text,
				userSelect: "none",
				overflow: "hidden",
				pointerEvents: "auto"
			}}>
			{}
			<div
				style={{
					padding: "10px 12px 8px",
					borderBottom: `1px solid ${C.border}`,
					fontWeight: 700,
					fontSize: "11px",
					letterSpacing: "0.08em",
					color: C.accent,
					textTransform: "uppercase",
					flex: "0 0 auto",
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}>
				<span>Component Creator</span>
				<span style={{ display: "flex", gap: "2px" }}>
					<button onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)"
						style={{
							fontSize: "13px", padding: "1px 5px",
							background: "transparent",
							border: `1px solid ${canUndo ? C.btnBorder : C.btnDisabledBorder}`,
							borderRadius: "3px",
							color: canUndo ? C.text : C.textDim,
							cursor: canUndo ? "pointer" : "default",
							fontFamily: "monospace", lineHeight: "1.2",
						}}>↶</button>
					<button onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)"
						style={{
							fontSize: "13px", padding: "1px 5px",
							background: "transparent",
							border: `1px solid ${canRedo ? C.btnBorder : C.btnDisabledBorder}`,
							borderRadius: "3px",
							color: canRedo ? C.text : C.textDim,
							cursor: canRedo ? "pointer" : "default",
							fontFamily: "monospace", lineHeight: "1.2",
						}}>↷</button>
				</span>
			</div>
			{}
			<div style={{ flex: 1, overflowY: "auto" }}>
				{}
				<div style={{ borderTop: `1px solid ${C.border}`, padding: "8px 12px" }}>
					<div style={labelStyle}>Component ID</div>
					<input type="text" value={state.id} onChange={(e) => handleStateChange({ id: e.target.value })} style={{ width: "100%", ...inputStyle }} />
				</div>
				{}
				<div style={{ borderTop: `1px solid ${C.border}`, padding: "8px 12px" }}>
					<div style={labelStyle}>Load Component</div>
					<div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
						<select
							value={selectedLoadPath}
							onChange={(e) => setSelectedLoadPath(e.target.value)}
							style={{ flex: 1, ...inputStyle }}>
							<option value="">-- Select component --</option>
							{componentList.map(path => {
								const fileName = path.split('/').pop()?.replace('.yaml', '') ?? path;
								return <option key={path} value={path}>{fileName}</option>;
							})}
						</select>
						<button
							onClick={handleLoad}
							disabled={!selectedLoadPath}
							style={{
								padding: "4px 8px",
								background: selectedLoadPath ? C.btnBg : "transparent",
								border: `1px solid ${selectedLoadPath ? C.btnBorder : C.btnDisabledBorder}`,
								borderRadius: "3px",
								color: selectedLoadPath ? C.textBright : C.textDim,
								cursor: selectedLoadPath ? "pointer" : "default",
								fontFamily: "monospace",
								fontSize: "11px"
							}}>
							Load
						</button>
					</div>
					{loadError && <div style={{ marginTop: "4px", fontSize: "10px", color: "#ff8844" }}>⚠ {loadError}</div>}
					{loadedPath && <div style={{ marginTop: "4px", fontSize: "10px", color: C.accent }}>Loaded: {loadedPath}</div>}
				</div>
				{}
				<div style={{ borderTop: `1px solid ${C.border}`, padding: "8px 12px" }}>
					<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
						<div style={labelStyle}>Meshes</div>
						<button
							onClick={handleAddMeshPart}
							style={{
								background: C.btnBg,
								border: `1px solid ${C.btnBorder}`,
								borderRadius: "3px",
								color: C.textBright,
								cursor: "pointer",
								fontFamily: "monospace",
								fontSize: "14px",
								padding: "2px 6px"
							}}>
							+
						</button>
					</div>
					{state.meshes.map((mesh) => (
						<div
							key={mesh.localId}
							style={{
								marginBottom: "6px",
								border: `1px solid ${C.border}`,
								borderRadius: "3px",
								overflow: "hidden"
							}}>
							<div
								onClick={() => toggleMeshPart(mesh.localId)}
								style={{
									padding: "6px",
									background: expandedMeshParts.has(mesh.localId) ? C.selectedBg : "rgba(0,0,0,0.2)",
									cursor: "pointer",
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									fontSize: "11px"
								}}>
								<span>
									{expandedMeshParts.has(mesh.localId) ? "▼" : "▶"} {mesh.name}
								</span>
								<div style={{ display: "flex", gap: "4px" }}>
									<button
										onClick={(e) => {
											e.stopPropagation();
											handleDuplicateMeshPart(mesh.localId);
										}}
										style={{
											background: "transparent",
											border: "none",
											color: C.textBright,
											cursor: "pointer",
											fontSize: "11px",
											padding: "0 4px"
										}}
										title="Duplicate">
										⧉
									</button>
									<button
										onClick={(e) => {
											e.stopPropagation();
											handleDeleteMeshPart(mesh.localId);
										}}
										style={{
											background: "transparent",
											border: "none",
											color: "#ff8844",
											cursor: "pointer",
											fontSize: "12px"
										}}>
										×
									</button>
								</div>
							</div>
							{expandedMeshParts.has(mesh.localId) && (
								<div style={{ padding: "6px", borderTop: `1px solid ${C.border}`, backgroundColor: "rgba(0,0,0,0.3)" }}>
									{}
									<div style={{ marginBottom: "6px" }}>
										<div style={labelStyle}>Name</div>
										<input
											type="text"
											value={mesh.name}
											onChange={(e) => handleMeshPartChange(mesh.localId, { name: e.target.value })}
											style={{ width: "100%", ...inputStyle }}
										/>
									</div>
									{}
									<div style={{ marginBottom: "6px" }}>
										<div style={labelStyle}>Type</div>
										<div style={rowStyle}>
											<label style={{ flex: 1, display: "flex", alignItems: "center", gap: "6px" }}>
												<input
													type="radio"
													checked={mesh.meshKind === "primitive"}
													onChange={() => handleMeshPartChange(mesh.localId, { meshKind: "primitive" })}
												/>
												<span>Primitive</span>
											</label>
											<label style={{ flex: 1, display: "flex", alignItems: "center", gap: "6px" }}>
												<input
													type="radio"
													checked={mesh.meshKind === "gltf"}
													onChange={() => handleMeshPartChange(mesh.localId, { meshKind: "gltf" })}
												/>
												<span>GLTF</span>
											</label>
										</div>
									</div>
									{mesh.meshKind === "primitive" && (
										<>
											<div style={{ marginBottom: "6px" }}>
												<div style={labelStyle}>Shape</div>
												<select
													value={mesh.primitive}
													onChange={(e) => handleMeshPartChange(mesh.localId, { primitive: e.target.value as any })}
													style={{ width: "100%", ...inputStyle }}>
													<option>box</option>
													<option>sphere</option>
													<option>plane</option>
													<option>cylinder</option>
												</select>
											</div>
											<div style={{ marginBottom: "6px" }}>
												<div style={labelStyle}>Size</div>
												<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "2px", width: "100%", boxSizing: "border-box", minWidth: 0 }}>
													<input
														type="number"
														step="0.1"
														value={mesh.sizeX}
														onChange={(e) => handleMeshPartChange(mesh.localId, { sizeX: parseFloat(e.target.value) || 1 })}
														placeholder="X"
														style={{ ...inputStyle, width: "100%" }}
													/>
													<input
														type="number"
														step="0.1"
														value={mesh.sizeY}
														onChange={(e) => handleMeshPartChange(mesh.localId, { sizeY: parseFloat(e.target.value) || 1 })}
														placeholder="Y"
														style={{ ...inputStyle, width: "100%" }}
													/>
													<input
														type="number"
														step="0.1"
														value={mesh.sizeZ}
														onChange={(e) => handleMeshPartChange(mesh.localId, { sizeZ: parseFloat(e.target.value) || 1 })}
														placeholder="Z"
														style={{ ...inputStyle, width: "100%" }}
													/>
												</div>
											</div>
											<div style={{ marginBottom: "6px" }}>
												<div style={labelStyle}>Offset</div>
												<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "2px", width: "100%", boxSizing: "border-box", minWidth: 0 }}>
													<input
														type="number"
														step="0.1"
														value={mesh.offsetX}
														onChange={(e) => handleMeshPartChange(mesh.localId, { offsetX: parseFloat(e.target.value) || 0 })}
														placeholder="X"
														style={{ ...inputStyle, width: "100%" }}
													/>
													<input
														type="number"
														step="0.1"
														value={mesh.offsetY}
														onChange={(e) => handleMeshPartChange(mesh.localId, { offsetY: parseFloat(e.target.value) || 0 })}
														placeholder="Y"
														style={{ ...inputStyle, width: "100%" }}
													/>
													<input
														type="number"
														step="0.1"
														value={mesh.offsetZ}
														onChange={(e) => handleMeshPartChange(mesh.localId, { offsetZ: parseFloat(e.target.value) || 0 })}
														placeholder="Z"
														style={{ ...inputStyle, width: "100%" }}
													/>
												</div>
											</div>
											<div style={{ marginBottom: "6px" }}>
												<div style={labelStyle}>Color</div>
												<div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
													<input
														type="color"
														value={mesh.color}
														onChange={(e) => handleMeshPartChange(mesh.localId, { color: e.target.value })}
														style={{ width: "40px", height: "30px", border: `1px solid ${C.btnBorder}`, borderRadius: "3px" }}
													/>
													<input
														type="text"
														value={mesh.color}
														onChange={(e) => handleMeshPartChange(mesh.localId, { color: e.target.value })}
														style={{ flex: 1, ...inputStyle }}
													/>
												</div>
											</div>
											<div style={{ marginBottom: "6px" }}>
												<div style={labelStyle}>Rotation (°)</div>
												<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "2px", width: "100%", boxSizing: "border-box", minWidth: 0 }}>
													<input
														type="number"
														step="1"
														value={mesh.rotationX}
														onChange={(e) => handleMeshPartChange(mesh.localId, { rotationX: parseFloat(e.target.value) || 0 })}
														placeholder="X"
														style={{ ...inputStyle, width: "100%" }}
													/>
													<input
														type="number"
														step="1"
														value={mesh.rotationY}
														onChange={(e) => handleMeshPartChange(mesh.localId, { rotationY: parseFloat(e.target.value) || 0 })}
														placeholder="Y"
														style={{ ...inputStyle, width: "100%" }}
													/>
													<input
														type="number"
														step="1"
														value={mesh.rotationZ}
														onChange={(e) => handleMeshPartChange(mesh.localId, { rotationZ: parseFloat(e.target.value) || 0 })}
														placeholder="Z"
														style={{ ...inputStyle, width: "100%" }}
													/>
												</div>
											</div>
											{}
											<div style={{ marginTop: "8px", borderTop: `1px solid ${C.border}`, paddingTop: "6px" }}>
												<div style={labelStyle}>Textures (PBR)</div>
												{Object.entries(mesh.textures).map(([key, slot]) => (
													<div key={key} style={{ marginBottom: "6px" }}>
														<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
															<div style={{ fontSize: "10px", color: C.textDim }}>{key}</div>
															{slot.previewUrl && (
																<button
																	onClick={() => handleRemoveTexture(mesh.localId, key)}
																	style={{
																		background: "transparent",
																		border: "none",
																		color: "#ff8844",
																		cursor: "pointer",
																		fontSize: "12px",
																		padding: "0 4px"
																	}}
																	title="Remove texture">
																	×
																</button>
															)}
														</div>
														<div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
															<button
																onClick={() => fileInputRefs.current[`${mesh.localId}_${key}`]?.click()}
																style={{
																	flex: 0.6,
																	padding: "4px 6px",
																	background: C.btnBg,
																	border: `1px solid ${C.btnBorder}`,
																	borderRadius: "3px",
																	color: C.textBright,
																	cursor: "pointer",
																	fontFamily: "monospace",
																	fontSize: "10px"
																}}>
																{slot.previewUrl ? "Replace" : "Upload"}
															</button>
															<input
																ref={(el) => {
																	fileInputRefs.current[`${mesh.localId}_${key}`] = el;
																}}
																type="file"
																accept="image/*"
																style={{ display: "none" }}
																onChange={(e) => handleMeshTextureFile(mesh.localId, key, e.target.files?.[0] || null)}
															/>
															<input
																type="text"
																value={slot.exportPath}
																onChange={(e) =>
																	handleMeshPartChange(mesh.localId, {
																		textures: { ...mesh.textures, [key]: { ...slot, exportPath: e.target.value } }
																	})
																}
																placeholder="/game/textures/..."
																style={{ flex: 1, fontSize: "10px", ...inputStyle }}
															/>
														</div>
													</div>
												))}
												<div style={{ marginTop: "8px" }}>
													<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
														<div style={{ fontSize: "10px", color: C.textDim }}>Displacement Scale</div>
													</div>
													<div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
														<input
															type="range"
															min="0"
															max="3"
															step="0.01"
															value={mesh.displacementScale}
															onChange={(e) => handleMeshPartChange(mesh.localId, { displacementScale: parseFloat(e.target.value) })}
															style={{ flex: 1 }}
														/>
														<span style={{ fontSize: "10px", color: C.textBright, minWidth: "32px", textAlign: "right" }}>
															{mesh.displacementScale.toFixed(2)}
														</span>
													</div>
												</div>
												<div style={{ marginTop: "8px" }}>
													<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
														<div style={{ fontSize: "10px", color: C.textDim }}>Normal Map Scale</div>
													</div>
													<div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
														<input
															type="range"
															min="0.1"
															max="3"
															step="0.01"
															value={mesh.normalScale}
															onChange={(e) => handleMeshPartChange(mesh.localId, { normalScale: parseFloat(e.target.value) })}
															style={{ flex: 1 }}
														/>
														<span style={{ fontSize: "10px", color: C.textBright, minWidth: "32px", textAlign: "right" }}>
															{mesh.normalScale.toFixed(2)}
														</span>
													</div>
												</div>
											</div>
										</>
									)}
									{mesh.meshKind === "gltf" && (
										<>
											<div style={{ marginBottom: "6px", borderBottom: `1px solid ${C.border}`, paddingBottom: "6px" }}>
												<div style={labelStyle}>.glb File</div>
												<div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
													<button
														onClick={() => gltfUploadRefs.current[mesh.localId]?.click()}
														style={{
															flex: 0.8,
															padding: "4px 6px",
															background: C.btnBg,
															border: `1px solid ${C.btnBorder}`,
															borderRadius: "3px",
															color: C.textBright,
															cursor: "pointer",
															fontFamily: "monospace",
															fontSize: "10px"
														}}>
														Choose File
													</button>
													<input
														ref={(el) => {
															gltfUploadRefs.current[mesh.localId] = el;
														}}
														type="file"
														accept=".glb,.gltf"
														style={{ display: "none" }}
														onChange={(e) => handleMeshGltfUpload(mesh.localId, e.target.files?.[0] || null)}
													/>
													<span style={{ flex: 1, fontSize: "10px", color: C.textDim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
														{mesh.gltfPath || "—"}
													</span>
												</div>
											</div>
											<div style={{ marginBottom: "6px", borderBottom: `1px solid ${C.border}`, paddingBottom: "6px" }}>
												<div style={labelStyle}>.zip (gltf+bin+textures)</div>
												<div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
													<button
														onClick={() => gltfZipRefs.current[mesh.localId]?.click()}
														style={{
															flex: 0.8,
															padding: "4px 6px",
															background: C.btnBg,
															border: `1px solid ${C.btnBorder}`,
															borderRadius: "3px",
															color: C.textBright,
															cursor: "pointer",
															fontFamily: "monospace",
															fontSize: "10px"
														}}>
														Choose File
													</button>
													<input
														ref={(el) => {
															gltfZipRefs.current[mesh.localId] = el;
														}}
														type="file"
														accept=".zip"
														style={{ display: "none" }}
														onChange={(e) => handleMeshGltfZipUpload(mesh.localId, e.target.files?.[0] || null)}
													/>
													<span style={{ flex: 1, fontSize: "10px", color: C.textDim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
														{gltfZipFileName || "—"}
													</span>
												</div>
											</div>
											<div style={{ marginBottom: "6px" }}>
												<div style={labelStyle}>Server Path</div>
												<div style={{ display: "flex", gap: "4px" }}>
													<input
														type="text"
														value={mesh.gltfPath}
														onChange={(e) => handleMeshPartChange(mesh.localId, { gltfPath: e.target.value })}
														placeholder="/models/..."
														style={{ flex: 1, ...inputStyle }}
													/>
													<button
														onClick={() => handleMeshGltfServerPath(mesh.localId)}
														disabled={!mesh.gltfPath || gltfLoading}
														style={{
															flex: 0.3,
															padding: "4px 8px",
															background: gltfLoading ? "transparent" : C.btnBg,
															border: `1px solid ${C.btnBorder}`,
															borderRadius: "3px",
															color: gltfLoading ? C.btnDisabledText : C.textBright,
															cursor: gltfLoading ? "default" : "pointer",
															fontFamily: "monospace",
															fontSize: "10px"
														}}>
														{gltfLoading ? "⟳" : "▶"}
													</button>
												</div>
											</div>
											<ServerModelList
												gltfPath={mesh.gltfPath}
												onSelect={(path) => {
													handleMeshPartChange(mesh.localId, { gltfPath: path, gltfPreviewUrl: path });
												}}
											/>
											<div style={{ marginBottom: "6px" }}>
												<div style={labelStyle}>Scale</div>
												<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "2px", width: "100%", boxSizing: "border-box", minWidth: 0 }}>
													<input
														type="number"
														step="0.1"
														value={mesh.gltfScaleX}
														onChange={(e) => handleMeshPartChange(mesh.localId, { gltfScaleX: parseFloat(e.target.value) || 1 })}
														placeholder="X"
														style={{ ...inputStyle, width: "100%" }}
													/>
													<input
														type="number"
														step="0.1"
														value={mesh.gltfScaleY}
														onChange={(e) => handleMeshPartChange(mesh.localId, { gltfScaleY: parseFloat(e.target.value) || 1 })}
														placeholder="Y"
														style={{ ...inputStyle, width: "100%" }}
													/>
													<input
														type="number"
														step="0.1"
														value={mesh.gltfScaleZ}
														onChange={(e) => handleMeshPartChange(mesh.localId, { gltfScaleZ: parseFloat(e.target.value) || 1 })}
														placeholder="Z"
														style={{ ...inputStyle, width: "100%" }}
													/>
												</div>
											</div>
											<div style={{ marginBottom: "6px" }}>
												<div style={labelStyle}>Offset</div>
												<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "2px", width: "100%", boxSizing: "border-box", minWidth: 0 }}>
													<input
														type="number"
														step="0.1"
														value={mesh.offsetX}
														onChange={(e) => handleMeshPartChange(mesh.localId, { offsetX: parseFloat(e.target.value) || 0 })}
														placeholder="X"
														style={{ ...inputStyle, width: "100%" }}
													/>
													<input
														type="number"
														step="0.1"
														value={mesh.offsetY}
														onChange={(e) => handleMeshPartChange(mesh.localId, { offsetY: parseFloat(e.target.value) || 0 })}
														placeholder="Y"
														style={{ ...inputStyle, width: "100%" }}
													/>
													<input
														type="number"
														step="0.1"
														value={mesh.offsetZ}
														onChange={(e) => handleMeshPartChange(mesh.localId, { offsetZ: parseFloat(e.target.value) || 0 })}
														placeholder="Z"
														style={{ ...inputStyle, width: "100%" }}
													/>
												</div>
											</div>
											{gltfLoading && <div style={{ marginBottom: "6px", fontSize: "11px", color: C.accent }}>⟳ Loading...</div>}
											{gltfError && <div style={{ marginBottom: "6px", fontSize: "11px", color: "#ff8844" }}>⚠ {gltfError}</div>}
										</>
									)}
								</div>
							)}
						</div>
					))}
				</div>
				{}
				<div style={{ borderTop: `1px solid ${C.border}`, padding: "8px 12px" }}>
					<label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px" }}>
						<input type="checkbox" checked={state.wireframe} onChange={(e) => handleStateChange({ wireframe: e.target.checked })} />
						Wireframe
					</label>
				</div>
				{}
				<div style={{ borderTop: `1px solid ${C.border}`, padding: "8px 12px" }}>
					<div style={labelStyle}>Helpers</div>
					<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
						<label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px" }}>
							<input
								type="checkbox"
								checked={helpers.player}
								onChange={(e) => {
									const newHelpers = { ...helpers, player: e.target.checked };
									setHelpers(newHelpers);
									onHelpersChange(newHelpers);
								}}
							/>
							Player (~1.8m)
						</label>
						<label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px" }}>
							<input
								type="checkbox"
								checked={helpers.unitCube}
								onChange={(e) => {
									const newHelpers = { ...helpers, unitCube: e.target.checked };
									setHelpers(newHelpers);
									onHelpersChange(newHelpers);
								}}
							/>
							Unit Cube
						</label>
					</div>
				</div>
				{}
				<div style={{ borderTop: `1px solid ${C.border}`, padding: "8px 12px" }}>
					<div style={labelStyle}>Physics</div>
					<div style={{ marginBottom: "6px" }}>
						<div style={{ fontSize: "10px", color: C.textDim, marginBottom: "2px" }}>Body Type</div>
						<select value={state.bodyType} onChange={(e) => handleStateChange({ bodyType: e.target.value as any })} style={{ width: "100%", ...inputStyle }}>
							<option>static</option>
							<option>dynamic</option>
							<option>kinematic</option>
						</select>
					</div>
					<div style={rowStyle}>
						<div style={{ flex: 1 }}>
							<div style={{ fontSize: "10px", color: C.textDim, marginBottom: "2px" }}>Gravity</div>
							<input type="number" step="0.1" value={state.gravityScale} onChange={(e) => handleStateChange({ gravityScale: parseFloat(e.target.value) || 1 })} style={{ width: "100%", ...inputStyle }} />
						</div>
						<div style={{ flex: 1 }}>
							<div style={{ fontSize: "10px", color: C.textDim, marginBottom: "2px" }}>Mass</div>
							<input type="number" step="0.1" value={state.mass} onChange={(e) => handleStateChange({ mass: parseFloat(e.target.value) || 1 })} style={{ width: "100%", ...inputStyle }} />
						</div>
					</div>
					<div style={rowStyle}>
						<div style={{ flex: 1 }}>
							<div style={{ fontSize: "10px", color: C.textDim, marginBottom: "2px" }}>Restitution</div>
							<input type="number" step="0.1" value={state.restitution} onChange={(e) => handleStateChange({ restitution: parseFloat(e.target.value) || 0 })} style={{ width: "100%", ...inputStyle }} />
						</div>
						<div style={{ flex: 1 }}>
							<div style={{ fontSize: "10px", color: C.textDim, marginBottom: "2px" }}>Friction</div>
							<input type="number" step="0.1" value={state.friction} onChange={(e) => handleStateChange({ friction: parseFloat(e.target.value) || 0.5 })} style={{ width: "100%", ...inputStyle }} />
						</div>
					</div>
					<div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
						<Btn onClick={() => onStartPhysicsTest(state)}>Drop Test</Btn>
						<Btn onClick={onStopPhysicsTest}>Reset</Btn>
					</div>
				</div>
				{}
				<div style={{ borderTop: `1px solid ${C.border}`, padding: "8px 12px" }}>
					<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
						<div style={labelStyle}>Hitboxes</div>
						<div style={{ display: "flex", gap: "4px" }}>
							<button
								onClick={() => setShowAutoGenPanel(v => !v)}
								style={{
									background: showAutoGenPanel ? C.selectedBg : C.btnBg,
									border: `1px solid ${C.btnBorder}`,
									borderRadius: "3px",
									color: C.textBright,
									cursor: "pointer",
									fontFamily: "monospace",
									fontSize: "10px",
									padding: "2px 6px"
								}}>
								⚡
							</button>
							<button
								onClick={handleAddHitbox}
								style={{
									background: C.btnBg,
									border: `1px solid ${C.btnBorder}`,
									borderRadius: "3px",
									color: C.textBright,
									cursor: "pointer",
									fontFamily: "monospace",
									fontSize: "14px",
									padding: "2px 6px"
								}}>
								+
							</button>
						</div>
					</div>

					{showAutoGenPanel && (
						<div style={{ marginBottom: "8px", padding: "6px", background: "rgba(0,0,0,0.2)", border: `1px solid ${C.border}`, borderRadius: "3px" }}>
							<div style={{ fontSize: "10px", color: C.accent, marginBottom: "6px", fontWeight: "bold", letterSpacing: "0.05em" }}>
								Auto Generate Hitboxes
							</div>
							<div style={{ marginBottom: "6px" }}>
								<div style={{ fontSize: "10px", color: C.textDim, marginBottom: "2px" }}>Mode</div>
								<select value={autoGenOptions.mode ?? "single"}
									onChange={e => setAutoGenOptions(o => ({ ...o, mode: e.target.value as any }))}
									style={{ width: "100%", ...inputStyle }}>
									<option value="single">Single Box</option>
									<option value="children">Per Child</option>
									<option value="meshes">Per Mesh</option>
								</select>
							</div>
							<div style={{ marginBottom: "6px" }}>
								<label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px" }}>
									<input type="checkbox"
										checked={autoGenReplace}
										onChange={e => setAutoGenReplace(e.target.checked)}
									/>
									Replace existing
								</label>
							</div>
							<div style={{ display: "flex", gap: "6px" }}>
								<button
									onClick={() => {
										setAutoGenStatus("Generating...");
										const newHitboxes = onAutoGenerateHitboxes(state, autoGenOptions);
										if (newHitboxes.length > 0) {
											setState(prev => ({
												...prev,
												hitboxes: autoGenReplace
													? newHitboxes
													: [...prev.hitboxes, ...newHitboxes],
											}));
											setAutoGenStatus(`Generated ${newHitboxes.length} hitbox${newHitboxes.length !== 1 ? 'es' : ''}`);
										} else {
											setAutoGenStatus("No hitboxes generated (mesh too small or empty)");
										}
									}}
									style={{
										flex: 1, padding: "6px 4px",
										background: C.btnBg, border: `1px solid ${C.btnBorder}`, borderRadius: "3px",
										color: C.textBright, cursor: "pointer", fontFamily: "monospace", fontSize: "11px"
									}}>
									Generate
								</button>
								<button
									onClick={() => setState(prev => ({ ...prev, hitboxes: [] }))}
									style={{
										flex: 1, padding: "6px 4px",
										background: "transparent", border: `1px solid ${C.btnDisabledBorder}`, borderRadius: "3px",
										color: C.textDim, cursor: "pointer", fontFamily: "monospace", fontSize: "11px"
									}}>
									Clear All
								</button>
							</div>
							{autoGenStatus && (
								<div style={{ marginTop: "4px", fontSize: "10px", color: C.accent }}>{autoGenStatus}</div>
							)}
							<div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
								<button
									onClick={() => {
										const merged = mergeAABBHitboxes(state.hitboxes as any, 0.1) as any as HitboxState[];
										setState(prev => ({ ...prev, hitboxes: merged }));
										setAutoGenStatus(`Merged overlapping, ${merged.length} remaining`);
									}}
									style={{
										flex: 1, padding: "4px 4px",
										background: "transparent", border: `1px solid ${C.btnDisabledBorder}`, borderRadius: "3px",
										color: C.textBright, cursor: "pointer", fontFamily: "monospace", fontSize: "10px"
									}}>
									Merge Overlapping
								</button>
								<button
									onClick={() => {
										const cleaned = removeContainedHitboxes(state.hitboxes as any) as any as HitboxState[];
										setState(prev => ({ ...prev, hitboxes: cleaned }));
										setAutoGenStatus(`Removed contained, ${cleaned.length} remaining`);
									}}
									style={{
										flex: 1, padding: "4px 4px",
										background: "transparent", border: `1px solid ${C.btnDisabledBorder}`, borderRadius: "3px",
										color: C.textBright, cursor: "pointer", fontFamily: "monospace", fontSize: "10px"
									}}>
									Remove Inside
								</button>
							</div>
						</div>
					)}

					{selectedHitboxId && (
					<div style={{
						marginBottom: "6px", padding: "6px",
						background: "rgba(255, 102, 0, 0.15)",
						border: `1px solid #ff6600`,
						borderRadius: "3px",
						fontSize: "10px",
					}}>
						<div style={{ color: "#ff6600", marginBottom: "4px", fontWeight: "bold" }}>
							{mergeMode === "select-target"
								? "Click target hitbox in the 3D scene..."
								: "Hitbox selected"}
						</div>
						<div style={{ display: "flex", gap: "6px" }}>
							<button
								onClick={() => {
									setState(prev => ({
										...prev,
										hitboxes: prev.hitboxes.filter(h => h.localId !== selectedHitboxId),
									}));
									setSelectedHitboxId(null);
								}}
								style={{
									padding: "4px 8px",
									background: "rgba(255,60,60,0.3)",
									border: "1px solid rgba(255,60,60,0.5)",
									borderRadius: "3px",
									color: "#ff6666",
									cursor: "pointer", fontFamily: "monospace", fontSize: "10px"
								}}>
								Delete
							</button>
							<button
								onClick={() => {
									setMergeMode("select-target");
									setMergeSourceId(selectedHitboxId);
								}}
								style={{
									padding: "4px 8px",
									background: "rgba(255,165,0,0.2)",
									border: "1px solid rgba(255,165,0,0.4)",
									borderRadius: "3px",
									color: "#ffaa00",
									cursor: "pointer", fontFamily: "monospace", fontSize: "10px"
								}}>
								Merge…
							</button>
							<button
								onClick={() => setSelectedHitboxId(null)}
								style={{
									padding: "4px 8px",
									background: "transparent",
									border: `1px solid ${C.btnDisabledBorder}`,
									borderRadius: "3px",
									color: C.textDim,
									cursor: "pointer", fontFamily: "monospace", fontSize: "10px"
								}}>
								Deselect
							</button>
						</div>
					</div>
				)}
				{state.hitboxes.length > 0 && (
					<div style={{ marginBottom: "6px", padding: "6px", background: "rgba(0,0,0,0.15)", borderRadius: "3px" }}>
						<div style={{ fontSize: "10px", color: C.textDim, marginBottom: "2px" }}>Catch-all Collision</div>
						<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
							{["player", "npc", "map", "map_decor"].map((layer) => (
								<label key={layer} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px" }}>
									<input type="checkbox"
										checked={state.hitboxes.every((h) => h.collidesWith.includes(layer))}
										onChange={() => handleGlobalCollidesWith(layer)}
									/>
									{layer}
								</label>
							))}
						</div>
					</div>
				)}
				{state.hitboxes.map((hb) => (
						<div
							key={hb.localId}
							style={{
								marginBottom: "6px",
								border: `1px solid ${selectedHitboxId === hb.localId ? "#ff6600" : C.border}`,
								borderRadius: "3px",
								overflow: "hidden"
							}}>
							<div
								onClick={() => {
									toggleHitbox(hb.localId);
									setSelectedHitboxId(hb.localId);
								}}
								style={{
									padding: "6px",
									background: selectedHitboxId === hb.localId ? "rgba(255,102,0,0.15)" : (expandedHitboxes.has(hb.localId) ? C.selectedBg : "rgba(0,0,0,0.2)"),
									cursor: "pointer",
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									fontSize: "11px"
								}}>
								<span>
									{expandedHitboxes.has(hb.localId) ? "▼" : "▶"} {hb.shape}
								</span>
								<button
									onClick={(e) => {
										e.stopPropagation();
										handleDeleteHitbox(hb.localId);
									}}
									style={{
										background: "transparent",
										border: "none",
										color: C.textDim,
										cursor: "pointer",
										fontSize: "12px"
									}}>
									×
								</button>
							</div>
							{expandedHitboxes.has(hb.localId) && (
								<div style={{ padding: "6px", borderTop: `1px solid ${C.border}`, backgroundColor: "rgba(0,0,0,0.3)" }}>
									<div style={{ marginBottom: "6px" }}>
										<div style={{ fontSize: "10px", color: C.textDim, marginBottom: "2px" }}>Shape</div>
										<select value={hb.shape} onChange={(e) => handleHitboxChange(hb.localId, { shape: e.target.value as any })} style={{ width: "100%", ...inputStyle }}>
											<option>box</option>
											<option>sphere</option>
											<option>capsule</option>
										</select>
									</div>
									{(hb.shape === "box" || hb.shape === "sphere") && (
										<div style={{ marginBottom: "6px" }}>
											<div style={{ fontSize: "10px", color: C.textDim, marginBottom: "2px" }}>Size Type</div>
											<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "4px" }}>
												{["full", "auto", "explicit"].map((k) => (
													<label key={k} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px" }}>
														<input type="radio" checked={hb.sizeKind === k} onChange={() => handleHitboxChange(hb.localId, { sizeKind: k as any })} />
														{k}
													</label>
												))}
											</div>
										</div>
									)}
									{hb.shape === "box" && hb.sizeKind === "explicit" && (
										<div style={{ marginBottom: "6px" }}>
											<div style={{ fontSize: "10px", color: C.textDim, marginBottom: "2px" }}>Size</div>
											<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "2px", width: "100%", boxSizing: "border-box", minWidth: 0 }}>
												<input type="number" step="0.1" value={hb.sizeX} onChange={(e) => handleHitboxChange(hb.localId, { sizeX: parseFloat(e.target.value) || 1 })} placeholder="X" style={{ ...inputStyle, width: "100%" }} />
												<input type="number" step="0.1" value={hb.sizeY} onChange={(e) => handleHitboxChange(hb.localId, { sizeY: parseFloat(e.target.value) || 1 })} placeholder="Y" style={{ ...inputStyle, width: "100%" }} />
												<input type="number" step="0.1" value={hb.sizeZ} onChange={(e) => handleHitboxChange(hb.localId, { sizeZ: parseFloat(e.target.value) || 1 })} placeholder="Z" style={{ ...inputStyle, width: "100%" }} />
											</div>
										</div>
									)}
									{hb.shape === "sphere" && hb.sizeKind === "explicit" && (
										<div style={{ marginBottom: "6px" }}>
											<div style={{ fontSize: "10px", color: C.textDim, marginBottom: "2px" }}>Radius</div>
											<input type="number" step="0.1" value={hb.radius} onChange={(e) => handleHitboxChange(hb.localId, { radius: parseFloat(e.target.value) || 0.5 })} style={{ width: "100%", ...inputStyle }} />
										</div>
									)}
									{hb.shape === "capsule" && (
										<>
											<div style={{ marginBottom: "6px" }}>
												<div style={{ fontSize: "10px", color: C.textDim, marginBottom: "2px" }}>Radius</div>
												<input type="number" step="0.1" value={hb.radius} onChange={(e) => handleHitboxChange(hb.localId, { radius: parseFloat(e.target.value) || 0.5 })} style={{ width: "100%", ...inputStyle }} />
											</div>
											<div style={{ marginBottom: "6px" }}>
												<div style={{ fontSize: "10px", color: C.textDim, marginBottom: "2px" }}>Height</div>
												<input type="number" step="0.1" value={hb.height} onChange={(e) => handleHitboxChange(hb.localId, { height: parseFloat(e.target.value) || 1 })} style={{ width: "100%", ...inputStyle }} />
											</div>
										</>
									)}
									<div style={{ marginBottom: "6px" }}>
										<div style={{ fontSize: "10px", color: C.textDim, marginBottom: "2px" }}>Offset</div>
										<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "2px", width: "100%", boxSizing: "border-box", minWidth: 0 }}>
											<input type="number" step="0.1" value={hb.offsetX} onChange={(e) => handleHitboxChange(hb.localId, { offsetX: parseFloat(e.target.value) || 0 })} placeholder="X" style={{ ...inputStyle, width: "100%" }} />
											<input type="number" step="0.1" value={hb.offsetY} onChange={(e) => handleHitboxChange(hb.localId, { offsetY: parseFloat(e.target.value) || 0 })} placeholder="Y" style={{ ...inputStyle, width: "100%" }} />
											<input type="number" step="0.1" value={hb.offsetZ} onChange={(e) => handleHitboxChange(hb.localId, { offsetZ: parseFloat(e.target.value) || 0 })} placeholder="Z" style={{ ...inputStyle, width: "100%" }} />
										</div>
									</div>
									<div style={{ marginBottom: "6px" }}>
										<div style={{ fontSize: "10px", color: C.textDim, marginBottom: "2px" }}>Relative Offset</div>
										<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "2px", width: "100%", boxSizing: "border-box", minWidth: 0 }}>
											<input
												type="number"
												step="0.1"
												value={hb.relativeOffsetX}
												onChange={(e) => handleHitboxChange(hb.localId, { relativeOffsetX: parseFloat(e.target.value) || 0 })}
												placeholder="X"
												style={{ ...inputStyle, width: "100%" }}
											/>
											<input
												type="number"
												step="0.1"
												value={hb.relativeOffsetY}
												onChange={(e) => handleHitboxChange(hb.localId, { relativeOffsetY: parseFloat(e.target.value) || 0 })}
												placeholder="Y"
												style={{ ...inputStyle, width: "100%" }}
											/>
											<input
												type="number"
												step="0.1"
												value={hb.relativeOffsetZ}
												onChange={(e) => handleHitboxChange(hb.localId, { relativeOffsetZ: parseFloat(e.target.value) || 0 })}
												placeholder="Z"
												style={{ ...inputStyle, width: "100%" }}
											/>
										</div>
									</div>
									<div style={{ marginBottom: "6px" }}>
										<div style={{ fontSize: "10px", color: C.textDim, marginBottom: "2px" }}>Rotation (°)</div>
										<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "2px", width: "100%", boxSizing: "border-box", minWidth: 0 }}>
											<input type="number" step="1" value={hb.rotationX} onChange={(e) => handleHitboxChange(hb.localId, { rotationX: parseFloat(e.target.value) || 0 })} placeholder="X" style={{ ...inputStyle, width: "100%" }} />
											<input type="number" step="1" value={hb.rotationY} onChange={(e) => handleHitboxChange(hb.localId, { rotationY: parseFloat(e.target.value) || 0 })} placeholder="Y" style={{ ...inputStyle, width: "100%" }} />
											<input type="number" step="1" value={hb.rotationZ} onChange={(e) => handleHitboxChange(hb.localId, { rotationZ: parseFloat(e.target.value) || 0 })} placeholder="Z" style={{ ...inputStyle, width: "100%" }} />
										</div>
									</div>
									<div style={{ marginBottom: "6px" }}>
										<div style={{ fontSize: "10px", color: C.textDim, marginBottom: "2px" }}>Collides With</div>
										<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
											{["player", "npc", "map", "map_decor"].map((layer) => (
												<label key={layer} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px" }}>
													<input type="checkbox" checked={hb.collidesWith.includes(layer)} onChange={() => handleToggleCollidesWith(hb.localId, layer)} />
													{layer}
												</label>
											))}
										</div>
									</div>
									<div style={{ marginBottom: "6px" }}>
										<label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", marginBottom: "6px" }}>
											<input type="checkbox" checked={hb.isSensor} onChange={(e) => handleHitboxChange(hb.localId, { isSensor: e.target.checked })} />
											Is Sensor (Trigger)
										</label>
										{hb.isSensor && (
											<>
												<div style={{ fontSize: "10px", color: C.textDim, marginBottom: "2px" }}>Trigger Tag</div>
												<input type="text" value={hb.tag} onChange={(e) => handleHitboxChange(hb.localId, { tag: e.target.value })} placeholder="tag" style={{ width: "100%", ...inputStyle }} />
											</>
										)}
									</div>
								</div>
							)}
						</div>
					))}
				</div>
				{}
			<div style={{ borderTop: `1px solid ${C.border}`, padding: "8px 12px" }}>
				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
					<div style={labelStyle}>Animations</div>
					<div style={{ display: "flex", gap: "4px" }}>
						<button
							onClick={handleAddAnimation}
							style={{
								background: C.btnBg,
								border: `1px solid ${C.btnBorder}`,
								borderRadius: "3px",
								color: C.textBright,
								cursor: "pointer",
								padding: "4px 8px",
								fontFamily: "monospace",
								fontSize: "11px"
							}}>
							+ Waypoint
						</button>
						<button
							onClick={handleAddClipAnimation}
							style={{
								background: C.btnBg,
								border: `1px solid ${C.btnBorder}`,
								borderRadius: "3px",
								color: C.textBright,
								cursor: "pointer",
								padding: "4px 8px",
								fontFamily: "monospace",
								fontSize: "11px"
							}}>
							+ Clip
						</button>
					</div>
				</div>
					{state.animations.map((anim) => (
						<div
							key={anim.localId}
							style={{
								background: "rgba(0,0,0,0.2)",
								border: `1px solid ${C.border}`,
								borderRadius: "4px",
								marginBottom: "6px",
								overflow: "hidden"
							}}>
							<div
								onClick={() => toggleAnimation(anim.localId)}
								style={{
									padding: "6px 8px",
									background: expandedAnimations.has(anim.localId) ? C.selectedBg : "transparent",
									cursor: "pointer",
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									fontSize: "11px",
									borderBottom: expandedAnimations.has(anim.localId) ? `1px solid ${C.border}` : "none"
								}}>
								<span>
									{expandedAnimations.has(anim.localId) ? "▼" : "▶"} {anim.name}
								</span>
								<div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
									<button
										onClick={(e) => {
											e.stopPropagation();
											onPlayAnimationItem(anim);
										}}
										style={{
											background: "transparent",
											border: "none",
											color: C.accent,
											cursor: "pointer",
											padding: "2px 4px",
											fontSize: "12px"
										}}>
										▶
									</button>
									<button
										onClick={(e) => {
											e.stopPropagation();
											handleDeleteAnimation(anim.localId);
										}}
										style={{
											background: "transparent",
											border: "none",
											color: "#ff8844",
											cursor: "pointer",
											padding: "2px 4px",
											fontSize: "12px"
										}}>
										×
									</button>
								</div>
							</div>
							{expandedAnimations.has(anim.localId) && (
								<div style={{ padding: "8px" }}>
									<div style={{ marginBottom: "6px" }}>
										<div style={{ fontSize: "10px", color: C.textDim, marginBottom: "2px" }}>Name</div>
										<input type="text" value={anim.name} onChange={(e) => handleAnimationChange(anim.localId, { name: e.target.value })} style={{ width: "100%", ...inputStyle }} />
									</div>
									<div style={{ marginBottom: "6px" }}>
										<div style={{ fontSize: "10px", color: C.textDim, marginBottom: "2px" }}>Target Mesh</div>
										<select
											value={anim.targetMeshId}
											onChange={(e) => handleAnimationChange(anim.localId, { targetMeshId: e.target.value })}
											style={{ width: "100%", ...inputStyle }}>
											{state.meshes.map((m) => (
												<option key={m.localId} value={m.localId}>
													{m.name}
												</option>
											))}
										</select>
									</div>
									{anim.type === 'clip' && (
										<div style={{ marginBottom: "6px" }}>
											<div style={{ fontSize: "10px", color: C.textDim, marginBottom: "2px" }}>Clip</div>
											<select
												value={anim.clipName}
												onChange={(e) => handleAnimationChange(anim.localId, { clipName: e.target.value })}
												style={{ width: "100%", ...inputStyle }}>
												{(gltfClipsByMesh[anim.targetMeshId] || []).map((clip) => (
													<option key={clip} value={clip}>{clip}</option>
												))}
											</select>
										</div>
									)}
									<div style={{ marginBottom: "6px" }}>
										<div style={{ fontSize: "10px", color: C.textDim, marginBottom: "2px" }}>Speed (units/s)</div>
										<input type="number" step="0.1" value={anim.speed} onChange={(e) => handleAnimationChange(anim.localId, { speed: parseFloat(e.target.value) || 1 })} style={{ width: "100%", ...inputStyle }} />
									</div>
									{anim.type === 'waypoints' && (
										<div style={{ marginBottom: "6px" }}>
											<div style={{ fontSize: "10px", color: C.textDim, marginBottom: "2px" }}>Pause at Waypoint (ms)</div>
											<input type="number" step="10" value={anim.pauseAtWaypoint} onChange={(e) => handleAnimationChange(anim.localId, { pauseAtWaypoint: parseInt(e.target.value) || 0 })} style={{ width: "100%", ...inputStyle }} />
										</div>
									)}
									<div style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
										<label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", flex: 1 }}>
											<input type="checkbox" checked={anim.loop} onChange={(e) => handleAnimationChange(anim.localId, { loop: e.target.checked })} />
											Loop
										</label>
										<label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", flex: 1 }}>
											<input type="checkbox" checked={anim.autoPlay} onChange={(e) => handleAnimationChange(anim.localId, { autoPlay: e.target.checked })} />
											Auto-trigger
										</label>
									</div>
									{anim.type === 'waypoints' && (
										<div style={{ marginBottom: "6px" }}>
											<div style={{ fontSize: "10px", color: C.textDim, marginBottom: "4px", display: "flex", justifyContent: "space-between" }}>
												<span>Waypoints</span>
												<button
													onClick={() => handleAddWaypoint(anim.localId)}
													style={{
														background: C.btnBg,
														border: `1px solid ${C.btnBorder}`,
														borderRadius: "2px",
														color: C.textBright,
														cursor: "pointer",
														padding: "2px 4px",
														fontFamily: "monospace",
														fontSize: "10px"
													}}>
													+ Waypoint
												</button>
											</div>
											{anim.waypoints.map((wp, idx) => (
												<div key={idx} style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "6px", padding: "6px", background: "rgba(0,0,0,0.2)", borderRadius: "3px" }}>
													<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", color: C.textDim }}>
														<span>Waypoint {idx + 1}</span>
														<button
															onClick={() => handleDeleteWaypoint(anim.localId, idx)}
															style={{
																background: "transparent",
																border: "none",
																color: "#ff8844",
																cursor: "pointer",
																padding: "0 2px",
																fontSize: "12px"
															}}>
															×
														</button>
													</div>
													<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "2px", width: "100%", boxSizing: "border-box", minWidth: 0 }}>
														<div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
															<span style={{ fontSize: "9px", color: C.textDim }}>X</span>
															<input type="number" step="0.1" value={wp.position.x} onChange={(e) => handleWaypointChange(anim.localId, idx, "x", parseFloat(e.target.value) || 0)} placeholder="X" style={{ ...inputStyle, width: "100%", fontSize: "11px", padding: "3px 4px" }} />
														</div>
														<div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
															<span style={{ fontSize: "9px", color: C.textDim }}>Y</span>
															<input type="number" step="0.1" value={wp.position.y} onChange={(e) => handleWaypointChange(anim.localId, idx, "y", parseFloat(e.target.value) || 0)} placeholder="Y" style={{ ...inputStyle, width: "100%", fontSize: "11px", padding: "3px 4px" }} />
														</div>
														<div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
															<span style={{ fontSize: "9px", color: C.textDim }}>Z</span>
															<input type="number" step="0.1" value={wp.position.z} onChange={(e) => handleWaypointChange(anim.localId, idx, "z", parseFloat(e.target.value) || 0)} placeholder="Z" style={{ ...inputStyle, width: "100%", fontSize: "11px", padding: "3px 4px" }} />
														</div>
													</div>
													<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "2px", width: "100%", boxSizing: "border-box", minWidth: 0 }}>
														<div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
															<span style={{ fontSize: "9px", color: C.accent }}>Rot X</span>
															<input type="number" step="0.1" value={wp.rotation?.x ?? 0} onChange={(e) => handleWaypointChange(anim.localId, idx, "x", parseFloat(e.target.value) || 0, "rotation")} placeholder="X" style={{ ...inputStyle, width: "100%", fontSize: "11px", padding: "3px 4px" }} />
														</div>
														<div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
															<span style={{ fontSize: "9px", color: C.accent }}>Rot Y</span>
															<input type="number" step="0.1" value={wp.rotation?.y ?? 0} onChange={(e) => handleWaypointChange(anim.localId, idx, "y", parseFloat(e.target.value) || 0, "rotation")} placeholder="Y" style={{ ...inputStyle, width: "100%", fontSize: "11px", padding: "3px 4px" }} />
														</div>
														<div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
															<span style={{ fontSize: "9px", color: C.accent }}>Rot Z</span>
															<input type="number" step="0.1" value={wp.rotation?.z ?? 0} onChange={(e) => handleWaypointChange(anim.localId, idx, "z", parseFloat(e.target.value) || 0, "rotation")} placeholder="Z" style={{ ...inputStyle, width: "100%", fontSize: "11px", padding: "3px 4px" }} />
														</div>
													</div>
												</div>
											))}
										</div>
									)}
								</div>
							)}
						</div>
					))}
				</div>
				{}
			</div>
			{}
			<div style={{ flex: "0 0 auto", borderTop: `1px solid ${C.border}`, padding: "8px 12px", display: "flex", gap: "6px" }}>
				<Btn onClick={handleSave} disabled={isSaving} style={{ flex: 1, padding: "7px 0" }}>
					{isSaving ? "Saving..." : "Save"}
				</Btn>
			</div>
		</div>
	);
}
function ServerModelList({ gltfPath, onSelect }: { gltfPath: string; onSelect: (path: string) => void }) {
	const [models, setModels] = useState<{ name: string; path: string }[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	useEffect(() => {
		setLoading(true);
		setError(null);
		fetch("/api/models")
			.then((r) => r.json())
			.then((data: { name: string; path: string }[]) => {
				setModels(data);
				setLoading(false);
			})
			.catch(() => {
				setError("Failed to load models");
				setLoading(false);
			});
	}, []);
	return (
		<div style={{ marginBottom: "6px" }}>
			<div style={{ fontSize: "10px", color: C.textDim, marginBottom: "4px" }}>From Server</div>
			{loading && <div style={{ fontSize: "10px", color: C.textDim, padding: "4px 0" }}>Loading...</div>}
			{error && <div style={{ fontSize: "10px", color: "#ff8844", padding: "4px 0" }}>{error}</div>}
			{!loading && models.length === 0 && !error && (
				<div style={{ fontSize: "10px", color: C.textDim, padding: "4px 0" }}>No models found</div>
			)}
			{!loading && models.length > 0 && (
				<div style={{ display: "flex", flexDirection: "column", gap: "2px", maxHeight: "140px", overflowY: "auto" }}>
					{models.map((m) => (
						<button
							key={m.name}
							onClick={() => onSelect(m.path)}
							style={{
								display: "flex",
								alignItems: "center",
								padding: "4px 8px",
								background: m.path === gltfPath ? C.selectedBg : C.btnBg,
								border: `1px solid ${m.path === gltfPath ? C.accent : C.btnBorder}`,
								borderRadius: "3px",
								color: m.path === gltfPath ? C.textBright : C.text,
								cursor: "pointer",
								fontFamily: "monospace",
								fontSize: "10px",
								textAlign: "left"
							}}>
							<span style={{ color: C.textDim, marginRight: "6px", fontSize: "9px" }}>▶</span>
							{m.name}
						</button>
					))}
				</div>
			)}
		</div>
	);
}
