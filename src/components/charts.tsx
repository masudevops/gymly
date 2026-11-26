// Lightweight SVG charts (react-native-svg works on web, iOS and Android).
import { useId, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

import { AppText } from '@/components/ui';
import { colors } from '@/theme/tokens';

export type Point = { x: number; y: number; label?: string };

/** Smooth path through points using monotone-ish cubic segments (no overshoot on flat runs). */
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    const cx = (p0.x + p1.x) / 2;
    d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  return d;
}

/**
 * Line chart with a soft area fill. `data` x values are timestamps (or any increasing number).
 * Shows min/max reference values and highlights the latest point.
 */
export function LineChart({
  data,
  height = 180,
  color = colors.volt,
  format = (v) => String(Math.round(v)),
  accessibilityLabel,
}: {
  data: Point[];
  height?: number;
  color?: string;
  format?: (v: number) => string;
  accessibilityLabel: string;
}) {
  const [width, setWidth] = useState(0);
  // SVG ids are document-global on web; keep each chart's gradient unique.
  const gradientId = `fill-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  if (data.length === 0) {
    return (
      <View style={{ height }} className="items-center justify-center rounded-xl bg-raised">
        <AppText variant="label">No data yet</AppText>
      </View>
    );
  }

  const padX = 8;
  const padTop = 16;
  const padBottom = 20;
  const ys = data.map((d) => d.y);
  const xs = data.map((d) => d.x);
  let min = Math.min(...ys);
  let max = Math.max(...ys);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const span = max - min;
  min -= span * 0.1;
  max += span * 0.1;
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const toX = (x: number) => (x1 === x0 ? width / 2 : padX + ((x - x0) / (x1 - x0)) * (width - padX * 2));
  const toY = (y: number) => padTop + (1 - (y - min) / (max - min)) * (height - padTop - padBottom);
  const pts = data.map((d) => ({ x: toX(d.x), y: toY(d.y) }));
  const line = smoothPath(pts);
  const area = pts.length > 1 ? `${line} L ${pts[pts.length - 1].x} ${height - padBottom} L ${pts[0].x} ${height - padBottom} Z` : '';
  const last = pts[pts.length - 1];
  const hi = Math.max(...ys);
  const lo = Math.min(...ys);

  return (
    <View onLayout={onLayout} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      {width > 0 && (
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity={0.28} />
              <Stop offset="1" stopColor={color} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Line x1={0} x2={width} y1={toY(hi)} y2={toY(hi)} stroke={colors.line} strokeDasharray="4 6" />
          <Line x1={0} x2={width} y1={toY(lo)} y2={toY(lo)} stroke={colors.line} strokeDasharray="4 6" />
          {area !== '' && <Path d={area} fill={`url(#${gradientId})`} />}
          <Path d={line} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" />
          {pts.length <= 24 && pts.map((p, i) => <Circle key={i} cx={p.x} cy={p.y} r={2.5} fill={color} />)}
          <Circle cx={last.x} cy={last.y} r={6} fill={colors.ink} stroke={color} strokeWidth={3} />
        </Svg>
      )}
      <View className="absolute right-1 top-0">
        <AppText variant="caption">{format(hi)}</AppText>
      </View>
      <View className="absolute bottom-0 right-1">
        <AppText variant="caption">{format(lo)}</AppText>
      </View>
      {data[0].label && (
        <View className="absolute bottom-0 left-1">
          <AppText variant="caption">{data[0].label}</AppText>
        </View>
      )}
    </View>
  );
}

/** Horizontal bar with a label and value; used for per-muscle set counts. */
export function BarRow({ label, value, max, sublabel, color = colors.volt }: { label: string; value: number; max: number; sublabel?: string; color?: string }) {
  const pct = max > 0 ? Math.max(0.03, value / max) : 0;
  return (
    <View className="gap-1.5">
      <View className="flex-row items-baseline justify-between">
        <AppText variant="body" className="font-medium">{label}</AppText>
        <AppText variant="label">
          <AppText variant="label" className="font-semibold text-fg">{value}</AppText>
          {sublabel ? ` ${sublabel}` : ''}
        </AppText>
      </View>
      <View className="h-2 overflow-hidden rounded-full bg-raised">
        <View className="h-2 rounded-full" style={{ width: `${pct * 100}%`, backgroundColor: color }} />
      </View>
    </View>
  );
}
