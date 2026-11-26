import { router } from 'expo-router';
import { CalendarDays, ChevronRight, Dumbbell, Layers, LayoutList, Sparkles } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { EmptyState, ErrorNote, Loading } from '@/components/form';
import { AppText, Screen } from '@/components/ui';
import { useProfile } from '@/features/profile/api';
import { GOAL_LABELS, LEVEL_LABELS, useActiveProgram, usePrograms, type ProgramSummary } from '@/features/programs/api';
import { availableDayCounts, defaultDayCount, recommendedProgramId } from '@/features/programs/recommend';
import { UpNextCard } from '@/features/programs/up-next-card';
import { cn } from '@/lib/cn';
import { colors } from '@/theme/tokens';

function Meta({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      {icon}
      <AppText variant="caption" className="text-muted">{label}</AppText>
    </View>
  );
}

function DaysPicker({ counts, value, onChange }: { counts: number[]; value: number; onChange: (d: number) => void }) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="Days per week" className="flex-row gap-2">
      {counts.map((d) => {
        const selected = d === value;
        return (
          <Pressable
            key={d}
            accessibilityRole="radio"
            aria-checked={selected}
            accessibilityLabel={`${d} days per week`}
            onPress={() => onChange(d)}
            className={cn('flex-1 items-center rounded-2xl border py-3', selected ? 'border-volt bg-volt' : 'border-line bg-surface active:bg-raised')}
          >
            <AppText variant="stat" className={cn('text-2xl', selected ? 'text-ink' : 'text-fg')}>{d}</AppText>
            <AppText variant="caption" className={selected ? 'text-ink/70' : undefined}>days</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

function ProgramCard({ p, recommended }: { p: ProgramSummary; recommended: boolean }) {
  return (
    <Pressable
      onPress={() => router.push(`/programs/${p.id}`)}
      className={cn('gap-3 rounded-2xl border bg-surface p-5 active:bg-raised', recommended ? 'border-volt/50' : 'border-line')}
    >
      {recommended && (
        <View className="flex-row items-center gap-1.5 self-start rounded-full bg-volt/15 px-2.5 py-1">
          <Sparkles color={colors.volt} size={12} />
          <AppText variant="caption" className="font-semibold text-volt">Recommended for you</AppText>
        </View>
      )}
      <View className="flex-row items-start gap-2">
        <View className="flex-1 gap-1">
          <AppText variant="heading">{p.name}</AppText>
          <AppText variant="label">{p.summary}</AppText>
        </View>
        <ChevronRight color={colors.muted} size={20} />
      </View>
      <View className="flex-row flex-wrap gap-x-4 gap-y-2">
        <Meta icon={<CalendarDays color={colors.iris} size={14} />} label={`${p.days_per_week} days/week`} />
        <Meta icon={<Layers color={colors.iris} size={14} />} label={`${p.weeks} weeks`} />
        <Meta icon={<Dumbbell color={colors.iris} size={14} />} label={`${LEVEL_LABELS[p.level]} · ${GOAL_LABELS[p.goal]}`} />
      </View>
    </Pressable>
  );
}

export default function ProgramsScreen() {
  const programs = usePrograms();
  const active = useActiveProgram().data;
  const profile = useProfile().data;
  // null = follow the default (onboarding choice); set once the user taps a count.
  const [picked, setPicked] = useState<number | null>(null);

  const all = programs.data ?? [];
  const counts = availableDayCounts(all);
  const days = picked ?? defaultDayCount(profile?.training_days, counts);
  const matching = all.filter((p) => p.days_per_week === days && p.id !== active?.program_id);
  const recommendedId = recommendedProgramId(matching, profile?.experience);
  // Recommended plan first, then the rest in their usual order.
  const ordered = [...matching].sort((a, b) => Number(b.id === recommendedId) - Number(a.id === recommendedId));

  return (
    <Screen>
      <AppText variant="display">Programs</AppText>
      <AppText variant="label" className="mt-1">Follow a plan that tells you exactly what to do next.</AppText>

      <UpNextCard className="mt-6" />

      <AppText variant="title" className="mb-1 mt-8 text-xl">{active ? 'Switch to another plan' : 'Choose a plan'}</AppText>
      <AppText variant="label" className="mb-4">How many days a week can you train?</AppText>

      {programs.isPending ? (
        <Loading />
      ) : programs.error ? (
        <ErrorNote message="Couldn't load programs." />
      ) : days === null ? (
        <EmptyState title="No programs available" />
      ) : (
        <>
          <DaysPicker counts={counts} value={days} onChange={setPicked} />
          <View className="mt-4 gap-3">
            {ordered.length === 0 ? (
              <EmptyState title={`You're already on the ${days}-day plan`} body="Pick another number of days to see other plans." />
            ) : (
              ordered.map((p) => <ProgramCard key={p.id} p={p} recommended={p.id === recommendedId && ordered.length > 1} />)
            )}
          </View>
        </>
      )}

      <Pressable
        onPress={() => router.push('/templates/new')}
        className="mt-8 flex-row items-center gap-3 rounded-2xl border border-dashed border-line p-4 active:bg-surface"
      >
        <LayoutList color={colors.iris} size={20} />
        <View className="flex-1">
          <AppText variant="body" className="font-medium">Prefer your own routine?</AppText>
          <AppText variant="caption">Build a template and start it any time from Train.</AppText>
        </View>
        <ChevronRight color={colors.muted} size={20} />
      </Pressable>
    </Screen>
  );
}
