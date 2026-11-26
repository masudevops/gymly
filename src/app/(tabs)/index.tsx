import { router } from 'expo-router';
import { ChevronRight, CloudOff, Flame, LayoutList, Pencil, Play, Plus } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { EmptyState, ErrorNote, IconButton, Loading } from '@/components/form';
import { AppText, Button, Card, Screen } from '@/components/ui';
import { useProfile } from '@/features/profile/api';
import { toTemplateSeed, useTemplates, type Template } from '@/features/templates/api';
import { useNow } from '@/features/workout/components';
import { useWorkoutStore } from '@/features/workout/store';
import { confirm } from '@/lib/confirm';
import { formatClock } from '@/lib/format';
import { colors } from '@/theme/tokens';

function greeting(name: string | null | undefined) {
  const h = new Date().getHours();
  const part = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return name ? `${part}, ${name}` : part;
}

function ActiveBanner() {
  const active = useWorkoutStore((s) => s.active);
  const now = useNow();
  if (!active) return null;
  return (
    <Pressable onPress={() => router.push('/workout')} className="mt-6 flex-row items-center gap-3 rounded-2xl bg-volt p-4 active:bg-volt-dim">
      <View className="h-11 w-11 items-center justify-center rounded-full bg-ink/15">
        <Play color={colors.ink} size={20} fill={colors.ink} />
      </View>
      <View className="flex-1">
        <AppText variant="heading" className="text-ink">{active.name}</AppText>
        <AppText variant="label" className="text-ink/70">
          In progress · {formatClock((now - new Date(active.startedAt).getTime()) / 1000)}
        </AppText>
      </View>
      <ChevronRight color={colors.ink} size={22} />
    </Pressable>
  );
}

function TemplateCard({ template, onStart }: { template: Template; onStart: () => void }) {
  const names = template.template_exercises.map((te) => te.exercise.name);
  return (
    <Card className="gap-3">
      <View className="flex-row items-start gap-2">
        <View className="flex-1">
          <AppText variant="heading" numberOfLines={1}>{template.name}</AppText>
          <AppText variant="label" numberOfLines={2} className="mt-1">
            {names.length ? names.join(' · ') : 'No exercises yet'}
          </AppText>
        </View>
        <IconButton label={`Edit ${template.name}`} onPress={() => router.push(`/templates/${template.id}`)}>
          <Pencil color={colors.muted} size={18} />
        </IconButton>
      </View>
      <Button title="Start" variant="secondary" icon={<Play color={colors.fg} size={16} fill={colors.fg} />} onPress={onStart} disabled={names.length === 0} />
    </Card>
  );
}

export default function TrainScreen() {
  const profile = useProfile().data;
  const templates = useTemplates();
  const active = useWorkoutStore((s) => s.active);
  const start = useWorkoutStore((s) => s.start);
  const pendingCount = useWorkoutStore((s) => s.pendingSaves.length);

  const begin = async (template?: Template) => {
    if (active) {
      const replace = await confirm('Workout in progress', `Discard "${active.name}" and start a new one?`, 'Discard & start', true);
      if (!replace) return;
    }
    start(template ? toTemplateSeed(template) : undefined);
    router.push('/workout');
  };

  return (
    <Screen>
      <AppText variant="label">{greeting(profile?.display_name)}</AppText>
      <AppText variant="display" className="mt-1">Train</AppText>

      <ActiveBanner />

      {pendingCount > 0 && (
        <View className="mt-4 flex-row items-center gap-2 rounded-xl bg-warning/10 px-4 py-3">
          <CloudOff color={colors.warning} size={18} />
          <AppText variant="label" className="flex-1 text-warning">
            {pendingCount} workout{pendingCount > 1 ? 's' : ''} saved on this device, syncing when you&apos;re back online.
          </AppText>
        </View>
      )}

      {!active && (
        <View className="mt-6 gap-3">
          <Button title="Start empty workout" icon={<Play color={colors.ink} size={20} fill={colors.ink} />} onPress={() => begin()} />
        </View>
      )}

      <View className="mt-8 flex-row items-center justify-between">
        <AppText variant="title" className="text-xl">My templates</AppText>
        <Button title="New" variant="ghost" icon={<Plus color={colors.volt} size={18} />} onPress={() => router.push('/templates/new')} className="min-h-[40px] px-3" />
      </View>

      <View className="mt-3 gap-3">
        {templates.isPending ? (
          <Loading />
        ) : templates.error ? (
          <ErrorNote message="Couldn't load your templates." />
        ) : templates.data.length === 0 ? (
          <EmptyState
            icon={<LayoutList color={colors.muted} size={28} />}
            title="No templates yet"
            body="Save your go-to routines and start them in one tap."
            action={<Button title="Create a template" variant="secondary" onPress={() => router.push('/templates/new')} />}
          />
        ) : (
          templates.data.map((t) => <TemplateCard key={t.id} template={t} onStart={() => begin(t)} />)
        )}
      </View>

      <Pressable onPress={() => router.push('/exercises')} className="mt-8 flex-row items-center gap-3 rounded-2xl border border-line p-4 active:bg-surface">
        <Flame color={colors.iris} size={20} />
        <AppText variant="body" className="flex-1">Browse the exercise library</AppText>
        <ChevronRight color={colors.muted} size={20} />
      </Pressable>
    </Screen>
  );
}
