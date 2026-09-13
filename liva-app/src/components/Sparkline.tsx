// Lightweight SVG area/line chart for dashboards.
import React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeContext';

export function Sparkline({
  data,
  width = 320,
  height = 96,
}: {
  data: number[];
  width?: number;
  height?: number;
}) {
  const { t } = useTheme();
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const points = data.map((v, i) => [
    (i / (data.length - 1)) * width,
    height - ((v - min) / span) * (height - 10) - 5,
  ]);
  const line = points
    .map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1))
    .join(' ');
  const area = `${line} L${width} ${height} L0 ${height} Z`;
  const last = points[points.length - 1];

  return (
    <Svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none">
      <Defs>
        <LinearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={t.accent1} stopOpacity="0.34" />
          <Stop offset="1" stopColor={t.accent1} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Path d={area} fill="url(#spark-fill)" />
      <Path d={line} fill="none" stroke={t.accent1} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={last[0]} cy={last[1]} r={3.5} fill={t.accent1} stroke={t.bg} strokeWidth={2} />
    </Svg>
  );
}
