import { Tabs } from 'expo-router';
import { ChartLine, CalendarRange, Dumbbell, History, UserRound, type LucideIcon } from 'lucide-react-native';
import { useWindowDimensions, type ColorValue } from 'react-native';

import { colors } from '@/theme/tokens';

function tabIcon(Icon: LucideIcon) {
  return function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return <Icon color={String(color)} size={24} strokeWidth={focused ? 2.4 : 1.8} />;
  };
}

/** Wide screens (desktop web, tablets in landscape) get a left sidebar instead of a stretched bottom bar. */
const SIDEBAR_MIN_WIDTH = 1024;

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const sidebar = width >= SIDEBAR_MIN_WIDTH;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.volt,
        tabBarInactiveTintColor: colors.muted,
        ...(sidebar
          ? {
              tabBarPosition: 'left',
              tabBarVariant: 'material',
              tabBarLabelPosition: 'beside-icon',
              tabBarActiveBackgroundColor: colors.raised,
              tabBarStyle: { backgroundColor: colors.ink, borderRightColor: colors.line, width: 232, paddingTop: 24 },
              tabBarItemStyle: { borderRadius: 12, marginHorizontal: 12, marginVertical: 4, paddingHorizontal: 8 },
              tabBarLabelStyle: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
            }
          : {
              tabBarStyle: { backgroundColor: colors.ink, borderTopColor: colors.line, height: 64, paddingTop: 6 },
              tabBarLabelStyle: { fontFamily: 'Inter_500Medium', fontSize: 11 },
            }),
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Train', tabBarIcon: tabIcon(Dumbbell) }} />
      <Tabs.Screen name="history" options={{ title: 'History', tabBarIcon: tabIcon(History) }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress', tabBarIcon: tabIcon(ChartLine) }} />
      <Tabs.Screen name="programs" options={{ title: 'Programs', tabBarIcon: tabIcon(CalendarRange) }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: tabIcon(UserRound) }} />
    </Tabs>
  );
}
