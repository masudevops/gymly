import { router } from 'expo-router';
import { ChevronRight, Flame, Scale, Trophy } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { BarRow, LineChart } from '@/components/charts';
import { EmptyState, ErrorNote, Loading } from '@/components/form';
import { AppText, Button, Card, Screen } from '@/components/ui';
import { MUSCLE_LABELS, type MuscleGroup } from '@/features/exercises/api';
import { useProfile } from '@/features/profile/api';
import { useBodyMeasurements, usePersonalRecords, useTrainingDays, useWeeklyMuscleSets } from '@/features/progress/api';
import { cn } from '@/lib/cn';
import { calendarWeeks, fromDay, shortDate, toDay, weekDays, weeklyStreak } from '@/lib/dates';
import { formatClock, formatWeight } from '@/lib/format';
import { colors } from '@/theme/tokens';

const WEEKS = 16;

function StatTile({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon?: React.ReactNode }) {
  return (
    <View className="flex-1 gap-1 rounded-2xl border border-line bg-surface p-4">
      <View className="flex-row items-center gap-1.5">
        {icon}
        <AppText variant="caption">{label}</AppText>
      </View>
      <AppText variant="stat" className="text-2xl">{value}</AppText>
      {sub && <AppText variant="caption">{sub}</AppText>}
    </View>
  );
}

function ConsistencyCalendar({ days }: { days: Map<string, number> }) {
  const weeks = calendarWeeks(WEEKS);
  const today = toDay(new Date());
  const max = Math.max(1, ...days.values());
  return (
    <View accessible accessibilityLabel={`Training calendar: ${days.size} days trained in the last ${WEEKS} weeks`}>
      <View className="flex-row gap-1">
        {weeks.map((week) => (
          <View key={week[0]} className="flex-1 gap-1">
            {week.map((day) => {
              const vol = days.get(day);
              const future = day > today;
              // Brighter cells = more volume that day; any workout gets at least the dim shade.
              const level = vol === undefined ? 0 : vol <= 0 ? 1 : Math.min(4, 1 + Math.ceil((vol / max) * 3));
              return (
                <View
                  key={day}
                  className={cn(
                    'aspect-square rounded-[4px]',
                    future ? 'bg-transparent' : level === 0 ? 'bg-raised' : level === 1 ? 'bg-volt/30' : level === 2 ? 'bg-volt/50' : level === 3 ? 'bg-volt/75' : 'bg-volt',
                    day === today && 'border border-fg/60',
                  )}
                />
              );
            })}
          </View>
        ))}
      </View>
      <View className="mt-2 flex-row justify-between">
        <AppText variant="caption">{shortDate(weeks[0][0])}</AppText>
        <AppText variant="caption">This week</AppText>
      </View>
    </View>
  );
}

function recordLabel(r: { kind: string; best_e1rm: number | null; heaviest_kg: number | null; most_reps: number | null; longest_seconds: number | null }, unit: 'kg' | 'lb') {
  if (r.kind === 'duration') return r.longest_seconds ? `${formatClock(r.longest_seconds)} longest` : '—';
  if (r.kind === 'reps_only') return r.most_reps ? `${r.most_reps} reps best` : '—';
  if (r.best_e1rm) return `${formatWeight(r.best_e1rm, unit)} ${unit} est. 1RM`;
  return r.heaviest_kg ? `${formatWeight(r.heaviest_kg, unit)} ${unit} heaviest` : '—';
}

export default function ProgressScreen() {
  const profile = useProfile().data;
  const unit = profile?.unit ?? 'kg';
  const target = profile?.training_days ?? 3;
  const trainingDays = useTrainingDays(WEEKS);
  const muscleSets = useWeeklyMuscleSets(2);
  const records = usePersonalRecords();
  const body = useBodyMeasurements();
  // Captured once per visit; render must stay pure for the React Compiler.
  const [now] = useState(() => Date.now());

  if (trainingDays.isPending || records.isPending) return <Screen><AppText variant="display">Progress</AppText><Loading /></Screen>;
  if (trainingDays.error || records.error) return <Screen><AppText variant="display">Progress</AppText><ErrorNote message="Couldn't load your stats." /></Screen>;

  const dayMap = new Map(trainingDays.data.map((d) => [d.day, Number(d.volume_kg)]));
  const thisWeek = weekDays(new Date());
  const trainedThisWeek = thisWeek.filter((d) => dayMap.has(d)).length;
  const streak = weeklyStreak([...dayMap.keys()]);
  const last30 = trainingDays.data.filter((d) => fromDay(d.day).getTime() >= now - 30 * 86400000).reduce((n, d) => n + Number(d.workouts), 0);

  // Sets per muscle: this week vs last week.
  const weekStart = thisWeek[0];
  const muscles = new Map<MuscleGroup, { now: number; last: number }>();
  for (const row of muscleSets.data ?? []) {
    const entry = muscles.get(row.muscle) ?? { now: 0, last: 0 };
    if (row.week_start === weekStart) entry.now += Number(row.sets);
    else entry.last += Number(row.sets);
    muscles.set(row.muscle, entry);
  }
  const muscleRows = [...muscles.entries()].sort((a, b) => b[1].now - a[1].now || b[1].last - a[1].last);
  const muscleMax = Math.max(1, ...muscleRows.map(([, v]) => Math.max(v.now, v.last)));

  const weights = (body.data ?? []).filter((m) => m.weight_kg !== null);
  const latest = weights[weights.length - 1];
  const monthAgo = weights.find((m) => fromDay(m.measured_on).getTime() >= now - 30 * 86400000);
  const change = latest && monthAgo && latest !== monthAgo ? Number(latest.weight_kg) - Number(monthAgo.weight_kg) : null;

  const hasAnyWorkout = trainingDays.data.length > 0 || records.data.length > 0;

  return (
    <Screen>
      <AppText variant="display">Progress</AppText>

      <View className="mt-6 flex-row gap-3">
        <StatTile label="This week" value={`${trainedThisWeek}/${target}`} sub="workouts" />
        <StatTile label="Streak" value={`${streak}`} sub={streak === 1 ? 'week' : 'weeks'} icon={<Flame color={colors.volt} size={14} />} />
        <StatTile label="Last 30 days" value={`${last30}`} sub="workouts" />
      </View>

      <Card className="mt-4">
        <AppText variant="heading" className="mb-4">Consistency</AppText>
        <ConsistencyCalendar days={dayMap} />
      </Card>

      {!hasAnyWorkout ? (
        <View className="mt-4">
          <EmptyState
            icon={<Trophy color={colors.muted} size={28} />}
            title="Your progress starts here"
            body="Finish a workout and your records, charts and weekly volume will appear."
            action={<Button title="Start training" variant="secondary" onPress={() => router.navigate('/')} />}
          />
        </View>
      ) : (
        <>
          <Card className="mt-4 gap-4">
            <View>
              <AppText variant="heading">Sets per muscle</AppText>
              <AppText variant="caption">Working sets this week, compared with last week</AppText>
            </View>
            {muscleRows.length === 0 ? (
              <AppText variant="label">No working sets in the last two weeks.</AppText>
            ) : (
              muscleRows.map(([m, v]) => <BarRow key={m} label={MUSCLE_LABELS[m]} value={v.now} max={muscleMax} sublabel={`· ${v.last} last week`} />)
            )}
          </Card>

          <AppText variant="title" className="mb-3 mt-8 text-xl">Personal records</AppText>
          <View className="gap-2">
            {records.data.map((r) => (
              <Pressable
                key={r.exercise_id}
                onPress={() => router.push(`/exercise/${r.exercise_id}`)}
                className="flex-row items-center gap-3 rounded-2xl border border-line bg-surface p-4 active:bg-raised"
              >
                <Trophy color={colors.volt} size={18} />
                <View className="flex-1">
                  <AppText variant="body" className="font-medium" numberOfLines={1}>{r.name}</AppText>
                  <AppText variant="caption">
                    {recordLabel(r, unit)} · {r.sessions} session{r.sessions === 1 ? '' : 's'}
                  </AppText>
                </View>
                <ChevronRight color={colors.muted} size={18} />
              </Pressable>
            ))}
          </View>
        </>
      )}

      <Card className="mt-8 gap-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Scale color={colors.iris} size={18} />
            <AppText variant="heading">Body weight</AppText>
          </View>
          <Button title={latest ? 'Log' : 'Log weight'} variant="ghost" onPress={() => router.push('/body-weight')} className="min-h-[40px] px-3" />
        </View>
        {latest ? (
          <>
            <View className="flex-row items-baseline gap-3">
              <AppText variant="stat">{formatWeight(Number(latest.weight_kg), unit)} {unit}</AppText>
              {change !== null && (
                <AppText variant="label" className={change <= 0 ? 'text-success' : 'text-warning'}>
                  {change > 0 ? '+' : ''}
                  {formatWeight(Math.abs(change), unit) === '0' ? '0' : `${change < 0 ? '−' : ''}${formatWeight(Math.abs(change), unit)}`} {unit} in 30 days
                </AppText>
              )}
            </View>
            {weights.length > 1 && (
              <LineChart
                height={120}
                color={colors.iris}
                accessibilityLabel="Body weight trend"
                format={(v) => formatWeight(v, unit)}
                data={weights.map((m) => ({ x: fromDay(m.measured_on).getTime(), y: Number(m.weight_kg) }))}
              />
            )}
          </>
        ) : (
          <AppText variant="label">Track your weight to see the trend alongside your training.</AppText>
        )}
      </Card>
    </Screen>
  );
}
