import { router, useLocalSearchParams } from 'expo-router';
import { CalendarDays, Dumbbell, Layers, Timer } from 'lucide-react-native';
import { View } from 'react-native';

import { ErrorNote, Header, Loading } from '@/components/form';
import { AppText, Button, Card, Screen } from '@/components/ui';
import { GOAL_LABELS, LEVEL_LABELS, targetLabel, useActiveProgram, useLeaveProgram, useProgram, useStartProgram } from '@/features/programs/api';
import { UpNextCard } from '@/features/programs/up-next-card';
import { confirm } from '@/lib/confirm';
import { colors } from '@/theme/tokens';

export default function ProgramDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const program = useProgram(id);
  const active = useActiveProgram().data;
  const start = useStartProgram();
  const leave = useLeaveProgram();
  const isActive = active?.program_id === id;

  if (program.isPending) return <Screen><Header /><Loading /></Screen>;
  if (program.error || !program.data) return <Screen><Header /><ErrorNote message="Couldn't load this program." /></Screen>;
  const p = program.data;

  const onStart = async () => {
    if (active) {
      const ok = await confirm(
        'Switch programs?',
        `You're ${active.sessions_done} sessions into ${active.name}. Starting ${p.name} ends that plan (your workouts stay in history).`,
        'Switch',
        true,
      );
      if (!ok) return;
    }
    start.mutate(p.id);
  };

  const onLeave = async () => {
    if (!active) return;
    if (await confirm('Leave program?', 'Your logged sessions stay in your history.', 'Leave', true)) {
      leave.mutate(active.enrollment_id, { onSuccess: () => router.back() });
    }
  };

  return (
    <Screen>
      <Header />
      <AppText variant="title">{p.name}</AppText>
      <AppText variant="label" className="mt-2">{p.summary}</AppText>

      <View className="mt-5 flex-row gap-3">
        {[
          { icon: <CalendarDays color={colors.iris} size={16} />, value: `${p.days_per_week}×`, label: 'per week' },
          { icon: <Layers color={colors.iris} size={16} />, value: `${p.weeks}`, label: 'weeks' },
          { icon: <Dumbbell color={colors.iris} size={16} />, value: LEVEL_LABELS[p.level], label: GOAL_LABELS[p.goal] },
        ].map((t) => (
          <View key={t.label} className="flex-1 items-center gap-1 rounded-xl bg-raised py-3">
            {t.icon}
            <AppText variant="heading" className="text-base">{t.value}</AppText>
            <AppText variant="caption">{t.label}</AppText>
          </View>
        ))}
      </View>

      {isActive ? (
        <UpNextCard className="mt-5" />
      ) : (
        <Button title={start.isPending ? 'Starting…' : 'Start this program'} onPress={onStart} disabled={start.isPending} className="mt-5" />
      )}
      {start.error && <View className="mt-3"><ErrorNote message="Couldn't start the program. Try again." /></View>}

      {p.description && <AppText variant="body" className="mt-6 text-muted">{p.description}</AppText>}
      {p.equipment_note && <AppText variant="caption" className="mt-2">Equipment: {p.equipment_note}</AppText>}

      <AppText variant="title" className="mb-3 mt-8 text-xl">Weekly schedule</AppText>
      <View className="gap-3">
        {p.program_days.map((d, i) => (
          <Card key={d.id} className="gap-3 p-4">
            <View>
              <AppText variant="caption" className="font-semibold uppercase tracking-wider text-iris">Session {i + 1}</AppText>
              <AppText variant="heading">{d.name}</AppText>
              {d.focus && <AppText variant="label">{d.focus}</AppText>}
            </View>
            {d.program_day_exercises.map((e) => (
              <View key={e.id} className="flex-row items-center justify-between gap-3">
                <AppText variant="body" className="flex-1" numberOfLines={2}>{e.exercise.name}</AppText>
                <AppText variant="label" className="text-fg">
                  {e.sets} × {targetLabel(e)}
                </AppText>
                {e.rest_seconds != null && (
                  <View className="w-14 flex-row items-center justify-end gap-1">
                    <Timer color={colors.faint} size={12} />
                    <AppText variant="caption">{e.rest_seconds}s</AppText>
                  </View>
                )}
              </View>
            ))}
          </Card>
        ))}
      </View>

      {isActive && <Button title="Leave program" variant="danger" onPress={onLeave} className="mt-8" />}
    </Screen>
  );
}
