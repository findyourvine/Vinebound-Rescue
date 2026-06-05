/**
 * A tiny global input state shared between the on-screen touch controls,
 * the keyboard handlers, and the Player.
 *
 * - Held flags (left/right/jumpHeld) describe a button currently pressed.
 * - "Queued" flags are one-shot pulses: set true on press; the Player
 *   buffers/consumes them so one tap == one action.
 */
export const input = {
  left: false,
  right: false,
  jumpHeld: false,    // held state, for variable-height jumps
  jumpQueued: false,
  corkQueued: false,
  dashQueued: false,
};

/** Clear everything — call on scene shutdown so movement never "sticks". */
export function resetInput() {
  input.left = false;
  input.right = false;
  input.jumpHeld = false;
  input.jumpQueued = false;
  input.corkQueued = false;
  input.dashQueued = false;
}
