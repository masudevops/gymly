import { Tabs } from 'expo-router';
import { ChartLine, CalendarRange, Dumbbell, History, UserRound, type LucideIcon } from 'lucide-react-native';
import type { ColorValue } from 'react-native';

import { colors } from '@/theme/tokens';

function tabIcon(Icon: LucideIcon) {
  return function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return <Icon color={String(color)} size={24} strokeWidth={focused ? 2.4 : 1.8} />;
  };
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.volt,
        tabBarInactiveTintColor: colors.faint,
        tabBarStyle: { backgroundColor: colors.ink, borderTopColor: colors.line, height: 64, paddingTop: 6 },
        tabBarLabelStyle: { fontFamily: 'Inter_500Medium', fontSize: 11 },
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
