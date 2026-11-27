import Svg, { G, Rect } from 'react-native-svg';

import { colors } from '@/theme/tokens';

/** The Gymly mark, drawn from assets/brand/gymly-mark.svg (keep the two in sync). */
export function BrandMark({ size = 64 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 1024 1024" accessibilityLabel="Gymly logo" role="img">
      <Rect width={1024} height={1024} rx={232} fill={colors.volt} />
      <G transform="rotate(-35 512 512)" fill={colors.ink}>
        <Rect x={300} y={476} width={424} height={72} rx={20} />
        <Rect x={226} y={350} width={108} height={324} rx={44} />
        <Rect x={690} y={350} width={108} height={324} rx={44} />
        <Rect x={150} y={410} width={88} height={204} rx={36} />
        <Rect x={786} y={410} width={88} height={204} rx={36} />
      </G>
    </Svg>
  );
}
