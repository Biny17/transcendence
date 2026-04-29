'use client'
import { traceRecorder } from '@/ThreeWrapper/4.module/modules/debug/TraceRecorder'
export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'
export type VerbosityLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'INSANE'
export type LogEntry = {
  level: LogLevel
  namespace: string
  msg: string
  data?: Record<string, any>
  timestamp: number
  stack?: string
}
export type DebugConfig = {
  enabled: boolean
  verbosityLevel?: VerbosityLevel
  logPhases?: boolean
  logPhaseDurations?: boolean
  logVariables?: boolean
  logFrameCount?: number
  showHitboxes?: boolean
  showBounds?: boolean
  logPhysicsState?: boolean
  logInputState?: boolean
  logRenderState?: boolean
  logNetwork?: boolean
  showNames?: boolean
  showObjectCenters?: boolean
  showRaycast?: boolean
  showPathfinding?: boolean
  showSkeleton?: boolean
  showFrustum?: boolean
  showLightVolumes?: boolean
  showGridOrigin?: boolean
  showLOD?: boolean
  showHoverOverlay?: boolean
  gameTickRate?: number
  freezeFrames?: boolean
}
type PhaseStackEntry = {
  name: string
  timestamp: number
  level: number
  variables?: Record<string, any>
}
export class PhaseTracker {
  private logger: Logger
  private entry: PhaseStackEntry
  constructor(logger: Logger, entry: PhaseStackEntry) {
    this.logger = logger
    this.entry = entry
  }
  close(): void {
    this.logger.popPhase()
  }
}
export class LoggerInstance {
  private namespace: string
  private logger: Logger
  constructor(namespace: string, logger: Logger) {
    this.namespace = namespace
    this.logger = logger
  }
  debug(msg: string, data?: Record<string, any>): void {
    this.logger.log('DEBUG', this.namespace, msg, data)
  }
  info(msg: string, data?: Record<string, any>): void {
    this.logger.log('INFO', this.namespace, msg, data)
  }
  warn(msg: string, data?: Record<string, any>): void {
    this.logger.log('WARN', this.namespace, msg, data)
  }
  error(msg: string, data?: Record<string, any>): void {
    this.logger.log('ERROR', this.namespace, msg, data)
  }
  pushPhase(
    phaseName: string,
    variables?: Record<string, any>,
  ): PhaseTracker {
    return this.logger.pushPhase(`${this.namespace} > ${phaseName}`, variables)
  }
  logVariable(name: string, value: any): void {
    this.logger.logVariable(name, value)
  }
  isDebugFeatureEnabled(feature: keyof DebugConfig): boolean {
    return this.logger.isDebugFeatureEnabled(feature)
  }
  shouldLogThisFrame(): boolean {
    return this.logger.shouldLogThisFrame()
  }
}
const _nativeConsole = {
  log: console.log.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
}
export class Logger {
  private static instance: Logger | null = null
  static ringBuffer: LogEntry[] = []
  private static bufferMaxSize = 1000
  private debugConfig: DebugConfig = { enabled: false }
  private phaseStack: PhaseStackEntry[] = []
  private frameCounter = 0
  private consoleIntercepted = false
  private variableHistory = new Map<string, any>()
  private constructor() {}
  static network(msg: string, data?: Record<string, any>): void {
    const logger = Logger.getInstance()
    logger.log('INFO', 'Network', msg, data)
  }
  static getEntries(): LogEntry[] {
    return [...Logger.ringBuffer]
  }
  static clearEntries(): void {
    Logger.ringBuffer = []
  }
  static setBufferSize(n: number): void {
    Logger.bufferMaxSize = Math.max(1, n)
    while (Logger.ringBuffer.length > Logger.bufferMaxSize) {
      Logger.ringBuffer.shift()
    }
  }
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }
  static setDebugConfig(config: DebugConfig | boolean): void {
    const logger = Logger.getInstance()
    if (typeof config === 'boolean') {
      logger.debugConfig = {
        enabled: config,
        verbosityLevel: config ? 'MEDIUM' : 'NONE',
        logPhases: config,
        logPhaseDurations: config,
        logVariables: config,
        logFrameCount: config ? 0 : undefined,
        showHitboxes: config,
        showBounds: config,
        logPhysicsState: config,
        logInputState: config,
        logRenderState: config,
        gameTickRate: undefined,
        freezeFrames: false,
      }
    } else {
      logger.debugConfig = config
    }
    if (logger.debugConfig.enabled) {
      logger.interceptConsole()
    }
  }
  static debug(msg: string, data?: Record<string, any>): void {
    const logger = Logger.getInstance()
    logger.log('DEBUG', logger.inferCallerName(), msg, data)
  }
  static info(msg: string, data?: Record<string, any>): void {
    const logger = Logger.getInstance()
    logger.log('INFO', logger.inferCallerName(), msg, data)
  }
  static warn(msg: string, data?: Record<string, any>): void {
    const logger = Logger.getInstance()
    logger.log('WARN', logger.inferCallerName(), msg, data)
  }
  static error(msg: string, data?: Record<string, any>): void {
    const logger = Logger.getInstance()
    logger.log('ERROR', logger.inferCallerName(), msg, data)
  }
  static getDebugConfig(): DebugConfig {
    return Logger.getInstance().debugConfig
  }
  static isDebugFeatureEnabled(feature: keyof DebugConfig): boolean {
    return Logger.getInstance().isDebugFeatureEnabled(feature)
  }
  static setGameTickRate(ms: number): void {
    Logger.getInstance().debugConfig.gameTickRate = ms
  }
  static setGlobalDebugLevel(level: VerbosityLevel): void {
    const logger = Logger.getInstance()
    logger.debugConfig.verbosityLevel = level
    logger.debugConfig.enabled = level !== 'NONE'
  }
  for(namespace: string): LoggerInstance {
    return new LoggerInstance(namespace, this)
  }
  getDebugConfig(): DebugConfig {
    return this.debugConfig
  }
  isDebugFeatureEnabled(feature: keyof DebugConfig): boolean {
    if (!this.debugConfig.enabled) return false
    const value = this.debugConfig[feature]
    if (typeof value === 'boolean') return value
    if (typeof value === 'number') return value > 0
    return false
  }
  pushPhase(phaseName: string, variables?: Record<string, any>): PhaseTracker {
    const entry: PhaseStackEntry = {
      name: phaseName,
      timestamp: Date.now(),
      level: this.phaseStack.length,
      variables,
    }
    this.phaseStack.push(entry)
    if (this.debugConfig.logPhases) {
      this.logPhaseHierarchy('→', entry.name)
    }
    if (this.debugConfig.logVariables && variables) {
      this.logVariables('init', variables, entry.level + 1)
    }
    traceRecorder.captureWorldDelta()
    return new PhaseTracker(this, entry)
  }
  popPhase(): void {
    const entry = this.phaseStack.pop()
    if (!entry) return
    if (this.debugConfig.logPhaseDurations) {
      const duration = Date.now() - entry.timestamp
      const indent = ' '.repeat((entry.level + 1) * 2)
      const time = this.formatTime()
      _nativeConsole.log(`${time} [✓] ${indent}${entry.name} (${duration}ms)`)
    }
    traceRecorder.captureWorldDelta()
  }
  logVariable(name: string, value: any): void {
    if (!this.debugConfig.logVariables) return
    if (!this.shouldLogThisFrame()) return
    const previous = this.variableHistory.get(name)
    this.variableHistory.set(name, value)
    const delta = previous !== undefined ? this.computeDelta(previous, value) : null
    const indent = ' '.repeat((this.phaseStack.length + 1) * 2)
    const time = this.formatTime()
    const serialized = this.serializeValue(value)
    const deltaStr = delta ? ` (Δ: ${this.serializeValue(delta)})` : ''
    _nativeConsole.log(`${time} [VAR] ${indent}${name} = ${serialized}${deltaStr}`)
    traceRecorder.watchVariable(name, value)
  }
  shouldLogThisFrame(): boolean {
    const frameCount = this.debugConfig.logFrameCount
    if (frameCount === undefined || frameCount === 0) return true
    return this.frameCounter % frameCount === 0
  }
  incrementFrameCounter(): void {
    this.frameCounter++
  }
  static incrementFrameCounter(): void {
    Logger.getInstance().incrementFrameCounter()
  }
  static getFrameCount(): number {
    return Logger.getInstance().frameCounter
  }
  log(
    level: LogLevel,
    namespace: string,
    msg: string,
    data?: Record<string, any>,
  ): void {
    if (!this.isLogLevelAllowed(level)) return
    const stack = this.debugConfig.verbosityLevel === 'INSANE' ? new Error().stack : undefined
    const entry: LogEntry = { level, namespace, msg, data, timestamp: Date.now(), stack }
    Logger.ringBuffer.push(entry)
    if (Logger.ringBuffer.length > Logger.bufferMaxSize) {
      Logger.ringBuffer.shift()
    }
    window.dispatchEvent(new CustomEvent('debug:logs', { detail: Logger.getEntries() }))
    traceRecorder.record(entry)
    const time = this.formatTime()
    const indent = ' '.repeat(this.phaseStack.length * 2)
    const levelStr = this.getLevelColor(level)
    const dataStr = data ? ` ${JSON.stringify(data)}` : ''
    _nativeConsole.log(`${time} [${levelStr}] ${indent}${namespace}: ${msg}${dataStr}`)
  }
  private logPhaseHierarchy(_marker: string, phaseName: string): void {
    const indent = ' '.repeat(this.phaseStack.length * 2)
    const time = this.formatTime()
    _nativeConsole.log(`${time} [→] ${indent}${phaseName}`)
  }
  private logVariables(
    _scope: string,
    variables: Record<string, any>,
    indent: number,
  ): void {
    Object.entries(variables).forEach(([key, value]) => {
      const indentStr = ' '.repeat(indent * 2)
      const time = this.formatTime()
      const serialized = this.serializeValue(value)
      _nativeConsole.log(`${time} [VAR] ${indentStr}${key} = ${serialized}`)
    })
  }
  private interceptConsole(): void {
    if (this.consoleIntercepted) return
    this.consoleIntercepted = true
    const self = this
    const intercept = (level: LogLevel) => (...args: any[]) => {
      const raw = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')
      const prefixMatch = raw.match(/^\[([A-Za-z0-9_]+)\]\s*(.*)$/)
      const ns = prefixMatch ? prefixMatch[1] : self.inferCallerName()
      const msg = prefixMatch ? prefixMatch[2] : raw
      self.log(level, ns, msg)
    }
    console.log = intercept('INFO')
    console.debug = intercept('DEBUG')
    console.info = intercept('INFO')
    console.warn = intercept('WARN')
    console.error = intercept('ERROR')
  }
  private inferCallerName(): string {
    try {
      const stack = new Error().stack ?? ''
      const lines = stack.split('\n')
      if (!Logger._stackDumped) {
        Logger._stackDumped = true
        _nativeConsole.log('[Logger] Stack sample for caller inference:')
        lines.slice(0, 12).forEach((l) => _nativeConsole.log(' ', l))
      }
      const skipPatterns = [
        'Logger', 'LoggerInstance',
        'webpack', 'next', 'node_modules', 'node:',
        '<anonymous>', 'forward-logs',
      ]
      for (let i = 2; i < lines.length; i++) {
        const line = lines[i]
        const classMethod = line.match(/at\s+([A-Z][A-Za-z0-9_]+)\./)
        if (classMethod) {
          const name = classMethod[1]
          if (!skipPatterns.some((p) => name.includes(p))) return name
          continue
        }
        const fileInPath = line.match(/[\\/]([\w]+)\.[tj]sx?[^)]*\)/)
        if (fileInPath) {
          const name = fileInPath[1]
          if (!skipPatterns.some((p) => name.includes(p))) return name
        }
      }
    } catch {
    }
    const top = this.phaseStack[this.phaseStack.length - 1]
    return top ? top.name.split(' ')[0] : '?'
  }
  private static _stackDumped = false
  private serializeValue(value: any): string {
    if (value === null) return 'null'
    if (value === undefined) return 'undefined'
    if (typeof value === 'string') return `"${value}"`
    if (typeof value === 'number') return value.toFixed(2)
    if (typeof value === 'boolean') return value.toString()
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return `[${value.map((v) => this.serializeValue(v)).join(', ')}]`
      }
      if (value.x !== undefined && value.y !== undefined) {
        if (value.z !== undefined) {
          return `(${value.x.toFixed(2)}, ${value.y.toFixed(2)}, ${value.z.toFixed(2)})`
        }
        return `(${value.x.toFixed(2)}, ${value.y.toFixed(2)})`
      }
      try {
        return JSON.stringify(value, null, 0)
      } catch {
        return '[object]'
      }
    }
    return String(value)
  }
  private formatTime(): string {
    const now = new Date()
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')
    return `[${hours}:${minutes}:${seconds}]`
  }
  private getLevelColor(level: LogLevel): string {
    switch (level) {
      case 'DEBUG':
        return '🔍'
      case 'INFO':
        return 'ℹ️'
      case 'WARN':
        return '⚠️'
      case 'ERROR':
        return '❌'
      default:
        return '•'
    }
  }
  private computeDelta(previous: any, current: any): any {
    if (typeof previous === 'number' && typeof current === 'number') return current - previous
    if (typeof previous === 'string' && typeof current === 'string') return current.length - previous.length
    return 'changed'
  }
  private getMinLogLevelForVerbosity(verbosity: VerbosityLevel): LogLevel {
    switch (verbosity) {
      case 'NONE':
        return 'ERROR' 
      case 'LOW':
        return 'ERROR'
      case 'MEDIUM':
        return 'WARN'
      case 'HIGH':
        return 'INFO'
      case 'INSANE':
        return 'DEBUG'
      default:
        return 'INFO'
    }
  }
  private isLogLevelAllowed(level: LogLevel): boolean {
    const verbosity = this.debugConfig.verbosityLevel ?? 'MEDIUM'
    if (verbosity === 'NONE') return false
    const minLevel = this.getMinLogLevelForVerbosity(verbosity)
    const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR']
    const levelIndex = levels.indexOf(level)
    const minIndex = levels.indexOf(minLevel)
    return levelIndex >= minIndex
  }
}
Logger.getInstance()
