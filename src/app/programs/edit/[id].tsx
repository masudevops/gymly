import { router, useLocalSearchParams } from 'expo-router';
import { ChevronDown, ChevronUp, Plus, Repeat, SlidersHorizontal, Trash2 } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { ErrorNote, Field, Header, IconButton, Loading, Stepper } from '@/components/form';
import { AppText, Button, Card, Screen } from '@/components/ui';
import { useExercisePicker } from '@/features/exercises/picker';
import { useActiveProgram, useProgram, useSaveProgram } from '@/features/programs/api';
import {
  MAX_DAYS,
  editorFromProgram,
  move,
  newEditorExercise,
  toSavePayload,
  validateEditor,
  type EditorDay,
  type EditorExercise,
  type EditorState,
} from '@/features/programs/model';
import { newKey } from '@/features/workout/model';
import { colors } from '@/theme/tokens';

const blankDay = (n: number): EditorDay => ({ key: newKey(), id: null, name: `Day ${n}`, focus: null, exercises: [] });

/**
 * /programs/edit/new            → a new program from scratch
 * /programs/edit/new?from=<id>  → a personal copy of a program (the original is never changed)
 * /programs/edit/<id>           → edit one of your own programs
 */
export default function ProgramEditorScreen() {
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const isNew = id === 'new';
  const sourceId = isNew ? from : id;
  const source = useProgram(sourceId);

  if (sourceId && source.isPending) return <Screen><Header /><Loading /></Screen>;
  if (sourceId && (source.error || !source.data)) return <Screen><Header /><ErrorNote message="Couldn't load this program." /></Screen>;
  if (!isNew && source.data && !source.data.owner_id) return <Screen><Header /><ErrorNote message="Built-in programs can't be edited. Use Customize to make your own copy." /></Screen>;

  const initial: EditorState = source.data
    ? editorFromProgram(
        { name: source.data.name, weeks: source.data.weeks, days: source.data.program_days.map((d) => ({ ...d, exercises: d.program_day_exercises })) },
        newKey,
        isNew,
      )
    : { name: '', weeks: 8, days: [blankDay(1)] };

  return <ProgramEditor key={`${id}:${from ?? ''}`} programId={isNew ? null : id} sourceProgramId={isNew ? (from ?? null) : null} initial={initial} />;
}

function ProgramEditor({ programId, sourceProgramId, initial }: { programId: string | null; sourceProgramId: string | null; initial: EditorState }) {
  const save = useSaveProgram();
  const openPicker = useExercisePicker((s) => s.open);
  const active = useActiveProgram().data;
  const [state, setState] = useState<EditorState>(initial);
  const [error, setError] = useState<string | null>(null);

  const setDays = (fn: (days: EditorDay[]) => EditorDay[]) => setState((s) => ({ ...s, days: fn(s.days) }));
  const updateDay = (key: string, fn: (d: EditorDay) => EditorDay) => setDays((days) => days.map((d) => (d.key === key ? fn(d) : d)));
  const updateExercise = (dayKey: string, exKey: string, patch: Partial<EditorExercise>) =>
    updateDay(dayKey, (d) => ({ ...d, exercises: d.exercises.map((e) => (e.key === exKey ? { ...e, ...patch } : e)) }));

  const addExercises = (dayKey: string) => {
    openPicker((refs) => updateDay(dayKey, (d) => ({ ...d, exercises: [...d.exercises, ...refs.map((r) => newEditorExercise(r, newKey()))] })));
    router.push('/exercises?pick=1');
  };
  const substitute = (dayKey: string, exKey: string) => {
    openPicker((refs) => refs[0] && updateExercise(dayKey, exKey, { exercise: refs[0], notes: null }));
    router.push('/exercises?pick=one');
  };

  const onSave = () => {
    const problem = validateEditor(state);
    setError(problem);
    if (problem) return;
    save.mutate(toSavePayload(state, { id: programId, sourceProgramId }), {
      onSuccess: (newId) => (programId ? router.back() : router.replace(`/programs/${newId}`)),
    });
  };

  const title = programId ? 'Edit program' : sourceProgramId ? 'Customize program' : 'New program';
  const editingActive = !!programId && active?.program_id === programId;

  return (
    <Screen>
      <Header title={title} />
      <View className="gap-5">
        {sourceProgramId && (
          <AppText variant="label">This creates your own copy. The original program stays as it is.</AppText>
        )}
        {editingActive && (
          <AppText variant="label" className="text-warning">You&apos;re following this program. Changes apply from your next session.</AppText>
        )}

        <Field label="Program name" value={state.name} onChangeText={(name) => setState((s) => ({ ...s, name }))} placeholder="e.g. My Upper / Lower" maxLength={80} />

        <View className="flex-row items-center justify-between">
          <View>
            <AppText variant="heading" className="text-base">Length</AppText>
            <AppText variant="caption">{state.days.length} sessions a week</AppText>
          </View>
          <Stepper
            value={`${state.weeks} wk`}
            decrementLabel="Fewer weeks"
            incrementLabel="More weeks"
            canDecrement={state.weeks > 1}
            canIncrement={state.weeks < 52}
            onDecrement={() => setState((s) => ({ ...s, weeks: s.weeks - 1 }))}
            onIncrement={() => setState((s) => ({ ...s, weeks: s.weeks + 1 }))}
          />
        </View>

        {state.days.map((day, di) => (
          <Card key={day.key} className="gap-4 p-4">
            <View className="flex-row items-end gap-1">
              <View className="min-w-0 flex-1 basis-0">
                <Field
                  label={`Session ${di + 1}`}
                  value={day.name}
                  onChangeText={(name) => updateDay(day.key, (d) => ({ ...d, name }))}
                  placeholder={`Day ${di + 1}`}
                  maxLength={60}
                />
              </View>
              <IconButton label={`Move ${day.name || `day ${di + 1}`} up`} onPress={() => setDays((days) => move(days, di, -1))}>
                <ChevronUp color={colors.muted} size={18} />
              </IconButton>
              <IconButton label={`Move ${day.name || `day ${di + 1}`} down`} onPress={() => setDays((days) => move(days, di, 1))}>
                <ChevronDown color={colors.muted} size={18} />
              </IconButton>
              <IconButton label={`Remove ${day.name || `day ${di + 1}`}`} onPress={() => setDays((days) => days.filter((d) => d.key !== day.key))}>
                <Trash2 color={colors.danger} size={18} />
              </IconButton>
            </View>

            {day.exercises.map((e, ei) => (
              <ExerciseEditor
                key={e.key}
                e={e}
                onChange={(patch) => updateExercise(day.key, e.key, patch)}
                onMove={(dir) => updateDay(day.key, (d) => ({ ...d, exercises: move(d.exercises, ei, dir) }))}
                onRemove={() => updateDay(day.key, (d) => ({ ...d, exercises: d.exercises.filter((x) => x.key !== e.key) }))}
                onSubstitute={() => substitute(day.key, e.key)}
              />
            ))}

            <Button title="Add exercises" variant="ghost" icon={<Plus color={colors.volt} size={18} />} onPress={() => addExercises(day.key)} />
          </Card>
        ))}

        {state.days.length < MAX_DAYS && (
          <Button title="Add session" variant="secondary" icon={<Plus color={colors.fg} size={20} />} onPress={() => setDays((days) => [...days, blankDay(days.length + 1)])} />
        )}

        {error && <ErrorNote message={error} />}
        {save.error && <ErrorNote message="Couldn't save the program. Try again." />}
        <Button title={save.isPending ? 'Saving…' : 'Save program'} onPress={onSave} disabled={save.isPending} />
      </View>
    </Screen>
  );
}

function ExerciseEditor({ e, onChange, onMove, onRemove, onSubstitute }: {
  e: EditorExercise;
  onChange: (patch: Partial<EditorExercise>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  onSubstitute: () => void;
}) {
  const timed = e.exercise.kind === 'duration';
  const step = timed ? 5 : 1;
  const lo = e.repsMin ?? (timed ? 30 : 8);
  const hi = e.repsMax ?? lo;
  const rest = e.rest ?? 90;
  const unit = timed ? 's' : '';
  const [open, setOpen] = useState(false);
  const summary = `${e.sets} × ${lo === hi ? lo : `${lo}–${hi}`}${unit} · ${rest}s`;

  return (
    <View className="gap-1 rounded-xl bg-raised/60 p-3">
      <AppText variant="heading" className="text-base text-volt" numberOfLines={2}>{e.exercise.name}</AppText>
      {e.notes && <AppText variant="caption">{e.notes}</AppText>}
      <View className="flex-row items-center">
        <Pressable
          accessibilityRole="button"
          aria-expanded={open}
          accessibilityLabel={`${open ? 'Hide' : 'Edit'} sets, reps and rest for ${e.exercise.name}`}
          onPress={() => setOpen((o) => !o)}
          className="min-h-[44px] flex-1 flex-row items-center gap-2 rounded-lg active:bg-surface"
        >
          <SlidersHorizontal color={open ? colors.volt : colors.muted} size={16} />
          <AppText variant="label" className="flex-shrink text-fg">{summary}</AppText>
        </Pressable>
        <IconButton label={`Replace ${e.exercise.name}`} onPress={onSubstitute}><Repeat color={colors.muted} size={17} /></IconButton>
        <IconButton label={`Move ${e.exercise.name} up`} onPress={() => onMove(-1)}><ChevronUp color={colors.muted} size={18} /></IconButton>
        <IconButton label={`Move ${e.exercise.name} down`} onPress={() => onMove(1)}><ChevronDown color={colors.muted} size={18} /></IconButton>
        <IconButton label={`Remove ${e.exercise.name}`} onPress={onRemove}><Trash2 color={colors.danger} size={17} /></IconButton>
      </View>
      {open && (
        <>
          <Row label="Sets">
            <Stepper value={`${e.sets}`} decrementLabel={`Fewer sets of ${e.exercise.name}`} incrementLabel={`More sets of ${e.exercise.name}`}
              canDecrement={e.sets > 1} canIncrement={e.sets < 10}
              onDecrement={() => onChange({ sets: e.sets - 1 })} onIncrement={() => onChange({ sets: e.sets + 1 })} />
          </Row>
          <Row label={timed ? 'Seconds, from' : 'Reps, from'}>
            <Stepper value={`${lo}${unit}`} decrementLabel={`Lower minimum for ${e.exercise.name}`} incrementLabel={`Raise minimum for ${e.exercise.name}`}
              canDecrement={lo > step} canIncrement={lo < 600}
              onDecrement={() => onChange({ repsMin: lo - step, repsMax: Math.max(hi, lo - step) })}
              onIncrement={() => onChange({ repsMin: lo + step, repsMax: Math.max(hi, lo + step) })} />
          </Row>
          <Row label="to">
            <Stepper value={`${hi}${unit}`} decrementLabel={`Lower maximum for ${e.exercise.name}`} incrementLabel={`Raise maximum for ${e.exercise.name}`}
              canDecrement={hi > lo} canIncrement={hi < 600}
              onDecrement={() => onChange({ repsMax: hi - step })} onIncrement={() => onChange({ repsMax: hi + step })} />
          </Row>
          <Row label="Rest">
            <Stepper value={`${rest}s`} decrementLabel={`Less rest for ${e.exercise.name}`} incrementLabel={`More rest for ${e.exercise.name}`}
              canDecrement={rest > 0} canIncrement={rest < 600}
              onDecrement={() => onChange({ rest: Math.max(0, rest - 15) })} onIncrement={() => onChange({ rest: Math.min(600, rest + 15) })} />
          </Row>
        </>
      )}
    </View>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="flex-row items-center justify-between gap-2">
      <AppText variant="label">{label}</AppText>
      {children}
    </View>
  );
}
