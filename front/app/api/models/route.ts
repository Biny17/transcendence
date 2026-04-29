import { readdirSync } from 'fs'
import { join } from 'path'

export function GET() {
  const dir = join(process.cwd(), 'public/game/modeles')
  const folders = readdirSync(dir).filter(f => {
    try {
      return readdirSync(join(dir, f)).includes('scene.gltf')
    } catch {
      return false
    }
  })
  return Response.json(folders.map(f => ({
    name: f,
    path: `/game/modeles/${f}/scene.gltf`,
  })))
}