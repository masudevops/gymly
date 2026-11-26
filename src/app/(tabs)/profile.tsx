import { AppText, ComingSoon, Screen } from '@/components/ui';

export default function ProfileScreen() {
  return (
    <Screen>
      <AppText variant="display">Profile</AppText>
      <ComingSoon phase="Phase 1" title="Your account and preferences" description="Units, rest timer defaults, goals, and account management." />
    </Screen>
  );
}
