import type { Vec3, Quat } from '../math';
export type PlayerState = {
    id: string;
    pos: Vec3;
    rot: Quat;
    action?: string;
    health?: number;
    score?: number;
};
export type Player = {
    id: string;
    name?: string;
    ready: boolean;
    isSpectator: boolean;
};
export type LoadWorldPlayer = {
    id: string;
    name?: string;
    skin?: string;
    cosmetics?: string[];
    lives: number;
    isSpectator: boolean;
};
//# sourceMappingURL=player.d.ts.map