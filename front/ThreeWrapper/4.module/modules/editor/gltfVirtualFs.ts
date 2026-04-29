import * as THREE from 'three'
export type GltfVirtualFs = {
  mainUrl: string
  manager: THREE.LoadingManager
  revoke: () => void
}
export async function extractGltfZip(file: File): Promise<GltfVirtualFs> {
  const JSZip = (await import('jszip')).default
  const zip = await JSZip.loadAsync(file)
  const blobUrls = new Map<string, string>()
  let mainFileName: string | null = null
  const entries = Object.entries(zip.files).filter(([, f]) => !f.dir)
  await Promise.all(
    entries.map(async ([name, zipFile]) => {
      const buf = await zipFile.async('arraybuffer')
      const mime = getMime(name)
      const blob = new Blob([buf], { type: mime })
      const url = URL.createObjectURL(blob)
      const basename = name.split('/').pop()!
      blobUrls.set(basename, url)
      if (!mainFileName && (name.endsWith('.glb') || name.endsWith('.gltf'))) {
        mainFileName = basename
      }
    })
  )
  if (!mainFileName) throw new Error('No .glb or .gltf file found in zip')
  const manager = new THREE.LoadingManager()
  manager.setURLModifier(url => {
    const basename = url.split('/').pop()!
    return blobUrls.get(basename) ?? url
  })
  return {
    mainUrl: blobUrls.get(mainFileName)!,
    manager,
    revoke: () => {
      for (const u of blobUrls.values()) {
        URL.revokeObjectURL(u)
      }
    },
  }
}
function getMime(filename: string): string {
  if (filename.endsWith('.glb')) return 'model/gltf-binary'
  if (filename.endsWith('.gltf')) return 'model/gltf+json'
  if (filename.endsWith('.bin')) return 'application/octet-stream'
  if (filename.endsWith('.png')) return 'image/png'
  if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) return 'image/jpeg'
  if (filename.endsWith('.ktx2')) return 'image/ktx2'
  return 'application/octet-stream'
}
