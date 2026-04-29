import { readdirSync } from 'fs'
import { join } from 'path'

export function GET() {
  const dir = join(process.cwd(), 'public/game/components')
  const files = readdirSync(dir).filter(f => f.endsWith('.yaml'))
  return Response.json(files.map(f => `/game/components/${f}`))
}