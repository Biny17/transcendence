export type WinConditionQuorumWin = {
  type: 'quorum_win'
  trigger: string       
  quorum: number | string 
}
export type WinConditionTimerSurvival = {
  type: 'timer_survival'
  duration: number      
  loseTrigger: string   
}
export type WinCondition = WinConditionQuorumWin | WinConditionTimerSurvival
export type GameModeCandidate = {
  worldId: string
  cinematic?: boolean
  loadTimeout?: number
  winCondition: WinCondition
  elimination: EliminationRule
}
export type GameModeSelectEntry = {
  condition: string                 
  pick: 'random' | 'fixed'
  candidates: GameModeCandidate[]
}
export type EliminationRule = {
  livesLost: number
}
export type CinematicPhase = {
  type: "cinematic";
  id: string;
  timeout: number;
};
export type WaitPhase = {
  type: "wait";
  worldId: string;
  waitFor: string;
  quorum: number | string;
  timeout: number;
  onTimeout?: "proceed" | "random";
};
export type GamePhase = {
	type: "game";
	sendGameResult: boolean;
	endCondition?: LobbyWinCondition;
	gameModeSelect: GameModeSelectEntry[];
	elimination: EliminationRule;
};
export type LoopPhase = {
  type: "loop";
  id: string;
  repeat: "until_lobby_end";
  phases: SequencePhase[];
};
export type EndPhase = {
  type: "end";
  worldId: string;
  timeout: number;
};
export type SequencePhase = WaitPhase | GamePhase | LoopPhase | EndPhase | CinematicPhase;
export type LobbyWinCondition =
  | { type: 'last_with_lives' }
  | { type: 'best_cumulative_score' }
  | { type: 'fixed_rounds'; value: number }
export type LobbySequenceConfig = {
  id: string
  globalLives: number
  phases: SequencePhase[]
  lobbyWinCondition: LobbyWinCondition
}