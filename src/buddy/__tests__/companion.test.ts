import { beforeEach, describe, expect, mock, test } from "bun:test"

let mockConfig: {
  oauthAccount?: { accountUuid?: string }
  userID?: string
  companion?: {
    name: string
    personality: string
    hatchedAt: number
    seed?: string
    rarity?: string
    species?: string
    eye?: string
    hat?: string
    shiny?: boolean
    stats?: Record<string, number>
  }
} = {}

const MOCK_DEFAULT_GLOBAL_CONFIG = {}

mock.module("../../utils/config.js", () => ({
  getGlobalConfig: () => mockConfig,
  saveGlobalConfig: (
    updater: (currentConfig: typeof mockConfig) => typeof mockConfig,
  ) => {
    mockConfig = updater(mockConfig)
  },
  DEFAULT_GLOBAL_CONFIG: MOCK_DEFAULT_GLOBAL_CONFIG,
}))

const {
  companionUserId,
  generateSeed,
  getCompanion,
  roll,
  rollWithSeed,
} = await import("../companion.js")

beforeEach(() => {
  mockConfig = {}
})

describe("companion domain logic", () => {
  test("rollWithSeed is deterministic for the same seed", () => {
    const first = rollWithSeed("seed-123")
    const second = rollWithSeed("seed-123")

    expect(second).toEqual(first)
  })

  test("roll returns the cached object for the same userId", () => {
    const first = roll("user-1")
    const second = roll("user-1")
    const third = roll("user-2")

    expect(second).toBe(first)
    expect(third).not.toBe(first)
  })

  test("roll output stays within expected domain ranges", () => {
    const result = rollWithSeed("domain-check")

    expect(["common", "uncommon", "rare", "epic", "legendary"]).toContain(
      result.bones.rarity,
    )
    expect(result.bones.stats.DEBUGGING).toBeGreaterThanOrEqual(1)
    expect(result.bones.stats.DEBUGGING).toBeLessThanOrEqual(100)
    expect(result.bones.stats.PATIENCE).toBeGreaterThanOrEqual(1)
    expect(result.bones.stats.PATIENCE).toBeLessThanOrEqual(100)
    expect(result.bones.stats.CHAOS).toBeGreaterThanOrEqual(1)
    expect(result.bones.stats.CHAOS).toBeLessThanOrEqual(100)
    expect(result.bones.stats.WISDOM).toBeGreaterThanOrEqual(1)
    expect(result.bones.stats.WISDOM).toBeLessThanOrEqual(100)
    expect(result.bones.stats.SNARK).toBeGreaterThanOrEqual(1)
    expect(result.bones.stats.SNARK).toBeLessThanOrEqual(100)
    expect(result.inspirationSeed).toBeGreaterThanOrEqual(0)
    expect(result.inspirationSeed).toBeLessThan(1_000_000_000)
  })

  test("generateSeed uses the rehatch prefix and random suffix shape", () => {
    const originalNow = Date.now
    const originalRandom = Math.random

    Date.now = () => 1_700_000_000_000
    Math.random = () => 0.123456789

    try {
      expect(generateSeed()).toBe("rehatch-1700000000000-4fzzzxjy")
    } finally {
      Date.now = originalNow
      Math.random = originalRandom
    }
  })

  test("companionUserId prefers oauth account, then userID, then anon", () => {
    mockConfig = {
      oauthAccount: { accountUuid: "oauth-user" },
      userID: "fallback-user",
    }
    expect(companionUserId()).toBe("oauth-user")

    mockConfig = {
      userID: "plain-user",
    }
    expect(companionUserId()).toBe("plain-user")

    mockConfig = {}
    expect(companionUserId()).toBe("anon")
  })

  test("getCompanion returns undefined when there is no stored companion", () => {
    mockConfig = {}

    expect(getCompanion()).toBeUndefined()
  })

  test("getCompanion merges stored soul with regenerated bones from seed", () => {
    mockConfig = {
      companion: {
        name: "Buddy",
        personality: "friendly",
        hatchedAt: 42,
        seed: "seed-abc",
      },
    }

    const companion = getCompanion()
    const seededRoll = rollWithSeed("seed-abc")

    expect(companion).toEqual({
      name: "Buddy",
      personality: "friendly",
      hatchedAt: 42,
      seed: "seed-abc",
      ...seededRoll.bones,
    })
  })

  test("getCompanion lets regenerated bones override stale stored bone fields", () => {
    mockConfig = {
      companion: {
        name: "Buddy",
        personality: "friendly",
        hatchedAt: 42,
        seed: "seed-override",
        rarity: "common",
        species: "cat",
        eye: "@",
        hat: "wizard",
        shiny: true,
        stats: {
          DEBUGGING: 1,
          PATIENCE: 1,
          CHAOS: 1,
          WISDOM: 1,
          SNARK: 1,
        },
      },
    }

    const companion = getCompanion()
    const seededRoll = rollWithSeed("seed-override")

    expect(companion?.rarity).toBe(seededRoll.bones.rarity)
    expect(companion?.species).toBe(seededRoll.bones.species)
    expect(companion?.eye).toBe(seededRoll.bones.eye)
    expect(companion?.hat).toBe(seededRoll.bones.hat)
    expect(companion?.shiny).toBe(seededRoll.bones.shiny)
    expect(companion?.stats).toEqual(seededRoll.bones.stats)
  })

  test("getCompanion falls back to companionUserId when stored seed is absent", () => {
    mockConfig = {
      oauthAccount: { accountUuid: "oauth-user" },
      companion: {
        name: "Buddy",
        personality: "friendly",
        hatchedAt: 42,
      },
    }

    const companion = getCompanion()
    const seededRoll = rollWithSeed("oauth-user")

    expect(companion).toEqual({
      name: "Buddy",
      personality: "friendly",
      hatchedAt: 42,
      ...seededRoll.bones,
    })
  })
})
