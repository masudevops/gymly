import { router, useLocalSearchParams } from 'expo-router';
import { ChevronDown, ChevronUp, Minus, Plus, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { EmptyState, ErrorNote, Field, Header, IconButton, Loading } from '@/components/form';
import { AppText, Button, Card, Screen } from '@/components/ui';
import { useExercisePicker } from '@/features/exercises/picker';
import { useDeleteTemplate, useSaveTemplate, useTemplates, type Template } from '@/features/templates/api';
import { newKey, type ExerciseKind } from '@/features/workout/model';
import { confirm } from '@/lib/confirm';
import { colors } from '@/theme/tokens';

type Row = { key: string; exerciseId: string; name: string; kind: ExerciseKind; sets: number; reps: number | null };

function Stepper({ value, min, max, onChange, label }: { value: number; min: number; max: number; onChange: (n: number) => void; label: string }) {
  return (
    <View className="flex-row items-center gap-1">
      <IconButton label={`Decrease ${label}`} onPress={() => onChange(Math.max(min, value - 1))}>
        <Minus color={colors.fg} size={16} />
      </IconButton>
      <AppText variant="heading" className="w-8 text-center">{value}</AppText>
      <IconButton label={`Increase ${label}`} onPress={() => onChange(Math.min(max, value + 1))}>
        <Plus color={colors.fg} size={16} />
      </IconButton>
    </View>
  );
}

function toRows(template: Template | undefined): Row[] {
  return (template?.template_exercises ?? []).map((te) => ({
    key: newKey(),
    exerciseId: te.exercise.id,
    name: te.exercise.name,
    kind: te.exercise.kind,
    sets: te.target_sets,
    reps: te.target_reps_min,
  }));
}

/** Loads the template (if editing), then mounts the editor with it as initial state. */
export default function TemplateEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const templates = useTemplates();
  const existing = templates.data?.find((t) => t.id === id);

  if (!isNew && !existing) return <Screen>{templates.isPending ? <Loading /> : <ErrorNote message="Template not found." />}</Screen>;
  return <TemplateEditor key={id} id={id} isNew={isNew} initial={existing} />;
}

function TemplateEditor({ id, isNew, initial }: { id: string; isNew: boolean; initial: Template | undefined }) {
  const save = useSaveTemplate();
  const remove = useDeleteTemplate();
  const openPicker = useExercisePicker((s) => s.open);
  const [name, setName] = useState(initial?.name ?? '');
  const [rows, setRows] = useState<Row[]>(() => toRows(initial));

  const update = (key: string, patch: Partial<Row>) => setRows((r) => r.map((x) => (x.key === key ? { ...x, ...patch } : x)));
  const move = (i: number, dir: -1 | 1) =>
    setRows((r) => {
      const j = i + dir;
      if (j < 0 || j >= r.length) return r;
      const next = [...r];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const addExercises = () => {
    openPicker((refs) =>
      setRows((r) => [...r, ...refs.map((e) => ({ key: newKey(), exerciseId: e.id, name: e.name, kind: e.kind, sets: 3, reps: e.kind === 'duration' ? null : 10 }))]),
    );
    router.push('/exercises?pick=1');
  };

  const onSave = () =>
    save.mutate(
      {
        id: isNew ? undefined : id,
        name: name.trim(),
        exercises: rows.map((r) => ({ exercise_id: r.exerciseId, target_sets: r.sets, target_reps_min: r.reps, target_reps_max: r.reps, rest_seconds: null })),
      },
      { onSuccess: () => router.back() },
    );

  const onDelete = async () => {
    if (await confirm('Delete template?', `"${name}" will be removed. Past workouts are kept.`, 'Delete', true)) {
      remove.mutate(id, { onSuccess: () => router.back() });
    }
  };

  return (
    <Screen>
      <Header
        title={isNew ? 'New template' : 'Edit template'}
        right={
          !isNew && (
            <IconButton label="Delete template" onPress={onDelete}>
              <Trash2 color={colors.danger} size={20} />
            </IconButton>
          )
        }
      />
      <View className="gap-5">
        <Field label="Name" value={name} onChangeText={setName} placeholder="e.g. Upper Body A" maxLength={60} />

        {rows.length === 0 ? (
          <EmptyState title="No exercises yet" body="Add the exercises you do in this routine, in order." />
        ) : (
          rows.map((r, i) => (
            <Card key={r.key} className="gap-3 p-4">
              <View className="flex-row items-center gap-1">
                <AppText variant="heading" className="flex-1 text-volt" numberOfLines={1}>{r.name}</AppText>
                <IconButton label="Move up" onPress={() => move(i, -1)}><ChevronUp color={colors.muted} size={18} /></IconButton>
                <IconButton label="Move down" onPress={() => move(i, 1)}><ChevronDown color={colors.muted} size={18} /></IconButton>
                <IconButton label={`Remove ${r.name}`} onPress={() => setRows((x) => x.filter((y) => y.key !== r.key))}>
                  <Trash2 color={colors.danger} size={18} />
                </IconButton>
              </View>
              <View className="flex-row flex-wrap items-center justify-between gap-2">
                <View className="flex-row items-center gap-2">
                  <AppText variant="label">Sets</AppText>
                  <Stepper label="sets" value={r.sets} min={1} max={20} onChange={(n) => update(r.key, { sets: n })} />
                </View>
                {r.kind !== 'duration' && (
                  <View className="flex-row items-center gap-2">
                    <AppText variant="label">Reps</AppText>
                    <Stepper label="reps" value={r.reps ?? 10} min={1} max={100} onChange={(n) => update(r.key, { reps: n })} />
                  </View>
                )}
              </View>
            </Card>
          ))
        )}

        <Button title="Add exercises" variant="secondary" icon={<Plus color={colors.fg} size={20} />} onPress={addExercises} />
        {save.error && <ErrorNote message="Couldn't save the template. Try again." />}
        <Button title={save.isPending ? 'Saving…' : 'Save template'} onPress={onSave} disabled={!name.trim() || rows.length === 0 || save.isPending} />
      </View>
    </Screen>
  );
}
