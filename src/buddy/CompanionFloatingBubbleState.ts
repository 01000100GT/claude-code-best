export const FLOATING_BUBBLE_SHOW_TICKS = 20
export const FLOATING_BUBBLE_FADE_WINDOW_TICKS = 6

export type FloatingBubbleState = {
  tick: number
  forReaction: string | undefined
}

/**
 * Functionality:
 * Creates the initial floating bubble state for the provided reaction text.
 *
 * Parameters:
 * - reaction: string | undefined. The current companion reaction. `undefined`
 *   means there is no active bubble to render.
 *
 * Returns:
 * - FloatingBubbleState. A state object with the tick counter initialised to
 *   zero and bound to the provided reaction.
 *
 * Exception handling:
 * - This pure function does not throw and performs no side effects.
 */
export function createFloatingBubbleState(
  reaction: string | undefined,
): FloatingBubbleState {
  return {
    tick: 0,
    forReaction: reaction,
  }
}

/**
 * Functionality:
 * Synchronises the floating bubble state with the latest reaction. When the
 * reaction text changes, the bubble lifetime is restarted from tick zero.
 *
 * Parameters:
 * - state: FloatingBubbleState. The current state being tracked by the
 *   component. `tick` is expected to be a non-negative integer.
 * - reaction: string | undefined. The latest companion reaction text.
 *
 * Returns:
 * - FloatingBubbleState. Returns the original state when the reaction is
 *   unchanged; otherwise returns a new state reset for the new reaction.
 *
 * Exception handling:
 * - This pure function does not throw and performs no side effects.
 */
export function syncFloatingBubbleState(
  state: FloatingBubbleState,
  reaction: string | undefined,
): FloatingBubbleState {
  if (reaction === state.forReaction) {
    return state
  }

  return createFloatingBubbleState(reaction)
}

/**
 * Functionality:
 * Advances the floating bubble timer by one tick while preserving the tracked
 * reaction text.
 *
 * Parameters:
 * - state: FloatingBubbleState. The current floating bubble state whose `tick`
 *   value is expected to be a non-negative integer.
 *
 * Returns:
 * - FloatingBubbleState. A new state with `tick` incremented by one.
 *
 * Exception handling:
 * - This pure function does not throw and performs no side effects.
 */
export function advanceFloatingBubbleState(
  state: FloatingBubbleState,
): FloatingBubbleState {
  return {
    ...state,
    tick: state.tick + 1,
  }
}

/**
 * Functionality:
 * Determines whether the floating bubble should render in its fading state.
 *
 * Parameters:
 * - tick: number. The elapsed bubble lifetime in ticks. The expected business
 *   meaning is a non-negative integer.
 *
 * Returns:
 * - boolean. `true` when the bubble has entered the fade window; otherwise
 *   `false`.
 *
 * Exception handling:
 * - This pure function does not throw and performs no side effects.
 */
export function isFloatingBubbleFading(tick: number): boolean {
  return (
    tick >=
    FLOATING_BUBBLE_SHOW_TICKS - FLOATING_BUBBLE_FADE_WINDOW_TICKS
  )
}
