import { beforeEach, describe, expect, test } from "bun:test"
import { DEFAULT_GLOBAL_CONFIG, saveGlobalConfig } from "../../utils/config.js"
import { getCompanion, rollWithSeed } from "../companion.js"
import { HATS, RARITIES } from "../types.js"

function resetGlobalConfigForTest() {
  saveGlobalConfig(() => structuredClone(DEFAULT_GLOBAL_CONFIG))
}

beforeEach(() => {
  resetGlobalConfigForTest()
})

function collectDeterministicSample(sampleSize: number) {
  const rarityCounts = Object.fromEntries(
    RARITIES.map(rarity => [rarity, 0]),
  ) as Record<(typeof RARITIES)[number], number>
  let shinyCount = 0
  const nonCommonHats = new Set<string>()

  for (let i = 0; i < sampleSize; i++) {
    const result = rollWithSeed(`stat-scan-${i}`)
    rarityCounts[result.bones.rarity] += 1
    if (result.bones.shiny) {
      shinyCount += 1
    }
    if (result.bones.rarity !== "common") {
      nonCommonHats.add(result.bones.hat)
    }
  }

  return {
    rarityCounts,
    shinyCount,
    nonCommonHats,
  }
}

describe("companion config integration", () => {
  test("saveGlobalConfig writes companion soul and getCompanion reads back merged companion", () => {
    saveGlobalConfig(current => ({
      ...current,
      companion: {
        name: "Buddy",
        personality: "friendly",
        hatchedAt: 42,
        seed: "persisted-seed",
      },
    }))

    const companion = getCompanion()
    const seededRoll = rollWithSeed("persisted-seed")

    expect(companion).toEqual({
      name: "Buddy",
      personality: "friendly",
      hatchedAt: 42,
      seed: "persisted-seed",
      ...seededRoll.bones,
    })
  })

  test("saveGlobalConfig clearing companion makes getCompanion return undefined", () => {
    saveGlobalConfig(current => ({
      ...current,
      companion: {
        name: "Buddy",
        personality: "friendly",
        hatchedAt: 42,
        seed: "seed-clear",
      },
    }))

    expect(getCompanion()).toBeDefined()

    saveGlobalConfig(current => ({
      ...current,
      companion: undefined,
    }))

    expect(getCompanion()).toBeUndefined()
  })

  test("common rarity companions always have hat set to none", () => {
    for (let i = 0; i < 5000; i++) {
      const result = rollWithSeed(`hat-rule-${i}`)
      if (result.bones.rarity === "common") {
        expect(result.bones.hat).toBe("none")
      }
    }
  })

  test("deterministic sample includes all rarity bands", () => {
    const seenRarities = new Set<string>()

    for (let i = 0; i < 20000; i++) {
      seenRarities.add(rollWithSeed(`rarity-scan-${i}`).bones.rarity)
      if (seenRarities.size === 5) {
        break
      }
    }

    expect([...seenRarities].sort()).toEqual(
      ["common", "epic", "legendary", "rare", "uncommon"].sort(),
    )
  })

  test("deterministic sample includes both shiny and non-shiny companions", () => {
    let sawShiny = false
    let sawNonShiny = false

    for (let i = 0; i < 10000; i++) {
      const shiny = rollWithSeed(`shiny-scan-${i}`).bones.shiny
      if (shiny) {
        sawShiny = true
      } else {
        sawNonShiny = true
      }

      if (sawShiny && sawNonShiny) {
        break
      }
    }

    expect(sawShiny).toBe(true)
    expect(sawNonShiny).toBe(true)
  })

  test("deterministic rarity distribution stays close to the configured weight shape", () => {
    const { rarityCounts } = collectDeterministicSample(20_000)

    expect(rarityCounts.common).toBeGreaterThan(10_000)
    expect(rarityCounts.common).toBeLessThan(14_000)
    expect(rarityCounts.uncommon).toBeGreaterThan(4_000)
    expect(rarityCounts.uncommon).toBeLessThan(6_000)
    expect(rarityCounts.rare).toBeGreaterThan(1_400)
    expect(rarityCounts.rare).toBeLessThan(2_600)
    expect(rarityCounts.epic).toBeGreaterThan(400)
    expect(rarityCounts.epic).toBeLessThan(1_200)
    expect(rarityCounts.legendary).toBeGreaterThan(80)
    expect(rarityCounts.legendary).toBeLessThan(400)

    expect(rarityCounts.common).toBeGreaterThan(rarityCounts.uncommon)
    expect(rarityCounts.uncommon).toBeGreaterThan(rarityCounts.rare)
    expect(rarityCounts.rare).toBeGreaterThan(rarityCounts.epic)
    expect(rarityCounts.epic).toBeGreaterThan(rarityCounts.legendary)
  })

  test("deterministic shiny rate stays within a narrow expected boundary", () => {
    const { shinyCount } = collectDeterministicSample(20_000)

    expect(shinyCount).toBeGreaterThan(100)
    expect(shinyCount).toBeLessThan(320)
  })

  test("non-common companions can produce both none and non-none hats within the valid hat set", () => {
    const { nonCommonHats } = collectDeterministicSample(20_000)

    expect(nonCommonHats.has("none")).toBe(true)
    expect([...nonCommonHats].some(hat => hat !== "none")).toBe(true)
    expect([...nonCommonHats].every(hat => HATS.includes(hat as any))).toBe(
      true,
    )
  })
})
