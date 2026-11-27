import { Image } from 'expo-image';
import { Dumbbell } from 'lucide-react-native';
import { ActivityIndicator, View } from 'react-native';

import { colors } from '@/theme/tokens';

import { useAvatarUrl } from './api';

/** Round profile photo; the volt dumbbell mark stands in until the user adds one (or if it fails to load). */
export function Avatar({ path, size = 88, busy }: { path: string | null | undefined; size?: number; busy?: boolean }) {
  const url = useAvatarUrl(path);
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="items-center justify-center overflow-hidden border-2 border-volt bg-volt/10"
    >
      {url.data ? (
        <Image source={{ uri: url.data }} style={{ width: size, height: size }} contentFit="cover" accessibilityLabel="Profile photo" />
      ) : (
        <Dumbbell color={colors.volt} size={size * 0.42} accessibilityLabel="Default avatar" />
      )}
      {(busy || (path && url.isPending)) && (
        <View className="absolute inset-0 items-center justify-center bg-ink/60">
          <ActivityIndicator color={colors.volt} />
        </View>
      )}
    </View>
  );
}
