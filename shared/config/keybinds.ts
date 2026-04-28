export enum KeyAction {
  MOVE_FORWARD = 'move_forward',
  MOVE_BACKWARD = 'move_backward',
  MOVE_LEFT = 'move_left',
  MOVE_RIGHT = 'move_right',
  JUMP = 'jump',
  SPRINT = 'sprint',
  CROUCH = 'crouch',
  PAUSE = 'pause',
}
export const KeyActionLabels: Record<KeyAction, string> = {
  [KeyAction.MOVE_FORWARD]: 'Move Forward',
  [KeyAction.MOVE_BACKWARD]: 'Move Backward',
  [KeyAction.MOVE_LEFT]: 'Move Left',
  [KeyAction.MOVE_RIGHT]: 'Move Right',
  [KeyAction.JUMP]: 'Jump',
  [KeyAction.SPRINT]: 'Sprint',
  [KeyAction.CROUCH]: 'Crouch',
  [KeyAction.PAUSE]: 'Pause Menu',
}
export const DEFAULT_KEYBINDINGS: Record<KeyAction, string> = {
  [KeyAction.MOVE_FORWARD]: 'KeyW',
  [KeyAction.MOVE_BACKWARD]: 'KeyS',
  [KeyAction.MOVE_LEFT]: 'KeyA',
  [KeyAction.MOVE_RIGHT]: 'KeyD',
  [KeyAction.JUMP]: 'Space',
  [KeyAction.SPRINT]: 'ShiftLeft',
  [KeyAction.CROUCH]: 'ControlLeft',
  [KeyAction.PAUSE]: 'Escape',
}
