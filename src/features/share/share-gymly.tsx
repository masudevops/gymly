// "Share Gymly": always shares the public homepage, never the current route. Browsers' own Share buttons
// (Safari, Chrome on iOS) attach a snapshot of whatever is on screen, which on these tabs would show the
// user's workouts and stats; sharing just the URL makes Messages and other apps fetch the branded preview.
import { Check, Share2 } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, View } from 'react-native';

import { IconButton } from '@/components/form';
import { AppText } from '@/components/ui';
import { cn } from '@/lib/cn';
import { colors } from '@/theme/tokens';

/** Web Share API with the homepage URL, falling back to copying the link. `copied` flips on for a moment. */
export function useShareGymly() {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = `${window.location.origin}/`;
    if (typeof navigator.share === 'function') {
      // Rejects when the user closes the share sheet; nothing to do then.
      await navigator.share({ title: 'Gymly', text: 'Train smarter. Get stronger.', url }).catch(() => {});
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard blocked (insecure context or permissions); nothing else to fall back to.
    }
  };
  return { share, copied };
}

/** Header share icon. Web only for now (native would use the Share API with a configured site URL). */
export function ShareGymlyButton() {
  const { share, copied } = useShareGymly();
  if (Platform.OS !== 'web') return null;
  return (
    <IconButton label={copied ? 'Link copied' : 'Share Gymly'} onPress={share} className="-mr-2">
      {copied ? <Check color={colors.volt} size={22} /> : <Share2 color={colors.muted} size={22} />}
    </IconButton>
  );
}

/** A tab's large title with the share icon on the right. */
export function TabTitle({ title, className }: { title: string; className?: string }) {
  return (
    <View className={cn('flex-row items-center justify-between', className)}>
      <AppText variant="display">{title}</AppText>
      <ShareGymlyButton />
    </View>
  );
}
