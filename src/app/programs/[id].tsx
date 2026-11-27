import { router, useLocalSearchParams } from 'expo-router';
import { BedDouble, CalendarDays, Clock, Flame, Layers, Pencil, Timer, Trash2, TrendingUp, Wand2 } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { ErrorNote, Header, IconButton, Loading } from '@/components/form';
import { MuscleMap } from '@/components/muscle-map';
import { AppText, Button, Card, Screen } from '@/components/ui';
import {
  GOAL_LABELS,
  LEVEL_LABELS,
  targetLabel,
  useActiveProgram,
  useDeleteProgram,
  useLeaveProgram,
  useProgram,
  useStartProgram,
} from '@/features/programs/api';
import { Tag } from '@/features/programs/components';
import { EQUIPMENT_LABELS, equipmentNeeded, estimateSessionMinutes, muscleMapSets, sessionRangeLabel, weeklySetsByMuscle } from '@/features/programs/model';
import { UpNextCard } from '@/features/programs/up-next-card';
import { confirm } from '@/lib/confirm';
import { colors } from '@/theme/tokens';

const MUSCLE_NAMES: Record<string, string> = {
  chest: 'Chest', back: 'Back', shoulders: 'Shoulders', biceps: 'Biceps', triceps: 'Triceps', forearms: 'Forearms',
  quads: 'Quads', hamstrings: 'Hamstrings', glutes: 'Glutes', calves: 'Calves', core: 'Core',
};

function Guidance({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <View className="flex-row gap-3">
      <View className="mt-0.5">{icon}</View>
      <View className="flex-1 gap-1">
        <AppText variant="heading" className="text-base">{title}</AppText>
        <AppText variant="label" className="leading-5">{body}</AppText>
      </View>
    </View>
  );
}

export default function ProgramDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const program = useProgram(id);
  const active = useActiveProgram().data;
  const start = useStartProgram();
  const leave = useLeaveProgram();
  const remove = useDeleteProgram();
  const isActive = active?.program_id === id;

  if (program.isPending) return <Screen><Header /><Loading /></Screen>;
  if (program.error || !program.data) return <Screen><Header /><ErrorNote message="Couldn't load this program." /></Screen>;
  const p = program.data;
  const isMine = !!p.owner_id;

  const days = p.program_days.map((d) => ({ exercises: d.program_day_exercises }));
  const volume = weeklySetsByMuscle(days);
  const map = muscleMapSets(days);
  const equipment = equipmentNeeded(days);
  const maxSets = Math.max(1, ...volume.map((v) => v.sets));

  const onStart = async () => {
    if (active) {
      const ok = await confirm(
        'Switch programs?',
        `You're ${active.sessions_done} sessions into ${active.name}. Starting ${p.name} ends that plan (your workouts stay in history).`,
        'Switch',
        true,
      );
      if (!ok) return;
    }
    start.mutate(p.id);
  };

  const onLeave = async () => {
    if (!active) return;
    if (await confirm('Leave program?', 'Your logged sessions stay in your history.', 'Leave', true)) {
      leave.mutate(active.enrollment_id, { onSuccess: () => router.back() });
    }
  };

  const onDelete = async () => {
    const note = isActive ? ' You are following it now, so it will end.' : '';
    if (await confirm('Delete program?', `"${p.name}" will be removed.${note} Your logged workouts stay in history.`, 'Delete', true)) {
      remove.mutate(p.id, { onSuccess: () => router.back() });
    }
  };

  return (
    <Screen>
      <Header
        right={
          isMine && (
            <View className="flex-row">
              <IconButton label="Edit program" onPress={() => router.push(`/programs/edit/${p.id}`)}>
                <Pencil color={colors.fg} size={20} />
              </IconButton>
              <IconButton label="Delete program" onPress={onDelete}>
                <Trash2 color={colors.danger} size={20} />
              </IconButton>
            </View>
          )
        }
      />
      {p.tagline && <AppText variant="caption" className="mb-1 font-semibold uppercase tracking-wider text-volt">{p.tagline}</AppText>}
      <AppText variant="title">{p.name}</AppText>
      <AppText variant="label" className="mt-2">{p.summary}</AppText>

      <View className="mt-4 flex-row flex-wrap gap-2">
        {isMine && <Tag label="Custom" tone="iris" />}
        <Tag label={LEVEL_LABELS[p.level]} tone={p.level === 'advanced' ? 'volt' : 'default'} />
        <Tag label={GOAL_LABELS[p.goal]} />
        {p.split && <Tag label={p.split} />}
      </View>

      <View className="mt-5 flex-row gap-3">
        {[
          { icon: <CalendarDays color={colors.iris} size={16} />, value: `${p.days_per_week}×`, label: 'per week' },
          { icon: <Layers color={colors.iris} size={16} />, value: `${p.weeks}`, label: 'weeks' },
          { icon: <Clock color={colors.iris} size={16} />, value: sessionRangeLabel(days), label: 'per session' },
        ].map((t) => (
          <View key={t.label} className="flex-1 items-center gap-1 rounded-xl bg-raised py-3">
            {t.icon}
            <AppText variant="heading" className="text-base">{t.value}</AppText>
            <AppText variant="caption">{t.label}</AppText>
          </View>
        ))}
      </View>

      {isActive ? (
        <UpNextCard className="mt-5" />
      ) : (
        <Button title={start.isPending ? 'Starting…' : 'Start this program'} onPress={onStart} disabled={start.isPending} className="mt-5" />
      )}
      {start.error && <View className="mt-3"><ErrorNote message="Couldn't start the program. Try again." /></View>}
      {!isMine && (
        <Button
          title="Customize"
          variant="secondary"
          icon={<Wand2 color={colors.fg} size={18} />}
          onPress={() => router.push(`/programs/edit/new?from=${p.id}`)}
          className="mt-3"
        />
      )}

      {p.description && <AppText variant="body" className="mt-6 text-muted">{p.description}</AppText>}

      {volume.length > 0 && (
        <>
          <AppText variant="title" className="mb-3 mt-8 text-xl">Muscles worked</AppText>
          <Card className="gap-4 p-4">
            <MuscleMap primary={map.primary} secondary={map.secondary} />
            <View className="gap-2">
              <AppText variant="caption">Direct sets per week</AppText>
              {volume.map((v) => (
                <View key={v.muscle} className="flex-row items-center gap-3">
                  <AppText variant="label" className="w-24 text-fg">{MUSCLE_NAMES[v.muscle] ?? v.muscle}</AppText>
                  <View className="h-2 flex-1 overflow-hidden rounded-full bg-raised">
                    <View className="h-2 rounded-full bg-volt" style={{ width: `${(v.sets / maxSets) * 100}%` }} />
                  </View>
                  <AppText variant="label" className="w-8 text-right">{v.sets}</AppText>
                </View>
              ))}
            </View>
          </Card>
        </>
      )}

      {equipment.length > 0 && (
        <>
          <AppText variant="title" className="mb-3 mt-8 text-xl">Equipment</AppText>
          <View className="flex-row flex-wrap gap-2">
            {equipment.map((e) => <Tag key={e} label={EQUIPMENT_LABELS[e]} />)}
          </View>
          {p.equipment_note && <AppText variant="caption" className="mt-2">{p.equipment_note}</AppText>}
        </>
      )}

      {(p.warmup || p.progression || p.recovery) && (
        <>
          <AppText variant="title" className="mb-3 mt-8 text-xl">How to run it</AppText>
          <Card className="gap-5 p-4">
            {p.warmup && <Guidance icon={<Flame color={colors.volt} size={18} />} title="Warm-up" body={p.warmup} />}
            {p.progression && <Guidance icon={<TrendingUp color={colors.volt} size={18} />} title="Progression" body={p.progression} />}
            {p.recovery && <Guidance icon={<BedDouble color={colors.volt} size={18} />} title="Recovery" body={p.recovery} />}
          </Card>
        </>
      )}

      <AppText variant="title" className="mb-3 mt-8 text-xl">Weekly schedule</AppText>
      <View className="gap-3">
        {p.program_days.map((d, i) => (
          <Card key={d.id} className="gap-3 p-4">
            <View>
              <View className="flex-row items-center justify-between">
                <AppText variant="caption" className="font-semibold uppercase tracking-wider text-iris">Session {i + 1}</AppText>
                <AppText variant="caption">~{estimateSessionMinutes(d.program_day_exercises)} min</AppText>
              </View>
              <AppText variant="heading">{d.name}</AppText>
              {d.focus && <AppText variant="label">{d.focus}</AppText>}
            </View>
            {d.program_day_exercises.map((e) => (
              <View key={e.id} className="gap-0.5">
                <View className="flex-row items-center justify-between gap-3">
                  <AppText variant="body" className="flex-1" numberOfLines={2}>{e.exercise.name}</AppText>
                  <AppText variant="label" className="text-fg">
                    {e.sets} × {targetLabel(e)}
                  </AppText>
                  {e.rest_seconds != null && (
                    <View className="w-14 flex-row items-center justify-end gap-1">
                      <Timer color={colors.faint} size={12} />
                      <AppText variant="caption">{e.rest_seconds}s</AppText>
                    </View>
                  )}
                </View>
                {e.notes && <AppText variant="caption" className="text-muted">{e.notes}</AppText>}
              </View>
            ))}
          </Card>
        ))}
      </View>

      {isActive && <Button title="Leave program" variant="danger" onPress={onLeave} className="mt-8" />}
    </Screen>
  );
}
