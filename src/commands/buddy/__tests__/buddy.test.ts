import { beforeEach, describe, expect, mock, test } from "bun:test"

let mockConfig: {
  companionMuted?: boolean
  companion?: {
    name: string
    personality: string
    seed?: string
    hatchedAt: number
  }
} = {}

let generatedSeed = "seed-123"
let currentCompanion:
  | {
      name: string
      personality: string
      species: string
      rarity: "common" | "uncommon" | "rare" | "epic" | "legendary"
      eye: string
      hat: string
      shiny: boolean
      hatchedAt: number
      stats: Record<string, number>
    }
  | undefined

mock.module("../../../utils/config.js", () => ({
  getGlobalConfig: () => mockConfig,
  saveGlobalConfig: (
    updater: (config: typeof mockConfig) => typeof mockConfig,
  ) => {
    mockConfig = updater(mockConfig)
  },
}))

mock.module("../../../buddy/companion.js", () => ({
  getCompanion: () => currentCompanion,
  generateSeed: () => generatedSeed,
  rollWithSeed: () => ({
    bones: {
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
    },
  }),
}))

mock.module("../../../buddy/sprites.js", () => ({
  renderSprite: () => ["[sprite]"],
}))

mock.module("../../../buddy/CompanionCard.js", () => ({
  CompanionCard: () => null,
}))

mock.module("../../../buddy/companionReact.js", () => ({
  triggerCompanionReaction: () => {},
}))

mock.module("../../../buddy/useBuddyNotification.js", () => ({
  isBuddyLive: () => true,
}))

const { call } = await import("../buddy.js")
const { default: buddyCommand } = await import("../index.js")

function createContext() {
  return {
    setAppState: undefined,
    messages: [],
    getAppState: () => ({}),
  } as any
}

beforeEach(() => {
  mockConfig = {}
  generatedSeed = "seed-123"
  currentCompanion = {
    name: "Buddy",
    personality: "friendly",
    species: "dragon",
    rarity: "legendary",
    eye: "·",
    hat: "none",
    shiny: false,
    hatchedAt: 42,
    stats: {
      DEBUGGING: 99,
      PATIENCE: 80,
      CHAOS: 10,
      WISDOM: 90,
      SNARK: 70,
    },
  }
})

describe("buddy command compatibility", () => {
  test("command metadata shows the legacy customer-facing command list", () => {
    expect(buddyCommand.description).toContain("pet, mute, unmute, hatch, rehatch")
    expect(buddyCommand.argumentHint).toBe("[pet|mute|unmute|hatch|rehatch]")
  })

  test("mute alias sets companionMuted to true", async () => {
    const seenDone: Array<string> = []

    await call(
      text => {
        if (text) {
          seenDone.push(text)
        }
      },
      createContext(),
      "mute",
    )

    expect(mockConfig.companionMuted).toBe(true)
    expect(seenDone).toEqual(["companion muted"])
  })

  test("unmute alias sets companionMuted to false", async () => {
    mockConfig = {
      companionMuted: true,
    }
    const seenDone: Array<string> = []

    await call(
      text => {
        if (text) {
          seenDone.push(text)
        }
      },
      createContext(),
      "unmute",
    )

    expect(mockConfig.companionMuted).toBe(false)
    expect(seenDone).toEqual(["companion unmuted"])
  })

  test("hatch shows the legacy command list when creating a companion", async () => {
    currentCompanion = undefined
    const seenDone: Array<string> = []

    await call(
      text => {
        if (text) {
          seenDone.push(text)
        }
      },
      createContext(),
      "hatch",
    )

    expect(seenDone[0]).toContain("/buddy pet  /buddy mute  /buddy unmute  /buddy hatch  /buddy rehatch")
    expect(mockConfig.companion?.seed).toBe("seed-123")
  })

  test("rehatch replaces the companion and shows the legacy command list", async () => {
    const seenDone: Array<string> = []

    await call(
      text => {
        if (text) {
          seenDone.push(text)
        }
      },
      createContext(),
      "rehatch",
    )

    expect(seenDone[0]).toContain("Your old companion has been replaced!")
    expect(seenDone[0]).toContain("/buddy pet  /buddy mute  /buddy unmute  /buddy hatch  /buddy rehatch")
    expect(mockConfig.companion?.seed).toBe("seed-123")
  })

  test("unknown subcommands no longer accidentally hatch a companion", async () => {
    currentCompanion = undefined
    const seenDone: Array<string> = []

    await call(
      text => {
        if (text) {
          seenDone.push(text)
        }
      },
      createContext(),
      "moot",
    )

    expect(seenDone[0]).toContain("unknown command: /buddy moot")
    expect(seenDone[0]).toContain("/buddy pet  /buddy mute  /buddy unmute  /buddy hatch  /buddy rehatch")
    expect(mockConfig.companion).toBeUndefined()
  })
})
