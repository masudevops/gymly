import '../global.css';

import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { SpaceGrotesk_500Medium, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

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
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="sign-up" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && !onboarded}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && onboarded}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="workout" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
        <Stack.Screen name="exercises/index" />
        <Stack.Screen name="exercises/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="templates/[id]" />
        <Stack.Screen name="history/[id]" />
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
