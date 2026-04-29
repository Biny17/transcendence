import type { PlayerState } from './player';
export type GameEvent = {
    type: string;
    data: Record<string, unknown>;
    tick: number;
};
export type WorldState = {
    tick: number;
    players: PlayerState[];
    events: GameEvent[];
};
export type Score = {
    playerId: string;
    value: number;
};
export type Ranking = {
    playerId: string;
    rank: number;
    score: number;
};
//# sourceMappingURL=world.d.ts.map