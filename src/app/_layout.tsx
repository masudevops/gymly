import '../global.css';

import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { SpaceGrotesk_500Medium, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { DarkTheme, Stack, ThemeProvider, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Text, View, Pressable } from 'react-native';

import { AuthProvider, useAuth } from '@/features/auth/auth-provider';
import { useProfile } from '@/features/profile/api';
import { usePendingSaveSync } from '@/features/workout/api';
import { colors } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

// Navigation chrome (headers, tab bar, screen background) uses the same palette as Tailwind classes.
const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.ink,
    card: colors.ink,
    border: colors.line,
    text: colors.fg,
    primary: colors.volt,
  },
};

function RootStack() {
  const { session, ready } = useAuth();
  const profile = useProfile();
  usePendingSaveSync();

  const signedIn = !!session;
  const onboarded = !!profile.data?.onboarded_at;
  // Keep the splash up until we know which group of screens to show.
  const loading = !ready || (signedIn && profile.isPending);

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync();
  }, [loading]);

  if (loading) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.ink } }}>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="sign-in" options={{ title: 'Sign in · Gymly' }} />
        <Stack.Screen name="sign-up" options={{ title: 'Create account · Gymly' }} />
        <Stack.Screen name="forgot-password" options={{ title: 'Reset password · Gymly' }} />
      </Stack.Protected>
      {/* Opened from the reset email, which creates a recovery session, so it must work in any auth state. */}
      <Stack.Screen name="reset-password" options={{ title: 'New password · Gymly' }} />
      <Stack.Protected guard={signedIn && !onboarded}>
        <Stack.Screen name="onboarding" options={{ title: 'Welcome · Gymly' }} />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && onboarded}>
        <Stack.Screen name="(tabs)" options={{ title: 'Gymly' }} />
        <Stack.Screen name="workout" options={{ title: 'Workout · Gymly', presentation: 'fullScreenModal', gestureEnabled: false }} />
        <Stack.Screen name="exercises/index" />
        <Stack.Screen name="exercises/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="templates/[id]" />
        <Stack.Screen name="history/[id]/index" />
        <Stack.Screen name="history/[id]/edit" />
        <Stack.Screen name="exercise/[id]" />
        <Stack.Screen name="body-weight" />
        <Stack.Screen name="programs/[id]" />
        <Stack.Screen name="settings/edit-profile" options={{ title: 'Edit profile · Gymly' }} />
        <Stack.Screen name="settings/account" options={{ title: 'Account · Gymly' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } }));
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });

  if (!fontsLoaded && !fontError) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider value={navTheme}>
          <StatusBar style="light" />
          <RootStack />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

/** Shown instead of a blank screen if rendering throws; Expo Router passes `retry` to re-render the route. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 }}>
      <Text style={{ color: colors.fg, fontSize: 22, fontWeight: '700' }}>Something went wrong</Text>
      <Text style={{ color: colors.muted, fontSize: 15, textAlign: 'center' }}>
        Your in-progress workout is saved on this device. Try again, and if it keeps happening, restart the app.
      </Text>
      {__DEV__ && <Text style={{ color: colors.danger, fontSize: 12, textAlign: 'center' }}>{error.message}</Text>}
      <Pressable onPress={retry} style={{ marginTop: 8, backgroundColor: colors.volt, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14 }}>
        <Text style={{ color: colors.ink, fontWeight: '700', fontSize: 16 }}>Try again</Text>
      </Pressable>
    </View>
  );
}
