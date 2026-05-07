export type GameConfigAction = {
  id: string
  type: string
  label?: string
}

export type GameConfigEvent = {
  name: string
  actions: string[]
}

export type GameConfig = {
  id: string
  maxPlayers: number
  duration: number
  winCondition: 'last_standing' | 'first_to_finish' | 'highest_score' | string
  allowRejoin: boolean
  spectatorAllowed: boolean
  teams?: TeamConfig[]
  emits?: string[]
  actions?: GameConfigAction[]
  events?: GameConfigEvent[]
}
export type TeamConfig = {
  id: string
  color: string
  maxPlayers?: number
}
