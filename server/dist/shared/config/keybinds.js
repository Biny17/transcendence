export var KeyAction;
(function (KeyAction) {
    KeyAction["MOVE_FORWARD"] = "move_forward";
    KeyAction["MOVE_BACKWARD"] = "move_backward";
    KeyAction["MOVE_LEFT"] = "move_left";
    KeyAction["MOVE_RIGHT"] = "move_right";
    KeyAction["JUMP"] = "jump";
    KeyAction["SPRINT"] = "sprint";
    KeyAction["CROUCH"] = "crouch";
    KeyAction["PAUSE"] = "pause";
})(KeyAction || (KeyAction = {}));
export const KeyActionLabels = {
    [KeyAction.MOVE_FORWARD]: 'Move Forward',
    [KeyAction.MOVE_BACKWARD]: 'Move Backward',
    [KeyAction.MOVE_LEFT]: 'Move Left',
    [KeyAction.MOVE_RIGHT]: 'Move Right',
    [KeyAction.JUMP]: 'Jump',
    [KeyAction.SPRINT]: 'Sprint',
    [KeyAction.CROUCH]: 'Crouch',
    [KeyAction.PAUSE]: 'Pause Menu',
};
export const DEFAULT_KEYBINDINGS = {
    [KeyAction.MOVE_FORWARD]: 'KeyW',
    [KeyAction.MOVE_BACKWARD]: 'KeyS',
    [KeyAction.MOVE_LEFT]: 'KeyA',
    [KeyAction.MOVE_RIGHT]: 'KeyD',
    [KeyAction.JUMP]: 'Space',
    [KeyAction.SPRINT]: 'ShiftLeft',
    [KeyAction.CROUCH]: 'ControlLeft',
    [KeyAction.PAUSE]: 'Escape',
};
//# sourceMappingURL=keybinds.js.map