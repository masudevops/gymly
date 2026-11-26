import { router } from 'expo-router';
import { CalendarRange, ChevronRight, Play } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { AppText, Button } from '@/components/ui';
import { useWorkoutStore } from '@/features/workout/store';
import { useBeginWorkout } from '@/features/workout/use-begin-workout';
import { colors } from '@/theme/tokens';

import { programDaySeed, useActiveProgram, useProgram } from './api';

/** "Up next" card for the active program, with a one-tap start. Renders nothing without an active program. */
export function UpNextCard({ className }: { className?: string }) {
  const active = useActiveProgram().data;
  const program = useProgram(active?.program_id);
  const begin = useBeginWorkout();
  const inProgress = useWorkoutStore((s) => s.active);
  if (!active) return null;

  const day = program.data?.program_days.find((d) => d.id === active.next_day_id);
  const pct = active.total_sessions > 0 ? Number(active.sessions_done) / active.total_sessions : 0;
  const runningThisDay = inProgress?.program?.programDayId === active.next_day_id;

  return (
    <View className={`overflow-hidden rounded-2xl border border-iris/40 bg-iris/10 ${className ?? ''}`}>
      <Pressable onPress={() => router.push(`/programs/${active.program_id}`)} className="flex-row items-center gap-3 p-4 pb-3 active:opacity-80">
        <CalendarRange color={colors.iris} size={20} />
        <View className="flex-1">
          <AppText variant="caption" className="font-semibold uppercase tracking-wider text-iris">Up next · {active.name}</AppText>
          <AppText variant="heading" className="mt-0.5">
            Week {active.next_week} · {active.next_day_name}
          </AppText>
          {day?.focus && <AppText variant="label">{day.focus}</AppText>}
        </View>
        <ChevronRight color={colors.muted} size={20} />
      </Pressable>
      <View className="mx-4 h-1.5 overflow-hidden rounded-full bg-raised">
        <View className="h-1.5 rounded-full bg-iris" style={{ width: `${Math.max(2, pct * 100)}%` }} />
      </View>
      <AppText variant="caption" className="mx-4 mt-1.5">
        {active.sessions_done} of {active.total_sessions} sessions done
      </AppText>
      <View className="p-4 pt-3">
        <Button
          title={runningThisDay ? 'Resume session' : "Start today's session"}
          icon={<Play color={colors.ink} size={18} fill={colors.ink} />}
          disabled={!day && !runningThisDay}
          onPress={() => (runningThisDay ? router.push('/workout') : day && begin(programDaySeed(day, active.enrollment_id, active.next_week)))}
        />
      </View>
    </View>
  );
}
