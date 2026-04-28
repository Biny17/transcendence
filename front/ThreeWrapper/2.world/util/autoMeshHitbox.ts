import * as THREE from "three";
import type { Vec3 } from "@/ThreeWrapper/2.world/tools/ObjectManager";
import type { HitboxState } from "@/ThreeWrapper/4.module/modules/editor/components/ComponentCreatorUI";

export type AutoMeshOptions = {
	minSize?: number;
	maxCount?: number;
	mergeDist?: number;
	preferShape?: "box" | "sphere" | "capsule";
	preserveMaterials?: boolean;
};

type InternalHitbox = {
	shape: { kind: "box"; halfExtents: Vec3 } | { kind: "sphere"; radius: number } | { kind: "capsule"; radius: number; height: number };
	relativeOffset: Vec3;
	rotation: Vec3;
	materialIndex?: number;
};

function computeMeshOBB(mesh: THREE.Mesh, root: THREE.Object3D): { halfExtents: THREE.Vector3; offset: THREE.Vector3; rotation: THREE.Euler } {
	if (!mesh.geometry.boundingBox) {
		mesh.geometry.computeBoundingBox();
	}
	const box = mesh.geometry.boundingBox!;
	const size = new THREE.Vector3().subVectors(box.max, box.min);

	const geomCenter = new THREE.Vector3().addVectors(box.min, box.max).multiplyScalar(0.5);

	const worldCenter = geomCenter.clone().applyMatrix4(mesh.matrixWorld);
	const rootInverse = new THREE.Matrix4().copy(root.matrixWorld).invert();
	const localCenter = worldCenter.clone().applyMatrix4(rootInverse);

	const euler = new THREE.Euler().setFromRotationMatrix(mesh.matrixWorld, "XYZ");

	return {
		halfExtents: new THREE.Vector3(size.x / 2, size.y / 2, size.z / 2),
		offset: localCenter,
		rotation: euler,
	};
}

function shapeFromHalfExtents(half: THREE.Vector3, preferShape: AutoMeshOptions["preferShape"]): InternalHitbox["shape"] {
	const { x, y, z } = half;
	const max = Math.max(x, y, z);
	const min = Math.min(x, y, z);
	const aspect = max / (min || 0.001);

	if (y > 2 * Math.max(x, z) && aspect > 3) {
		return { kind: "capsule", radius: Math.max(x, z), height: y * 2 };
	}

	if (Math.abs(x - y) < 0.1 && Math.abs(y - z) < 0.1) {
		const r = Math.sqrt(x * x + y * y + z * z);
		return { kind: "sphere", radius: r };
	}

	if (preferShape === "sphere") {
		const r = Math.max(x, y, z);
		return { kind: "sphere", radius: r };
	}
	if (preferShape === "capsule") {
		return { kind: "capsule", radius: Math.max(x, z), height: y * 2 };
	}

	return { kind: "box", halfExtents: { x, y, z } };
}

function mergeBoxes(a: InternalHitbox, b: InternalHitbox, mergeDist: number): InternalHitbox | null {
	if (a.shape.kind !== "box" || b.shape.kind !== "box") return null;

	const dist = Math.sqrt(
		Math.pow(a.relativeOffset.x - b.relativeOffset.x, 2) +
		Math.pow(a.relativeOffset.y - b.relativeOffset.y, 2) +
		Math.pow(a.relativeOffset.z - b.relativeOffset.z, 2)
	);
	if (dist > mergeDist) return null;

	const ha = a.shape.halfExtents;
	const hb = b.shape.halfExtents;
	const oa = a.relativeOffset;
	const ob = b.relativeOffset;

	const minX = Math.min(oa.x - ha.x, ob.x - hb.x);
	const maxX = Math.max(oa.x + ha.x, ob.x + hb.x);
	const minY = Math.min(oa.y - ha.y, ob.y - hb.y);
	const maxY = Math.max(oa.y + ha.y, ob.y + hb.y);
	const minZ = Math.min(oa.z - ha.z, ob.z - hb.z);
	const maxZ = Math.max(oa.z + ha.z, ob.z + hb.z);

	const cx = (minX + maxX) / 2;
	const cy = (minY + maxY) / 2;
	const cz = (minZ + maxZ) / 2;
	const hx = (maxX - minX) / 2;
	const hy = (maxY - minY) / 2;
	const hz = (maxZ - minZ) / 2;

	return {
		shape: { kind: "box", halfExtents: { x: hx, y: hy, z: hz } },
		relativeOffset: { x: cx, y: cy, z: cz },
	};
}

function runMerging(boxes: InternalHitbox[], mergeDist: number): InternalHitbox[] {
	if (mergeDist <= 0) return boxes;
	let merged = true;
	while (merged) {
		merged = false;
		for (let i = 0; i < boxes.length && !merged; i++) {
			for (let j = i + 1; j < boxes.length && !merged; j++) {
				const m = mergeBoxes(boxes[i], boxes[j], mergeDist);
				if (m) {
					boxes[i] = m;
					boxes.splice(j, 1);
					merged = true;
				}
			}
		}
	}
	return boxes;
}

export function generateAutoMeshHitboxes(
	root: THREE.Object3D | THREE.Group,
	options: AutoMeshOptions = {}
): HitboxState[] {
	const {
		minSize = 0.05,
		maxCount = 30,
		mergeDist = 0.05,
		preferShape = "box",
		preserveMaterials = true,
	} = options;

	const hitboxesByMaterial = new Map<number, InternalHitbox[]>();
	const rootGroup = root instanceof THREE.Group ? root : root;

	root.traverse((obj) => {
		if (!(obj instanceof THREE.Mesh)) return;
		if (!obj.geometry) return;

		const { halfExtents, offset, rotation } = computeMeshOBB(obj, rootGroup);

		const maxExtent = Math.max(halfExtents.x, halfExtents.y, halfExtents.z);
		if (maxExtent < minSize) return;

		const shape = shapeFromHalfExtents(halfExtents, preferShape);
		const hb: InternalHitbox = {
			shape,
			relativeOffset: { x: offset.x, y: offset.y, z: offset.z },
			rotation: { x: rotation.x, y: rotation.y, z: rotation.z },
			materialIndex: preserveMaterials ? obj.material instanceof THREE.Material ? rootGroup.children.indexOf(obj) : 0 : 0,
		};

		const key = preserveMaterials ? (obj.material instanceof THREE.Material ? 0 : 0) : 0;
		if (!hitboxesByMaterial.has(key)) hitboxesByMaterial.set(key, []);
		hitboxesByMaterial.get(key)!.push(hb);
	});

	const allMerged: InternalHitbox[] = [];
	for (const boxes of hitboxesByMaterial.values()) {
		const sorted = boxes.sort((a, b) => {
			const volA = a.shape.kind === "box" ? a.shape.halfExtents.x * a.shape.halfExtents.y * a.shape.halfExtents.z : 1;
			const volB = b.shape.kind === "box" ? b.shape.halfExtents.x * b.shape.halfExtents.y * b.shape.halfExtents.z : 1;
			return volB - volA;
		});
		const merged = runMerging([...sorted], mergeDist);
		allMerged.push(...merged);
	}

	const limited = allMerged.slice(0, maxCount);

	return limited.map((hb, idx) => {
		let shape: HitboxState["shape"] = "box";
		let sizeX = 1, sizeY = 1, sizeZ = 1, radius = 0.5, height = 1;

		if (hb.shape.kind === "box") {
			shape = "box";
			sizeX = hb.shape.halfExtents.x * 2;
			sizeY = hb.shape.halfExtents.y * 2;
			sizeZ = hb.shape.halfExtents.z * 2;
		} else if (hb.shape.kind === "sphere") {
			shape = "sphere";
			radius = hb.shape.radius;
		} else if (hb.shape.kind === "capsule") {
			shape = "capsule";
			radius = hb.shape.radius;
			height = hb.shape.height;
		}

		return {
			localId: `auto_${idx}_${crypto.randomUUID().slice(0, 8)}`,
			shape,
			sizeKind: "explicit" as const,
			sizeX,
			sizeY,
			sizeZ,
			radius,
			height,
			offsetX: hb.relativeOffset.x,
			offsetY: hb.relativeOffset.y,
			offsetZ: hb.relativeOffset.z,
			relativeOffsetX: hb.relativeOffset.x,
			relativeOffsetY: hb.relativeOffset.y,
			relativeOffsetZ: hb.relativeOffset.z,
			rotationX: THREE.MathUtils.radToDeg(hb.rotation.x),
			rotationY: THREE.MathUtils.radToDeg(hb.rotation.y),
			rotationZ: THREE.MathUtils.radToDeg(hb.rotation.z),
			collidesWith: [],
			isSensor: false,
			tag: "",
		};
	});
}
