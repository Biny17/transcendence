import type { KeyBinding } from '@/shared/types'
export class KeymapHandler {
  private readonly bindings = new Map<string, KeyBinding>()
  constructor(defaults: KeyBinding[] = []) {
    for (const binding of defaults) {
      this.register(binding)
    }
  }
  register(binding: KeyBinding): void {
    this.bindings.set(binding.action, binding)
  }
  registerMany(bindings: KeyBinding[]): void {
    for (const b of bindings) this.register(b)
  }
  rebind(action: string, key: string): void {
    const existing = this.bindings.get(action)
    if (existing) {
      existing.key = key
    } else {
      this.bindings.set(action, { action, key })
    }
  }
  getKey(action: string): string | undefined {
    return this.bindings.get(action)?.key
  }
  getAltKey(action: string): string | undefined {
    return this.bindings.get(action)?.altKey
  }
  matches(action: string, code: string): boolean {
    const binding = this.bindings.get(action)
    if (!binding) return false
    return binding.key === code || binding.altKey === code
  }
  getAll(): KeyBinding[] {
    return [...this.bindings.values()]
  }
  getBinding(action: string): KeyBinding | undefined {
    return this.bindings.get(action)
  }
}
