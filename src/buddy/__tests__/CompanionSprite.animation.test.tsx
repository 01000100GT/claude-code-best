import { beforeEach, describe, expect, mock, test } from "bun:test"
import figures from "figures"

let currentFullscreen = false
let currentCompanion: any = {
  name: "Buddy",
  rarity: "legendary",
  species: "dragon",
  eye: "·",
  hat: "none",
  shiny: false,
  stats: {
    DEBUGGING: 99,
    PATIENCE: 80,
    CHAOS: 10,
    WISDOM: 90,
    SNARK: 70,
  },
}

mock.module("../../hooks/useTerminalSize.js", () => ({
  useTerminalSize: () => ({ columns: 120, rows: 24 }),
}))

mock.module("../../state/AppState.js", () => ({
  useAppState: () => undefined,
  useSetAppState: () => () => {},
}))

mock.module("../../utils/config.js", () => ({
  getGlobalConfig: () => ({
    companionMuted: false,
  }),
  saveGlobalConfig: () => {},
  DEFAULT_GLOBAL_CONFIG: {},
}))

mock.module("../../utils/fullscreen.js", () => ({
  isFullscreenActive: () => currentFullscreen,
  isFullscreenEnvEnabled: () => currentFullscreen,
  isMouseClicksDisabled: () => false,
  isMouseTrackingEnabled: () => false,
  maybeGetTmuxMouseHint: () => undefined,
}))

mock.module("../companion.js", () => ({
  getCompanion: () => currentCompanion,
}))

mock.module("../sprites.js", () => ({
  renderFace: (companion: { eye: string }) => `(${companion.eye})`,
  renderSprite: (companion: { eye: string; name: string }, frame: number) => [
    `[${companion.name} ${frame}] ${companion.eye}${companion.eye}`,
    "body",
  ],
  spriteFrameCount: () => 3,
}))

const { renderToScreen } = await import("../../ink/render-to-screen.js")
const { cellAtIndex } = await import("../../ink/screen.js")
const {
  CompanionSpriteContent,
  deriveCompanionSpriteAnimation,
} = await import("../CompanionSprite.js")

function screenToText(screen: any): string {
  const lines: string[] = []

  for (let row = 0; row < screen.height; row++) {
    let line = ""
    for (let col = 0; col < screen.width; col++) {
      line += cellAtIndex(screen, row * screen.width + col).char
    }
    lines.push(line.trimEnd())
  }

  return lines.join("\n").trim()
}

function renderAnimatedSprite(args: {
  reaction?: string
  petting?: boolean
  petAge?: number
  tick?: number
}): string {
  const { screen } = renderToScreen(
    <CompanionSpriteContent
      companion={currentCompanion}
      reaction={args.reaction}
      focused={false}
      columns={120}
      petting={args.petting ?? false}
      petAge={args.petAge ?? 0}
      fading={false}
      tick={args.tick ?? 0}
      fullscreen={currentFullscreen}
    />,
    160,
  )

  return screenToText(screen)
}

beforeEach(() => {
  currentFullscreen = false
  currentCompanion = {
    name: "Buddy",
    rarity: "legendary",
    species: "dragon",
    eye: "·",
    hat: "none",
    shiny: false,
    stats: {
      DEBUGGING: 99,
      PATIENCE: 80,
      CHAOS: 10,
      WISDOM: 90,
      SNARK: 70,
    },
  }
})

describe("CompanionSprite animation", () => {
  test("deriveCompanionSpriteAnimation enters blink state on the idle blink step", () => {
    expect(
      deriveCompanionSpriteAnimation({
        reaction: undefined,
        petting: false,
        petAge: 0,
        tick: 8,
        frameCount: 3,
      }),
    ).toEqual({
      heartFrame: null,
      spriteFrame: 0,
      blink: true,
    })
  })

  test("deriveCompanionSpriteAnimation cycles pet burst hearts and excited frames", () => {
    expect(
      deriveCompanionSpriteAnimation({
        reaction: "hello",
        petting: true,
        petAge: 4,
        tick: 5,
        frameCount: 3,
      }),
    ).toEqual({
      heartFrame: "·    ·   ·  ",
      spriteFrame: 2,
      blink: false,
    })
  })

  test("CompanionSpriteContent replaces eyes with dashes during blink", () => {
    const text = renderAnimatedSprite({
      tick: 8,
    })

    expect(text).toContain("[Buddy 0] --")
    expect(text).not.toContain("··")
  })

  test("CompanionSpriteContent prepends the pet burst hearts while petting", () => {
    const text = renderAnimatedSprite({
      petting: true,
      petAge: 0,
      tick: 0,
    })

    expect(text).toContain(figures.heart)
    expect(text).toContain("[Buddy 0] ··")
  })

  test("CompanionSpriteContent reaches the final pet burst frame before petting ends", () => {
    const text = renderAnimatedSprite({
      petting: true,
      petAge: 4,
      tick: 1,
    })

    expect(text).toContain("·    ·   ·")
    expect(text).toContain("[Buddy 1] ··")
  })
})
