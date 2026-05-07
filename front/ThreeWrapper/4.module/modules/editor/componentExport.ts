import { dump as yamlDump, load as yamlLoad } from 'js-yaml'
import type {
  ComponentDef,
  MeshPrimitive,
  MeshGLTF,
  TexturePBR,
  HitboxDef,
  PhysicsDef,
  AnimationDef,
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

function buildAnimations(animations: AnimationState[], meshes: MeshPartState[]): Record<string, AnimationDef> {
  const result: Record<string, AnimationDef> = {}
  for (const anim of animations) {
    const meshIndex = meshes.findIndex(m => m.localId === anim.targetMeshId)
    const targetMesh = meshIndex >= 0 ? meshIndex : undefined
    if (anim.type === 'waypoints') {
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
    } else if (anim.type === 'clip') {
      result[anim.clipName] = {
        kind: 'clip',
        ...(targetMesh !== undefined && { targetMesh }),
        autoPlay: anim.autoPlay,
        loop: anim.loop,
        speed: anim.speed,
      }
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
    if (hb.rotationX !== 0 || hb.rotationY !== 0 || hb.rotationZ !== 0) {
      def.rotation = { x: hb.rotationX, y: hb.rotationY, z: hb.rotationZ }
    }
    if (hb.collidesWith.length > 0) {
      def.collidesWith = hb.collidesWith
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

export function parseYamlToState(yaml: string): ComponentState {
  const def = yamlLoad(yaml) as ComponentDef

  const meshDefs = def.meshes ?? (def.mesh ? [def.mesh] : [])

  const meshLocalIds: string[] = []
  const meshes: MeshPartState[] = meshDefs.map((m, i) => {
    const localId = crypto.randomUUID()
    meshLocalIds.push(localId)

    if ('gltf' in m) {
      const gltfMesh = m as MeshGLTF
      return {
        localId,
        name: `mesh_${i + 1}`,
        meshKind: 'gltf' as const,
        primitive: 'box' as const,
        sizeX: 1,
        sizeY: 1,
        sizeZ: 1,
        color: '#888888',
        textures: {
          map: { file: null, previewUrl: null, exportPath: '' },
          normalMap: { file: null, previewUrl: null, exportPath: '' },
          roughnessMap: { file: null, previewUrl: null, exportPath: '' },
          metalnessMap: { file: null, previewUrl: null, exportPath: '' },
          emissiveMap: { file: null, previewUrl: null, exportPath: '' },
          aoMap: { file: null, previewUrl: null, exportPath: '' },
          displacementMap: { file: null, previewUrl: null, exportPath: '' },
        },
        displacementScale: 0.2,
        normalScale: 1.0,
        offsetX: gltfMesh.offset?.x ?? 0,
        offsetY: gltfMesh.offset?.y ?? 0,
        offsetZ: gltfMesh.offset?.z ?? 0,
        relativeOffsetX: 0,
        relativeOffsetY: 0,
        relativeOffsetZ: 0,
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
        gltfPath: gltfMesh.gltf,
        gltfPreviewUrl: gltfMesh.gltf,
        gltfScaleX: gltfMesh.scale?.x ?? 1,
        gltfScaleY: gltfMesh.scale?.y ?? 1,
        gltfScaleZ: gltfMesh.scale?.z ?? 1,
      }
    } else {
      const primMesh = m as MeshPrimitive
      const colorNum = primMesh.color ?? 0x888888
      const colorStr = `#${colorNum.toString(16).padStart(6, '0')}`

      const textures: Record<string, { file: File | null; previewUrl: string | null; exportPath: string }> = {
        map: { file: null, previewUrl: null, exportPath: '' },
        normalMap: { file: null, previewUrl: null, exportPath: '' },
        roughnessMap: { file: null, previewUrl: null, exportPath: '' },
        metalnessMap: { file: null, previewUrl: null, exportPath: '' },
        emissiveMap: { file: null, previewUrl: null, exportPath: '' },
        aoMap: { file: null, previewUrl: null, exportPath: '' },
        displacementMap: { file: null, previewUrl: null, exportPath: '' },
      }

      if (primMesh.textures) {
        const texDef = primMesh.textures
        if (typeof texDef === 'string') {
          textures.map!.exportPath = texDef
        } else if (!('faces' in texDef) && !('all' in texDef)) {
          const pbr = texDef as TexturePBR
          if (pbr.map) textures.map!.exportPath = pbr.map
          if (pbr.normalMap) textures.normalMap!.exportPath = pbr.normalMap
          if (pbr.roughnessMap) textures.roughnessMap!.exportPath = pbr.roughnessMap
          if (pbr.metalnessMap) textures.metalnessMap!.exportPath = pbr.metalnessMap
          if (pbr.emissiveMap) textures.emissiveMap!.exportPath = pbr.emissiveMap
          if (pbr.aoMap) textures.aoMap!.exportPath = pbr.aoMap
          if (pbr.displacementMap) textures.displacementMap!.exportPath = pbr.displacementMap
        }
      }

      return {
        localId,
        name: `mesh_${i + 1}`,
        meshKind: 'primitive' as const,
        primitive: primMesh.primitive ?? 'box',
        sizeX: primMesh.size?.x ?? 1,
        sizeY: primMesh.size?.y ?? 1,
        sizeZ: primMesh.size?.z ?? 1,
        color: colorStr,
        textures,
        displacementScale: primMesh.displacementScale ?? 0.2,
        normalScale: 1.0,
        offsetX: primMesh.offset?.x ?? 0,
        offsetY: primMesh.offset?.y ?? 0,
        offsetZ: primMesh.offset?.z ?? 0,
        relativeOffsetX: 0,
        relativeOffsetY: 0,
        relativeOffsetZ: 0,
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
        gltfPath: '',
        gltfPreviewUrl: null,
        gltfScaleX: 1,
        gltfScaleY: 1,
        gltfScaleZ: 1,
      }
    }
  })

  const hitboxes: HitboxState[] = (def.hitboxes ?? []).map((hb) => {
    let sizeKind: 'full' | 'auto' | 'explicit' = 'explicit'
    let sizeX = 1, sizeY = 1, sizeZ = 1
    let radius = 0.5
    let height = 1

    if (hb.shape === 'box') {
      if (hb.size === 'full' || hb.size === 'auto') {
        sizeKind = hb.size
      } else if (typeof hb.size === 'object') {
        sizeKind = 'explicit'
        sizeX = hb.size.x ?? 1
        sizeY = hb.size.y ?? 1
        sizeZ = hb.size.z ?? 1
      }
    } else if (hb.shape === 'sphere') {
      if (hb.size === 'full' || hb.size === 'auto') {
        sizeKind = hb.size
        radius = 0.5
      } else {
        sizeKind = 'explicit'
        radius = hb.radius ?? 0.5
      }
    } else if (hb.shape === 'capsule') {
      sizeKind = 'explicit'
      radius = hb.radius ?? 0.5
      height = hb.height ?? 1
    }

    return {
      localId: crypto.randomUUID(),
      shape: hb.shape,
      sizeKind,
      sizeX,
      sizeY,
      sizeZ,
      radius,
      height,
      offsetX: hb.offset?.x ?? 0,
      offsetY: hb.offset?.y ?? 0,
      offsetZ: hb.offset?.z ?? 0,
      relativeOffsetX: 0,
      relativeOffsetY: 0,
      relativeOffsetZ: 0,
      rotationX: hb.rotation?.x ?? 0,
      rotationY: hb.rotation?.y ?? 0,
      rotationZ: hb.rotation?.z ?? 0,
      collidesWith: hb.collidesWith ?? [],
      isSensor: hb.isSensor ?? false,
      tag: hb.tag ?? '',
    }
  })

  const animations: AnimationState[] = []
  if (def.animations) {
    for (const [name, anim] of Object.entries(def.animations)) {
      const targetMeshId = anim.targetMesh !== undefined
        ? meshLocalIds[anim.targetMesh] ?? meshLocalIds[0] ?? ''
        : meshLocalIds[0] ?? ''

      if (anim.kind === 'waypoints') {
        animations.push({
          localId: crypto.randomUUID(),
          name,
          targetMeshId,
          type: 'waypoints',
          waypoints: anim.waypoints.map(wp => ({
            position: wp.position,
            rotation: wp.rotation,
          })),
          clipName: '',
          speed: anim.speed ?? 2,
          loop: anim.loop ?? true,
          autoPlay: anim.autoPlay ?? false,
          pauseAtWaypoint: anim.pauseAtWaypoint ?? 0,
        })
      } else if (anim.kind === 'clip') {
        animations.push({
          localId: crypto.randomUUID(),
          name,
          targetMeshId,
          type: 'clip',
          waypoints: [],
          clipName: name,
          speed: anim.speed ?? 1,
          loop: anim.loop ?? true,
          autoPlay: anim.autoPlay ?? false,
          pauseAtWaypoint: 0,
        })
      }
    }
  }

  return {
    id: def.id ?? 'component',
    meshes,
    wireframe: false,
    bodyType: def.physics?.bodyType ?? 'static',
    gravityScale: def.physics?.gravityScale ?? 1,
    mass: def.physics?.mass ?? 1,
    restitution: def.physics?.restitution ?? 0.1,
    friction: def.physics?.friction ?? 0.5,
    hitboxes,
    animations,
  }
}