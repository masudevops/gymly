import { Check } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { ErrorNote, Field } from '@/components/form';
import { AppText, Button, Screen } from '@/components/ui';
import { useUpdateProfile } from '@/features/profile/api';
import type { Enums } from '@/lib/database.types';
import { cn } from '@/lib/cn';
import { colors } from '@/theme/tokens';

type Goal = Enums<'training_goal'>;
type Experience = Enums<'experience_level'>;
type Unit = Enums<'unit_system'>;

const GOALS: { value: Goal; title: string; body: string }[] = [
  { value: 'strength', title: 'Get stronger', body: 'Lift heavier on the big compound movements.' },
  { value: 'muscle', title: 'Build muscle', body: 'Grow size with focused volume.' },
  { value: 'general_fitness', title: 'Stay fit', body: 'Train consistently and feel good.' },
  { value: 'endurance', title: 'Build endurance', body: 'Go longer, recover faster.' },
];

const EXPERIENCE: { value: Experience; title: string; body: string }[] = [
  { value: 'beginner', title: 'Beginner', body: 'Less than a year of regular training.' },
  { value: 'intermediate', title: 'Intermediate', body: '1–3 years, comfortable with the main lifts.' },
  { value: 'advanced', title: 'Advanced', body: '3+ years of structured training.' },
];

function Option({ title, body, selected, onPress }: { title: string; body?: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={cn('flex-row items-center gap-4 rounded-2xl border p-4', selected ? 'border-volt bg-volt/10' : 'border-line bg-surface active:bg-raised')}
    >
      <View className="flex-1 gap-1">
        <AppText variant="heading">{title}</AppText>
        {body && <AppText variant="label">{body}</AppText>}
      </View>
      <View className={cn('h-6 w-6 items-center justify-center rounded-full border-2', selected ? 'border-volt bg-volt' : 'border-line')}>
        {selected && <Check color={colors.ink} size={14} strokeWidth={3} />}
      </View>
    </Pressable>
  );
}

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState<Goal | null>(null);
  const [experience, setExperience] = useState<Experience | null>(null);
  const [days, setDays] = useState(3);
  const [unit, setUnit] = useState<Unit>('kg');
  const update = useUpdateProfile();

  const steps = [
    {
      title: "What's your main goal?",
      valid: !!goal,
      body: (
        <View className="gap-3">
          <Field label="Your name (optional)" value={name} onChangeText={setName} placeholder="What should we call you?" maxLength={60} />
          <View className="h-2" />
          {GOALS.map((g) => (
            <Option key={g.value} title={g.title} body={g.body} selected={goal === g.value} onPress={() => setGoal(g.value)} />
          ))}
        </View>
      ),
    },
    {
      title: 'How experienced are you?',
      valid: !!experience,
      body: (
        <View className="gap-3">
          {EXPERIENCE.map((e) => (
            <Option key={e.value} title={e.title} body={e.body} selected={experience === e.value} onPress={() => setExperience(e.value)} />
          ))}
        </View>
      ),
    },
    {
      title: 'How many days a week will you train?',
      valid: true,
      body: (
        <View className="flex-row flex-wrap gap-3">
          {[1, 2, 3, 4, 5, 6, 7].map((d) => (
            <Pressable
              key={d}
              accessibilityRole="radio"
              accessibilityState={{ selected: days === d }}
              onPress={() => setDays(d)}
              className={cn('h-16 w-16 items-center justify-center rounded-2xl border', days === d ? 'border-volt bg-volt' : 'border-line bg-surface')}
            >
              <AppText variant="title" className={days === d ? 'text-ink' : 'text-fg'}>{d}</AppText>
            </Pressable>
          ))}
        </View>
      ),
    },
    {
      title: 'Which units do you lift in?',
      valid: true,
      body: (
        <View className="gap-3">
          <Option title="Kilograms (kg)" selected={unit === 'kg'} onPress={() => setUnit('kg')} />
          <Option title="Pounds (lb)" selected={unit === 'lb'} onPress={() => setUnit('lb')} />
          <AppText variant="caption">You can change this any time in your profile.</AppText>
        </View>
      ),
    },
  ];

  const current = steps[step];
  const last = step === steps.length - 1;

  const next = () => {
    if (!last) return setStep(step + 1);
    update.mutate({
      display_name: name.trim() || null,
      goal,
      experience,
      training_days: days,
      unit,
      onboarded_at: new Date().toISOString(),
    });
  };

  return (
    <Screen className="flex-1">
      <View className="mb-8 flex-row gap-2">
        {steps.map((_, i) => (
          <View key={i} className={cn('h-1.5 flex-1 rounded-full', i <= step ? 'bg-volt' : 'bg-raised')} />
        ))}
      </View>
      <AppText variant="label">Step {step + 1} of {steps.length}</AppText>
      <AppText variant="title" className="mb-6 mt-1">{current.title}</AppText>
      {current.body}
      <View className="mt-8 gap-3">
        {update.error && <ErrorNote message="Couldn't save your profile. Check your connection and try again." />}
        <Button title={last ? (update.isPending ? 'Saving…' : "Let's go") : 'Continue'} onPress={next} disabled={!current.valid || update.isPending} />
        {step > 0 && <Button title="Back" variant="ghost" onPress={() => setStep(step - 1)} />}
      </View>
    </Screen>
  );
}
