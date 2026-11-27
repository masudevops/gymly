import { router } from 'expo-router';
import { CalendarClock, ChevronRight, Dumbbell } from 'lucide-react-native';
import { FlatList, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, ErrorNote, Loading } from '@/components/form';
import { AppText, Button } from '@/components/ui';
import { DailyQuote } from '@/features/motivation/daily-quote';
import { useUnit } from '@/features/profile/api';
import { TabTitle } from '@/features/share/share-gymly';
import { useWorkoutHistory, type WorkoutSummary } from '@/features/workout/api';
import { totalVolume } from '@/lib/fitness';
import { formatDate, formatDuration, formatVolume, plural } from '@/lib/format';
import { colors } from '@/theme/tokens';

function WorkoutRow({ w, unit }: { w: WorkoutSummary; unit: 'kg' | 'lb' }) {
  const sets = w.workout_exercises.flatMap((e) => e.workout_sets);
  const volume = totalVolume(sets.map((s) => ({ weight: s.weight_kg ?? 0, reps: s.reps ?? 0, isWarmup: s.is_warmup })));
  return (
    <Pressable onPress={() => router.push(`/history/${w.id}`)} className="rounded-2xl border border-line bg-surface p-4 active:bg-raised">
      <View className="flex-row items-center gap-2">
        <View className="flex-1">
          <AppText variant="heading" numberOfLines={1}>{w.name}</AppText>
          <AppText variant="caption" className="mt-0.5">
            {formatDate(w.started_at)} · {formatDuration(w.started_at, w.finished_at)}
          </AppText>
        </View>
        <ChevronRight color={colors.muted} size={20} />
      </View>
      <AppText variant="label" numberOfLines={2} className="mt-3">
        {w.workout_exercises.map((e) => `${e.workout_sets.length}× ${e.exercise?.name ?? 'Exercise'}`).join('  ·  ')}
      </AppText>
      <View className="mt-3 flex-row gap-4">
        <AppText variant="caption" className="text-fg">{plural(sets.length, 'set')}</AppText>
        {volume > 0 && <AppText variant="caption" className="text-fg">{formatVolume(volume, unit)}</AppText>}
      </View>
    </Pressable>
  );
}

export default function HistoryScreen() {
  const history = useWorkoutHistory();
  const unit = useUnit();
  const items = history.data?.pages.flat() ?? [];

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-ink">
      <FlatList
        data={items}
        keyExtractor={(w) => w.id}
        contentContainerClassName="w-full max-w-2xl self-center gap-3 px-5 pb-10 pt-4"
        ListHeaderComponent={
          <View className="mb-3">
            <TabTitle title="History" />
            <DailyQuote context="history" className="mt-1" />
          </View>
        }
        renderItem={({ item }) => <WorkoutRow w={item} unit={unit} />}
        onEndReached={() => history.hasNextPage && !history.isFetchingNextPage && history.fetchNextPage()}
        onEndReachedThreshold={0.5}
        refreshing={history.isRefetching}
        onRefresh={() => history.refetch()}
        ListEmptyComponent={
          history.isPending ? (
            <Loading />
          ) : history.error ? (
            <ErrorNote message="Couldn't load your history." />
          ) : (
            <EmptyState
              icon={<CalendarClock color={colors.muted} size={28} />}
              title="No workouts yet"
              body="Finished workouts show up here with every set you logged."
              action={<Button title="Start training" variant="secondary" icon={<Dumbbell color={colors.fg} size={18} />} onPress={() => router.navigate('/')} />}
            />
          )
        }
        ListFooterComponent={history.isFetchingNextPage ? <Loading /> : undefined}
      />
    </SafeAreaView>
  );
}
