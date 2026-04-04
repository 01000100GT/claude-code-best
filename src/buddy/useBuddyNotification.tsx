import { feature } from 'bun:bundle';
import { useEffect } from 'react';
import { useNotifications } from '../context/notifications.js';
import { Text } from '../ink.js';
import { getGlobalConfig } from '../utils/config.js';
import { getRainbowColor } from '../utils/thinking.js';

export function isBuddyTeaserWindow(d: Date = new Date()): boolean {
  if (process.env.USER_TYPE === 'ant') return true;
  return d.getFullYear() === 2026 && d.getMonth() === 3 && d.getDate() <= 7;
}
export function isBuddyLive(d: Date = new Date()): boolean {
  if (process.env.USER_TYPE === 'ant') return true;
  return d.getFullYear() > 2026 || d.getFullYear() === 2026 && d.getMonth() >= 3;
}

export function BuddyTeaserText({
  text,
}: {
  text: string;
}) {
  return (
    <>
      {[...text].map((ch, i) => (
        <Text key={i} color={getRainbowColor(i)}>
          {ch}
        </Text>
      ))}
    </>
  );
}

// Rainbow /buddy teaser shown on startup when no companion hatched yet.
// Idle presence and reactions are handled by CompanionSprite directly.
export function shouldShowBuddyTeaser(args: {
  buddyEnabled: boolean;
  hasCompanion: boolean;
  inTeaserWindow: boolean;
}): boolean {
  return args.buddyEnabled && !args.hasCompanion && args.inTeaserWindow;
}

export function createBuddyTeaserNotification() {
  return {
    key: 'buddy-teaser',
    jsx: <BuddyTeaserText text="/buddy" />,
    priority: 'immediate' as const,
    timeoutMs: 15000,
  };
}

export function runBuddyNotificationEffect(args: {
  buddyEnabled: boolean;
  hasCompanion: boolean;
  inTeaserWindow: boolean;
  addNotification: (notification: ReturnType<typeof createBuddyTeaserNotification>) => void;
  removeNotification: (key: string) => void;
}) {
  if (
    !shouldShowBuddyTeaser({
      buddyEnabled: args.buddyEnabled,
      hasCompanion: args.hasCompanion,
      inTeaserWindow: args.inTeaserWindow,
    })
  ) {
    return;
  }

  args.addNotification(createBuddyTeaserNotification());

  return () => args.removeNotification('buddy-teaser');
}

export function useBuddyNotification() {
  const { addNotification, removeNotification } = useNotifications();

  useEffect(() => {
    const config = getGlobalConfig();
    if (!feature('BUDDY')) {
      return;
    }

    return runBuddyNotificationEffect({
      buddyEnabled: true,
      hasCompanion: Boolean(config.companion),
      inTeaserWindow: isBuddyTeaserWindow(),
      addNotification,
      removeNotification,
    });
  }, [addNotification, removeNotification]);
}
export function findBuddyTriggerPositionsInText(text: string): Array<{
  start: number;
  end: number;
}> {
  const triggers: Array<{
    start: number;
    end: number;
  }> = [];
  const re = /\/buddy\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    triggers.push({
      start: m.index,
      end: m.index + m[0].length
    });
  }
  return triggers;
}
export function findBuddyTriggerPositions(text: string): Array<{
  start: number;
  end: number;
}> {
  if (!feature('BUDDY')) return [];
  return findBuddyTriggerPositionsInText(text);
}
