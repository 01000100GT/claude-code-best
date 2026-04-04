import { describe, expect, test } from "bun:test"
import { renderToScreen } from "../../ink/render-to-screen.js"
import { cellAtIndex } from "../../ink/screen.js"
import {
  CompanionCard,
  formatCompanionCardStatBar,
  isCompanionCardDismissActive,
} from "../CompanionCard.js"
import type { Companion } from "../types.js"

const baseCompanion: Companion = {
  name: "Buddy",
  personality: "calm but curious",
  seed: "seed-1",
  hatchedAt: 1,
  rarity: "legendary",
  species: "dragon",
  eye: "·",
  hat: "none",
  shiny: false,
  stats: {
    DEBUGGING: 99,
    PATIENCE: 55,
    CHAOS: 10,
    WISDOM: 88,
    SNARK: 73,
  },
}

function screenToText(screen: any): string {
  const lines: string[] = []

  for (let row = 0; row < screen.height; row++) {
    let line = ""
    for (let col = 0; col < screen.width; col++) {
      line += cellAtIndex(screen, row * screen.width + col).char
    }
    lines.push(line.trimEnd())
  }

  return lines.join("\n")
}

describe("CompanionCard", () => {
  test("formatCompanionCardStatBar clamps fill width but preserves displayed value", () => {
    expect(formatCompanionCardStatBar("DEBUGGING", 55)).toBe(
      "DEBUGGING  ██████░░░░  55",
    )
    expect(formatCompanionCardStatBar("CHAOS", 120)).toBe(
      "CHAOS      ██████████ 120",
    )
    expect(formatCompanionCardStatBar("CHAOS", -5)).toBe(
      "CHAOS      ░░░░░░░░░░  -5",
    )
  })

  test("isCompanionCardDismissActive reflects whether onDone exists", () => {
    expect(isCompanionCardDismissActive()).toBe(false)
    expect(isCompanionCardDismissActive(() => {})).toBe(true)
  })

  test("renders card content, border, rarity header, and stats", () => {
    const { screen } = renderToScreen(
      <CompanionCard companion={baseCompanion} />,
      80,
    )
    const text = screenToText(screen)

    expect(text).toContain("★★★★★ LEGENDARY")
    expect(text).toContain("DRAGON")
    expect(text).toContain("Buddy")
    expect(text).toContain('"calm but curious"')
    expect(text).toContain("DEBUGGING  ██████████  99")
    expect(text).toContain("PATIENCE   ██████░░░░  55")
    expect(text).toContain("╭")
    expect(text).toContain("╰")
  })

  test("renders shiny banner and last reaction section when provided", () => {
    const { screen } = renderToScreen(
      <CompanionCard
        companion={{ ...baseCompanion, shiny: true }}
        lastReaction="I am ready!"
      />,
      80,
    )
    const text = screenToText(screen)

    expect(text).toContain("✨ SHINY ✨")
    expect(text).toContain("last said")
    expect(text).toContain("I am ready!")
  })

  test("omits last reaction section when no reaction is provided", () => {
    const { screen } = renderToScreen(
      <CompanionCard companion={baseCompanion} />,
      80,
    )
    const text = screenToText(screen)

    expect(text).not.toContain("last said")
  })
})
