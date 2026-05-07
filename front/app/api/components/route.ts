import { readdirSync, writeFileSync } from 'fs'
import { join } from 'path'

export function GET() {
  const dir = join(process.cwd(), 'public/game/components')
  const files = readdirSync(dir).filter(f => f.endsWith('.yaml'))
  return Response.json(files.map(f => `/game/components/${f}`))
}

export async function POST(request: Request) {
  try {
    const { id, yaml } = await request.json()
    if (!id || typeof id !== 'string') {
      return Response.json({ error: 'Missing or invalid component id' }, { status: 400 })
    }
    const sanitized = id.replace(/[^a-zA-Z0-9_-]/g, '_')
    if (!sanitized) {
      return Response.json({ error: 'Invalid component id after sanitization' }, { status: 400 })
    }
    const dir = join(process.cwd(), 'public/game/components')
    const filePath = join(dir, `${sanitized}.yaml`)
    writeFileSync(filePath, yaml, 'utf-8')
    return Response.json({ success: true, path: `/game/components/${sanitized}.yaml` })
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 })
  }
}