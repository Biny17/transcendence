import * as THREE from 'three'
import type { Module, WorldContext } from '@/ThreeWrapper/4.module'
export type AudioModuleOptions = {
  masterVolume?: number
}
type SoundEntry = {
  buffer: AudioBuffer
  positional: boolean
}
export class AudioModule implements Module {
  readonly type = 'audio'
  readonly requires = [] as const
  private ctx: WorldContext | null = null
  private listener: THREE.AudioListener | null = null
  private sounds: Map<string, SoundEntry> = new Map()
  private activeSources: Set<THREE.Audio | THREE.PositionalAudio> = new Set()
  private masterVolume: number
  private loader = new THREE.AudioLoader()
  constructor(options: AudioModuleOptions = {}) {
    this.masterVolume = options.masterVolume ?? 1
  }
  init(ctx: WorldContext): void {
    this.ctx = ctx
    this.listener = new THREE.AudioListener()
    ctx.camera.add(this.listener)
    this.listener.setMasterVolume(this.masterVolume)
  }
  async load(id: string, url: string, positional = false): Promise<void> {
    const buffer = await this.loader.loadAsync(url)
    this.sounds.set(id, { buffer, positional })
  }
  play(id: string, options: { volume?: number; loop?: boolean; object3d?: THREE.Object3D } = {}): THREE.Audio | THREE.PositionalAudio | null {
    if (!this.listener) return null
    const entry = this.sounds.get(id)
    if (!entry) {
      console.warn(`[AudioModule] Sound "${id}" not loaded`)
      return null
    }
    if (entry.positional && options.object3d) {
      const audio = new THREE.PositionalAudio(this.listener)
      options.object3d.add(audio)
      this.setupAudio(audio, entry.buffer, options)
      return audio
    }
    const audio = new THREE.Audio(this.listener)
    this.setupAudio(audio, entry.buffer, options)
    return audio
  }
  private setupAudio(audio: THREE.Audio<GainNode> | THREE.PositionalAudio, buffer: AudioBuffer, options: { volume?: number; loop?: boolean }): void {
    audio.setBuffer(buffer)
    audio.setVolume(options.volume ?? 1)
    audio.setLoop(options.loop ?? false)
    audio.play()
    this.activeSources.add(audio as THREE.Audio<GainNode>)
    if (!options.loop) {
      audio.onEnded = () => { this.activeSources.delete(audio as THREE.Audio<GainNode>) }
    }
  }
  stopAll(): void {
    for (const source of this.activeSources) {
      if (source.isPlaying) source.stop()
    }
    this.activeSources.clear()
  }
  setMasterVolume(volume: number): void {
    this.masterVolume = volume
    this.listener?.setMasterVolume(volume)
  }
  getMasterVolume(): number {
    return this.masterVolume
  }
  update(_delta: number): void {}
  dispose(): void {
    this.stopAll()
    if (this.listener && this.ctx) {
      this.ctx.camera.remove(this.listener)
    }
    this.sounds.clear()
    this.listener = null
    this.ctx = null
  }
}
