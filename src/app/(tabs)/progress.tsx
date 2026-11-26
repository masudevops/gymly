import { AppText, ComingSoon, Screen } from '@/components/ui';

export default function ProgressScreen() {
  return (
    <Screen>
      <AppText variant="display">Progress</AppText>
      <ComingSoon
        phase="Phase 2"
        title="See yourself get stronger"
        description="Personal records, estimated 1RM and volume charts, weekly muscle volume, body weight and streaks."
      />
    </Screen>
  );
}
