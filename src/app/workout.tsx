import { router } from 'expo-router';
import { ChevronDown, Dumbbell, Plus } from 'lucide-react-native';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, IconButton } from '@/components/form';
import { AppText, Button } from '@/components/ui';
import { useExercisePicker } from '@/features/exercises/picker';
import { useProfile } from '@/features/profile/api';
import { useLastSets } from '@/features/workout/api';
import { ExerciseCard, RestTimerBar, useNow } from '@/features/workout/components';
import { isSetComplete, workoutStats } from '@/features/workout/model';
import { useWorkoutStore } from '@/features/workout/store';
import { confirm } from '@/lib/confirm';
import { formatClock, formatVolume } from '@/lib/format';
import { colors } from '@/theme/tokens';

export default function WorkoutScreen() {
  const active = useWorkoutStore((s) => s.active);
  const rename = useWorkoutStore((s) => s.rename);
  const addExercises = useWorkoutStore((s) => s.addExercises);
  const finish = useWorkoutStore((s) => s.finish);
  const discard = useWorkoutStore((s) => s.discard);
  const openPicker = useExercisePicker((s) => s.open);
  const profile = useProfile().data;
  const unit = profile?.unit ?? 'kg';
  const now = useNow();
  const lastSets = useLastSets(active?.exercises.map((e) => e.exerciseId) ?? []);
  // Nothing in progress (finished elsewhere, or a stale link). No auto-redirect: on web the screen can
  // re-render mid-transition after Finish, and a redirect here would race the navigation to the summary.
  if (!active) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-4 bg-ink px-8">
        <AppText variant="heading">No workout in progress</AppText>
        <Button title="Back to Train" variant="secondary" onPress={() => router.replace('/')} />
      </SafeAreaView>
    );
  }

  const stats = workoutStats(active);
  const elapsed = (now - new Date(active.startedAt).getTime()) / 1000;

  const pickExercises = () => {
    openPicker((refs) => addExercises(refs));
    router.push('/exercises?pick=1');
  };

  const onFinish = async () => {
    if (stats.sets === 0) {
      const ok = await confirm('No sets completed', 'Tick off at least one set to save this workout, or discard it.', 'Discard workout', true);
      if (ok) {
        discard();
        router.replace('/');
      }
      return;
    }
    const unfinished = active.exercises.some((e) => e.sets.some((s) => !s.done && isSetComplete(e.kind, s)));
    if (unfinished) {
      const ok = await confirm('Finish workout?', 'Some filled-in sets are not ticked off. Only ticked sets are saved.', 'Finish');
      if (!ok) return;
    }
    const payload = finish();
    if (payload) {
      // Close the workout modal back to the tabs, then open the summary, so Back from the summary lands on the tabs.
      router.dismissTo('/');
      router.push({ pathname: '/history/[id]', params: { id: payload.id, done: '1' } });
    }
  };

  const onDiscard = async () => {
    if (await confirm('Discard workout?', 'Everything logged in this session will be lost.', 'Discard', true)) {
        discard();
      router.replace('/');
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-ink">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <View className="w-full max-w-2xl flex-1 self-center">
          {/* Header */}
          <View className="flex-row items-center gap-2 px-4 pb-2 pt-1">
            <IconButton label="Minimize workout" onPress={() => router.back()}>
              <ChevronDown color={colors.fg} size={26} />
            </IconButton>
            <View className="flex-1 items-center">
              <AppText variant="stat" className="text-2xl">{formatClock(elapsed)}</AppText>
              <AppText variant="caption">
                {stats.sets} sets · {formatVolume(stats.volumeKg, unit)}
              </AppText>
            </View>
            <Button title="Finish" onPress={onFinish} className="min-h-[44px] px-4" />
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-4 px-4 pb-40">
            <TextInput
              value={active.name}
              onChangeText={rename}
              accessibilityLabel="Workout name"
              maxLength={60}
              className="font-display text-3xl text-fg"
              placeholderTextColor={colors.faint}
              placeholder="Workout name"
            />

            {active.exercises.length === 0 ? (
              <EmptyState
                icon={<Dumbbell color={colors.muted} size={32} />}
                title="Add your first exercise"
                body="Pick from 140+ exercises or create your own."
              />
            ) : (
              active.exercises.map((e, i) => (
                <ExerciseCard
                  key={e.key}
                  exercise={e}
                  index={i}
                  total={active.exercises.length}
                  previous={lastSets.data?.[e.exerciseId]}
                  unit={unit}
                  defaultRest={profile?.rest_seconds ?? 90}
                />
              ))
            )}

            <Button title="Add exercises" variant="secondary" icon={<Plus color={colors.fg} size={20} />} onPress={pickExercises} />
            <Button title="Discard workout" variant="danger" onPress={onDiscard} />
            <AppText variant="caption" className="text-center">
              Tip: tap a set number to mark it as a warm-up, long-press it to delete.
            </AppText>
          </ScrollView>

          <View className="absolute bottom-0 left-0 right-0 px-4 pb-4">
            <RestTimerBar />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
