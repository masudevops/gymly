import { AppText, ComingSoon, Screen } from '@/components/ui';

export default function HistoryScreen() {
  return (
    <Screen>
      <AppText variant="display">History</AppText>
      <ComingSoon phase="Phase 1" title="Every workout, logged" description="Browse past sessions, see sets and volume, and edit or delete entries." />
    </Screen>
  );
}
