import { describe, expect, test } from "bun:test"
import {
  EYES,
  HATS,
  RARITIES,
  RARITY_COLORS,
  RARITY_STARS,
  RARITY_WEIGHTS,
  SPECIES,
  STAT_NAMES,
  axolotl,
  blob,
  cactus,
  capybara,
  cat,
  chonk,
  dragon,
  duck,
  ghost,
  goose,
  mushroom,
  octopus,
  owl,
  penguin,
  rabbit,
  robot,
  snail,
  turtle,
} from "../types.js"

describe("buddy types", () => {
  test("SPECIES keeps the full expected species set in order", () => {
    expect(SPECIES).toEqual([
      duck,
      goose,
      blob,
      cat,
      dragon,
      octopus,
      owl,
      penguin,
      turtle,
      snail,
      ghost,
      axolotl,
      capybara,
      cactus,
      robot,
      rabbit,
      mushroom,
      chonk,
    ])
  })

  test("species runtime-constructed constants decode to the expected strings", () => {
    expect(duck).toBe("duck")
    expect(goose).toBe("goose")
    expect(blob).toBe("blob")
    expect(cat).toBe("cat")
    expect(dragon).toBe("dragon")
    expect(octopus).toBe("octopus")
    expect(owl).toBe("owl")
    expect(penguin).toBe("penguin")
    expect(turtle).toBe("turtle")
    expect(snail).toBe("snail")
    expect(ghost).toBe("ghost")
    expect(axolotl).toBe("axolotl")
    expect(capybara).toBe("capybara")
    expect(cactus).toBe("cactus")
    expect(robot).toBe("robot")
    expect(rabbit).toBe("rabbit")
    expect(mushroom).toBe("mushroom")
    expect(chonk).toBe("chonk")
  })

  test("EYES, HATS, and STAT_NAMES keep their expected options", () => {
    expect(EYES).toEqual(["·", "✦", "×", "◉", "@", "°"])
    expect(HATS).toEqual([
      "none",
      "crown",
      "tophat",
      "propeller",
      "halo",
      "wizard",
      "beanie",
      "tinyduck",
    ])
    expect(STAT_NAMES).toEqual([
      "DEBUGGING",
      "PATIENCE",
      "CHAOS",
      "WISDOM",
      "SNARK",
    ])
  })

  test("rarity weights, stars, and colors cover every rarity key", () => {
    expect(Object.keys(RARITY_WEIGHTS)).toEqual([...RARITIES])
    expect(Object.keys(RARITY_STARS)).toEqual([...RARITIES])
    expect(Object.keys(RARITY_COLORS)).toEqual([...RARITIES])
  })

  test("rarity weights stay positive and sum to the expected distribution", () => {
    const weights = RARITIES.map(rarity => RARITY_WEIGHTS[rarity])

    expect(weights.every(weight => weight > 0)).toBe(true)
    expect(weights.reduce((sum, weight) => sum + weight, 0)).toBe(100)
    expect(weights).toEqual([60, 25, 10, 4, 1])
  })

  test("rarity stars increase monotonically with rarity tier", () => {
    const starCounts = RARITIES.map(rarity => RARITY_STARS[rarity].length)

    expect(starCounts).toEqual([1, 2, 3, 4, 5])
  })

  test("rarity colors keep the expected theme mapping", () => {
    expect(RARITY_COLORS).toEqual({
      common: "inactive",
      uncommon: "success",
      rare: "permission",
      epic: "autoAccept",
      legendary: "warning",
    })
  })
})
