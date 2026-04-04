import { beforeEach, describe, expect, mock, test } from "bun:test"

let buddyFeatureEnabled = true
let companionMuted = false
let currentCompanion:
  | {
      name: string
      species: string
    }
  | undefined = {
  name: "Buddy",
  species: "dragon",
}

mock.module("bun:bundle", () => ({
  feature: (name: string) => name === "BUDDY" && buddyFeatureEnabled,
}))

mock.module("../../utils/config.js", () => ({
  getGlobalConfig: () => ({
    companionMuted,
  }),
}))

mock.module("../companion.js", () => ({
  getCompanion: () => currentCompanion,
}))

const { buildCompanionIntroAttachment, companionIntroText, getCompanionIntroAttachment } = await import(
  "../prompt.js"
)

beforeEach(() => {
  buddyFeatureEnabled = true
  companionMuted = false
  currentCompanion = {
    name: "Buddy",
    species: "dragon",
  }
})

describe("buddy prompt", () => {
  test("companionIntroText interpolates name and species into the instruction text", () => {
    const text = companionIntroText("Buddy", "dragon")

    expect(text).toContain("A small dragon named Buddy")
    expect(text).toContain("You're not Buddy")
    expect(text).toContain("When the user addresses Buddy directly")
  })

  test("getCompanionIntroAttachment returns empty when feature is disabled", () => {
    buddyFeatureEnabled = false

    expect(getCompanionIntroAttachment([])).toEqual([])
  })

  test("getCompanionIntroAttachment returns empty when companion is missing", () => {
    currentCompanion = undefined

    expect(getCompanionIntroAttachment([])).toEqual([])
  })

  test("getCompanionIntroAttachment returns empty when companion is muted", () => {
    companionMuted = true

    expect(getCompanionIntroAttachment([])).toEqual([])
  })

  test("buildCompanionIntroAttachment creates a companion_intro attachment when eligible", () => {
    expect(
      buildCompanionIntroAttachment({
        companion: currentCompanion,
        muted: false,
        messages: [],
      }),
    ).toEqual([
      {
        type: "companion_intro",
        name: "Buddy",
        species: "dragon",
      },
    ])
  })

  test("buildCompanionIntroAttachment skips duplicates for the same companion name", () => {
    expect(
      buildCompanionIntroAttachment({
        companion: currentCompanion,
        muted: false,
        messages: [
          {
            type: "attachment",
            attachment: {
              type: "companion_intro",
              name: "Buddy",
              species: "dragon",
            },
          },
        ] as any[],
      }),
    ).toEqual([])
  })

  test("buildCompanionIntroAttachment allows a new intro for a different companion name", () => {
    expect(
      buildCompanionIntroAttachment({
        companion: currentCompanion,
        muted: false,
        messages: [
          {
            type: "attachment",
            attachment: {
              type: "companion_intro",
              name: "Old Buddy",
              species: "dragon",
            },
          },
        ] as any[],
      }),
    ).toEqual([
      {
        type: "companion_intro",
        name: "Buddy",
        species: "dragon",
      },
    ])
  })
})
