// Miniature recreations of real Gymly screens for the landing page, built from the app's own tokens
// so they always match. Example data only; screen readers get one label per preview instead.
import { Check, Timer } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/ui';
import { cn } from '@/lib/cn';
import { colors } from '@/theme/tokens';

function Preview({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <View role="img" aria-label={label} className={cn('rounded-2xl border border-line bg-surface p-4', className)}>
      <View aria-hidden importantForAccessibility="no-hide-descendants" className="gap-3">{children}</View>
    </View>
  );
}

const WEEKLY_VOLUME = [38, 46, 41, 55, 52, 63, 70, 78];

export function ProgressPreview({ className }: { className?: string }) {
  const max = Math.max(...WEEKLY_VOLUME);
  return (
    <Preview label="Example of the Gymly progress screen" className={className}>
      <View className="flex-row items-end justify-between">
        <AppText variant="heading">Weekly volume</AppText>
        <AppText variant="caption" className="text-volt">+24%</AppText>
      </View>
      <View className="h-24 flex-row items-end gap-1.5">
        {WEEKLY_VOLUME.map((v, i) => (
          <View
            key={i}
            className={cn('flex-1 rounded-md', i === WEEKLY_VOLUME.length - 1 ? 'bg-volt' : 'bg-volt/30')}
            style={{ height: `${(v / max) * 100}%` }}
          />
        ))}
      </View>
      <View className="flex-row gap-2">
        <MiniStat label="Workouts" value="42" />
        <MiniStat label="Weekly streak" value="6 weeks" />
      </View>
    </Preview>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 rounded-xl bg-raised px-3 py-2">
      <AppText variant="caption">{label}</AppText>
      <AppText variant="heading" className="text-base">{value}</AppText>
    </View>
  );
}

const SPLIT = [
  { day: 'Push', muscles: 'Chest · Shoulders · Triceps' },
  { day: 'Pull', muscles: 'Back · Biceps', next: true },
  { day: 'Legs', muscles: 'Quads · Hamstrings · Glutes' },
];

export function ProgramPreview({ className }: { className?: string }) {
  return (
    <Preview label="Example of a Gymly training program" className={className}>
      <View className="flex-row items-center justify-between">
        <AppText variant="heading">3-day split</AppText>
        <AppText variant="caption">Week 2 of 6</AppText>
      </View>
      {SPLIT.map((s) => (
        <View
          key={s.day}
          className={cn('flex-row items-center gap-3 rounded-xl border px-3 py-2.5', s.next ? 'border-volt bg-volt/10' : 'border-line bg-raised')}
        >
          <View className="flex-1">
            <AppText variant="heading" className="text-base">{s.day}</AppText>
            <AppText variant="caption" className="text-muted">{s.muscles}</AppText>
          </View>
          {s.next && <AppText variant="caption" className="font-semibold text-volt">Up next</AppText>}
        </View>
      ))}
    </Preview>
  );
}

const SETS = [
  { kg: '80', reps: '8', done: true },
  { kg: '82.5', reps: '6', done: true },
  { kg: '82.5', reps: '6', done: false },
];

export function LoggerPreview({ className }: { className?: string }) {
  return (
    <Preview label="Example of logging sets in a Gymly workout" className={className}>
      <View className="flex-row items-center justify-between">
        <AppText variant="heading">Bench Press</AppText>
        <View className="flex-row items-center gap-1 rounded-full bg-volt px-2.5 py-1">
          <Timer color={colors.ink} size={13} strokeWidth={2.4} />
          <AppText variant="caption" className="font-semibold text-ink">Rest 1:24</AppText>
        </View>
      </View>
      {SETS.map((s, i) => (
        <View key={i} className={cn('flex-row items-center gap-3 rounded-xl px-3 py-2', s.done ? 'bg-success/10' : 'bg-raised')}>
          <AppText variant="label" className="w-6">{i + 1}</AppText>
          <AppText variant="body" className="flex-1">{s.kg} kg</AppText>
          <AppText variant="body" className="flex-1">{s.reps} reps</AppText>
          <View className={cn('h-6 w-6 items-center justify-center rounded-md', s.done ? 'bg-success' : 'border border-line')}>
            {s.done && <Check color={colors.ink} size={14} strokeWidth={3} />}
          </View>
        </View>
      ))}
    </Preview>
  );
}

/** A plain phone outline for the desktop hero. */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <View className="w-[320px] rounded-[48px] border border-line bg-ink p-3 shadow-2xl">
      <View className="gap-3 overflow-hidden rounded-[38px] bg-ink px-3 pb-6 pt-10">
        <View className="absolute left-1/2 top-3 h-5 w-24 -translate-x-12 rounded-full bg-raised" />
        {children}
      </View>
    </View>
  );
}
