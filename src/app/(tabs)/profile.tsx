import { LogOut, Minus, Plus, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { Chip, ErrorNote, Field, IconButton, Loading } from '@/components/form';
import { AppText, Button, Card, Screen } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';
import { useProfile, useUpdateProfile } from '@/features/profile/api';
import { useWorkoutStore } from '@/features/workout/store';
import { confirm } from '@/lib/confirm';
import { formatClock } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { colors } from '@/theme/tokens';

export default function ProfileScreen() {
  const { session } = useAuth();
  const profile = useProfile();
  const update = useUpdateProfile();
  const discard = useWorkoutStore((s) => s.discard);
  const [name, setName] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (profile.isPending) return <Screen><Loading /></Screen>;
  if (!profile.data) return <Screen><ErrorNote message="Couldn't load your profile." /></Screen>;
  const p = profile.data;
  const rest = p.rest_seconds;

  const signOut = async () => {
    if (await confirm('Sign out?', 'Any workout in progress stays on this device.', 'Sign out')) await supabase.auth.signOut();
  };

  const deleteAccount = async () => {
    const ok = await confirm(
      'Delete account?',
      'This permanently deletes your account, workouts, templates and custom exercises. This cannot be undone.',
      'Delete forever',
      true,
    );
    if (!ok) return;
    const { error } = await supabase.rpc('delete_account');
    if (error) return setDeleteError("Couldn't delete your account. Try again.");
    discard();
    useWorkoutStore.setState({ pendingSaves: [] });
    await supabase.auth.signOut();
  };

  return (
    <Screen>
      <AppText variant="display">Profile</AppText>
      <AppText variant="label" className="mt-1">{session?.user.email}</AppText>

      <Card className="mt-6 gap-4">
        <Field
          label="Display name"
          value={name ?? p.display_name ?? ''}
          onChangeText={setName}
          onBlur={() => name !== null && name.trim() !== (p.display_name ?? '') && update.mutate({ display_name: name.trim() || null })}
          placeholder="Your name"
          maxLength={60}
        />
        <View className="gap-2">
          <AppText variant="label">Units</AppText>
          <View className="flex-row gap-2">
            <Chip label="Kilograms" selected={p.unit === 'kg'} onPress={() => update.mutate({ unit: 'kg' })} />
            <Chip label="Pounds" selected={p.unit === 'lb'} onPress={() => update.mutate({ unit: 'lb' })} />
          </View>
        </View>
        <View className="flex-row items-center justify-between">
          <View>
            <AppText variant="body">Default rest timer</AppText>
            <AppText variant="caption">Starts after each working set</AppText>
          </View>
          <View className="flex-row items-center">
            <IconButton label="Shorter rest" onPress={() => update.mutate({ rest_seconds: Math.max(0, rest - 15) })}>
              <Minus color={colors.fg} size={18} />
            </IconButton>
            <AppText variant="heading" className="w-14 text-center">{rest === 0 ? 'Off' : formatClock(rest)}</AppText>
            <IconButton label="Longer rest" onPress={() => update.mutate({ rest_seconds: Math.min(600, rest + 15) })}>
              <Plus color={colors.fg} size={18} />
            </IconButton>
          </View>
        </View>
        {update.error && <ErrorNote message="Couldn't save that change." />}
      </Card>

      <View className="mt-6 gap-3">
        <Button title="Sign out" variant="secondary" icon={<LogOut color={colors.fg} size={18} />} onPress={signOut} />
        <Button title="Delete account" variant="danger" icon={<Trash2 color={colors.danger} size={18} />} onPress={deleteAccount} />
        {deleteError && <ErrorNote message={deleteError} />}
      </View>
    </Screen>
  );
}
