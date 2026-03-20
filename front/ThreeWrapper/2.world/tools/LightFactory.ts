import * as THREE from 'three'
export type AmbientLightParams = {
	color?: THREE.ColorRepresentation
	intensity?: number
	name?: string
}
export type DirectionalLightParams = {
	color?: THREE.ColorRepresentation
	intensity?: number
	position?: { x: number; y: number; z: number }
	target?: { x: number; y: number; z: number }
	castShadow?: boolean
	name?: string
	shadow?: {
		mapSize?: { width: number; height: number }
		camera?: {
			left?: number
			right?: number
			top?: number
			bottom?: number
			near?: number
			far?: number
		}
		bias?: number
		normalBias?: number
		radius?: number
	}
}
export type PointLightParams = {
	color?: THREE.ColorRepresentation
	intensity?: number
	position?: { x: number; y: number; z: number }
	distance?: number
	decay?: number
	castShadow?: boolean
	name?: string
	shadow?: {
		mapSize?: { width: number; height: number }
		camera?: {
			near?: number
			far?: number
		}
		bias?: number
		normalBias?: number
		radius?: number
	}
}
export type SpotLightParams = {
	color?: THREE.ColorRepresentation
	intensity?: number
	position?: { x: number; y: number; z: number }
	target?: { x: number; y: number; z: number }
	distance?: number
	angle?: number
	penumbra?: number
	decay?: number
	castShadow?: boolean
	name?: string
	shadow?: {
		mapSize?: { width: number; height: number }
		camera?: {
			near?: number
			far?: number
			fov?: number
		}
		bias?: number
		normalBias?: number
		radius?: number
	}
}
export type HemisphereLightParams = {
	skyColor?: THREE.ColorRepresentation
	groundColor?: THREE.ColorRepresentation
	intensity?: number
	position?: { x: number; y: number; z: number }
	name?: string
}
export class LightFactory {
	static createAmbientLight(params?: AmbientLightParams): THREE.AmbientLight {
		const config = {
			color: 0xffffff,
			intensity: 0.5,
			name: 'AmbientLight',
			...params,
		}
		const light = new THREE.AmbientLight(config.color, config.intensity)
		if (config.name) light.name = config.name
		return light
	}
	static createDirectionalLight(params?: DirectionalLightParams): THREE.DirectionalLight {
		const config = {
			color: 0xffffff,
			intensity: 1,
			position: { x: 5, y: 10, z: 5 },
			target: { x: 0, y: 0, z: 0 },
			castShadow: true,
			name: 'DirectionalLight',
			shadow: {
				mapSize: { width: 2048, height: 2048 },
				camera: {
					left: -20,
					right: 20,
					top: 20,
					bottom: -20,
					near: 0.1,
					far: 100,
				},
				bias: -0.0001,
				normalBias: 0.02,
				radius: 4,
			},
			...params,
		}
		const light = new THREE.DirectionalLight(config.color, config.intensity)
		if (config.name) light.name = config.name
		light.position.set(config.position.x, config.position.y, config.position.z)
		light.target.position.set(config.target.x, config.target.y, config.target.z)
		if (config.castShadow && config.shadow?.mapSize && config.shadow?.camera) {
			light.castShadow = true
			light.shadow.mapSize.width = config.shadow.mapSize.width
			light.shadow.mapSize.height = config.shadow.mapSize.height
			const cam = config.shadow.camera
			if (cam.left !== undefined) light.shadow.camera.left = cam.left
			if (cam.right !== undefined) light.shadow.camera.right = cam.right
			if (cam.top !== undefined) light.shadow.camera.top = cam.top
			if (cam.bottom !== undefined) light.shadow.camera.bottom = cam.bottom
			if (cam.near !== undefined) light.shadow.camera.near = cam.near
			if (cam.far !== undefined) light.shadow.camera.far = cam.far
			light.shadow.bias = config.shadow.bias ?? -0.0001
			light.shadow.normalBias = config.shadow.normalBias ?? 0.02
			light.shadow.radius = config.shadow.radius ?? 4
		}
		return light
	}
	static createPointLight(params?: PointLightParams): THREE.PointLight {
		const config = {
			color: 0xffffff,
			intensity: 1,
			position: { x: 0, y: 0, z: 0 },
			distance: 100,
			decay: 1,
			castShadow: false,
			name: 'PointLight',
			shadow: {
				mapSize: { width: 1024, height: 1024 },
				camera: {
					near: 0.1,
					far: 500,
				},
				bias: -0.0001,
				normalBias: 0.02,
				radius: 4,
			},
			...params,
		}
		const light = new THREE.PointLight(config.color, config.intensity, config.distance, config.decay)
		if (config.name) light.name = config.name
		light.position.set(config.position.x, config.position.y, config.position.z)
		if (config.castShadow && config.shadow?.mapSize && config.shadow?.camera) {
			light.castShadow = true
			light.shadow.mapSize.width = config.shadow.mapSize.width
			light.shadow.mapSize.height = config.shadow.mapSize.height
			const cam = config.shadow.camera
			if (cam.near !== undefined) light.shadow.camera.near = cam.near
			if (cam.far !== undefined) light.shadow.camera.far = cam.far
			light.shadow.bias = config.shadow.bias ?? -0.0001
			light.shadow.normalBias = config.shadow.normalBias ?? 0.02
			light.shadow.radius = config.shadow.radius ?? 4
		}
		return light
	}
	static createSpotLight(params?: SpotLightParams): THREE.SpotLight {
		const config = {
			color: 0xffffff,
			intensity: 1,
			position: { x: 0, y: 10, z: 0 },
			target: { x: 0, y: 0, z: 0 },
			distance: 100,
			angle: Math.PI / 6,
			penumbra: 0,
			decay: 1,
			castShadow: false,
			name: 'SpotLight',
			shadow: {
				mapSize: { width: 1024, height: 1024 },
				camera: {
					near: 0.1,
					far: 500,
					fov: 45,
				},
				bias: -0.0001,
				normalBias: 0.02,
				radius: 4,
			},
			...params,
		}
		const light = new THREE.SpotLight(
			config.color,
			config.intensity,
			config.distance,
			config.angle,
			config.penumbra,
			config.decay
		)
		if (config.name) light.name = config.name
		light.position.set(config.position.x, config.position.y, config.position.z)
		light.target.position.set(config.target.x, config.target.y, config.target.z)
		if (config.castShadow && config.shadow?.mapSize && config.shadow?.camera) {
			light.castShadow = true
			light.shadow.mapSize.width = config.shadow.mapSize.width
			light.shadow.mapSize.height = config.shadow.mapSize.height
			const cam = config.shadow.camera
			if (cam.near !== undefined) light.shadow.camera.near = cam.near
			if (cam.far !== undefined) light.shadow.camera.far = cam.far
			if (cam.fov !== undefined) light.shadow.camera.fov = cam.fov
			light.shadow.bias = config.shadow.bias ?? -0.0001
			light.shadow.normalBias = config.shadow.normalBias ?? 0.02
			light.shadow.radius = config.shadow.radius ?? 4
		}
		return light
	}
	static createHemisphereLight(params?: HemisphereLightParams): THREE.HemisphereLight {
		const config = {
			skyColor: 0x87ceeb,
			groundColor: 0x8b7355,
			intensity: 0.6,
			position: { x: 0, y: 10, z: 0 },
			name: 'HemisphereLight',
			...params,
		}
		const light = new THREE.HemisphereLight(config.skyColor, config.groundColor, config.intensity)
		if (config.name) light.name = config.name
		light.position.set(config.position.x, config.position.y, config.position.z)
		return light
	}
	static createThreePointLighting(
		keyIntensity = 1,
		fillIntensity = 0.5,
		backIntensity = 0.8
	): { key: THREE.DirectionalLight; fill: THREE.DirectionalLight; back: THREE.DirectionalLight } {
		const key = this.createDirectionalLight({
			position: { x: 5, y: 10, z: 5 },
			intensity: keyIntensity,
		})
		const fill = this.createDirectionalLight({
			position: { x: -5, y: 5, z: -5 },
			intensity: fillIntensity,
			castShadow: false,
		})
		const back = this.createDirectionalLight({
			position: { x: 0, y: 8, z: -10 },
			intensity: backIntensity,
			castShadow: false,
		})
		return { key, fill, back }
	}
	static createCinematicLighting(): {
		sun: THREE.DirectionalLight
		sky: THREE.HemisphereLight
		bounce: THREE.DirectionalLight
	} {
		const sun = this.createDirectionalLight({
			position: { x: 10, y: 15, z: 10 },
			intensity: 1.2,
		})
		const sky = this.createHemisphereLight({
			skyColor: 0x87ceeb,
			groundColor: 0xf0e68c,
			intensity: 0.4,
		})
		const bounce = this.createDirectionalLight({
			position: { x: -8, y: 5, z: -8 },
			intensity: 0.3,
			castShadow: false,
		})
		return { sun, sky, bounce }
	}
}
