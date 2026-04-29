import { dump as yamlDump } from 'js-yaml'
import type {
  ComponentDef,
  MeshPrimitive,
  MeshGLTF,
  TexturePBR,
  HitboxDef,
  Vec3,
  PhysicsDef,
  WaypointAnimDef,
} from '@/ThreeWrapper/2.world/tools'
import type { ComponentState, HitboxState, AnimationState, MeshPartState } from './components/ComponentCreatorUI'
function buildComponentDef(state: ComponentState): ComponentDef {
  const meshes = state.meshes.map(buildMesh)
  const physics = buildPhysics(state)
  const hitboxes = buildHitboxes(state.hitboxes)
  const animations = buildAnimations(state.animations, state.meshes)
  return {
    id: state.id || 'my_component',
    meshes,
    ...(Object.keys(physics).length > 0 && { physics }),
    ...(hitboxes.length > 0 && { hitboxes }),
    ...(Object.keys(animations).length > 0 && { animations }),
  }
}
function buildMesh(meshPart: MeshPartState): MeshPrimitive | MeshGLTF {
  if (meshPart.meshKind === 'gltf') {
    const mesh: MeshGLTF = { gltf: meshPart.gltfPath }
    if (meshPart.gltfScaleX !== 1 || meshPart.gltfScaleY !== 1 || meshPart.gltfScaleZ !== 1) {
      mesh.scale = { x: meshPart.gltfScaleX, y: meshPart.gltfScaleY, z: meshPart.gltfScaleZ }
    }
    if (meshPart.offsetX !== 0 || meshPart.offsetY !== 0 || meshPart.offsetZ !== 0) {
      mesh.offset = { x: meshPart.offsetX, y: meshPart.offsetY, z: meshPart.offsetZ }
    }
    return mesh
  }
  const textures = buildTexturesPBR(meshPart)
  const colorHex = parseInt(meshPart.color.replace('#', ''), 16)
  const mesh: MeshPrimitive = {
    primitive: meshPart.primitive,
    size: { x: meshPart.sizeX, y: meshPart.sizeY, z: meshPart.sizeZ },
    ...(colorHex !== 0x888888 && { color: colorHex }),
  }
  if (textures) {
    mesh.textures = textures
  }
  if (meshPart.offsetX !== 0 || meshPart.offsetY !== 0 || meshPart.offsetZ !== 0) {
    mesh.offset = { x: meshPart.offsetX, y: meshPart.offsetY, z: meshPart.offsetZ }
  }
  if (meshPart.displacementScale !== 0.2) {
    mesh.displacementScale = meshPart.displacementScale
  }
  return mesh
}
function buildTexturesPBR(meshPart: MeshPartState): TexturePBR | undefined {
  const slots = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'aoMap', 'displacementMap']
  const result: TexturePBR = {}
  let hasAny = false
  for (const key of slots) {
    const slot = meshPart.textures[key]
    if (slot?.exportPath) {
      result[key as keyof TexturePBR] = slot.exportPath
      hasAny = true
    }
  }
  return hasAny ? result : undefined
}
function buildAnimations(animations: AnimationState[], meshes: MeshPartState[]): Record<string, WaypointAnimDef> {
  const result: Record<string, WaypointAnimDef> = {}
  for (const anim of animations) {
    const meshIndex = meshes.findIndex(m => m.localId === anim.targetMeshId)
    const targetMesh = meshIndex >= 0 ? meshIndex : undefined
    result[anim.name] = {
      kind: 'waypoints',
      ...(targetMesh !== undefined && { targetMesh }),
      waypoints: anim.waypoints.map(wp => ({
        position: wp.position,
        ...(wp.rotation && { rotation: wp.rotation }),
      })),
      speed: anim.speed,
      loop: anim.loop,
      autoPlay: anim.autoPlay,
      ...(anim.pauseAtWaypoint > 0 && { pauseAtWaypoint: anim.pauseAtWaypoint }),
    }
  }
  return result
}
function buildPhysics(state: ComponentState): PhysicsDef {
  const physics: PhysicsDef = {
    bodyType: state.bodyType,
  }
  if (state.gravityScale !== 1) physics.gravityScale = state.gravityScale
  if (state.bodyType === 'dynamic' && state.mass > 0) physics.mass = state.mass
  if (state.restitution !== 0) physics.restitution = state.restitution
  if (state.friction !== 0.5) physics.friction = state.friction
  if (Object.keys(physics).length === 1) return {}
  return physics
}
function buildHitboxes(hitboxes: HitboxState[]): HitboxDef[] {
  return hitboxes.map(hb => {
    const def: HitboxDef = { shape: hb.shape }
    if (hb.shape === 'box') {
      if (hb.sizeKind === 'full') {
        def.size = 'full'
      } else if (hb.sizeKind === 'auto') {
        def.size = 'auto'
      } else {
        def.size = { x: hb.sizeX, y: hb.sizeY, z: hb.sizeZ }
      }
    } else if (hb.shape === 'sphere') {
      if (hb.sizeKind === 'auto' || hb.sizeKind === 'full') {
        def.size = 'auto'
      } else {
        def.radius = hb.radius
      }
    } else if (hb.shape === 'capsule') {
      def.radius = hb.radius
      def.height = hb.height
    }
    if (hb.offsetX !== 0 || hb.offsetY !== 0 || hb.offsetZ !== 0) {
      def.offset = { x: hb.offsetX, y: hb.offsetY, z: hb.offsetZ }
    }
    if (hb.collidesWith.length > 0) {
      def.collidesWith = hb.collidesWith as any
    }
    if (hb.isSensor) {
      def.isSensor = true
      if (hb.tag) def.tag = hb.tag
    }
    return def
  })
}
export function buildYamlString(state: ComponentState): string {
  const def = buildComponentDef(state)
  return `# $schema: /game/components/component.schema.json\n# ---\n` +
    yamlDump(def, { lineWidth: -1 })
}
export async function downloadZip(state: ComponentState): Promise<void> {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  const id = state.id || 'component'
  const yamlStr = buildYamlString(state)
  zip.file(`${id}.yaml`, yamlStr)
  const textureFolder = zip.folder('textures')!
  const slots = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'aoMap', 'displacementMap']
  for (const mesh of state.meshes) {
    for (const key of slots) {
      const slot = mesh.textures[key]
      if (slot?.file) {
        const arrayBuffer = await slot.file.arrayBuffer()
        textureFolder.file(slot.file.name, arrayBuffer)
      }
    }
  }
  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${id}.zip`
  a.click()
  URL.revokeObjectURL(url)
}
export function downloadYaml(state: ComponentState): void {
  const yamlStr = buildYamlString(state)
  const blob = new Blob([yamlStr], { type: 'text/yaml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${state.id || 'component'}.yaml`
  a.click()
  URL.revokeObjectURL(url)
}
