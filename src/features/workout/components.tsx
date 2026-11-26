import * as Haptics from 'expo-haptics';
import { Check, ChevronDown, ChevronUp, Minus, Plus, Timer, Trash2, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, TextInput, View } from 'react-native';

import { IconButton } from '@/components/form';
import { AppText } from '@/components/ui';
import { cn } from '@/lib/cn';
import { displayToKg, type Unit } from '@/lib/fitness';
import { formatClock, formatWeight, parseNumber } from '@/lib/format';
import { colors } from '@/theme/tokens';

import type { LastSet } from './api';
import { isSetComplete, type SetEntry, type WorkoutExercise } from './model';
import { useWorkoutStore } from './store';

const haptic = (style: 'light' | 'success' | 'warning') => {
  if (Platform.OS === 'web') return;
  if (style === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  else Haptics.notificationAsync(style === 'success' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning);
};

/** Re-renders every second while mounted. */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/**
 * Numeric cell that keeps the raw text while typing (so "102." or "" don't get reformatted mid-edit)
 * and resyncs from the store when not focused.
 */
function NumberCell({ value, onChange, placeholder, done, label }: { value: string; onChange: (n: number | null) => void; placeholder?: string; done: boolean; label: string }) {
  const [text, setText] = useState(value);
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setText(value);
  }, [value]);
  return (
    <TextInput
      accessibilityLabel={label}
      value={text}
      onChangeText={(t) => {
        setText(t);
        onChange(parseNumber(t));
      }}
      onFocus={() => (focused.current = true)}
      onBlur={() => {
        focused.current = false;
        setText(value);
      }}
      placeholder={placeholder}
      placeholderTextColor={colors.faint}
      keyboardType="decimal-pad"
      inputMode="decimal"
      selectTextOnFocus
      // min-w-0 + basis-0: browsers give <input> an intrinsic ~20ch width that otherwise overflows the row on web.
      className={cn('h-11 min-w-0 flex-1 basis-0 rounded-lg text-center font-semibold text-base', done ? 'bg-transparent text-fg' : 'bg-raised text-fg')}
    />
  );
}

function previousLabel(kind: WorkoutExercise['kind'], prev: LastSet | undefined, unit: Unit) {
  if (!prev) return '—';
  if (kind === 'duration') return prev.duration_seconds ? formatClock(prev.duration_seconds) : '—';
  if (kind === 'reps_only') return prev.reps ? `${prev.reps}` : '—';
  return prev.weight_kg !== null && prev.reps ? `${formatWeight(prev.weight_kg, unit)}×${prev.reps}` : '—';
}

function SetRow({
  exercise,
  set,
  index,
  workingIndex,
  previous,
  unit,
  restSeconds,
}: {
  exercise: WorkoutExercise;
  set: SetEntry;
  index: number;
  workingIndex: number;
  previous: LastSet | undefined;
  unit: Unit;
  restSeconds: number;
}) {
  const updateSet = useWorkoutStore((s) => s.updateSet);
  const removeSet = useWorkoutStore((s) => s.removeSet);
  const startRest = useWorkoutStore((s) => s.startRest);
  const patch = (p: Partial<SetEntry>) => updateSet(exercise.key, set.key, p);
  const complete = isSetComplete(exercise.kind, set);

  const toggleDone = () => {
    if (set.done) return patch({ done: false });
    // Tapping done on an empty row copies last time's numbers (common "same as last time" flow).
    if (!complete && previous) {
      const filled = { weightKg: previous.weight_kg, reps: previous.reps, durationSeconds: previous.duration_seconds };
      if (!isSetComplete(exercise.kind, { ...set, ...filled })) return haptic('warning');
      patch({ ...filled, done: true });
    } else if (!complete) {
      return haptic('warning');
    } else {
      patch({ done: true });
    }
    haptic('success');
    if (!set.isWarmup) startRest(restSeconds);
  };

  return (
    <View className={cn('flex-row items-center gap-2 rounded-xl px-2 py-1', set.done && 'bg-success/10')}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={set.isWarmup ? 'Warm-up set. Tap to make it a working set' : `Set ${workingIndex}. Tap to mark as warm-up`}
        onPress={() => patch({ isWarmup: !set.isWarmup })}
        onLongPress={() => removeSet(exercise.key, set.key)}
        className="h-11 w-9 items-center justify-center rounded-lg active:bg-raised"
      >
        <AppText variant="label" className={cn('font-bold', set.isWarmup ? 'text-warning' : 'text-fg')}>
          {set.isWarmup ? 'W' : workingIndex}
        </AppText>
      </Pressable>
      <AppText variant="caption" className="w-20 text-center" numberOfLines={1}>
        {previousLabel(exercise.kind, previous, unit)}
      </AppText>
      {exercise.kind === 'weight_reps' && (
        <NumberCell
          label={`Set ${index + 1} weight`}
          value={formatWeight(set.weightKg, unit)}
          onChange={(n) => patch({ weightKg: n === null ? null : displayToKg(n, unit) })}
          placeholder={previous?.weight_kg != null ? formatWeight(previous.weight_kg, unit) : unit}
          done={set.done}
        />
      )}
      {exercise.kind === 'duration' ? (
        <NumberCell
          label={`Set ${index + 1} seconds`}
          value={set.durationSeconds?.toString() ?? ''}
          onChange={(n) => patch({ durationSeconds: n === null ? null : Math.round(n) })}
          placeholder={previous?.duration_seconds?.toString() ?? 'sec'}
          done={set.done}
        />
      ) : (
        <NumberCell
          label={`Set ${index + 1} reps`}
          value={set.reps?.toString() ?? ''}
          onChange={(n) => patch({ reps: n === null ? null : Math.round(n) })}
          placeholder={previous?.reps?.toString() ?? 'reps'}
          done={set.done}
        />
      )}
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: set.done }}
        accessibilityLabel={`Complete set ${index + 1}`}
        onPress={toggleDone}
        className={cn('h-11 w-11 items-center justify-center rounded-lg', set.done ? 'bg-success' : 'bg-raised active:bg-line')}
      >
        <Check color={set.done ? colors.ink : colors.muted} size={20} strokeWidth={3} />
      </Pressable>
    </View>
  );
}

/**
 * Numbers working sets 1..n (warm-ups shown as "W") and pairs each set with last time's set
 * of the same type and order, so "previous" lines up even when warm-ups were added or removed.
 */
function numberSets(sets: SetEntry[], previous: LastSet[]) {
  const workingPrev = previous.filter((p) => !p.is_warmup);
  const warmPrev = previous.filter((p) => p.is_warmup);
  let working = 0;
  let warm = 0;
  return sets.map((set, index) => {
    const prev = set.isWarmup ? warmPrev[warm++] : workingPrev[working++];
    return { set, index, workingIndex: working, previous: prev };
  });
}

export function ExerciseCard({
  exercise,
  index,
  total,
  previous,
  unit,
  defaultRest,
}: {
  exercise: WorkoutExercise;
  index: number;
  total: number;
  previous: LastSet[] | undefined;
  unit: Unit;
  defaultRest: number;
}) {
  const addSet = useWorkoutStore((s) => s.addSet);
  const moveExercise = useWorkoutStore((s) => s.moveExercise);
  const removeExercise = useWorkoutStore((s) => s.removeExercise);
  const rows = numberSets(exercise.sets, previous ?? []);
  const unitLabel = exercise.kind === 'weight_reps' ? unit : exercise.kind === 'duration' ? 'sec' : '';

  return (
    <View className="rounded-2xl border border-line bg-surface p-3">
      <View className="mb-2 flex-row items-center gap-1 pl-2">
        <AppText variant="heading" className="flex-1 text-volt" numberOfLines={1}>
          {exercise.name}
        </AppText>
        <IconButton label="Move up" onPress={() => moveExercise(exercise.key, -1)} className={index === 0 ? 'opacity-30' : ''}>
          <ChevronUp color={colors.muted} size={20} />
        </IconButton>
        <IconButton label="Move down" onPress={() => moveExercise(exercise.key, 1)} className={index === total - 1 ? 'opacity-30' : ''}>
          <ChevronDown color={colors.muted} size={20} />
        </IconButton>
        <IconButton label={`Remove ${exercise.name}`} onPress={() => removeExercise(exercise.key)}>
          <Trash2 color={colors.danger} size={18} />
        </IconButton>
      </View>

      <View className="mb-1 flex-row items-center gap-2 px-2">
        <AppText variant="caption" className="w-9 text-center">SET</AppText>
        <AppText variant="caption" className="w-20 text-center">PREVIOUS</AppText>
        {exercise.kind === 'weight_reps' && <AppText variant="caption" className="flex-1 text-center uppercase">{unitLabel}</AppText>}
        <AppText variant="caption" className="flex-1 text-center">{exercise.kind === 'duration' ? 'SEC' : 'REPS'}</AppText>
        <View className="w-11" />
      </View>

      {rows.map(({ set: s, index, workingIndex, previous: prev }) => (
        <SetRow
          key={s.key}
          exercise={exercise}
          set={s}
          index={index}
          workingIndex={workingIndex}
          previous={prev}
          unit={unit}
          restSeconds={exercise.restSeconds ?? defaultRest}
        />
      ))}

      <Pressable onPress={() => addSet(exercise.key)} className="mt-2 h-11 flex-row items-center justify-center gap-2 rounded-xl bg-raised active:bg-line">
        <Plus color={colors.fg} size={18} />
        <AppText variant="label" className="font-semibold text-fg">Add set</AppText>
      </Pressable>
    </View>
  );
}

/** Rest countdown pinned to the bottom of the workout screen. */
export function RestTimerBar() {
  const rest = useWorkoutStore((s) => s.rest);
  const adjust = useWorkoutStore((s) => s.adjustRest);
  const stop = useWorkoutStore((s) => s.stopRest);
  const now = useNow(250);
  const remaining = rest ? Math.ceil((rest.endsAt - now) / 1000) : 0;
  const notified = useRef<number | null>(null);

  useEffect(() => {
    if (rest && remaining <= 0 && notified.current !== rest.endsAt) {
      notified.current = rest.endsAt;
      haptic('success');
      stop();
    }
  }, [rest, remaining, stop]);

  if (!rest || remaining <= 0) return null;
  const progress = Math.min(1, Math.max(0, remaining / rest.totalSeconds));

  return (
    <View className="overflow-hidden rounded-2xl border border-line bg-raised">
      <View className="absolute bottom-0 left-0 top-0 bg-volt/15" style={{ width: `${progress * 100}%` }} />
      <View className="flex-row items-center gap-2 px-3 py-2">
        <Timer color={colors.volt} size={20} />
        <AppText variant="stat" className="flex-1 text-2xl" accessibilityLiveRegion="polite">
          {formatClock(remaining)}
        </AppText>
        <IconButton label="Subtract 15 seconds" onPress={() => adjust(-15)}>
          <Minus color={colors.fg} size={18} />
        </IconButton>
        <IconButton label="Add 15 seconds" onPress={() => adjust(15)}>
          <Plus color={colors.fg} size={18} />
        </IconButton>
        <IconButton label="Skip rest" onPress={stop}>
          <X color={colors.fg} size={18} />
        </IconButton>
      </View>
    </View>
  );
}
