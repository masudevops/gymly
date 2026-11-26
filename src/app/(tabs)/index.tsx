import { Flame, Play, Plus } from 'lucide-react-native';
import { View } from 'react-native';

import { AppText, Button, Card, Screen } from '@/components/ui';
import { colors } from '@/theme/tokens';

const week = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function TrainScreen() {
  return (
    <Screen>
      <AppText variant="label">Let&apos;s get after it</AppText>
      <AppText variant="display" className="mt-1">
        Train
      </AppText>

      {/* Weekly consistency strip (real data arrives in Phase 2) */}
      <Card className="mt-6">
        <View className="flex-row items-center justify-between">
          <AppText variant="heading">This week</AppText>
          <View className="flex-row items-center gap-1">
            <Flame color={colors.volt} size={18} />
            <AppText variant="label" className="text-fg">
              0 day streak
            </AppText>
          </View>
        </View>
        <View className="mt-4 flex-row justify-between">
          {week.map((d, i) => (
            <View key={i} className="items-center gap-2">
              <View className="h-9 w-9 items-center justify-center rounded-full border border-line bg-raised" />
              <AppText variant="caption">{d}</AppText>
            </View>
          ))}
        </View>
      </Card>

      <View className="mt-6 gap-3">
        <Button title="Start empty workout" icon={<Play color={colors.ink} size={20} fill={colors.ink} />} />
        <Button title="New template" variant="secondary" icon={<Plus color={colors.fg} size={20} />} />
      </View>

      <AppText variant="heading" className="mt-8">
        My templates
      </AppText>
      <Card className="mt-3 items-center py-8">
        <AppText variant="label" className="text-center">
          No templates yet. Save a workout as a template to start it in one tap.
        </AppText>
      </Card>
    </Screen>
  );
}
