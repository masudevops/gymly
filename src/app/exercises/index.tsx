import { router, useLocalSearchParams } from 'expo-router';
import { Check, ChevronRight, Plus, Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chip, EmptyState, ErrorNote, Field, Header, IconButton, Loading } from '@/components/form';
import { AppText, Button } from '@/components/ui';
import { EQUIPMENT_LABELS, MUSCLE_LABELS, filterExercises, useExercises, type Exercise, type MuscleGroup } from '@/features/exercises/api';
import { useExercisePicker } from '@/features/exercises/picker';
import { cn } from '@/lib/cn';
import { colors } from '@/theme/tokens';

const MUSCLES = Object.keys(MUSCLE_LABELS) as MuscleGroup[];

function ExerciseRow({ exercise, selected, picking, onPress }: { exercise: Exercise; selected: boolean; picking: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={picking ? 'checkbox' : 'button'}
      aria-checked={picking ? selected : undefined}
      className={cn('flex-row items-center gap-3 rounded-xl px-3 py-3', selected ? 'bg-volt/10' : 'active:bg-raised')}
    >
      <View className="h-11 w-11 items-center justify-center rounded-xl bg-raised">
        <AppText variant="label" className="font-semibold text-fg">{exercise.name.slice(0, 1)}</AppText>
      </View>
      <View className="flex-1">
        <AppText variant="body" className="font-medium" numberOfLines={1}>{exercise.name}</AppText>
        <AppText variant="caption">
          {MUSCLE_LABELS[exercise.primary_muscle]} · {EQUIPMENT_LABELS[exercise.equipment]}
          {exercise.owner_id ? ' · Custom' : ''}
        </AppText>
      </View>
      {picking ? (
        <View className={cn('h-6 w-6 items-center justify-center rounded-full border-2', selected ? 'border-volt bg-volt' : 'border-line')}>
          {selected && <Check color={colors.ink} size={14} strokeWidth={3} />}
        </View>
      ) : (
        <ChevronRight color={colors.faint} size={18} />
      )}
    </Pressable>
  );
}

export default function ExercisesScreen() {
  // pick=1: multi-select and confirm; pick=one: tapping an exercise picks it (used to swap one exercise).
  const { pick } = useLocalSearchParams<{ pick?: string }>();
  const picking = pick === '1';
  const pickingOne = pick === 'one';
  const { data, isPending, error } = useExercises();
  const onPick = useExercisePicker((s) => s.onPick);
  const clearPicker = useExercisePicker((s) => s.clear);
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  const list = useMemo(() => filterExercises(data ?? [], query, muscle), [data, query, muscle]);

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const pickOne = (e: Exercise) => {
    onPick?.([{ id: e.id, name: e.name, kind: e.kind }]);
    clearPicker();
    router.back();
  };

  const confirmPick = () => {
    const byId = new Map((data ?? []).map((e) => [e.id, e]));
    onPick?.(selected.map((id) => byId.get(id)!).map((e) => ({ id: e.id, name: e.name, kind: e.kind })));
    clearPicker();
    router.back();
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-ink">
      <View className="w-full max-w-2xl flex-1 self-center px-5 pt-2">
        <Header
          title={picking ? 'Add exercises' : pickingOne ? 'Choose a replacement' : 'Exercises'}
          right={
            <IconButton label="New exercise" onPress={() => router.push('/exercises/new')}>
              <Plus color={colors.volt} size={24} />
            </IconButton>
          }
        />
        <View className="relative">
          <View className="absolute left-4 top-0 z-10 h-[52px] justify-center">
            <Search color={colors.faint} size={18} />
          </View>
          <Field value={query} onChangeText={setQuery} placeholder="Search 140+ exercises" className="pl-11" autoCorrect={false} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3 grow-0" contentContainerClassName="gap-2 pr-4">
          <Chip label="All" selected={!muscle} onPress={() => setMuscle(null)} />
          {MUSCLES.map((m) => (
            <Chip key={m} label={MUSCLE_LABELS[m]} selected={muscle === m} onPress={() => setMuscle(muscle === m ? null : m)} />
          ))}
        </ScrollView>

        {isPending ? (
          <Loading />
        ) : error ? (
          <View className="mt-4"><ErrorNote message="Couldn't load exercises. Pull to retry or check your connection." /></View>
        ) : (
          <FlatList
            className="mt-3 flex-1"
            data={list}
            keyExtractor={(e) => e.id}
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="pb-28"
            renderItem={({ item }) => (
              <ExerciseRow
                exercise={item}
                selected={selected.includes(item.id)}
                picking={picking}
                onPress={picking ? () => toggle(item.id) : pickingOne ? () => pickOne(item) : () => router.push(`/exercise/${item.id}`)}
              />
            )}
            ListEmptyComponent={
              <EmptyState
                title="No matches"
                body="Can't find it? Create your own exercise."
                action={<Button title="New exercise" variant="secondary" onPress={() => router.push('/exercises/new')} />}
              />
            }
          />
        )}
      </View>

      {picking && selected.length > 0 && (
        <View className="absolute bottom-0 left-0 right-0 border-t border-line bg-ink px-5 pb-8 pt-3">
          <View className="w-full max-w-2xl self-center">
            <Button title={`Add ${selected.length} exercise${selected.length > 1 ? 's' : ''}`} onPress={confirmPick} />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
