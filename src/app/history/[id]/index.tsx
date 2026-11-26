import { router, useLocalSearchParams } from 'expo-router';
import { CloudOff, PartyPopper, Pencil, Trash2, Trophy } from 'lucide-react-native';
import { View } from 'react-native';

import { ErrorNote, Header, IconButton, Loading } from '@/components/form';
import { AppText, Button, Card, Screen } from '@/components/ui';
import { useUnit } from '@/features/profile/api';
import { useWorkoutPRs } from '@/features/progress/api';
import { useDeleteWorkout, useWorkoutDetail } from '@/features/workout/api';
import { useWorkoutStore } from '@/features/workout/store';
import { confirm } from '@/lib/confirm';
import { estimateOneRepMax, totalVolume } from '@/lib/fitness';
import { formatClock, formatDate, formatDuration, formatVolume, formatWeight } from '@/lib/format';
import { colors } from '@/theme/tokens';

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 items-center gap-1 rounded-xl bg-raised py-3">
      <AppText variant="stat" className="text-xl">{value}</AppText>
      <AppText variant="caption">{label}</AppText>
    </View>
  );
}

function prLabel(record: string, value: number, previous: number, unit: 'kg' | 'lb') {
  switch (record) {
    case 'e1rm': return `est. 1RM ${formatWeight(value, unit)} ${unit} (was ${formatWeight(previous, unit)})`;
    case 'weight': return `heaviest ${formatWeight(value, unit)} ${unit} (was ${formatWeight(previous, unit)})`;
    case 'reps': return `${value} reps (was ${previous})`;
    default: return `${formatClock(value)} (was ${formatClock(previous)})`;
  }
}

export default function WorkoutDetailScreen() {
  const { id, done } = useLocalSearchParams<{ id: string; done?: string }>();
  const justFinished = done === '1';
  const pending = useWorkoutStore((s) => s.pendingSaves.find((p) => p.id === id));
  const detail = useWorkoutDetail(id);
  const prs = useWorkoutPRs(id, !!detail.data);
  const remove = useDeleteWorkout();
  const unit = useUnit();

  const goHome = () => router.replace('/');

  // Saved locally but not yet on the server (offline): show what we know.
  if (pending && !detail.data) {
    return (
      <Screen>
        <Header title={pending.name} onBack={goHome} />
        <Card className="items-center gap-3 py-8">
          <CloudOff color={colors.warning} size={28} />
          <AppText variant="heading">Saved on this device</AppText>
          <AppText variant="label" className="text-center">
            Your workout is safe and will sync automatically when you&apos;re back online.
          </AppText>
          <Button title="Done" onPress={goHome} className="mt-2 self-stretch" />
        </Card>
      </Screen>
    );
  }

  if (detail.isPending) return <Screen><Loading /></Screen>;
  if (detail.error || !detail.data) return <Screen><Header onBack={goHome} /><ErrorNote message="Couldn't load this workout." /></Screen>;

  const w = detail.data;
  const allSets = w.workout_exercises.flatMap((e) => e.workout_sets);
  const volume = totalVolume(allSets.map((s) => ({ weight: s.weight_kg ?? 0, reps: s.reps ?? 0, isWarmup: s.is_warmup })));

  const prExercises = new Set((prs.data ?? []).map((p) => p.exercise_id));

  const onDelete = async () => {
    if (await confirm('Delete workout?', 'This workout and all its sets will be permanently removed.', 'Delete', true)) {
      remove.mutate(w.id, { onSuccess: () => router.back() });
    }
  };

  return (
    <Screen>
      <Header
        onBack={justFinished ? goHome : undefined}
        right={
          <View className="flex-row">
            <IconButton label="Edit workout" onPress={() => router.push(`/history/${w.id}/edit`)}>
              <Pencil color={colors.fg} size={19} />
            </IconButton>
            <IconButton label="Delete workout" onPress={onDelete}>
              <Trash2 color={colors.danger} size={20} />
            </IconButton>
          </View>
        }
      />

      {justFinished && (
        <View className="mb-5 flex-row items-center gap-3 rounded-2xl bg-volt p-4">
          <PartyPopper color={colors.ink} size={24} />
          <View className="flex-1">
            <AppText variant="heading" className="text-ink">Workout complete</AppText>
            <AppText variant="label" className="text-ink/70">Nice work. Rest up and come back stronger.</AppText>
          </View>
        </View>
      )}

      <AppText variant="title">{w.name}</AppText>
      <AppText variant="label" className="mt-1">{formatDate(w.started_at)}</AppText>

      <View className="mt-5 flex-row gap-3">
        <Stat label="Duration" value={formatDuration(w.started_at, w.finished_at)} />
        <Stat label="Sets" value={String(allSets.length)} />
        <Stat label="Volume" value={volume > 0 ? formatVolume(volume, unit) : '—'} />
      </View>

      {prs.data && prs.data.length > 0 && (
        <View className="mt-4 gap-2 rounded-2xl border border-volt/40 bg-volt/10 p-4">
          <View className="flex-row items-center gap-2">
            <Trophy color={colors.volt} size={18} />
            <AppText variant="heading" className="text-volt">
              {prs.data.length} new personal record{prs.data.length > 1 ? 's' : ''}
            </AppText>
          </View>
          {prs.data.map((pr) => (
            <AppText key={`${pr.exercise_id}-${pr.record}`} variant="label" className="text-fg">
              {pr.name}: {prLabel(pr.record, Number(pr.value), Number(pr.previous), unit)}
            </AppText>
          ))}
        </View>
      )}

      <View className="mt-6 gap-3">
        {w.workout_exercises.map((we) => {
          const kind = we.exercise?.kind ?? 'weight_reps';
          const best = Math.max(0, ...we.workout_sets.filter((s) => !s.is_warmup).map((s) => estimateOneRepMax(s.weight_kg ?? 0, s.reps ?? 0) ?? 0));
          let n = 0;
          return (
            <Card key={we.id} className="gap-2 p-4">
              <View className="flex-row items-baseline justify-between">
                <AppText variant="heading" className="flex-1 text-volt" numberOfLines={1}>{we.exercise?.name}</AppText>
                {prExercises.has(we.exercise?.id ?? '') && <Trophy color={colors.volt} size={16} />}
                {kind === 'weight_reps' && best > 0 && <AppText variant="caption" className="ml-2">est. 1RM {formatWeight(best, unit)} {unit}</AppText>}
              </View>
              {we.workout_sets.map((s) => {
                if (!s.is_warmup) n += 1;
                const value =
                  kind === 'duration'
                    ? formatClock(s.duration_seconds ?? 0)
                    : kind === 'reps_only'
                      ? `${s.reps} reps`
                      : `${formatWeight(s.weight_kg, unit)} ${unit} × ${s.reps}`;
                return (
                  <View key={s.id} className="flex-row items-center gap-3">
                    <AppText variant="label" className={s.is_warmup ? 'w-6 font-bold text-warning' : 'w-6 font-bold text-fg'}>
                      {s.is_warmup ? 'W' : n}
                    </AppText>
                    <AppText variant="body">{value}</AppText>
                    {s.rpe != null && <AppText variant="caption">RPE {s.rpe}</AppText>}
                  </View>
                );
              })}
            </Card>
          );
        })}
      </View>

      {justFinished && <Button title="Done" onPress={goHome} className="mt-6" />}
    </Screen>
  );
}
