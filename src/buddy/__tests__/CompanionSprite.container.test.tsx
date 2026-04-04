import { beforeEach, describe, expect, mock, test } from "bun:test"

let currentColumns = 120
let currentFullscreen = false
let companionMuted = false
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
let currentAppState = {
  companionReaction: undefined as string | undefined,
  companionPetAt: undefined as number | undefined,
  footerSelection: undefined as string | undefined,
}

mock.module("../../hooks/useTerminalSize.js", () => ({
  useTerminalSize: () => ({ columns: currentColumns, rows: 24 }),
}))

mock.module("../../state/AppState.js", () => ({
  useAppState: (selector: (state: typeof currentAppState) => unknown) =>
    selector(currentAppState),
  useSetAppState: () => () => {},
}))

mock.module("../../utils/config.js", () => ({
  getGlobalConfig: () => ({
    companionMuted,
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
  renderSprite: (companion: { name: string }, frame: number) => [
    `[sprite ${companion.name} ${frame}]`,
    "[body]",
  ],
  spriteFrameCount: () => 3,
}))

const { renderToScreen } = await import("../../ink/render-to-screen.js")
const { cellAtIndex } = await import("../../ink/screen.js")
const {
  MIN_COLS_FOR_FULL_SPRITE,
  CompanionSpriteContent,
  CompanionSpriteView,
  calculateCompanionReservedColumns,
  canRenderCompanionSprite,
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

function renderSpriteContainer(): string {
  const { screen } = renderToScreen(
    <CompanionSpriteView
      companion={currentCompanion}
      muted={companionMuted}
      reaction={currentAppState.companionReaction}
      focused={currentAppState.footerSelection === "companion"}
      columns={currentColumns}
      petting={false}
      petAge={0}
      fading={false}
      tick={0}
      fullscreen={currentFullscreen}
    />,
    160,
  )
  return screenToText(screen)
}

function renderSpriteContent(): string {
  const { screen } = renderToScreen(
    <CompanionSpriteContent
      companion={currentCompanion}
      reaction={currentAppState.companionReaction}
      focused={currentAppState.footerSelection === "companion"}
      columns={currentColumns}
      petting={false}
      petAge={0}
      fading={false}
      tick={0}
      fullscreen={currentFullscreen}
    />,
    160,
  )
  return screenToText(screen)
}

beforeEach(() => {
  currentColumns = 120
  currentFullscreen = false
  companionMuted = false
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
  currentAppState = {
    companionReaction: undefined,
    companionPetAt: undefined,
    footerSelection: undefined,
  }
})

describe("CompanionSprite container", () => {
  test("canRenderCompanionSprite encodes companion presence and muted gate", () => {
    expect(
      canRenderCompanionSprite({
        hasCompanion: true,
        muted: false,
      }),
    ).toBe(true)

    expect(
      canRenderCompanionSprite({
        hasCompanion: false,
        muted: false,
      }),
    ).toBe(false)

    expect(
      canRenderCompanionSprite({
        hasCompanion: true,
        muted: true,
      }),
    ).toBe(false)
  })

  test("renders only the sprite column when wide and not speaking", () => {
    const text = renderSpriteContainer()

    expect(text).toContain("[sprite")
    expect(text).toContain("Buddy 0]")
    expect(text).toContain("Buddy")
    expect(text).not.toContain('"')
  })

  test("renders inline speech bubble when wide, speaking, and not fullscreen", () => {
    currentAppState = {
      ...currentAppState,
      companionReaction: "hello from buddy",
    }

    const text = renderSpriteContainer()

    expect(text).toContain("hello from buddy")
    expect(text).toContain("[sprite")
    expect(text).toContain("Buddy 0]")
    expect(text).toContain("─")
  })

  test("omits inline bubble when fullscreen is active even if reaction exists", () => {
    currentFullscreen = true
    currentAppState = {
      ...currentAppState,
      companionReaction: "fullscreen line",
    }

    const text = renderSpriteContainer()

    expect(text).toContain("[sprite")
    expect(text).toContain("Buddy 0]")
    expect(text).not.toContain("fullscreen line")
    expect(text).not.toContain("─")
  })

  test("renders one-line narrow layout with quoted quip when terminal is narrow", () => {
    currentColumns = MIN_COLS_FOR_FULL_SPRITE - 1
    currentAppState = {
      ...currentAppState,
      companionReaction: "narrow hello",
    }

    const text = renderSpriteContainer()

    expect(text).toContain("(·)")
    expect(text).toContain('"narrow hello"')
    expect(text).not.toContain("[sprite Buddy 0]")
  })

  test("returns nothing when companion is missing at the view level", () => {
    currentCompanion = undefined

    expect(renderSpriteContainer()).toBe("")
  })

  test("returns nothing when companion is muted at the view level", () => {
    companionMuted = true

    expect(renderSpriteContainer()).toBe("")
  })

  test("focused name row wraps the companion name with spaces", () => {
    currentAppState = {
      ...currentAppState,
      footerSelection: "companion",
    }

    const text = renderSpriteContent()

    expect(text).toContain(" Buddy ")
  })

  test("calculateCompanionReservedColumns includes bubble width only when speaking outside fullscreen", () => {
    const silentColumns = calculateCompanionReservedColumns({
      terminalColumns: 120,
      speaking: false,
      companionName: "Buddy",
      fullscreen: false,
    })
    const speakingColumns = calculateCompanionReservedColumns({
      terminalColumns: 120,
      speaking: true,
      companionName: "Buddy",
      fullscreen: false,
    })

    expect(speakingColumns).toBeGreaterThan(silentColumns)

    expect(
      calculateCompanionReservedColumns({
        terminalColumns: 120,
        speaking: true,
        companionName: "Buddy",
        fullscreen: true,
      }),
    ).toBe(silentColumns)

    expect(
      calculateCompanionReservedColumns({
        terminalColumns: MIN_COLS_FOR_FULL_SPRITE - 1,
        speaking: true,
        companionName: "Buddy",
        fullscreen: false,
      }),
    ).toBe(0)
  })
})
