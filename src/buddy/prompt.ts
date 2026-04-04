import { feature } from 'bun:bundle'
import type { Message } from '../types/message.js'
import type { Attachment } from '../utils/attachments.js'
import { getGlobalConfig } from '../utils/config.js'
import { getCompanion } from './companion.js'

export function companionIntroText(name: string, species: string): string {
  return `# Companion

A small ${species} named ${name} sits beside the user's input box and occasionally comments in a speech bubble. You're not ${name} — it's a separate watcher.

When the user addresses ${name} directly (by name), its bubble will answer. Your job in that moment is to stay out of the way: respond in ONE line or less, or just answer any part of the message meant for you. Don't explain that you're not ${name} — they know. Don't narrate what ${name} might say — the bubble handles that.`
}

export function buildCompanionIntroAttachment(args: {
  companion:
    | {
        name: string
        species: string
      }
    | undefined
  muted: boolean
  messages: Message[] | undefined
}): Attachment[] {
  if (!args.companion || args.muted) return []

  for (const msg of args.messages ?? []) {
    if (msg.type !== 'attachment') continue
    if (msg.attachment.type !== 'companion_intro') continue
    if (msg.attachment.name === args.companion.name) return []
  }

  return [
    {
      type: 'companion_intro',
      name: args.companion.name,
      species: args.companion.species,
    },
  ]
}

export function getCompanionIntroAttachment(
  messages: Message[] | undefined,
): Attachment[] {
  if (!feature('BUDDY')) return []
  return buildCompanionIntroAttachment({
    companion: getCompanion(),
    muted: getGlobalConfig().companionMuted,
    messages,
  })
}
