import { router } from 'expo-router';
import { ChevronLeft, Minus, Plus } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';

import { AppText } from '@/components/ui';
import { cn } from '@/lib/cn';
import { colors } from '@/theme/tokens';

// React 19: `ref` is a regular prop and arrives inside `props`.
export function Field({ label, error, className, ...props }: TextInputProps & { label?: string; error?: string; className?: string }) {
  return (
    <View className="gap-1.5">
      {label && <AppText variant="label">{label}</AppText>}
      <TextInput
        placeholderTextColor={colors.faint}
        className={cn(
          'min-h-[52px] rounded-xl border bg-raised px-4 font-sans text-base text-fg',
          error ? 'border-danger' : 'border-line focus:border-volt',
          className,
        )}
        {...props}
      />
      {error && <AppText variant="caption" className="text-danger">{error}</AppText>}
    </View>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      aria-selected={selected}
      onPress={onPress}
      className={cn('h-10 justify-center rounded-full border px-4', selected ? 'border-volt bg-volt' : 'border-line bg-surface active:bg-raised')}
    >
      <Text className={cn('font-medium text-sm', selected ? 'text-ink' : 'text-fg')}>{label}</Text>
    </Pressable>
  );
}

export function IconButton({ onPress, label, children, className }: { onPress: () => void; label: string; children: ReactNode; className?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      className={cn('h-11 w-11 items-center justify-center rounded-full active:bg-raised', className)}
    >
      {children}
    </Pressable>
  );
}

/** Two-or-more option toggle (e.g. kg / lb). Announced as a radio group. */
export function Segmented<T extends string>({ options, value, onChange, label }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} className="flex-row rounded-full border border-line bg-raised p-1">
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            aria-checked={selected}
            onPress={() => !selected && onChange(o.value)}
            className={cn('h-10 justify-center rounded-full px-3.5', selected ? 'bg-volt' : 'active:bg-surface')}
          >
            <Text className={cn('font-semibold text-sm', selected ? 'text-ink' : 'text-muted')}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Minus / value / plus control for small numeric settings. */
export function Stepper({ value, onDecrement, onIncrement, decrementLabel, incrementLabel, canDecrement = true, canIncrement = true }: {
  value: string;
  onDecrement: () => void;
  onIncrement: () => void;
  decrementLabel: string;
  incrementLabel: string;
  canDecrement?: boolean;
  canIncrement?: boolean;
}) {
  return (
    <View className="flex-row items-center gap-1">
      <IconButton label={decrementLabel} onPress={() => canDecrement && onDecrement()} className={cn('bg-raised', !canDecrement && 'opacity-40')}>
        <Minus color={colors.fg} size={18} />
      </IconButton>
      <AppText variant="heading" className="min-w-[48px] text-center">{value}</AppText>
      <IconButton label={incrementLabel} onPress={() => canIncrement && onIncrement()} className={cn('bg-raised', !canIncrement && 'opacity-40')}>
        <Plus color={colors.fg} size={18} />
      </IconButton>
    </View>
  );
}

/** In-screen header for stack screens: back button, title, optional right action. */
export function Header({ title, right, onBack }: { title?: string; right?: ReactNode; onBack?: () => void }) {
  return (
    <View className="mb-2 flex-row items-center justify-between">
      <IconButton label="Back" onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))} className="-ml-2">
        <ChevronLeft color={colors.fg} size={26} />
      </IconButton>
      {title ? <AppText variant="heading" numberOfLines={1} className="mx-2 flex-1 text-center">{title}</AppText> : <View className="flex-1" />}
      <View className="min-w-[44px] items-end">{right}</View>
    </View>
  );
}

export function Loading() {
  return (
    <View className="flex-1 items-center justify-center py-16">
      <ActivityIndicator color={colors.volt} />
    </View>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <View className="rounded-xl border border-danger/40 bg-danger/10 p-4">
      <AppText variant="label" className="text-danger">{message}</AppText>
    </View>
  );
}

export function EmptyState({ icon, title, body, action }: { icon?: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <View className="items-center gap-3 rounded-2xl border border-dashed border-line px-6 py-10">
      {icon}
      <AppText variant="heading" className="text-center">{title}</AppText>
      {body && <AppText variant="label" className="text-center">{body}</AppText>}
      {action}
    </View>
  );
}
