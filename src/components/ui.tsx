// Core UI primitives. Styling via NativeWind classes backed by src/theme/tokens.js.
import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { Platform, Pressable, ScrollView, Text, View, type PressableProps, type TextProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { cn } from '@/lib/cn';

/** Full-height screen with safe areas and a centered, max-width column (keeps web readable). */
export function Screen({ children, scroll = true, className }: { children: ReactNode; scroll?: boolean; className?: string }) {
  const body = <View className={cn('w-full max-w-2xl self-center px-5 pb-10 pt-4', className)}>{children}</View>;
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-ink">
      {scroll ? <ScrollView contentContainerClassName="grow">{body}</ScrollView> : body}
    </SafeAreaView>
  );
}

type Variant = 'display' | 'title' | 'heading' | 'body' | 'label' | 'caption' | 'stat';

const textVariants: Record<Variant, string> = {
  display: 'font-display text-4xl text-fg tracking-tight',
  title: 'font-display text-2xl text-fg tracking-tight',
  heading: 'font-semibold text-lg text-fg',
  body: 'font-sans text-base text-fg leading-6',
  label: 'font-medium text-sm text-muted',
  caption: 'font-sans text-xs text-faint',
  stat: 'font-display text-3xl text-fg',
};

export function AppText({ variant = 'body', className, ...props }: TextProps & { variant?: Variant; className?: string }) {
  return <Text className={cn(textVariants[variant], className)} {...props} />;
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <View className={cn('rounded-2xl border border-line bg-surface p-5', className)}>{children}</View>;
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const buttonVariants: Record<ButtonVariant, { box: string; text: string }> = {
  primary: { box: 'bg-volt active:bg-volt-dim', text: 'text-ink' },
  secondary: { box: 'bg-raised border border-line active:opacity-80', text: 'text-fg' },
  ghost: { box: 'active:bg-raised', text: 'text-volt' },
  danger: { box: 'bg-danger/15 active:bg-danger/25', text: 'text-danger' },
};

export function Button({
  title,
  variant = 'primary',
  icon,
  className,
  onPress,
  disabled,
  ...props
}: PressableProps & { title: string; variant?: ButtonVariant; icon?: ReactNode; className?: string }) {
  const v = buttonVariants[variant];
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={(e) => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.(e);
      }}
      className={cn('min-h-[52px] flex-row items-center justify-center gap-2 rounded-xl px-5', v.box, disabled && 'opacity-40', className)}
      {...props}
    >
      {icon}
      <Text className={cn('font-semibold text-base', v.text)}>{title}</Text>
    </Pressable>
  );
}
