import type { Module, WorldContext } from '@/ThreeWrapper/4.module'
import type { Player } from 'shared/state'
export type TeamColor = 'red' | 'blue' | 'green' | 'yellow' | string
export type Team = {
  id: string
  name: string
  color: TeamColor
  playerIds: string[]
  maxSize?: number
}
export type TeamModuleOptions = {
  teams?: Omit<Team, 'playerIds'>[]
  maxPlayersPerTeam?: number
  autoBalance?: boolean
}
export class TeamModule implements Module {
  readonly type = 'team-module'
  private ctx: WorldContext | null = null
  private teams: Map<string, Team> = new Map()
  private playerTeamMap: Map<string, string> = new Map() 
  private options: Required<TeamModuleOptions>
  constructor(options: TeamModuleOptions = {}) {
    this.options = {
      teams: options.teams ?? [],
      maxPlayersPerTeam: options.maxPlayersPerTeam ?? 0, 
      autoBalance: options.autoBalance ?? false,
    }
  }
  init(ctx: WorldContext): void {
    this.ctx = ctx
    for (const teamDef of this.options.teams) {
      this.teams.set(teamDef.id, {
        ...teamDef,
        playerIds: [],
        maxSize: teamDef.maxSize ?? this.options.maxPlayersPerTeam,
      })
    }
  }
  addTeam(team: Omit<Team, 'playerIds'>): Team {
    const newTeam: Team = {
      ...team,
      playerIds: [],
      maxSize: team.maxSize ?? this.options.maxPlayersPerTeam,
    }
    this.teams.set(team.id, newTeam)
    return newTeam
  }
  removeTeam(teamId: string): boolean {
    const team = this.teams.get(teamId)
    if (!team) return false
    for (const playerId of team.playerIds) {
      this.playerTeamMap.delete(playerId)
    }
    return this.teams.delete(teamId)
  }
  getTeam(teamId: string): Team | undefined {
    return this.teams.get(teamId)
  }
  getAllTeams(): Team[] {
    return Array.from(this.teams.values())
  }
  assignPlayer(playerId: string, teamId: string): boolean {
    const team = this.teams.get(teamId)
    if (!team) return false
    if (team.maxSize && team.maxSize > 0 && team.playerIds.length >= team.maxSize) {
      return false
    }
    this.removePlayerFromCurrentTeam(playerId)
    team.playerIds.push(playerId)
    this.playerTeamMap.set(playerId, teamId)
    return true
  }
  removePlayer(playerId: string): boolean {
    return this.removePlayerFromCurrentTeam(playerId)
  }
  getPlayerTeam(playerId: string): Team | undefined {
    const teamId = this.playerTeamMap.get(playerId)
    if (!teamId) return undefined
    return this.teams.get(teamId)
  }
  getTeamPlayers(teamId: string): string[] {
    return this.teams.get(teamId)?.playerIds ?? []
  }
  areTeammates(playerIdA: string, playerIdB: string): boolean {
    const teamA = this.playerTeamMap.get(playerIdA)
    const teamB = this.playerTeamMap.get(playerIdB)
    return !!teamA && teamA === teamB
  }
  autoAssignPlayer(player: Player): boolean {
    const smallestTeam = this.getSmallestTeam()
    if (!smallestTeam) return false
    return this.assignPlayer(player.id, smallestTeam.id)
  }
  autoBalanceAll(players: Player[]): void {
    for (const team of this.teams.values()) {
      team.playerIds = []
    }
    this.playerTeamMap.clear()
    const teamList = Array.from(this.teams.values())
    if (teamList.length === 0) return
    players.forEach((player, index) => {
      const team = teamList[index % teamList.length]
      team.playerIds.push(player.id)
      this.playerTeamMap.set(player.id, team.id)
    })
  }
  private removePlayerFromCurrentTeam(playerId: string): boolean {
    const currentTeamId = this.playerTeamMap.get(playerId)
    if (!currentTeamId) return false
    const currentTeam = this.teams.get(currentTeamId)
    if (currentTeam) {
      currentTeam.playerIds = currentTeam.playerIds.filter(id => id !== playerId)
    }
    this.playerTeamMap.delete(playerId)
    return true
  }
  private getSmallestTeam(): Team | undefined {
    let smallest: Team | undefined
    for (const team of this.teams.values()) {
      if (!team.maxSize || team.maxSize === 0 || team.playerIds.length < team.maxSize) {
        if (!smallest || team.playerIds.length < smallest.playerIds.length) {
          smallest = team
        }
      }
    }
    return smallest
  }
  update(_delta: number): void {}
  dispose(): void {
    this.teams.clear()
    this.playerTeamMap.clear()
    this.ctx = null
  }
}
