import { describe, expect, test } from "bun:test"
import {
  advanceFloatingBubbleState,
  createFloatingBubbleState,
  FLOATING_BUBBLE_FADE_WINDOW_TICKS,
  FLOATING_BUBBLE_SHOW_TICKS,
  isFloatingBubbleFading,
  syncFloatingBubbleState,
} from "../CompanionFloatingBubbleState.js"

describe("CompanionFloatingBubbleState", () => {
  test("creates initial state from reaction", () => {
    expect(createFloatingBubbleState("hello")).toEqual({
      tick: 0,
      forReaction: "hello",
    })
  })

  test("preserves state when reaction is unchanged", () => {
    const state = {
      tick: 5,
      forReaction: "hello",
    }

    expect(syncFloatingBubbleState(state, "hello")).toBe(state)
  })

  test("resets tick when reaction changes", () => {
    expect(
      syncFloatingBubbleState(
        {
          tick: 13,
          forReaction: "hello",
        },
        "world",
      ),
    ).toEqual({
      tick: 0,
      forReaction: "world",
    })
  })

  test("resets tick when reaction becomes undefined", () => {
    expect(
      syncFloatingBubbleState(
        {
          tick: 9,
          forReaction: "hello",
        },
        undefined,
      ),
    ).toEqual({
      tick: 0,
      forReaction: undefined,
    })
  })

  test("advances tick by one while preserving reaction", () => {
    expect(
      advanceFloatingBubbleState({
        tick: 2,
        forReaction: "hello",
      }),
    ).toEqual({
      tick: 3,
      forReaction: "hello",
    })
  })

  test("starts fading at the configured threshold", () => {
    const threshold =
      FLOATING_BUBBLE_SHOW_TICKS - FLOATING_BUBBLE_FADE_WINDOW_TICKS

    expect(isFloatingBubbleFading(threshold - 1)).toBe(false)
    expect(isFloatingBubbleFading(threshold)).toBe(true)
    expect(isFloatingBubbleFading(FLOATING_BUBBLE_SHOW_TICKS)).toBe(true)
  })

  test("does not carry fading state from reaction A to reaction B", () => {
    const threshold =
      FLOATING_BUBBLE_SHOW_TICKS - FLOATING_BUBBLE_FADE_WINDOW_TICKS
    const fadedState = {
      tick: threshold + 2,
      forReaction: "A",
    }

    const resetState = syncFloatingBubbleState(fadedState, "B")

    expect(resetState.tick).toBe(0)
    expect(resetState.forReaction).toBe("B")
    expect(isFloatingBubbleFading(resetState.tick)).toBe(false)
  })
})
