import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test"
import { render } from "../../ink.js"
import { renderToScreen } from "../../ink/render-to-screen.js"
import { cellAtIndex } from "../../ink/screen.js"

let buddyFeatureEnabled = true
let mockConfig: {
  companion?: object
} = {}
const addedNotifications: Array<{
  key: string
  priority: string
  timeoutMs?: number
  jsx?: React.ReactNode
}> = []
const removedNotifications: string[] = []
const originalUserType = process.env.USER_TYPE

mock.module("bun:bundle", () => ({
  feature: (name: string) => name === "BUDDY" && buddyFeatureEnabled,
}))

mock.module("../../context/notifications.js", () => ({
  useNotifications: () => ({
    addNotification: (notification: {
      key: string
      priority: string
      timeoutMs?: number
      jsx?: React.ReactNode
    }) => {
      addedNotifications.push(notification)
    },
    removeNotification: (key: string) => {
      removedNotifications.push(key)
    },
  }),
}))

mock.module("../../utils/config.js", () => ({
  getGlobalConfig: () => mockConfig,
}))

const {
  BuddyTeaserText,
  createBuddyTeaserNotification,
  findBuddyTriggerPositionsInText,
  isBuddyLive,
  isBuddyTeaserWindow,
  runBuddyNotificationEffect,
  shouldShowBuddyTeaser,
  useBuddyNotification,
} = await import("../useBuddyNotification.js")

function HookHost() {
  useBuddyNotification()
  return null
}

async function renderHookHost() {
  const instance = await render(<HookHost />, {
    stdout: process.stdout,
    patchConsole: false,
  })

  await flushEffects()
  return instance
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

  return lines.join("\n").trim()
}

function collectStyleIds(screen: any): number[] {
  const styleIds: number[] = []

  for (let row = 0; row < screen.height; row++) {
    for (let col = 0; col < screen.width; col++) {
      const cell = cellAtIndex(screen, row * screen.width + col)
      if (cell.char.trim() === "") {
        continue
      }
      styleIds.push(cell.styleId)
    }
  }

  return styleIds
}

async function flushEffects(): Promise<void> {
  await Promise.resolve()
  await new Promise<void>(resolve => setTimeout(resolve, 0))
}

beforeEach(() => {
  buddyFeatureEnabled = true
  mockConfig = {}
  addedNotifications.length = 0
  removedNotifications.length = 0
  process.env.USER_TYPE = undefined
})

afterEach(() => {
  process.env.USER_TYPE = originalUserType
})

describe("useBuddyNotification", () => {
  test("isBuddyTeaserWindow returns true during teaser window", () => {
    expect(isBuddyTeaserWindow(new Date("2026-04-01T12:00:00Z"))).toBe(true)
    expect(isBuddyTeaserWindow(new Date("2026-04-07T12:00:00Z"))).toBe(true)
  })

  test("isBuddyTeaserWindow returns false outside teaser window", () => {
    expect(isBuddyTeaserWindow(new Date("2026-03-31T12:00:00Z"))).toBe(false)
    expect(isBuddyTeaserWindow(new Date("2026-04-08T12:00:00Z"))).toBe(false)
  })

  test("isBuddyLive returns true from April 2026 onward", () => {
    expect(isBuddyLive(new Date("2026-04-01T00:00:00Z"))).toBe(true)
    expect(isBuddyLive(new Date("2027-01-01T00:00:00Z"))).toBe(true)
    expect(isBuddyLive(new Date("2026-03-31T23:59:59Z"))).toBe(false)
  })

  test("shouldShowBuddyTeaser encodes the display gate", () => {
    expect(
      shouldShowBuddyTeaser({
        buddyEnabled: true,
        hasCompanion: false,
        inTeaserWindow: true,
      }),
    ).toBe(true)

    expect(
      shouldShowBuddyTeaser({
        buddyEnabled: false,
        hasCompanion: false,
        inTeaserWindow: true,
      }),
    ).toBe(false)

    expect(
      shouldShowBuddyTeaser({
        buddyEnabled: true,
        hasCompanion: true,
        inTeaserWindow: true,
      }),
    ).toBe(false)
  })

  test("findBuddyTriggerPositionsInText matches buddy commands on word boundaries", () => {
    expect(
      findBuddyTriggerPositionsInText("try /buddy then /buddy! but not /buddying"),
    ).toEqual([
      { start: 4, end: 10 },
      { start: 16, end: 22 },
    ])
  })

  test("BuddyTeaserText renders visible text with varied rainbow styles", () => {
    const { screen } = renderToScreen(<BuddyTeaserText text="/buddy" />, 40)

    expect(screenToText(screen).replaceAll("\n", "")).toBe("/buddy")
    expect(new Set(collectStyleIds(screen)).size).toBeGreaterThan(1)
  })

  test("createBuddyTeaserNotification builds the expected immediate notification", () => {
    const notification = createBuddyTeaserNotification()

    expect(notification.key).toBe("buddy-teaser")
    expect(notification.priority).toBe("immediate")
    expect(notification.timeoutMs).toBe(15000)

    const { screen } = renderToScreen(notification.jsx, 40)
    expect(screenToText(screen).replaceAll("\n", "")).toBe("/buddy")
  })

  test("runBuddyNotificationEffect adds teaser notification on the positive path", () => {
    const cleanup = runBuddyNotificationEffect({
      buddyEnabled: true,
      hasCompanion: false,
      inTeaserWindow: true,
      addNotification: notification => {
        addedNotifications.push(notification)
      },
      removeNotification: key => {
        removedNotifications.push(key)
      },
    })

    expect(addedNotifications).toHaveLength(1)
    expect(addedNotifications[0]?.key).toBe("buddy-teaser")
    expect(addedNotifications[0]?.priority).toBe("immediate")
    expect(addedNotifications[0]?.timeoutMs).toBe(15000)

    const { screen } = renderToScreen(
      addedNotifications[0]?.jsx as React.ReactElement,
      40,
    )
    expect(screenToText(screen).replaceAll("\n", "")).toBe("/buddy")
    expect(typeof cleanup).toBe("function")
  })

  test("runBuddyNotificationEffect cleanup removes teaser notification", () => {
    const cleanup = runBuddyNotificationEffect({
      buddyEnabled: true,
      hasCompanion: false,
      inTeaserWindow: true,
      addNotification: notification => {
        addedNotifications.push(notification)
      },
      removeNotification: key => {
        removedNotifications.push(key)
      },
    })

    expect(addedNotifications).toHaveLength(1)
    cleanup?.()
    expect(removedNotifications).toEqual(["buddy-teaser"])
  })

  test("hook does not add teaser when companion already exists", async () => {
    process.env.USER_TYPE = "ant"
    mockConfig = {
      companion: { name: "Buddy" },
    }

    const instance = await renderHookHost()

    try {
      expect(addedNotifications).toHaveLength(0)
    } finally {
      instance.unmount()
      instance.cleanup()
      await flushEffects()
    }
  })

  test("hook does not add teaser when buddy feature is disabled", async () => {
    process.env.USER_TYPE = "ant"
    buddyFeatureEnabled = false

    const instance = await renderHookHost()

    try {
      expect(addedNotifications).toHaveLength(0)
    } finally {
      instance.unmount()
      instance.cleanup()
      await flushEffects()
    }

    expect(removedNotifications).toHaveLength(0)
  })
})
