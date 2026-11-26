import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { LineChart } from "@/components/charts";
import { Lightbulb } from "lucide-react-native";

import { Chip, ErrorNote, Header, Loading } from "@/components/form";
import { MuscleMap } from "@/components/muscle-map";
import { AppText, Card, Screen } from "@/components/ui";
import { MUSCLE_LABELS, useExercises } from "@/features/exercises/api";
import { useUnit } from "@/features/profile/api";
import { useExerciseHistory } from "@/features/progress/api";
import { kgToDisplay } from "@/lib/fitness";
import { formatClock, formatDate, formatWeight, plural } from "@/lib/format";
import { colors } from "@/theme/tokens";

type Metric = "e1rm" | "top" | "volume" | "reps" | "duration";

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const unit = useUnit();
  const exercise = useExercises().data?.find((e) => e.id === id);
  const history = useExerciseHistory(id);
  const kind = exercise?.kind ?? "weight_reps";
  const [metric, setMetric] = useState<Metric | null>(null);

  if (history.isPending)
    return (
      <Screen>
        <Header />
        <Loading />
      </Screen>
    );
  if (history.error)
    return (
      <Screen>
        <Header />
        <ErrorNote message="Couldn't load this exercise's history." />
      </Screen>
    );

  const rows = history.data;
  const options: { value: Metric; label: string }[] =
    kind === "weight_reps"
      ? [
          { value: "e1rm", label: "Est. 1RM" },
          { value: "top", label: "Heaviest set" },
          { value: "volume", label: "Volume" },
        ]
      : kind === "reps_only"
        ? [{ value: "reps", label: "Total reps" }]
        : [{ value: "duration", label: "Longest" }];
  const active =
    metric && options.some((o) => o.value === metric)
      ? metric
      : options[0].value;

  const valueOf = (r: (typeof rows)[number]): number | null => {
    switch (active) {
      case "e1rm":
        return r.best_e1rm === null
          ? null
          : kgToDisplay(Number(r.best_e1rm), unit);
      case "top":
        return r.top_weight_kg === null
          ? null
          : kgToDisplay(Number(r.top_weight_kg), unit);
      case "volume":
        return kgToDisplay(Number(r.volume_kg), unit);
      case "reps":
        return Number(r.total_reps);
      case "duration":
        return r.longest_seconds;
    }
  };
  const points = rows
    .map((r) => ({ x: new Date(r.started_at).getTime(), y: valueOf(r) }))
    .filter((p): p is { x: number; y: number } => p.y !== null && p.y > 0);
  const fmt = (v: number) =>
    active === "duration"
      ? formatClock(v)
      : active === "reps"
        ? String(Math.round(v))
        : `${Math.round(v * 10) / 10}`;

  const bestE1rm = Math.max(0, ...rows.map((r) => Number(r.best_e1rm ?? 0)));
  const heaviest = Math.max(
    0,
    ...rows.map((r) => Number(r.top_weight_kg ?? 0)),
  );
  const mostReps = Math.max(0, ...rows.map((r) => Number(r.total_reps)));
  const longest = Math.max(0, ...rows.map((r) => r.longest_seconds ?? 0));

  const tiles =
    kind === "weight_reps"
      ? [
          {
            label: "Best est. 1RM",
            value: bestE1rm ? `${formatWeight(bestE1rm, unit)} ${unit}` : "—",
          },
          {
            label: "Heaviest",
            value: heaviest ? `${formatWeight(heaviest, unit)} ${unit}` : "—",
          },
          { label: "Sessions", value: String(rows.length) },
        ]
      : kind === "reps_only"
        ? [
            { label: "Most reps (session)", value: String(mostReps) },
            { label: "Sessions", value: String(rows.length) },
          ]
        : [
            { label: "Longest", value: longest ? formatClock(longest) : "—" },
            { label: "Sessions", value: String(rows.length) },
          ];

  return (
    <Screen>
      <Header />
      <AppText variant="title">{exercise?.name ?? "Exercise"}</AppText>
      {exercise && (
        <AppText variant="label" className="mt-1">
          {[
            exercise.primary_muscle,
            ...exercise.secondary_muscles.filter(
              (m) => m !== exercise.primary_muscle,
            ),
          ]
            .map((m) => MUSCLE_LABELS[m])
            .join(" · ")}
        </AppText>
      )}

      {exercise && (
        <Card className="mt-5 gap-5">
          <MuscleMap
            primary={exercise.primary_muscle}
            secondary={exercise.secondary_muscles}
          />
          {exercise.instructions && (
            <View className="gap-3">
              <AppText variant="heading">How to do it</AppText>
              {exercise.instructions.split("\n").map((step, i) => (
                <View key={i} className="flex-row gap-3">
                  <View className="h-6 w-6 items-center justify-center rounded-full bg-raised">
                    <AppText variant="caption" className="font-bold text-fg">
                      {i + 1}
                    </AppText>
                  </View>
                  <AppText variant="body" className="flex-1">
                    {step}
                  </AppText>
                </View>
              ))}
            </View>
          )}
          {exercise.form_tip && (
            <View className="flex-row gap-3 rounded-xl bg-volt/10 p-3">
              <Lightbulb color={colors.volt} size={18} />
              <AppText variant="label" className="flex-1 text-fg">
                {exercise.form_tip}
              </AppText>
            </View>
          )}
        </Card>
      )}

      <AppText variant="title" className="mb-3 mt-8 text-xl">
        Your progress
      </AppText>
      {rows.length === 0 ? (
        <AppText variant="label">
          No sessions yet. Log this exercise and your records and trends will
          appear here.
        </AppText>
      ) : (
        <>
          <View className="flex-row gap-3">
            {tiles.map((t) => (
              <View
                key={t.label}
                className="flex-1 items-center gap-1 rounded-xl bg-raised py-3"
              >
                <AppText variant="stat" className="text-lg">
                  {t.value}
                </AppText>
                <AppText variant="caption">{t.label}</AppText>
              </View>
            ))}
          </View>

          <Card className="mt-4 gap-4">
            {options.length > 1 && (
              <View className="flex-row flex-wrap gap-2">
                {options.map((o) => (
                  <Chip
                    key={o.value}
                    label={o.label}
                    selected={active === o.value}
                    onPress={() => setMetric(o.value)}
                  />
                ))}
              </View>
            )}
            {points.length < 2 ? (
              <AppText variant="label">
                Log this exercise in at least two workouts to see a trend.
              </AppText>
            ) : (
              <LineChart
                data={points}
                format={fmt}
                accessibilityLabel={`${options.find((o) => o.value === active)?.label} over time`}
              />
            )}
          </Card>

          <AppText variant="heading" className="mb-3 mt-6">
            Sessions
          </AppText>
          <View className="gap-2">
            {[...rows].reverse().map((r) => (
              <View
                key={r.workout_id}
                className="flex-row items-center justify-between rounded-xl border border-line bg-surface px-4 py-3"
              >
                <AppText variant="label">{formatDate(r.started_at)}</AppText>
                <AppText variant="body" className="font-medium">
                  {kind === "duration"
                    ? formatClock(r.longest_seconds ?? 0)
                    : kind === "reps_only"
                      ? `${plural(Number(r.total_reps), "rep")} · ${plural(Number(r.working_sets), "set")}`
                      : `${formatWeight(r.top_weight_kg, unit)} ${unit} × ${r.top_reps} · ${plural(Number(r.working_sets), "set")}`}
                </AppText>
              </View>
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}
