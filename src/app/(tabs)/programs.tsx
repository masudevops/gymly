import { router } from 'expo-router';
import { ChevronRight, LayoutList, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';

import { EmptyState, ErrorNote, Loading, Segmented } from '@/components/form';
import { AppText, Screen } from '@/components/ui';
import { DailyQuote } from '@/features/motivation/daily-quote';
import { useProfile } from '@/features/profile/api';
import { useActiveProgram, usePrograms } from '@/features/programs/api';
import { FeaturedCard, ProgramCard } from '@/features/programs/components';
import { availableDayCounts, defaultDayCount, recommendedProgramId, type Level } from '@/features/programs/recommend';
import { UpNextCard } from '@/features/programs/up-next-card';
import { cn } from '@/lib/cn';
import { colors } from '@/theme/tokens';

const LEVEL_OPTIONS: { value: Level; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

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

function SectionTitle({ title, body }: { title: string; body?: string }) {
  return (
    <View className="mb-3 mt-8 gap-1">
      <AppText variant="title" className="text-xl">{title}</AppText>
      {body && <AppText variant="label">{body}</AppText>}
    </View>
  );
}

export default function ProgramsScreen() {
  const programs = usePrograms();
  const active = useActiveProgram().data;
  const profile = useProfile().data;
  const { width } = useWindowDimensions();
  // null = follow the default (onboarding choice); set once the user taps.
  const [pickedDays, setPickedDays] = useState<number | null>(null);
  const [pickedLevel, setPickedLevel] = useState<Level | null>(null);

  const all = programs.data ?? [];
  const mine = all.filter((p) => p.owner_id);
  const featured = all.filter((p) => !p.owner_id && p.featured);
  const catalog = all.filter((p) => !p.owner_id && !p.featured);

  const counts = availableDayCounts(catalog);
  const days = pickedDays ?? defaultDayCount(profile?.training_days, counts);
  const level = pickedLevel ?? profile?.experience ?? 'beginner';
  const matching = catalog.filter((p) => p.days_per_week === days && p.id !== active?.program_id);
  const recommendedId = recommendedProgramId(matching, level);
  // Recommended plan first, then the rest by closeness to the chosen level.
  const rank = { beginner: 0, intermediate: 1, advanced: 2 } as const;
  const ordered = [...matching].sort(
    (a, b) => Number(b.id === recommendedId) - Number(a.id === recommendedId) || Math.abs(rank[a.level] - rank[level]) - Math.abs(rank[b.level] - rank[level]),
  );
  const featuredWidth = Math.min(340, width - 64);

  return (
    <Screen>
      <AppText variant="display">Programs</AppText>
      <DailyQuote context="programs" className="mt-1" />

      <UpNextCard className="mt-6" />

      {programs.isPending ? (
        <Loading />
      ) : programs.error ? (
        <View className="mt-6"><ErrorNote message="Couldn't load programs." /></View>
      ) : (
        <>
          {mine.length > 0 && (
            <>
              <SectionTitle title="My programs" />
              <View className="gap-3">
                {mine.map((p) => <ProgramCard key={p.id} p={p} />)}
              </View>
            </>
          )}

          {featured.length > 0 && (
            <>
              <SectionTitle title="Featured" body="Classic routines, adapted for Gymly." />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={featuredWidth + 12} decelerationRate="fast" className="-mx-5" contentContainerClassName="gap-3 px-5">
                {featured.map((p) => (
                  <View key={p.id} style={{ width: featuredWidth }}>
                    <FeaturedCard p={p} className="flex-1" />
                  </View>
                ))}
              </ScrollView>
            </>
          )}

          <SectionTitle title={active ? 'Switch to another plan' : 'Find your program'} body="How many days a week can you train?" />
          {days === null ? (
            <EmptyState title="No programs available" />
          ) : (
            <>
              <DaysPicker counts={counts} value={days} onChange={setPickedDays} />
              <AppText variant="label" className="mb-2 mt-5">Experience level</AppText>
              <Segmented label="Experience level" options={LEVEL_OPTIONS} value={level} onChange={setPickedLevel} />
              <View className="mt-4 gap-3">
                {ordered.length === 0 ? (
                  <EmptyState title={`You're already on the ${days}-day plan`} body="Pick another number of days to see other plans." />
                ) : (
                  ordered.map((p) => <ProgramCard key={p.id} p={p} recommended={p.id === recommendedId && p.level === level} />)
                )}
              </View>
            </>
          )}

          <SectionTitle title="Build your own" />
          <View className="gap-3">
            <Pressable
              onPress={() => router.push('/programs/edit/new')}
              className="flex-row items-center gap-3 rounded-2xl border border-dashed border-volt/50 p-4 active:bg-surface"
            >
              <Plus color={colors.volt} size={20} />
              <View className="flex-1">
                <AppText variant="body" className="font-medium text-volt">Create custom program</AppText>
                <AppText variant="caption">Your own weekly plan with sets, reps and rest. Or open any program and tap Customize.</AppText>
              </View>
              <ChevronRight color={colors.muted} size={20} />
            </Pressable>
            <Pressable
              onPress={() => router.push('/templates/new')}
              className="flex-row items-center gap-3 rounded-2xl border border-dashed border-line p-4 active:bg-surface"
            >
              <LayoutList color={colors.iris} size={20} />
              <View className="flex-1">
                <AppText variant="body" className="font-medium">Just one routine?</AppText>
                <AppText variant="caption">Build a template and start it any time from Train.</AppText>
              </View>
              <ChevronRight color={colors.muted} size={20} />
            </Pressable>
          </View>
        </>
      )}
    </Screen>
  );
}
