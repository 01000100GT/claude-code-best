import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test"

const originalFetch = globalThis.fetch

const mockCompanion = {
  name: "Buddy",
  personality:
    "A very friendly companion with a very long personality description that should be truncated when building the request body.",
  species: "dragon",
  rarity: "legendary",
  stats: {
    DEBUGGING: 99,
    PATIENCE: 80,
    CHAOS: 10,
    WISDOM: 90,
    SNARK: 70,
  },
}

let companionMuted = false
let mockAccessToken: string | undefined = "token-123"
let mockOrganizationUuid: string | undefined = "org-123"

mock.module("../companion.js", () => ({
  getCompanion: () => mockCompanion,
}))

mock.module("../../utils/config.js", () => ({
  getGlobalConfig: () => ({
    companionMuted,
    oauthAccount: mockOrganizationUuid
      ? { organizationUuid: mockOrganizationUuid }
      : undefined,
  }),
}))

mock.module("../../utils/auth.js", () => ({
  getClaudeAIOAuthTokens: () =>
    mockAccessToken ? { accessToken: mockAccessToken } : undefined,
}))

mock.module("../../constants/oauth.js", () => ({
  getOauthConfig: () => ({
    BASE_API_URL: "https://example.com",
  }),
}))

mock.module("../../utils/http.js", () => ({
  getUserAgent: () => "test-agent",
}))

const {
  _resetCompanionReactStateForTesting,
  appendRecentReaction,
  buildTranscript,
  createBuddyReactRequestBody,
  escapeRegex,
  isAddressed,
  shouldTriggerCompanionReaction,
  triggerCompanionReaction,
} = await import("../companionReact.js")

async function flushAsyncWork(): Promise<void> {
  await Promise.resolve()
  await new Promise<void>(resolve => setTimeout(resolve, 0))
}

beforeEach(() => {
  companionMuted = false
  mockAccessToken = "token-123"
  mockOrganizationUuid = "org-123"
  _resetCompanionReactStateForTesting()
})

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe("companionReact", () => {
  test("escapeRegex escapes regex metacharacters", () => {
    expect(escapeRegex("a+b(c)?[d]")).toBe("a\\+b\\(c\\)\\?\\[d\\]")
  })

  test("isAddressed only inspects recent user messages", () => {
    const messages = [
      { type: "user", message: { content: "hello Buddy" } },
      { type: "assistant", message: { content: "response" } },
      { type: "user", message: { content: "another line" } },
      { type: "assistant", message: { content: "response" } },
      { type: "user", message: { content: "Buddy please help" } },
    ] as any[]

    expect(isAddressed(messages, "Buddy")).toBe(true)
    expect(isAddressed(messages.slice(0, 3), "Buddy")).toBe(true)
    expect(
      isAddressed(
        [
          { type: "assistant", message: { content: "Buddy" } },
          { type: "user", message: { content: "no mention here" } },
        ] as any[],
        "Buddy",
      ),
    ).toBe(false)
  })

  test("buildTranscript keeps only recent user and assistant text", () => {
    const messages = [
      { type: "system", message: { content: "skip me" } },
      { type: "user", message: { content: "hello" } },
      {
        type: "assistant",
        message: {
          content: [
            { type: "text", text: "part one" },
            { type: "image", url: "skip" },
            { type: "text", text: "part two" },
          ],
        },
      },
    ] as any[]

    expect(buildTranscript(messages)).toBe(
      "user: hello\nclaude: part one part two",
    )
  })

  test("shouldTriggerCompanionReaction encodes mute, transcript, and rate-limit guards", () => {
    expect(
      shouldTriggerCompanionReaction({
        hasCompanion: true,
        muted: false,
        addressed: false,
        now: 100_000,
        lastReactTime: 0,
        transcript: "hello",
      }),
    ).toBe(true)

    expect(
      shouldTriggerCompanionReaction({
        hasCompanion: false,
        muted: false,
        addressed: false,
        now: 100_000,
        lastReactTime: 0,
        transcript: "hello",
      }),
    ).toBe(false)

    expect(
      shouldTriggerCompanionReaction({
        hasCompanion: true,
        muted: true,
        addressed: false,
        now: 100_000,
        lastReactTime: 0,
        transcript: "hello",
      }),
    ).toBe(false)

    expect(
      shouldTriggerCompanionReaction({
        hasCompanion: true,
        muted: false,
        addressed: false,
        now: 10_000,
        lastReactTime: 5_000,
        transcript: "hello",
      }),
    ).toBe(false)

    expect(
      shouldTriggerCompanionReaction({
        hasCompanion: true,
        muted: false,
        addressed: true,
        now: 10_000,
        lastReactTime: 9_000,
        transcript: "hello",
      }),
    ).toBe(true)
  })

  test("appendRecentReaction keeps only the newest items", () => {
    expect(appendRecentReaction(["a", "b"], "c", 2)).toEqual(["b", "c"])
    expect(appendRecentReaction(["a"], "b", 8)).toEqual(["a", "b"])
  })

  test("createBuddyReactRequestBody truncates long fields and formats metadata", () => {
    const body = createBuddyReactRequestBody(
      {
        ...mockCompanion,
        name: "B".repeat(40),
      },
      "transcript",
      true,
      ["x".repeat(250)],
    )

    expect(body.name).toHaveLength(32)
    expect(body.personality.length).toBeLessThanOrEqual(200)
    expect(body.reason).toBe("addressed")
    expect(body.addressed).toBe(true)
    expect(body.recent[0]).toHaveLength(200)
  })

  test("triggerCompanionReaction calls API and forwards reaction text", async () => {
    let fetchCalls = 0
    const seenReactions: Array<string | undefined> = []

    globalThis.fetch = ((async () => {
      fetchCalls += 1
      return {
        ok: true,
        json: async () => ({ reaction: "  hello buddy  " }),
      } as Response
    }) as unknown) as typeof fetch

    triggerCompanionReaction(
      [{ type: "user", message: { content: "Buddy, say hi" } }] as any[],
      text => {
        seenReactions.push(text)
      },
    )

    await flushAsyncWork()

    expect(fetchCalls).toBe(1)
    expect(seenReactions).toEqual(["hello buddy"])
  })

  test("triggerCompanionReaction rate-limits repeated non-addressed turns", async () => {
    let fetchCalls = 0

    globalThis.fetch = ((async () => {
      fetchCalls += 1
      return {
        ok: true,
        json: async () => ({ reaction: "hello" }),
      } as Response
    }) as unknown) as typeof fetch

    const messages = [
      { type: "user", message: { content: "plain request" } },
    ] as any[]

    triggerCompanionReaction(messages, () => {})
    await flushAsyncWork()

    triggerCompanionReaction(messages, () => {})
    await flushAsyncWork()

    expect(fetchCalls).toBe(1)
  })

  test("triggerCompanionReaction skips API call when companion is muted", async () => {
    companionMuted = true
    let fetchCalls = 0

    globalThis.fetch = ((async () => {
      fetchCalls += 1
      return {
        ok: true,
        json: async () => ({ reaction: "hello" }),
      } as Response
    }) as unknown) as typeof fetch

    triggerCompanionReaction(
      [{ type: "user", message: { content: "Buddy, say hi" } }] as any[],
      () => {},
    )

    await flushAsyncWork()

    expect(fetchCalls).toBe(0)
  })
})
