import * as THREE from 'three'
export type MaterialParams = {
	color?: THREE.ColorRepresentation
	emissive?: THREE.ColorRepresentation
	metalness?: number
	roughness?: number
	opacity?: number
	transparent?: boolean
	wireframe?: boolean
	type?: 'basic' | 'standard' | 'phong'
}
export type Transform = {
	position?: { x?: number; y?: number; z?: number }
	rotation?: { x?: number; y?: number; z?: number }
	scale?: { x?: number; y?: number; z?: number }
}
export interface MeshOptions {
	material?: MaterialParams
	transform?: Transform
	castShadow?: boolean
	receiveShadow?: boolean
	name?: string
}
export interface BoxOptions extends MeshOptions {
	width?: number
	height?: number
	depth?: number
	widthSegments?: number
	heightSegments?: number
	depthSegments?: number
}
export interface SphereOptions extends MeshOptions {
	radius?: number
	widthSegments?: number
	heightSegments?: number
	phiStart?: number
	phiLength?: number
	thetaStart?: number
	thetaLength?: number
}
export interface CylinderOptions extends MeshOptions {
	radiusTop?: number
	radiusBottom?: number
	height?: number
	radialSegments?: number
	heightSegments?: number
	openEnded?: boolean
	thetaStart?: number
	thetaLength?: number
}
export interface ConeOptions extends MeshOptions {
	radius?: number
	height?: number
	radialSegments?: number
	heightSegments?: number
	openEnded?: boolean
	thetaStart?: number
	thetaLength?: number
}
export interface PlaneOptions extends MeshOptions {
	width?: number
	height?: number
	widthSegments?: number
	heightSegments?: number
}
export interface CircleOptions extends MeshOptions {
	radius?: number
	segments?: number
	thetaStart?: number
	thetaLength?: number
}
export interface RingOptions extends MeshOptions {
	innerRadius?: number
	outerRadius?: number
	thetaSegments?: number
	phiSegments?: number
	thetaStart?: number
	thetaLength?: number
}
export interface TorusOptions extends MeshOptions {
	radius?: number
	tube?: number
	radialSegments?: number
	tubularSegments?: number
	arc?: number
}
export interface CapsuleOptions extends MeshOptions {
	radius?: number
	height?: number
	capSegments?: number
	radialSegments?: number
}
export interface PyramidOptions extends MeshOptions {
	width?: number
	height?: number
	depth?: number
}
export interface LatheOptions extends MeshOptions {
	points: THREE.Vector2[]
	segments?: number
	phiStart?: number
	phiLength?: number
}
export interface PolyhedronOptions extends MeshOptions {
	radius?: number
	detail?: number
}
export class GeometryFactory {
	private static readonly DEFAULT_SEGMENTS = 32
	static box(options?: BoxOptions): THREE.Mesh {
		const geo = new THREE.BoxGeometry(
			options?.width ?? 1,
			options?.height ?? 1,
			options?.depth ?? 1,
			options?.widthSegments ?? 1,
			options?.heightSegments ?? 1,
			options?.depthSegments ?? 1
		)
		return this.buildMesh(geo, options)
	}
	static sphere(options?: SphereOptions): THREE.Mesh {
		const geo = new THREE.SphereGeometry(
			options?.radius ?? 1,
			options?.widthSegments ?? this.DEFAULT_SEGMENTS,
			options?.heightSegments ?? this.DEFAULT_SEGMENTS,
			options?.phiStart ?? 0,
			options?.phiLength ?? Math.PI * 2,
			options?.thetaStart ?? 0,
			options?.thetaLength ?? Math.PI
		)
		return this.buildMesh(geo, options)
	}
	static cylinder(options?: CylinderOptions): THREE.Mesh {
		const geo = new THREE.CylinderGeometry(
			options?.radiusTop ?? 1,
			options?.radiusBottom ?? 1,
			options?.height ?? 1,
			options?.radialSegments ?? this.DEFAULT_SEGMENTS,
			options?.heightSegments ?? 1,
			options?.openEnded ?? false,
			options?.thetaStart ?? 0,
			options?.thetaLength ?? Math.PI * 2
		)
		return this.buildMesh(geo, options)
	}
	static cone(options?: ConeOptions): THREE.Mesh {
		const geo = new THREE.ConeGeometry(
			options?.radius ?? 1,
			options?.height ?? 1,
			options?.radialSegments ?? this.DEFAULT_SEGMENTS,
			options?.heightSegments ?? 1,
			options?.openEnded ?? false,
			options?.thetaStart ?? 0,
			options?.thetaLength ?? Math.PI * 2
		)
		return this.buildMesh(geo, options)
	}
	static plane(options?: PlaneOptions): THREE.Mesh {
		const geo = new THREE.PlaneGeometry(
			options?.width ?? 1,
			options?.height ?? 1,
			options?.widthSegments ?? 1,
			options?.heightSegments ?? 1
		)
		return this.buildMesh(geo, options)
	}
	static circle(options?: CircleOptions): THREE.Mesh {
		const geo = new THREE.CircleGeometry(
			options?.radius ?? 1,
			options?.segments ?? this.DEFAULT_SEGMENTS,
			options?.thetaStart ?? 0,
			options?.thetaLength ?? Math.PI * 2
		)
		return this.buildMesh(geo, options)
	}
	static ring(options?: RingOptions): THREE.Mesh {
		const geo = new THREE.RingGeometry(
			options?.innerRadius ?? 0.5,
			options?.outerRadius ?? 1,
			options?.thetaSegments ?? this.DEFAULT_SEGMENTS,
			options?.phiSegments ?? 8,
			options?.thetaStart ?? 0,
			options?.thetaLength ?? Math.PI * 2
		)
		return this.buildMesh(geo, options)
	}
	static torus(options?: TorusOptions): THREE.Mesh {
		const geo = new THREE.TorusGeometry(
			options?.radius ?? 1,
			options?.tube ?? 0.4,
			options?.radialSegments ?? 16,
			options?.tubularSegments ?? 100,
			options?.arc ?? Math.PI * 2
		)
		return this.buildMesh(geo, options)
	}
	static capsule(options?: CapsuleOptions): THREE.Mesh {
		const geo = new THREE.CapsuleGeometry(
			options?.radius ?? 0.5,
			options?.height ?? 1,
			options?.capSegments ?? 4,
			options?.radialSegments ?? 8
		)
		return this.buildMesh(geo, options)
	}
	static dodecahedron(options?: PolyhedronOptions): THREE.Mesh {
		return this.buildMesh(new THREE.DodecahedronGeometry(options?.radius ?? 1, options?.detail ?? 0), options)
	}
	static icosahedron(options?: PolyhedronOptions): THREE.Mesh {
		return this.buildMesh(new THREE.IcosahedronGeometry(options?.radius ?? 1, options?.detail ?? 0), options)
	}
	static octahedron(options?: PolyhedronOptions): THREE.Mesh {
		return this.buildMesh(new THREE.OctahedronGeometry(options?.radius ?? 1, options?.detail ?? 0), options)
	}
	static tetrahedron(options?: PolyhedronOptions): THREE.Mesh {
		return this.buildMesh(new THREE.TetrahedronGeometry(options?.radius ?? 1, options?.detail ?? 0), options)
	}
	static pyramid(options?: PyramidOptions): THREE.Mesh {
		const geo = new THREE.BufferGeometry()
		const hw = (options?.width ?? 1) / 2
		const hh = (options?.height ?? 1) / 2
		const hd = (options?.depth ?? 1) / 2
		const vertices = new Float32Array([
			-hw, -hh, -hd,  hw, -hh, -hd,  hw, -hh,  hd,  -hw, -hh,  hd,
			  0,  hh,   0,
		])
		const indices = new Uint32Array([
			0, 2, 1,  0, 3, 2,
			0, 1, 4,  1, 2, 4,  2, 3, 4,  3, 0, 4,
		])
		geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
		geo.setIndex(new THREE.BufferAttribute(indices, 1))
		geo.computeVertexNormals()
		return this.buildMesh(geo, options)
	}
	static lathe(options: LatheOptions): THREE.Mesh {
		const geo = new THREE.LatheGeometry(
			options.points,
			options?.segments ?? this.DEFAULT_SEGMENTS,
			options?.phiStart ?? 0,
			options?.phiLength ?? Math.PI * 2
		)
		return this.buildMesh(geo, options)
	}
	static applyTransform(object: THREE.Object3D, transform: Transform): void {
		const pos = transform.position ?? {}
		const rot = transform.rotation ?? {}
		const scl = transform.scale ?? {}
		if (pos.x !== undefined || pos.y !== undefined || pos.z !== undefined)
			object.position.set(pos.x ?? 0, pos.y ?? 0, pos.z ?? 0)
		if (rot.x !== undefined || rot.y !== undefined || rot.z !== undefined)
			object.rotation.set(rot.x ?? 0, rot.y ?? 0, rot.z ?? 0)
		if (scl.x !== undefined || scl.y !== undefined || scl.z !== undefined)
			object.scale.set(scl.x ?? 1, scl.y ?? 1, scl.z ?? 1)
	}
	private static buildMesh(geo: THREE.BufferGeometry, options?: MeshOptions): THREE.Mesh {
		const mesh = new THREE.Mesh(geo, this.buildMaterial(options?.material))
		if (options?.name)          mesh.name = options.name
		if (options?.castShadow)    mesh.castShadow = true
		if (options?.receiveShadow) mesh.receiveShadow = true
		if (options?.transform)     this.applyTransform(mesh, options.transform)
		return mesh
	}
	private static buildMaterial(params?: MaterialParams): THREE.Material {
		const c = {
			color:       0xcccccc as THREE.ColorRepresentation,
			emissive:    0x000000 as THREE.ColorRepresentation,
			metalness:   0.5,
			roughness:   0.5,
			opacity:     1,
			transparent: false,
			wireframe:   false,
			type:        'standard' as const,
			...params,
		}
		if (c.type === 'basic') {
			return new THREE.MeshBasicMaterial({ color: c.color, wireframe: c.wireframe, transparent: c.transparent, opacity: c.opacity })
		}
		if (c.type === 'phong') {
			return new THREE.MeshPhongMaterial({ color: c.color, emissive: c.emissive, wireframe: c.wireframe, transparent: c.transparent, opacity: c.opacity })
		}
		return new THREE.MeshStandardMaterial({ color: c.color, emissive: c.emissive, metalness: c.metalness, roughness: c.roughness, wireframe: c.wireframe, transparent: c.transparent, opacity: c.opacity })
	}
}
