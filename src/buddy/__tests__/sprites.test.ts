import { describe, expect, test } from "bun:test"
import {
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
  SPECIES,
  turtle,
  type CompanionBones,
} from "../types.js"
import { renderFace, renderSprite, spriteFrameCount } from "../sprites.js"

const baseStats = {
  DEBUGGING: 50,
  PATIENCE: 50,
  CHAOS: 50,
  WISDOM: 50,
  SNARK: 50,
} as const

function createBones(
  overrides: Partial<CompanionBones> & Pick<CompanionBones, "species">,
): CompanionBones {
  return {
    rarity: "legendary",
    species: overrides.species,
    eye: overrides.eye ?? "·",
    hat: overrides.hat ?? "none",
    shiny: overrides.shiny ?? false,
    stats: overrides.stats ?? { ...baseStats },
  }
}

describe("sprites", () => {
  test("renderSprite drops the blank hat slot when every frame leaves the first row empty", () => {
    const duckSprite = renderSprite(
      createBones({
        species: duck,
      }),
      0,
    )

    expect(duckSprite).toHaveLength(4)
    expect(duckSprite[0]).toContain("__")
    expect(duckSprite.join("\n")).toContain("<(· )___")
  })

  test("renderSprite inserts the hat line when the current frame has an empty first row", () => {
    const dragonSprite = renderSprite(
      createBones({
        species: dragon,
        hat: "crown",
      }),
      0,
    )

    expect(dragonSprite).toHaveLength(5)
    expect(dragonSprite[0]).toBe("   \\^^^/    ")
    expect(dragonSprite.join("\n")).toContain("<  ·  ·  >")
  })

  test("renderSprite preserves a non-empty first row instead of replacing it with a hat", () => {
    const dragonSprite = renderSprite(
      createBones({
        species: dragon,
        hat: "crown",
      }),
      2,
    )

    expect(dragonSprite[0]).toBe("   ~    ~   ")
    expect(dragonSprite[0]).not.toBe("   \\^^^/    ")
  })

  test("renderSprite wraps frame index using modulo", () => {
    const directFrame = renderSprite(
      createBones({
        species: cat,
      }),
      1,
    )
    const wrappedFrame = renderSprite(
      createBones({
        species: cat,
      }),
      4,
    )

    expect(wrappedFrame).toEqual(directFrame)
  })

  test("spriteFrameCount stays at three frames for every current species", () => {
    expect(SPECIES.map(species => spriteFrameCount(species))).toEqual(
      Array(SPECIES.length).fill(3),
    )
  })

  test("renderFace keeps stable species-specific face mappings", () => {
    const eye = "°" as const

    expect(renderFace(createBones({ species: duck, eye }))).toBe("(°>")
    expect(renderFace(createBones({ species: goose, eye }))).toBe("(°>")
    expect(renderFace(createBones({ species: blob, eye }))).toBe("(°°)")
    expect(renderFace(createBones({ species: cat, eye }))).toBe("=°ω°=")
    expect(renderFace(createBones({ species: dragon, eye }))).toBe("<°~°>")
    expect(renderFace(createBones({ species: octopus, eye }))).toBe("~(°°)~")
    expect(renderFace(createBones({ species: owl, eye }))).toBe("(°)(°)")
    expect(renderFace(createBones({ species: penguin, eye }))).toBe("(°>)")
    expect(renderFace(createBones({ species: turtle, eye }))).toBe("[°_°]")
    expect(renderFace(createBones({ species: snail, eye }))).toBe("°(@)")
    expect(renderFace(createBones({ species: ghost, eye }))).toBe("/°°\\")
    expect(renderFace(createBones({ species: axolotl, eye }))).toBe("}°.°{")
    expect(renderFace(createBones({ species: capybara, eye }))).toBe("(°oo°)")
    expect(renderFace(createBones({ species: cactus, eye }))).toBe("|°  °|")
    expect(renderFace(createBones({ species: robot, eye }))).toBe("[°°]")
    expect(renderFace(createBones({ species: rabbit, eye }))).toBe("(°..°)")
    expect(renderFace(createBones({ species: mushroom, eye }))).toBe("|°  °|")
    expect(renderFace(createBones({ species: chonk, eye }))).toBe("(°.°)")
  })
})
