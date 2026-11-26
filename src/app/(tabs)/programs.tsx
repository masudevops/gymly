import { router } from 'expo-router';
import { CalendarDays, ChevronRight, Dumbbell, Layers } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { ErrorNote, Loading } from '@/components/form';
import { AppText, Screen } from '@/components/ui';
import { GOAL_LABELS, LEVEL_LABELS, useActiveProgram, usePrograms } from '@/features/programs/api';
import { UpNextCard } from '@/features/programs/up-next-card';
import { colors } from '@/theme/tokens';

function Meta({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      {icon}
      <AppText variant="caption" className="text-muted">{label}</AppText>
    </View>
  );
}

export default function ProgramsScreen() {
  const programs = usePrograms();
  const active = useActiveProgram().data;

  return (
    <Screen>
      <AppText variant="display">Programs</AppText>
      <AppText variant="label" className="mt-1">Follow a plan that tells you exactly what to do next.</AppText>

      <UpNextCard className="mt-6" />

      <AppText variant="title" className="mb-3 mt-8 text-xl">{active ? 'Other programs' : 'Choose a program'}</AppText>
      {programs.isPending ? (
        <Loading />
      ) : programs.error ? (
        <ErrorNote message="Couldn't load programs." />
      ) : (
        <View className="gap-3">
          {programs.data
            .filter((p) => p.id !== active?.program_id)
            .map((p) => (
              <Pressable key={p.id} onPress={() => router.push(`/programs/${p.id}`)} className="gap-3 rounded-2xl border border-line bg-surface p-5 active:bg-raised">
                <View className="flex-row items-start gap-2">
                  <View className="flex-1 gap-1">
                    <AppText variant="heading">{p.name}</AppText>
                    <AppText variant="label">{p.summary}</AppText>
                  </View>
                  <ChevronRight color={colors.muted} size={20} />
                </View>
                <View className="flex-row flex-wrap gap-x-4 gap-y-2">
                  <Meta icon={<CalendarDays color={colors.iris} size={14} />} label={`${p.days_per_week} days/week`} />
                  <Meta icon={<Layers color={colors.iris} size={14} />} label={`${p.weeks} weeks`} />
                  <Meta icon={<Dumbbell color={colors.iris} size={14} />} label={`${LEVEL_LABELS[p.level]} · ${GOAL_LABELS[p.goal]}`} />
                </View>
              </Pressable>
            ))}
        </View>
      )}
    </Screen>
  );
}
