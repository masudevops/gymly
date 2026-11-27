import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Camera, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { ErrorNote, Field, Header, Loading } from '@/components/form';
import { AppText, Button, Screen } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';
import { useProfile, useSetAvatar, useUpdateProfile } from '@/features/profile/api';
import { Avatar } from '@/features/profile/avatar';
import { colors } from '@/theme/tokens';

const MAX_BYTES = 5 * 1024 * 1024; // matches the avatars bucket limit
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function EditProfileScreen() {
  const { session } = useAuth();
  const profile = useProfile();
  const update = useUpdateProfile();
  const setAvatar = useSetAvatar();
  const [name, setName] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  if (profile.isPending) return <Screen><Loading /></Screen>;
  if (!profile.data) return <Screen><Header title="Edit profile" /><ErrorNote message="Couldn't load your profile." /></Screen>;
  const p = profile.data;
  const draft = name ?? p.display_name ?? '';
  const changed = draft.trim() !== (p.display_name ?? '');

  const choosePhoto = async () => {
    setPhotoError(null);
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    if (asset.mimeType && !TYPES.includes(asset.mimeType)) return setPhotoError('Use a JPEG, PNG or WebP image.');
    if (asset.fileSize && asset.fileSize > MAX_BYTES) return setPhotoError('That photo is over 5 MB. Pick a smaller one.');
    setAvatar.mutate(
      { image: { uri: asset.uri, mimeType: asset.mimeType }, previous: p.avatar_path },
      { onError: () => setPhotoError("Couldn't upload that photo. Try again.") },
    );
  };

  const removePhoto = () => {
    setPhotoError(null);
    setAvatar.mutate({ image: null, previous: p.avatar_path }, { onError: () => setPhotoError("Couldn't remove your photo. Try again.") });
  };

  const save = () =>
    update.mutate({ display_name: draft.trim() || null }, { onSuccess: () => (router.canGoBack() ? router.back() : router.replace('/profile')) });

  return (
    <Screen>
      <Header title="Edit profile" />

      <View className="mt-4 items-center gap-4">
        <Avatar path={p.avatar_path} size={112} busy={setAvatar.isPending} />
        <View className="w-full flex-row gap-3">
          <Button
            title={p.avatar_path ? 'Change photo' : 'Add photo'}
            variant="secondary"
            className="min-w-0 flex-1"
            icon={<Camera color={colors.fg} size={18} />}
            disabled={setAvatar.isPending}
            onPress={choosePhoto}
          />
          {p.avatar_path && (
            <Button
              title="Remove"
              variant="ghost"
              className="min-w-0"
              icon={<Trash2 color={colors.volt} size={18} />}
              disabled={setAvatar.isPending}
              onPress={removePhoto}
            />
          )}
        </View>
        {photoError && <View className="w-full"><ErrorNote message={photoError} /></View>}
      </View>

      <View className="mt-8 gap-5">
        <Field label="Display name" value={draft} onChangeText={setName} placeholder="Your name" maxLength={60} autoComplete="name" returnKeyType="done" onSubmitEditing={() => changed && save()} />
        <View className="gap-1.5">
          <AppText variant="label">Email</AppText>
          <AppText variant="body" className="text-muted">{session?.user.email}</AppText>
        </View>
        {update.error && <ErrorNote message="Couldn't save your name. Try again." />}
        <Button title={update.isPending ? 'Saving…' : 'Save'} disabled={!changed || update.isPending} onPress={save} />
      </View>
    </Screen>
  );
}
