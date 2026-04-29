export type GameConfig = {
    id: string;
    maxPlayers: number;
    duration: number;
    winCondition: 'last_standing' | 'first_to_finish' | 'highest_score' | string;
    allowRejoin: boolean;
    spectatorAllowed: boolean;
    teams?: TeamConfig[];
    emits?: string[];
};
export type TeamConfig = {
    id: string;
    color: string;
    maxPlayers?: number;
};
//# sourceMappingURL=game.d.ts.map