import Constants from 'expo-constants';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import {
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  ChevronRight,
  CircleQuestionMark,
  CloudCheck,
  CloudUpload,
  Download,
  Flame,
  Info,
  LogOut,
  Pencil,
  Ruler,
  Target,
  Timer,
  UserCog,
  type LucideIcon,
} from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Platform, Pressable, View } from 'react-native';

import { ErrorNote, Loading, Segmented, Stepper } from '@/components/form';
import { AppText, Button, Card, Screen } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';
import { fetchAllWorkouts, useProfile, useProfileSummary, useUpdateProfile } from '@/features/profile/api';
import { Avatar } from '@/features/profile/avatar';
import { downloadFile, workoutsToCsv } from '@/features/profile/export';
import { usePendingSaveSync } from '@/features/workout/api';
import { cn } from '@/lib/cn';
import { confirm } from '@/lib/confirm';
import { toDay } from '@/lib/dates';
import { formatClock, plural } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { colors } from '@/theme/tokens';

const FEEDBACK_URL = 'https://github.com/masudevops/gymly/issues';

export default function ProfileScreen() {
  const { session } = useAuth();
  const profile = useProfile();
  const update = useUpdateProfile();

  if (profile.isPending) return <Screen><Loading /></Screen>;
  if (!profile.data) {
    return (
      <Screen>
        <AppText variant="display">Profile</AppText>
        <View className="mt-6 gap-3">
          <ErrorNote message="Couldn't load your profile." />
          <Button title="Try again" variant="secondary" onPress={() => profile.refetch()} />
        </View>
      </Screen>
    );
  }
  const p = profile.data;
  const rest = p.rest_seconds;
  const goal = p.training_days ?? 3;

  const signOut = async () => {
    if (await confirm('Sign out?', 'Any workout in progress stays on this device.', 'Sign out')) await supabase.auth.signOut();
  };

  return (
    <Screen>
      <AppText variant="display">Profile</AppText>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Edit profile"
        onPress={() => router.push('/settings/edit-profile')}
        className="mt-5 flex-row items-center gap-4 rounded-2xl active:opacity-80"
      >
        <View>
          <Avatar path={p.avatar_path} />
          <View className="absolute -bottom-0.5 -right-0.5 h-8 w-8 items-center justify-center rounded-full border-2 border-ink bg-raised">
            <Pencil color={colors.fg} size={14} />
          </View>
        </View>
        <View className="min-w-0 flex-1">
          <AppText variant="title" numberOfLines={1} className={cn(!p.display_name && 'text-muted')}>{p.display_name || 'Add your name'}</AppText>
          <AppText variant="label" numberOfLines={1} className="mt-0.5">{session?.user.email}</AppText>
        </View>
      </Pressable>

      <Overview />

      <SectionTitle>Preferences</SectionTitle>
      <Card className="py-1">
        <Row icon={Ruler} title="Units">
          <Segmented
            label="Units"
            value={p.unit}
            onChange={(unit) => update.mutate({ unit })}
            options={[{ value: 'kg', label: 'Kilograms' }, { value: 'lb', label: 'Pounds' }]}
          />
        </Row>
        <Divider />
        <Row icon={Timer} title="Default rest timer" subtitle="Starts after each working set">
          <Stepper
            value={rest === 0 ? 'Off' : formatClock(rest)}
            decrementLabel="Shorter rest"
            incrementLabel="Longer rest"
            canDecrement={rest > 0}
            canIncrement={rest < 600}
            onDecrement={() => update.mutate({ rest_seconds: Math.max(0, rest - 15) })}
            onIncrement={() => update.mutate({ rest_seconds: Math.min(600, rest + 15) })}
          />
        </Row>
        <Divider />
        <Row icon={Target} title="Weekly goal" subtitle="Workouts per week">
          <Stepper
            value={String(goal)}
            decrementLabel="Fewer workouts per week"
            incrementLabel="More workouts per week"
            canDecrement={goal > 1}
            canIncrement={goal < 7}
            onDecrement={() => update.mutate({ training_days: Math.max(1, goal - 1) })}
            onIncrement={() => update.mutate({ training_days: Math.min(7, goal + 1) })}
          />
        </Row>
        {update.error && <View className="pb-4"><ErrorNote message="Couldn't save that change. Check your connection and try again." /></View>}
      </Card>

      <SectionTitle>Settings</SectionTitle>
      <Card className="py-1">
        <SyncRow />
        {Platform.OS === 'web' && (
          <>
            <Divider />
            <ExportRow unit={p.unit} />
          </>
        )}
        <Divider />
        <Row icon={CircleQuestionMark} title="Help & feedback" subtitle="Report a problem or suggest an idea" onPress={() => WebBrowser.openBrowserAsync(FEEDBACK_URL)} />
        <Divider />
        <Row icon={Info} title="About Gymly">
          <AppText variant="label">v{Constants.expoConfig?.version ?? '1.0.0'}</AppText>
        </Row>
        <Divider />
        <Row icon={UserCog} title="Account management" subtitle="Delete your account and data" onPress={() => router.push('/settings/account')} />
      </Card>

      <Button title="Sign out" variant="secondary" className="mt-6" icon={<LogOut color={colors.fg} size={18} />} onPress={signOut} />
    </Screen>
  );
}

/** Lifetime totals, computed in Postgres from the user's own workouts and enrollments. */
function Overview() {
  const summary = useProfileSummary();
  if (summary.isError) {
    return (
      <Pressable accessibilityRole="button" onPress={() => summary.refetch()} className="mt-5">
        <ErrorNote message="Couldn't load your stats. Tap to retry." />
      </Pressable>
    );
  }
  const s = summary.data;
  const stats: { icon: LucideIcon; value: number | undefined; label: string }[] = [
    { icon: Flame, value: s?.workouts, label: s?.workouts === 1 ? 'Workout' : 'Workouts' },
    { icon: CalendarDays, value: s?.weeks_active, label: s?.weeks_active === 1 ? 'Week active' : 'Weeks active' },
    { icon: ChartNoAxesColumnIncreasing, value: s?.programs, label: s?.programs === 1 ? 'Program' : 'Programs' },
  ];
  return (
    <Card className="mt-5 flex-row px-2 py-4">
      {stats.map(({ icon: Icon, value, label }, i) => (
        <View
          key={label}
          accessible
          accessibilityLabel={value === undefined ? `${label}, loading` : `${value} ${label}`}
          className={cn('flex-1 items-center gap-1 px-1', i > 0 && 'border-l border-line')}
        >
          <Icon color={colors.volt} size={20} />
          {value === undefined ? (
            <View className="h-9 justify-center"><ActivityIndicator color={colors.faint} size="small" /></View>
          ) : (
            <AppText variant="stat" className="text-2xl">{value}</AppText>
          )}
          <AppText variant="caption" numberOfLines={1} className="text-muted">{label}</AppText>
        </View>
      ))}
    </Card>
  );
}

/** Finished workouts waiting to reach the server (offline saves); tap to retry now. */
function SyncRow() {
  const { pendingCount, flush } = usePendingSaveSync();
  const [syncing, setSyncing] = useState(false);
  if (pendingCount === 0) {
    return <Row icon={CloudCheck} title="Data & sync" subtitle="All workouts are saved to your account" />;
  }
  return (
    <Row
      icon={CloudUpload}
      title="Data & sync"
      subtitle={`${plural(pendingCount, 'workout')} waiting to upload`}
      onPress={async () => {
        setSyncing(true);
        await flush();
        setSyncing(false);
      }}
    >
      {syncing ? <ActivityIndicator color={colors.volt} /> : <AppText variant="label" className="text-volt">Sync now</AppText>}
    </Row>
  );
}

function ExportRow({ unit }: { unit: 'kg' | 'lb' }) {
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const run = async () => {
    if (state === 'busy') return;
    setState('busy');
    try {
      const workouts = await fetchAllWorkouts();
      downloadFile(`gymly-workouts-${toDay(new Date())}.csv`, workoutsToCsv(workouts, unit));
      setState('done');
    } catch {
      setState('error');
    }
  };
  const subtitle = {
    idle: 'Download every set as a CSV spreadsheet',
    busy: 'Preparing your file…',
    done: 'Downloaded. Check your downloads folder',
    error: "Couldn't export. Check your connection and try again",
  }[state];
  return (
    <Row icon={Download} title="Export data" subtitle={subtitle} danger={state === 'error'} onPress={run}>
      {state === 'busy' ? <ActivityIndicator color={colors.volt} /> : undefined}
    </Row>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <AppText variant="heading" className="mb-3 mt-7">{children}</AppText>;
}

function Divider() {
  return <View className="ml-[34px] h-px bg-line" />;
}

/** Settings row: icon, title/subtitle, then a control (children) or a chevron when it navigates. */
function Row({ icon: Icon, title, subtitle, onPress, children, danger }: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  children?: ReactNode;
  danger?: boolean;
}) {
  const body = (
    <>
      <Icon color={colors.muted} size={22} />
      {/* min width lets a control wrap below the title on very narrow screens */}
      <View className="min-w-[72px] flex-1">
        <AppText variant="body" className="font-medium">{title}</AppText>
        {subtitle && <AppText variant="caption" className={cn('text-sm', danger ? 'text-danger' : 'text-muted')}>{subtitle}</AppText>}
      </View>
      {children ?? (onPress && <ChevronRight color={colors.faint} size={20} />)}
    </>
  );
  const box = 'min-h-[64px] flex-row flex-wrap items-center gap-x-3 gap-y-2 py-3';
  if (!onPress) return <View className={box}>{body}</View>;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} className={cn(box, '-mx-5 px-5 active:bg-raised')}>
      {body}
    </Pressable>
  );
}
