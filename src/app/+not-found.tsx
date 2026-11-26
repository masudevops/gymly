import { router } from 'expo-router';
import { Compass } from 'lucide-react-native';

import { AppText, Button, Screen } from '@/components/ui';
import { colors } from '@/theme/tokens';

export default function NotFoundScreen() {
  return (
    <Screen className="flex-1 items-center justify-center gap-4">
      <Compass color={colors.muted} size={40} />
      <AppText variant="title">Page not found</AppText>
      <AppText variant="label" className="text-center">This page doesn&apos;t exist or has moved.</AppText>
      <Button title="Go to Train" onPress={() => router.replace('/')} className="self-stretch" />
    </Screen>
  );
}
