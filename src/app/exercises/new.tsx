import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Chip, ErrorNote, Field, Header } from '@/components/form';
import { AppText, Button, Screen } from '@/components/ui';
import { EQUIPMENT_LABELS, MUSCLE_LABELS, useCreateExercise, type Equipment, type MuscleGroup } from '@/features/exercises/api';
import type { ExerciseKind } from '@/features/workout/model';

const KINDS: { value: ExerciseKind; label: string }[] = [
  { value: 'weight_reps', label: 'Weight × reps' },
  { value: 'reps_only', label: 'Reps only' },
  { value: 'duration', label: 'Time' },
];

export default function NewExerciseScreen() {
  const [name, setName] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup | null>(null);
  const [equipment, setEquipment] = useState<Equipment>('barbell');
  const [kind, setKind] = useState<ExerciseKind>('weight_reps');
  const create = useCreateExercise();

  const save = () => {
    if (!name.trim() || !muscle) return;
    create.mutate({ name, primary_muscle: muscle, equipment, kind }, { onSuccess: () => router.back() });
  };

  const duplicate = create.error && 'code' in create.error && create.error.code === '23505';

  return (
    <Screen>
      <Header title="New exercise" />
      <View className="gap-6">
        <Field label="Name" value={name} onChangeText={setName} placeholder="e.g. Cable Y-Raise" maxLength={80} autoFocus />
        <View className="gap-2">
          <AppText variant="label">Primary muscle</AppText>
          <View className="flex-row flex-wrap gap-2">
            {(Object.keys(MUSCLE_LABELS) as MuscleGroup[]).map((m) => (
              <Chip key={m} label={MUSCLE_LABELS[m]} selected={muscle === m} onPress={() => setMuscle(m)} />
            ))}
          </View>
        </View>
        <View className="gap-2">
          <AppText variant="label">Equipment</AppText>
          <View className="flex-row flex-wrap gap-2">
            {(Object.keys(EQUIPMENT_LABELS) as Equipment[]).map((e) => (
              <Chip key={e} label={EQUIPMENT_LABELS[e]} selected={equipment === e} onPress={() => setEquipment(e)} />
            ))}
          </View>
        </View>
        <View className="gap-2">
          <AppText variant="label">Tracked as</AppText>
          <View className="flex-row flex-wrap gap-2">
            {KINDS.map((k) => (
              <Chip key={k.value} label={k.label} selected={kind === k.value} onPress={() => setKind(k.value)} />
            ))}
          </View>
        </View>
        {create.error && <ErrorNote message={duplicate ? 'You already have an exercise with that name.' : "Couldn't save. Try again."} />}
        <Button title={create.isPending ? 'Saving…' : 'Save exercise'} onPress={save} disabled={!name.trim() || !muscle || create.isPending} />
      </View>
    </Screen>
  );
}
