// Front/back body diagram highlighting the muscles an exercise works. Original artwork drawn from
// simple shapes on a 120×240 grid per figure; primary muscles in volt, secondary in a dimmer tint.
import { View } from 'react-native';
import Svg, { Circle, Ellipse, G, Rect } from 'react-native-svg';

import { AppText } from '@/components/ui';
import type { MuscleGroup } from '@/features/exercises/api';
import { colors } from '@/theme/tokens';

type Shape =
  | { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number }
  | { kind: 'rect'; x: number; y: number; w: number; h: number; r: number };

const e = (cx: number, cy: number, rx: number, ry: number): Shape => ({ kind: 'ellipse', cx, cy, rx, ry });
const r = (x: number, y: number, w: number, h: number, rr = 6): Shape => ({ kind: 'rect', x, y, w, h, r: rr });
const mirror = (s: Shape): Shape => (s.kind === 'ellipse' ? { ...s, cx: 120 - s.cx } : { ...s, x: 120 - s.x - s.w });
const pair = (s: Shape) => [s, mirror(s)];

// Body silhouette shared by both views.
const BODY: Shape[] = [
  r(54, 31, 12, 10, 3), // neck
  r(36, 40, 48, 70, 14), // torso
  ...pair(r(22, 44, 13, 44, 6)), // upper arms
  ...pair(r(19, 88, 13, 42, 6)), // forearms
  r(39, 106, 42, 22, 9), // pelvis
  ...pair(r(39, 124, 20, 60, 9)), // thighs
  ...pair(r(41, 184, 16, 48, 7)), // lower legs
];

const FRONT: Partial<Record<MuscleGroup, Shape[]>> = {
  shoulders: pair(e(31, 48, 9, 8)),
  chest: pair(r(40, 47, 19, 18, 6)),
  biceps: pair(e(28.5, 68, 5.5, 13)),
  forearms: pair(e(25.5, 106, 5.5, 15)),
  core: [r(48, 68, 24, 38, 6)],
  quads: pair(e(49, 153, 9, 25)),
  calves: pair(e(49, 205, 6, 18)),
};

const BACK: Partial<Record<MuscleGroup, Shape[]>> = {
  shoulders: pair(e(31, 48, 9, 8)),
  back: [r(39, 43, 42, 52, 12)],
  triceps: pair(e(28.5, 68, 5.5, 13)),
  forearms: pair(e(25.5, 106, 5.5, 15)),
  glutes: pair(e(50, 117, 10, 10)),
  hamstrings: pair(e(49, 154, 9, 23)),
  calves: pair(e(49, 203, 7, 18)),
};

function ShapeEl({ s, fill, opacity = 1 }: { s: Shape; fill: string; opacity?: number }) {
  return s.kind === 'ellipse' ? (
    <Ellipse cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} fill={fill} opacity={opacity} />
  ) : (
    <Rect x={s.x} y={s.y} width={s.w} height={s.h} rx={s.r} fill={fill} opacity={opacity} />
  );
}

function Figure({ regions, primary, secondary, label }: {
  regions: Partial<Record<MuscleGroup, Shape[]>>;
  primary: Set<MuscleGroup>;
  secondary: Set<MuscleGroup>;
  label: string;
}) {
  const all = primary.has('full_body');
  return (
    <View className="flex-1 items-center gap-1">
      <Svg width="100%" height={250} viewBox="0 0 120 240">
        <Circle cx={60} cy={18} r={13} fill={colors.line} />
        <G>{BODY.map((s, i) => <ShapeEl key={i} s={s} fill={colors.line} />)}</G>
        {(Object.keys(regions) as MuscleGroup[]).map((m) => {
          const isPrimary = all || primary.has(m);
          const isSecondary = !isPrimary && (secondary.has(m) || secondary.has('full_body'));
          if (!isPrimary && !isSecondary) return null;
          return (
            <G key={m}>
              {regions[m]!.map((s, i) => (
                <ShapeEl key={i} s={s} fill={colors.volt} opacity={isPrimary ? 1 : 0.38} />
              ))}
            </G>
          );
        })}
      </Svg>
      <AppText variant="caption">{label}</AppText>
    </View>
  );
}

/** Muscle map for an exercise (one primary) or a program (several). Cardio has no diagram (whole-body conditioning). */
export function MuscleMap({ primary, secondary }: { primary: MuscleGroup | MuscleGroup[]; secondary: MuscleGroup[] }) {
  const primaries = Array.isArray(primary) ? primary : [primary];
  if (primaries.length === 0 || (primaries.length === 1 && primaries[0] === 'cardio')) return null;
  const p = new Set<MuscleGroup>(primaries);
  const s = new Set<MuscleGroup>(secondary.filter((m) => !p.has(m)));
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={`Works ${[...primaries, ...secondary].join(', ').replace(/_/g, ' ')}`}>
      <View className="flex-row">
        <Figure regions={FRONT} primary={p} secondary={s} label="Front" />
        <Figure regions={BACK} primary={p} secondary={s} label="Back" />
      </View>
      <View className="mt-2 flex-row justify-center gap-5">
        <View className="flex-row items-center gap-1.5">
          <View className="h-2.5 w-2.5 rounded-full bg-volt" />
          <AppText variant="caption">Primary</AppText>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="h-2.5 w-2.5 rounded-full bg-volt/40" />
          <AppText variant="caption">Secondary</AppText>
        </View>
      </View>
    </View>
  );
}
