import { describe, expect, test } from "bun:test"
const { cellAtIndex } = await import("../../ink/screen.js")
const { renderToScreen } = await import("../../ink/render-to-screen.js")
const {
  CompanionFloatingBubbleContent,
} = await import("../CompanionSprite.js")

/**
 * 功能描述：将 Ink Screen 缓冲区转换为普通文本，便于断言气泡内容是否渲染。
 * 参数说明：
 * - screen: Screen，`renderToScreen()` 生成的屏幕缓冲区。
 * 返回值：
 * - string，按行拼接并去除每行末尾空白后的文本结果。
 * 异常处理：
 * - 不主动抛出异常；调用方需保证 `screen` 为有效对象。
 */
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

/**
 * 功能描述：提取所有非空白字符及其样式 ID，用于比较 fading 前后的 UI 样式变化。
 * 参数说明：
 * - screen: Screen，`renderToScreen()` 生成的屏幕缓冲区。
 * 返回值：
 * - Array<{ char: string; styleId: number }>，按屏幕扫描顺序返回非空白字符及其样式标识。
 * 异常处理：
 * - 不主动抛出异常；调用方需保证 `screen` 为有效对象。
 */
function collectStyledChars(
  screen: any,
): Array<{ char: string; styleId: number }> {
  const result: Array<{ char: string; styleId: number }> = []

  for (let row = 0; row < screen.height; row++) {
    for (let col = 0; col < screen.width; col++) {
      const cell = cellAtIndex(screen, row * screen.width + col)
      if (cell.char.trim() === "") {
        continue
      }

      result.push({
        char: cell.char,
        styleId: cell.styleId,
      })
    }
  }

  return result
}

/**
 * 功能描述：渲染浮动气泡展示组件，并提取文本内容与样式快照。
 * 参数说明：
 * - args.reaction: string，气泡文本内容。
 * - args.tick: number，气泡经过的 tick，用于决定是否进入 fading。
 * - args.rarity: keyof typeof import("../types.js").RARITY_COLORS，伙伴 rarity，用于决定颜色。
 * 返回值：
 * - { text: string; styledChars: Array<{ char: string; styleId: number }> }，
 *   分别表示渲染后的文本内容和非空白字符样式快照。
 * 异常处理：
 * - 若渲染失败，则由底层渲染器直接抛出异常。
 */
function renderBubble(args: {
  reaction: string
  tick: number
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary"
}): {
  text: string
  styledChars: Array<{ char: string; styleId: number }>
} {
  const { screen } = renderToScreen(
    <CompanionFloatingBubbleContent {...args} />,
    120,
  )

  return {
    text: screenToText(screen),
    styledChars: collectStyledChars(screen),
  }
}

describe("CompanionFloatingBubble UI", () => {
  test("renders the speech bubble text when reaction exists", () => {
    const bubble = renderBubble({
      reaction: "hello from buddy",
      tick: 0,
      rarity: "legendary",
    })

    expect(bubble.text).toContain("hello from buddy")
  })

  test("switches rendered style when the bubble enters fading", () => {
    const normalBubble = renderBubble({
      reaction: "fade me",
      tick: 0,
      rarity: "legendary",
    })
    const fadingBubble = renderBubble({
      reaction: "fade me",
      tick: 14,
      rarity: "legendary",
    })

    expect(normalBubble.text).toContain("fade me")
    expect(fadingBubble.text).toContain("fade me")
    expect(fadingBubble.styledChars).not.toEqual(normalBubble.styledChars)
  })

  test("renders the downward tail for fullscreen bubble layout", () => {
    const bubble = renderBubble({
      reaction: "tail check",
      tick: 0,
      rarity: "legendary",
    })

    expect(bubble.text).toContain("tail check")
    expect(bubble.text).toContain("╲")
  })
})
