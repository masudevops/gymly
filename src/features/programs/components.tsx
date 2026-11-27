// Program cards and labels shared by the Programs tab and program preview.
import { router } from 'expo-router';
import { CalendarDays, ChevronRight, Clock, Dumbbell, Sparkles } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { AppText, Button } from '@/components/ui';
import { cn } from '@/lib/cn';
import { colors } from '@/theme/tokens';

import { GOAL_LABELS, LEVEL_LABELS, type ProgramListItem } from './api';
import { sessionRangeLabel } from './model';

export function Tag({ label, tone = 'default' }: { label: string; tone?: 'default' | 'volt' | 'iris' }) {
  return (
    <View className={cn('rounded-full px-2.5 py-1', tone === 'volt' ? 'bg-volt/15' : tone === 'iris' ? 'bg-iris/15' : 'bg-raised')}>
      <AppText variant="caption" className={cn('font-medium', tone === 'volt' ? 'text-volt' : tone === 'iris' ? 'text-iris' : 'text-fg')}>{label}</AppText>
    </View>
  );
}

function Meta({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      {icon}
      <AppText variant="caption" className="text-muted">{label}</AppText>
    </View>
  );
}

const sessionLabel = (p: ProgramListItem) => sessionRangeLabel(p.program_days.map((d) => ({ exercises: d.program_day_exercises })));

export function ProgramCard({ p, recommended = false }: { p: ProgramListItem; recommended?: boolean }) {
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
        <Meta icon={<Clock color={colors.iris} size={14} />} label={sessionLabel(p)} />
        <Meta icon={<Dumbbell color={colors.iris} size={14} />} label={p.owner_id ? `Custom · ${p.split ?? LEVEL_LABELS[p.level]}` : `${LEVEL_LABELS[p.level]} · ${GOAL_LABELS[p.goal]}`} />
      </View>
    </Pressable>
  );
}

/** Larger card for featured programs: accent border, tagline, tags and an explicit call to action. */
export function FeaturedCard({ p, className }: { p: ProgramListItem; className?: string }) {
  return (
    <View className={cn('gap-3 overflow-hidden rounded-3xl border border-volt/40 bg-surface p-5', className)}>
      {/* Decorative mark; hidden from screen readers. */}
      <View aria-hidden importantForAccessibility="no-hide-descendants" className="absolute -right-6 -top-6 opacity-[0.07]">
        <Dumbbell color={colors.volt} size={140} strokeWidth={1.5} />
      </View>
      {p.tagline && <AppText variant="caption" className="font-semibold uppercase tracking-wider text-volt">{p.tagline}</AppText>}
      <AppText variant="title">{p.name}</AppText>
      <AppText variant="label" numberOfLines={3}>{p.summary}</AppText>
      <View className="flex-row flex-wrap gap-2">
        <Tag label={LEVEL_LABELS[p.level]} tone={p.level === 'advanced' ? 'volt' : 'default'} />
        <Tag label={`${p.days_per_week} days/week`} />
        <Tag label={sessionLabel(p)} />
      </View>
      <Button title="Explore program" onPress={() => router.push(`/programs/${p.id}`)} className="mt-1" />
    </View>
  );
}
