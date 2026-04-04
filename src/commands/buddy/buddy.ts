import React from 'react'
import {
  getCompanion,
  rollWithSeed,
  generateSeed,
} from '../../buddy/companion.js'
import { type StoredCompanion, RARITY_STARS } from '../../buddy/types.js'
import { renderSprite } from '../../buddy/sprites.js'
import { CompanionCard } from '../../buddy/CompanionCard.js'
import { getGlobalConfig, saveGlobalConfig } from '../../utils/config.js'
import { triggerCompanionReaction } from '../../buddy/companionReact.js'
import type { ToolUseContext } from '../../Tool.js'
import type {
  LocalJSXCommandContext,
  LocalJSXCommandOnDone,
} from '../../types/command.js'

// Species → default name fragments for hatch (no API needed)
const SPECIES_NAMES: Record<string, string> = {
  duck: 'Waddles',
  goose: 'Goosberry',
  blob: 'Gooey',
  cat: 'Whiskers',
  dragon: 'Ember',
  octopus: 'Inky',
  owl: 'Hoots',
  penguin: 'Waddleford',
  turtle: 'Shelly',
  snail: 'Trailblazer',
  ghost: 'Casper',
  axolotl: 'Axie',
  capybara: 'Chill',
  cactus: 'Spike',
  robot: 'Byte',
  rabbit: 'Flops',
  mushroom: 'Spore',
  chonk: 'Chonk',
}

const SPECIES_PERSONALITY: Record<string, string> = {
  duck: 'Quirky and easily amused. Leaves rubber duck debugging tips everywhere.',
  goose: 'Assertive and honks at bad code. Takes no prisoners in code reviews.',
  blob: 'Adaptable and goes with the flow. Sometimes splits into two when confused.',
  cat: 'Independent and judgmental. Watches you type with mild disdain.',
  dragon:
    'Fiery and passionate about architecture. Hoards good variable names.',
  octopus:
    'Multitasker extraordinaire. Wraps tentacles around every problem at once.',
  owl: 'Wise but verbose. Always says "let me think about that" for exactly 3 seconds.',
  penguin: 'Cool under pressure. Slides gracefully through merge conflicts.',
  turtle: 'Patient and thorough. Believes slow and steady wins the deploy.',
  snail: 'Methodical and leaves a trail of useful comments. Never rushes.',
  ghost:
    'Ethereal and appears at the worst possible moments with spooky insights.',
  axolotl: 'Regenerative and cheerful. Recovers from any bug with a smile.',
  capybara: 'Zen master. Remains calm while everything around is on fire.',
  cactus:
    'Prickly on the outside but full of good intentions. Thrives on neglect.',
  robot: 'Efficient and literal. Processes feedback in binary.',
  rabbit: 'Energetic and hops between tasks. Finishes before you start.',
  mushroom: 'Quietly insightful. Grows on you over time.',
  chonk:
    'Big, warm, and takes up the whole couch. Prioritizes comfort over elegance.',
}

function speciesLabel(species: string): string {
  return species.charAt(0).toUpperCase() + species.slice(1)
}

function buildStoredCompanion(seed: string): {
  stored: StoredCompanion
  rarity: string
  species: string
  personality: string
  sprite: string[]
  shiny: boolean
} {
  const r = rollWithSeed(seed)
  const name = SPECIES_NAMES[r.bones.species] ?? 'Buddy'
  const personality =
    SPECIES_PERSONALITY[r.bones.species] ?? 'Mysterious and code-savvy.'

  const stored: StoredCompanion = {
    name,
    personality,
    seed,
    hatchedAt: Date.now(),
  }

  return {
    stored,
    rarity: r.bones.rarity,
    species: r.bones.species,
    personality,
    sprite: renderSprite(r.bones, 0),
    shiny: r.bones.shiny,
  }
}

function buddyCommandList(): string {
  return '/buddy pet  /buddy mute  /buddy unmute  /buddy hatch  /buddy rehatch'
}

export async function call(
  onDone: LocalJSXCommandOnDone,
  context: ToolUseContext & LocalJSXCommandContext,
  args: string,
): Promise<React.ReactNode> {
  const sub = args?.trim().toLowerCase() ?? ''
  const setState = context.setAppState

  if (sub === 'off' || sub === 'mute') {
    saveGlobalConfig(cfg => ({ ...cfg, companionMuted: true }))
    onDone('companion muted', { display: 'system' })
    return null
  }

  if (sub === 'on' || sub === 'unmute') {
    saveGlobalConfig(cfg => ({ ...cfg, companionMuted: false }))
    onDone('companion unmuted', { display: 'system' })
    return null
  }

  if (sub === 'pet') {
    const companion = getCompanion()
    if (!companion) {
      onDone('no companion yet \u00b7 run /buddy first', { display: 'system' })
      return null
    }

    // Auto-unmute on pet + trigger heart animation
    saveGlobalConfig(cfg => ({ ...cfg, companionMuted: false }))
    setState?.(prev => ({ ...prev, companionPetAt: Date.now() }))

    // Trigger a post-pet reaction
    triggerCompanionReaction(context.messages ?? [], reaction =>
      setState?.(prev =>
        prev.companionReaction === reaction
          ? prev
          : { ...prev, companionReaction: reaction },
      ),
    )

    onDone(`petted ${companion.name}`, { display: 'system' })
    return null
  }

  const companion = getCompanion()

  if (sub === 'hatch') {
    if (companion) {
      onDone(
        'you already have a companion · run /buddy to see it\nTip: /buddy rehatch will replace it',
        { display: 'system' },
      )
      return null
    }

    const seed = generateSeed()
    const nextCompanion = buildStoredCompanion(seed)

    saveGlobalConfig(cfg => ({ ...cfg, companion: nextCompanion.stored }))

    const stars = RARITY_STARS[nextCompanion.rarity]
    const shiny = nextCompanion.shiny ? ' ✨ Shiny!' : ''
    const lines = [
      'A wild companion appeared!',
      '',
      ...nextCompanion.sprite,
      '',
      `${nextCompanion.stored.name} the ${speciesLabel(nextCompanion.species)}${shiny}`,
      `Rarity: ${stars} (${nextCompanion.rarity})`,
      `"${nextCompanion.personality}"`,
      '',
      'Your companion will now appear beside your input box!',
      buddyCommandList(),
    ]
    onDone(lines.join('\n'), { display: 'system' })
    return null
  }

  if (sub === 'rehatch') {
    const seed = generateSeed()
    const nextCompanion = buildStoredCompanion(seed)

    saveGlobalConfig(cfg => ({ ...cfg, companion: nextCompanion.stored }))

    const stars = RARITY_STARS[nextCompanion.rarity]
    const shiny = nextCompanion.shiny ? ' ✨ Shiny!' : ''
    const lines = [
      companion ? 'A new companion appeared!' : 'A wild companion appeared!',
      '',
      ...nextCompanion.sprite,
      '',
      `${nextCompanion.stored.name} the ${speciesLabel(nextCompanion.species)}${shiny}`,
      `Rarity: ${stars} (${nextCompanion.rarity})`,
      `"${nextCompanion.personality}"`,
      '',
      companion
        ? 'Your old companion has been replaced!'
        : 'Your companion will now appear beside your input box!',
      buddyCommandList(),
    ]
    onDone(lines.join('\n'), { display: 'system' })
    return null
  }

  if (sub !== '') {
    onDone(`unknown command: /buddy ${sub}\n${buddyCommandList()}`, {
      display: 'system',
    })
    return null
  }

  if (companion && getGlobalConfig().companionMuted) {
    saveGlobalConfig(cfg => ({ ...cfg, companionMuted: false }))
  }

  if (companion) {
    // Return JSX card — matches official vc8 component
    const lastReaction = context.getAppState?.()?.companionReaction
    return React.createElement(CompanionCard, {
      companion,
      lastReaction,
      onDone,
    })
  }

  const seed = generateSeed()
  const nextCompanion = buildStoredCompanion(seed)

  saveGlobalConfig(cfg => ({ ...cfg, companion: nextCompanion.stored }))

  const stars = RARITY_STARS[nextCompanion.rarity]
  const shiny = nextCompanion.shiny ? ' ✨ Shiny!' : ''

  const lines = [
    'A wild companion appeared!',
    '',
    ...nextCompanion.sprite,
    '',
    `${nextCompanion.stored.name} the ${speciesLabel(nextCompanion.species)}${shiny}`,
    `Rarity: ${stars} (${nextCompanion.rarity})`,
    `"${nextCompanion.personality}"`,
    '',
    'Your companion will now appear beside your input box!',
    buddyCommandList(),
  ]
  onDone(lines.join('\n'), { display: 'system' })
  return null
}
