import { router, useLocalSearchParams } from 'expo-router';
import { Plus, Trash2, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { ErrorNote, Field, Header, IconButton, Loading } from '@/components/form';
import { AppText, Button, Card, Screen } from '@/components/ui';
import { useExercisePicker } from '@/features/exercises/picker';
import { useUnit } from '@/features/profile/api';
import { useUpdateWorkout, useWorkoutDetail } from '@/features/workout/api';
import { NumberCell } from '@/features/workout/components';
import * as M from '@/features/workout/model';
import { cn } from '@/lib/cn';
import { confirm } from '@/lib/confirm';
import { displayToKg, type Unit } from '@/lib/fitness';
import { formatDate, formatWeight } from '@/lib/format';
import { colors } from '@/theme/tokens';

/** Loads the workout, then mounts the editor with it as initial state. */
export default function EditWorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const detail = useWorkoutDetail(id);
  if (detail.isPending) return <Screen><Header title="Edit workout" /><Loading /></Screen>;
  if (detail.error || !detail.data) return <Screen><Header title="Edit workout" /><ErrorNote message="Couldn't load this workout." /></Screen>;
  return <Editor key={id} initial={M.fromSavedWorkout(detail.data as unknown as M.SavedWorkout)} />;
}

function SetEditRow({ ex, set, label, unit, onChange, onRemove }: {
  ex: M.WorkoutExercise;
  set: M.SetEntry;
  label: string;
  unit: Unit;
  onChange: (patch: Partial<M.SetEntry>) => void;
  onRemove: () => void;
}) {
  return (
    <View className="flex-row items-center gap-2 px-1 py-1">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={set.isWarmup ? 'Warm-up set. Tap to make it a working set' : `${label}. Tap to mark as warm-up`}
        onPress={() => onChange({ isWarmup: !set.isWarmup })}
        className="h-11 w-9 items-center justify-center rounded-lg active:bg-raised"
      >
        <AppText variant="label" className={cn('font-bold', set.isWarmup ? 'text-warning' : 'text-fg')}>{set.isWarmup ? 'W' : label.replace('Set ', '')}</AppText>
      </Pressable>
      {ex.kind === 'weight_reps' && (
        <NumberCell label={`${label} weight`} value={formatWeight(set.weightKg, unit)} onChange={(n) => onChange({ weightKg: n === null ? null : displayToKg(n, unit) })} placeholder={unit} done={false} />
      )}
      {ex.kind === 'duration' ? (
        <NumberCell label={`${label} seconds`} value={set.durationSeconds?.toString() ?? ''} onChange={(n) => onChange({ durationSeconds: n === null ? null : Math.round(n) })} placeholder="sec" done={false} />
      ) : (
        <NumberCell label={`${label} reps`} value={set.reps?.toString() ?? ''} onChange={(n) => onChange({ reps: n === null ? null : Math.round(n) })} placeholder="reps" done={false} />
      )}
      <IconButton label={`Delete ${label}`} onPress={onRemove}>
        <X color={colors.faint} size={18} />
      </IconButton>
    </View>
  );
}

function Editor({ initial }: { initial: M.ActiveWorkout }) {
  const [w, setW] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const unit = useUnit();
  const update = useUpdateWorkout();
  const openPicker = useExercisePicker((s) => s.open);

  const edit = (fn: (x: M.ActiveWorkout) => M.ActiveWorkout) => {
    setW(fn);
    setDirty(true);
  };

  const payload = M.toUpdatePayload(w);
  const droppedSets = w.exercises.reduce((n, e) => n + e.sets.filter((s) => !M.isSetComplete(e.kind, s)).length, 0);

  const save = async () => {
    if (payload.exercises.length === 0) {
      const ok = await confirm('No sets left', 'Saving would leave this workout empty. Delete the workout from its page instead.', 'OK');
      if (ok) return;
      return;
    }
    if (droppedSets > 0) {
      const ok = await confirm('Incomplete sets', `${droppedSets} set${droppedSets > 1 ? 's are' : ' is'} missing values and won't be saved.`, 'Save anyway');
      if (!ok) return;
    }
    update.mutate(payload, { onSuccess: () => router.back() });
  };

  const cancel = async () => {
    if (!dirty || (await confirm('Discard changes?', 'Your edits to this workout will be lost.', 'Discard', true))) router.back();
  };

  return (
    <Screen>
      <Header title="Edit workout" onBack={cancel} />
      <AppText variant="label" className="mb-4">{formatDate(w.startedAt)}</AppText>
      <View className="gap-4">
        <Field label="Name" value={w.name} onChangeText={(name) => edit((x) => ({ ...x, name }))} maxLength={60} />

        {w.exercises.map((ex) => {
          let working = 0;
          const labels = ex.sets.map((s) => (s.isWarmup ? 'Warm-up' : `Set ${++working}`));
          return (
            <Card key={ex.key} className="gap-1 p-3">
              <View className="flex-row items-center gap-1 pl-2">
                <AppText variant="heading" className="flex-1 text-volt" numberOfLines={1}>{ex.name}</AppText>
                <IconButton label={`Remove ${ex.name}`} onPress={() => edit((x) => M.removeExercise(x, ex.key))}>
                  <Trash2 color={colors.danger} size={18} />
                </IconButton>
              </View>
              {ex.sets.map((s, i) => (
                <SetEditRow
                  key={s.key}
                  ex={ex}
                  set={s}
                  label={labels[i]}
                  unit={unit}
                  onChange={(patch) => edit((x) => M.updateSet(x, ex.key, s.key, patch))}
                  onRemove={() => edit((x) => M.removeSet(x, ex.key, s.key))}
                />
              ))}
              <Pressable onPress={() => edit((x) => M.addSet(x, ex.key))} className="mt-1 h-11 flex-row items-center justify-center gap-2 rounded-xl bg-raised active:bg-line">
                <Plus color={colors.fg} size={18} />
                <AppText variant="label" className="font-semibold text-fg">Add set</AppText>
              </Pressable>
            </Card>
          );
        })}

        <Button
          title="Add exercises"
          variant="secondary"
          icon={<Plus color={colors.fg} size={20} />}
          onPress={() => {
            openPicker((refs) => edit((x) => M.addExercises(x, refs)));
            router.push('/exercises?pick=1');
          }}
        />
        <Field label="Notes" value={w.notes} onChangeText={(notes) => edit((x) => ({ ...x, notes }))} placeholder="How did it feel?" multiline maxLength={2000} className="min-h-[88px] py-3" />
        {update.error && <ErrorNote message="Couldn't save your changes. Check your connection and try again." />}
        <Button title={update.isPending ? 'Saving…' : 'Save changes'} onPress={save} disabled={!dirty || update.isPending} />
        <Button title="Cancel" variant="ghost" onPress={cancel} />
      </View>
    </Screen>
  );
}
