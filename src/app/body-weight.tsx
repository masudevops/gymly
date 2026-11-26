import { Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { LineChart } from '@/components/charts';
import { ErrorNote, Field, Header, IconButton, Loading } from '@/components/form';
import { AppText, Button, Card, Screen } from '@/components/ui';
import { useUnit } from '@/features/profile/api';
import { useBodyMeasurements, useDeleteMeasurement, useLogBodyWeight } from '@/features/progress/api';
import { confirm } from '@/lib/confirm';
import { fromDay, shortDate, toDay } from '@/lib/dates';
import { displayToKg } from '@/lib/fitness';
import { formatWeight, parseNumber } from '@/lib/format';
import { colors } from '@/theme/tokens';

export default function BodyWeightScreen() {
  const unit = useUnit();
  const body = useBodyMeasurements();
  const log = useLogBodyWeight();
  const remove = useDeleteMeasurement();
  const [text, setText] = useState('');
  const value = parseNumber(text);
  const today = toDay(new Date());
  const valid = value !== null && displayToKg(value, unit) >= 20 && displayToKg(value, unit) <= 400;

  const save = () => {
    if (!valid || value === null) return;
    log.mutate({ day: today, weightKg: displayToKg(value, unit) }, { onSuccess: () => setText('') });
  };

  const entries = (body.data ?? []).filter((m) => m.weight_kg !== null);
  const loggedToday = entries.some((m) => m.measured_on === today);

  return (
    <Screen>
      <Header title="Body weight" />
      <Card className="gap-3">
        <AppText variant="heading">{loggedToday ? "Update today's weight" : "Today's weight"}</AppText>
        <View className="flex-row items-end gap-3">
          <View className="flex-1">
            <Field value={text} onChangeText={setText} placeholder={`e.g. ${unit === 'kg' ? '80.5' : '177'}`} keyboardType="decimal-pad" inputMode="decimal" onSubmitEditing={save} />
          </View>
          <AppText variant="heading" className="mb-3.5">{unit}</AppText>
        </View>
        {text !== '' && !valid && <AppText variant="caption" className="text-danger">Enter a weight between {unit === 'kg' ? '20 and 400 kg' : '44 and 880 lb'}.</AppText>}
        {log.error && <ErrorNote message="Couldn't save. Try again." />}
        <Button title={log.isPending ? 'Saving…' : 'Save'} onPress={save} disabled={!valid || log.isPending} />
      </Card>

      {body.isPending ? (
        <Loading />
      ) : (
        <>
          {entries.length > 1 && (
            <Card className="mt-4">
              <LineChart
                color={colors.iris}
                accessibilityLabel="Body weight trend"
                format={(v) => formatWeight(v, unit)}
                data={entries.map((m) => ({ x: fromDay(m.measured_on).getTime(), y: Number(m.weight_kg) }))}
              />
            </Card>
          )}
          <View className="mt-4 gap-2">
            {[...entries].reverse().map((m) => (
              <View key={m.id} className="flex-row items-center rounded-xl border border-line bg-surface py-1 pl-4 pr-1">
                <AppText variant="label" className="flex-1">{shortDate(m.measured_on)}</AppText>
                <AppText variant="body" className="font-semibold">{formatWeight(Number(m.weight_kg), unit)} {unit}</AppText>
                <IconButton
                  label={`Delete entry for ${shortDate(m.measured_on)}`}
                  onPress={async () => (await confirm('Delete entry?', `Remove the ${shortDate(m.measured_on)} weigh-in?`, 'Delete', true)) && remove.mutate(m.id)}
                >
                  <Trash2 color={colors.faint} size={16} />
                </IconButton>
              </View>
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}
