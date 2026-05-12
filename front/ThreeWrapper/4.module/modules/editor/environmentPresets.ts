export type LightDefAmbient = { type: 'ambient'; color?: number; intensity?: number }
export type LightDefDirectional = { type: 'directional'; color?: number; intensity?: number; position?: { x: number; y: number; z: number }; target?: { x: number; y: number; z: number }; castShadow?: boolean }
export type LightDefPoint = { type: 'point'; color?: number; intensity?: number; position?: { x: number; y: number; z: number }; distance?: number; decay?: number }
export type LightDefHemisphere = { type: 'hemisphere'; skyColor?: number; groundColor?: number; intensity?: number }
export type LightDef = LightDefAmbient | LightDefDirectional | LightDefPoint | LightDefHemisphere

export type FogDefExponential = { kind: 'exponential'; color: number; density: number }
export type FogDefLinear = { kind?: 'linear'; color: number; near: number; far: number }
export type FogDef = FogDefExponential | FogDefLinear | null

export type SkyDefPreset = { preset: string }
export type SkyDefEquirect = { equirect: string }
export type SkyDefCubemap = { cubemap: { px: string; nx: string; py: string; ny: string; pz: string; nz: string } }
export type SkyDef = SkyDefPreset | SkyDefEquirect | SkyDefCubemap | null

export type EnvDef = {
  sky: SkyDef
  fog: FogDef
  lights: LightDef[]
  clouds: boolean
}

export type EnvPreset = {
  id: string
  label: string
  description?: string
  env: EnvDef
}

export const ENV_PRESETS: EnvPreset[] = [
  {
    id: 'default',
    label: 'Default',
    description: 'Neutral editor default',
    env: {
      sky: null,
      fog: null,
      lights: [
        { type: 'ambient', color: 0xffffff, intensity: 0.6 },
        { type: 'directional', color: 0xffffff, intensity: 1.2, position: { x: 5, y: 10, z: 5 } },
      ],
      clouds: false,
    },
  },
  {
    id: 'sunset',
    label: 'Strong Sunset',
    description: 'Warm strong directional light from low angle',
    env: {
      sky: null,
      fog: { kind: 'exponential', color: 0xd4783b, density: 0.006 },
      lights: [
        { type: 'ambient', color: 0xd4783b, intensity: 0.3 },
        { type: 'directional', color: 0xff6633, intensity: 2.5, position: { x: -15, y: 2, z: 10 } },
        { type: 'hemisphere', skyColor: 0xff8844, groundColor: 0x442200, intensity: 0.4 },
      ],
      clouds: true,
    },
  },
  {
    id: 'day',
    label: 'Bright Day',
    description: 'Bright clear daylight',
    env: {
      sky: null,
      fog: { kind: 'exponential', color: 0xcce0ff, density: 0.002 },
      lights: [
        { type: 'ambient', color: 0xffffff, intensity: 0.8 },
        { type: 'directional', color: 0xffffff, intensity: 2.0, position: { x: 10, y: 20, z: 5 }, castShadow: true },
        { type: 'hemisphere', skyColor: 0x87ceeb, groundColor: 0x556b2f, intensity: 0.5 },
      ],
      clouds: true,
    },
  },
  {
    id: 'moon',
    label: 'Moon Surface',
    description: 'Dark cold scene with moonlight',
    env: {
      sky: null,
      fog: { kind: 'exponential', color: 0x111122, density: 0.004 },
      lights: [
        { type: 'ambient', color: 0x1a1a3a, intensity: 0.15 },
        { type: 'directional', color: 0x8888ff, intensity: 0.8, position: { x: 0, y: 25, z: 5 } },
        { type: 'hemisphere', skyColor: 0x222244, groundColor: 0x111122, intensity: 0.2 },
      ],
      clouds: false,
    },
  },
  {
    id: 'swamp',
    label: 'Swamp',
    description: 'Dim murky green atmosphere',
    env: {
      sky: null,
      fog: { kind: 'exponential', color: 0x2a4a2a, density: 0.015 },
      lights: [
        { type: 'ambient', color: 0x2a4a2a, intensity: 0.25 },
        { type: 'directional', color: 0x88aa66, intensity: 0.5, position: { x: 5, y: 8, z: 3 } },
        { type: 'hemisphere', skyColor: 0x3a5a3a, groundColor: 0x1a2a1a, intensity: 0.3 },
        { type: 'point', color: 0x88ff88, intensity: 0.3, position: { x: -3, y: 2, z: -2 }, distance: 8 },
        { type: 'point', color: 0x88ff88, intensity: 0.2, position: { x: 4, y: 1.5, z: 3 }, distance: 6 },
      ],
      clouds: true,
    },
  },
  {
    id: 'night',
    label: 'Night',
    description: 'Dark night with stars',
    env: {
      sky: null,
      fog: { kind: 'exponential', color: 0x0a0a1a, density: 0.003 },
      lights: [
        { type: 'ambient', color: 0x0a0a2a, intensity: 0.1 },
        { type: 'directional', color: 0x4466aa, intensity: 0.4, position: { x: 0, y: 30, z: 0 } },
        { type: 'point', color: 0x8888ff, intensity: 0.2, position: { x: -5, y: 3, z: -5 }, distance: 10 },
      ],
      clouds: false,
    },
  },
  {
    id: 'studio',
    label: 'Studio',
    description: 'Clean even lighting for preview',
    env: {
      sky: null,
      fog: null,
      lights: [
        { type: 'ambient', color: 0xffffff, intensity: 0.7 },
        { type: 'directional', color: 0xffffff, intensity: 1.5, position: { x: 5, y: 8, z: 5 } },
        { type: 'directional', color: 0xffffff, intensity: 0.8, position: { x: -5, y: 4, z: -5 } },
        { type: 'directional', color: 0x8888ff, intensity: 0.5, position: { x: 0, y: -1, z: 5 } },
      ],
      clouds: false,
    },
  },
  {
    id: 'neon',
    label: 'Neon City',
    description: 'Dark with colorful neon point lights',
    env: {
      sky: null,
      fog: { kind: 'exponential', color: 0x1a0a2a, density: 0.008 },
      lights: [
        { type: 'ambient', color: 0x0a001a, intensity: 0.05 },
        { type: 'point', color: 0xff00ff, intensity: 1.5, position: { x: -6, y: 3, z: -4 }, distance: 12 },
        { type: 'point', color: 0x00ffff, intensity: 1.5, position: { x: 6, y: 3, z: -4 }, distance: 12 },
        { type: 'point', color: 0xffff00, intensity: 1.0, position: { x: 0, y: 5, z: 6 }, distance: 10 },
        { type: 'point', color: 0xff4444, intensity: 0.8, position: { x: -3, y: 1.5, z: 5 }, distance: 8 },
        { type: 'hemisphere', skyColor: 0x440066, groundColor: 0x0a001a, intensity: 0.3 },
      ],
      clouds: false,
    },
  },
  {
    id: 'cold',
    label: 'Cold Winter',
    description: 'Blue tinted cold atmosphere',
    env: {
      sky: null,
      fog: { kind: 'exponential', color: 0xbbddff, density: 0.005 },
      lights: [
        { type: 'ambient', color: 0xbbddff, intensity: 0.5 },
        { type: 'directional', color: 0xddeeff, intensity: 1.5, position: { x: 8, y: 15, z: 4 } },
        { type: 'hemisphere', skyColor: 0xccddff, groundColor: 0x99aacc, intensity: 0.4 },
      ],
      clouds: true,
    },
  },
  {
    id: 'cave',
    label: 'Dark Cave',
    description: 'Almost no ambient, few orange point lights',
    env: {
      sky: null,
      fog: { kind: 'exponential', color: 0x0a0a0a, density: 0.02 },
      lights: [
        { type: 'ambient', color: 0x050505, intensity: 0.02 },
        { type: 'point', color: 0xff8844, intensity: 2.0, position: { x: 0, y: 2, z: 0 }, distance: 6 },
        { type: 'point', color: 0xff6633, intensity: 1.0, position: { x: 4, y: 1, z: 3 }, distance: 5 },
        { type: 'point', color: 0xff6633, intensity: 0.8, position: { x: -4, y: 1.5, z: -2 }, distance: 5 },
      ],
      clouds: false,
    },
  },
]

export function getEnvPreset(id: string): EnvPreset | undefined {
  return ENV_PRESETS.find(p => p.id === id)
}
