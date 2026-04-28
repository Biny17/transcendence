import { useState, useCallback } from "react";
import type { HitboxState } from "./ComponentCreatorUI";
import { generateAutoMeshHitboxes, AutoMeshOptions } from "@/ThreeWrapper/2.world/util/autoMeshHitbox";
import type * as THREE from "three";
export interface HitboxEditorState {
	hitboxes: HitboxState[];
	hoveredIdx: number | null;
	selectedIdx: number | null;
	isSelectingSecond: boolean;
	setHoveredIdx: (idx: number | null) => void;
	setSelectedIdx: (idx: number | null) => void;
	generate: (asset: THREE.Object3D | THREE.Group, opts: AutoMeshOptions) => void;
	mergeSelected: () => void;
	deleteSelected: () => void;
	clearSelection: () => void;
	updateHitbox: (idx: number, updates: Partial<HitboxState>) => void;
}
export function useHitboxEditor(initial: HitboxState[] = []): HitboxEditorState {
	const [hitboxes, setHitboxes] = useState<HitboxState[]>(initial);
	const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
	const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
	const [isSelectingSecond, setIsSelectingSecond] = useState(false);
	const generate = useCallback((asset: THREE.Object3D | THREE.Group, opts: AutoMeshOptions) => {
		const generated = generateAutoMeshHitboxes(asset, opts);
		setHitboxes(generated);
		setSelectedIdx(null);
		setIsSelectingSecond(false);
	}, []);
	const mergeSelected = useCallback(() => {
		if (selectedIdx === null || hoveredIdx === null || selectedIdx === hoveredIdx) return;
		const a = hitboxes[selectedIdx];
		const b = hitboxes[hoveredIdx];
		if (!a || !b) return;
		const merged = mergeTwoHitboxes(a, b);
		setHitboxes((prev) => {
			const next = [...prev];
			next[selectedIdx] = merged;
			if (hoveredIdx > selectedIdx) {
				next.splice(hoveredIdx, 1);
			} else if (hoveredIdx < selectedIdx) {
				next.splice(hoveredIdx, 1);
			}
			return next;
		});
		setSelectedIdx(null);
		setIsSelectingSecond(false);
	}, [selectedIdx, hoveredIdx, hitboxes]);
	const deleteSelected = useCallback(() => {
		if (selectedIdx === null) return;
		setHitboxes((prev) => prev.filter((_, i) => i !== selectedIdx));
		setSelectedIdx(null);
		setIsSelectingSecond(false);
	}, [selectedIdx]);
	const clearSelection = useCallback(() => {
		setSelectedIdx(null);
		setIsSelectingSecond(false);
	}, []);
	const updateHitbox = useCallback((idx: number, updates: Partial<HitboxState>) => {
		setHitboxes((prev) => prev.map((h, i) => (i === idx ? { ...h, ...updates } : h)));
	}, []);
	return {
		hitboxes,
		hoveredIdx,
		selectedIdx,
		isSelectingSecond,
		setHoveredIdx,
		setSelectedIdx,
		generate,
		mergeSelected,
		deleteSelected,
		clearSelection,
		updateHitbox,
	};
}
function mergeTwoHitboxes(a: HitboxState, b: HitboxState): HitboxState {
	if (a.shape === "box" && b.shape === "box") {
		const hxA = a.sizeX / 2, hyA = a.sizeY / 2, hzA = a.sizeZ / 2;
		const hxB = b.sizeX / 2, hyB = b.sizeY / 2, hzB = b.sizeZ / 2;
		const minX = Math.min(a.relativeOffsetX - hxA, b.relativeOffsetX - hxB);
		const maxX = Math.max(a.relativeOffsetX + hxA, b.relativeOffsetX + hxB);
		const minY = Math.min(a.relativeOffsetY - hyA, b.relativeOffsetY - hyB);
		const maxY = Math.max(a.relativeOffsetY + hyA, b.relativeOffsetY + hyB);
		const minZ = Math.min(a.relativeOffsetZ - hzA, b.relativeOffsetZ - hzB);
		const maxZ = Math.max(a.relativeOffsetZ + hzA, b.relativeOffsetZ + hzB);
		return {
			...a,
			shape: "box",
			sizeKind: "explicit",
			sizeX: maxX - minX,
			sizeY: maxY - minY,
			sizeZ: maxZ - minZ,
			relativeOffsetX: (minX + maxX) / 2,
			relativeOffsetY: (minY + maxY) / 2,
			relativeOffsetZ: (minZ + maxZ) / 2,
			offsetX: (minX + maxX) / 2,
			offsetY: (minY + maxY) / 2,
			offsetZ: (minZ + maxZ) / 2,
		};
	}
	const rA = a.shape === "sphere" ? a.radius : Math.max(a.sizeX, a.sizeY, a.sizeZ) / 2;
	const rB = b.shape === "sphere" ? b.radius : Math.max(b.sizeX, b.sizeY, b.sizeZ) / 2;
	const maxR = Math.max(rA, rB);
	const dist = Math.sqrt(
		Math.pow(a.relativeOffsetX - b.relativeOffsetX, 2) +
		Math.pow(a.relativeOffsetY - b.relativeOffsetY, 2) +
		Math.pow(a.relativeOffsetZ - b.relativeOffsetZ, 2)
	);
	const newR = Math.max(maxR, dist + rB);
	return {
		...a,
		shape: "sphere",
		sizeKind: "explicit",
		radius: newR,
		sizeX: newR * 2,
		sizeY: newR * 2,
		sizeZ: newR * 2,
	};
}
