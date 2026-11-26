import { AppText, ComingSoon, Screen } from '@/components/ui';

export default function ProgramsScreen() {
  return (
    <Screen>
      <AppText variant="display">Programs</AppText>
      <ComingSoon
        phase="Phase 3"
        title="Follow a plan that progresses"
        description="Multi-week programs for full-body, upper/lower and push/pull/legs, with today's workout ready to start."
      />
    </Screen>
  );
}
