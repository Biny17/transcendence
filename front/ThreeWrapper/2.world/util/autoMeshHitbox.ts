import * as THREE from "three";

export type AutoMeshOptions = {
	mode?: "single" | "children" | "meshes";
	minSize?: number;
};

export type AutoHitboxResult = {
	localId: string;
	shape: "box" | "sphere" | "capsule";
	sizeKind: "explicit";
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

let idCounter = 0;

function generateId(prefix = "auto"): string {
	return `${prefix}_${idCounter++}_${Date.now().toString(36).slice(-4)}`;
}

function computeAABB(
	target: THREE.Object3D,
	root: THREE.Object3D,
): { size: THREE.Vector3; center: THREE.Vector3 } {
	root.updateMatrixWorld(true);
	const box = new THREE.Box3().setFromObject(target);
	const size = box.getSize(new THREE.Vector3());
	const center = box.getCenter(new THREE.Vector3());
	const rootPos = new THREE.Vector3();
	root.getWorldPosition(rootPos);
	center.sub(rootPos);
	return { size, center };
}

function buildResult(center: THREE.Vector3, size: THREE.Vector3, localId: string): AutoHitboxResult {
	return {
		localId,
		shape: "box",
		sizeKind: "explicit",
		sizeX: size.x,
		sizeY: size.y,
		sizeZ: size.z,
		radius: 0,
		height: 0,
		offsetX: center.x,
		offsetY: center.y,
		offsetZ: center.z,
		relativeOffsetX: 0,
		relativeOffsetY: 0,
		relativeOffsetZ: 0,
		rotationX: 0,
		rotationY: 0,
		rotationZ: 0,
		collidesWith: [],
		isSensor: false,
		tag: "",
	};
}

export function generateAutoMeshHitboxes(
	root: THREE.Object3D | THREE.Group,
	options: AutoMeshOptions = {},
): AutoHitboxResult[] {
	const mode = options.mode ?? "single";
	const minSize = options.minSize ?? 0.05;

	root.updateMatrixWorld(true);

	const targets: THREE.Object3D[] = [];

	if (mode === "single") {
		targets.push(root);
	} else if (mode === "children" && root instanceof THREE.Group) {
		for (const child of root.children) {
			targets.push(child);
		}
	} else if (mode === "meshes") {
		root.traverse((obj: THREE.Object3D) => {
			if (obj instanceof THREE.Mesh && obj.geometry) {
				targets.push(obj);
			}
		});
	} else if (mode === "children" && !(root instanceof THREE.Group)) {
		targets.push(root);
	}

	if (targets.length === 0) return [];

	return targets
		.map((target) => {
			const { size, center } = computeAABB(target, root);
			const maxExtent = Math.max(size.x, size.y, size.z);
			if (maxExtent < minSize) return null;
			return buildResult(center, size, generateId("cc_hb"));
		})
		.filter((r): r is AutoHitboxResult => r !== null);
}

function getAABB(hb: { offsetX: number; offsetY: number; offsetZ: number; sizeX: number; sizeY: number; sizeZ: number }) {
	return {
		minX: hb.offsetX - hb.sizeX / 2,
		minY: hb.offsetY - hb.sizeY / 2,
		minZ: hb.offsetZ - hb.sizeZ / 2,
		maxX: hb.offsetX + hb.sizeX / 2,
		maxY: hb.offsetY + hb.sizeY / 2,
		maxZ: hb.offsetZ + hb.sizeZ / 2,
	};
}

function intervalsOverlap(aMin: number, aMax: number, bMin: number, bMax: number): boolean {
	return aMin <= bMax && aMax >= bMin;
}

function gap(aMin: number, aMax: number, bMin: number, bMax: number): number {
	if (intervalsOverlap(aMin, aMax, bMin, bMax)) return 0;
	return Math.min(Math.abs(aMax - bMin), Math.abs(aMin - bMax));
}

function isContained(inner: ReturnType<typeof getAABB>, outer: ReturnType<typeof getAABB>): boolean {
	return (
		inner.minX >= outer.minX &&
		inner.maxX <= outer.maxX &&
		inner.minY >= outer.minY &&
		inner.maxY <= outer.maxY &&
		inner.minZ >= outer.minZ &&
		inner.maxZ <= outer.maxZ
	);
}

export function mergeAABBHitboxes(results: AutoHitboxResult[], mergeDist = 0.1): AutoHitboxResult[] {
	const boxResults = results.filter((r) => r.shape === "box");
	const nonBoxResults = results.filter((r) => r.shape !== "box");

	let merged = [...boxResults];
	let changed = true;

	while (changed) {
		changed = false;
		for (let i = 0; i < merged.length; i++) {
			for (let j = i + 1; j < merged.length; j++) {
				const a = getAABB(merged[i]);
				const b = getAABB(merged[j]);

				const overlapX = intervalsOverlap(a.minX, a.maxX, b.minX, b.maxX);
				const overlapY = intervalsOverlap(a.minY, a.maxY, b.minY, b.maxY);
				const overlapZ = intervalsOverlap(a.minZ, a.maxZ, b.minZ, b.maxZ);

				const axesOverlap = (overlapX ? 1 : 0) + (overlapY ? 1 : 0) + (overlapZ ? 1 : 0);

				if (axesOverlap === 3 || (axesOverlap >= 2 && gap(a.minX, a.maxX, b.minX, b.maxX) <= mergeDist && gap(a.minY, a.maxY, b.minY, b.maxY) <= mergeDist && gap(a.minZ, a.maxZ, b.minZ, b.maxZ) <= mergeDist)) {
					const minX = Math.min(a.minX, b.minX);
					const maxX = Math.max(a.maxX, b.maxX);
					const minY = Math.min(a.minY, b.minY);
					const maxY = Math.max(a.maxY, b.maxY);
					const minZ = Math.min(a.minZ, b.minZ);
					const maxZ = Math.max(a.maxZ, b.maxZ);

					const newHb: AutoHitboxResult = {
						...merged[i],
						localId: generateId("cc_hb"),
						sizeX: maxX - minX,
						sizeY: maxY - minY,
						sizeZ: maxZ - minZ,
						offsetX: (minX + maxX) / 2,
						offsetY: (minY + maxY) / 2,
						offsetZ: (minZ + maxZ) / 2,
						rotationX: 0,
						rotationY: 0,
						rotationZ: 0,
					};

					merged = [...merged.slice(0, i), ...merged.slice(i + 1, j), ...merged.slice(j + 1), newHb];
					changed = true;
					break;
				}
			}
			if (changed) break;
		}
	}

	return [...merged, ...nonBoxResults];
}

export function removeContainedHitboxes(results: AutoHitboxResult[]): AutoHitboxResult[] {
	const boxResults = results.filter((r) => r.shape === "box");
	const nonBoxResults = results.filter((r) => r.shape !== "box");

	const kept = new Set<number>();
	for (let i = 0; i < boxResults.length; i++) {
		let contained = false;
		for (let j = 0; j < boxResults.length; j++) {
			if (i === j) continue;
			const a = getAABB(boxResults[i]);
			const b = getAABB(boxResults[j]);
			if (isContained(a, b) && !isContained(b, a)) {
				contained = true;
				break;
			}
		}
		if (!contained) kept.add(i);
	}

	return [...Array.from(kept).map((i) => boxResults[i]), ...nonBoxResults];
}
