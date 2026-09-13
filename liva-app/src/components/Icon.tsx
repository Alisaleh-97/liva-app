// LIVA line-icon library — ported from theme.jsx ICON_PATHS.
// Renders via react-native-svg primitives (Svg + Path/Rect/Circle) instead of
// SvgXml, because the web shim (react-native-svg-web) doesn't parse XML strings
// the same way as native and crashes on render.

import React, { useMemo } from 'react';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

const ICON_PATHS: Record<string, string> = {
  home:    '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5"/><path d="M9.5 21v-6h5v6"/>',
  live:    '<rect x="2.5" y="6" width="13" height="12" rx="2.5"/><path d="M15.5 10.5 21 7.5v9l-5.5-3"/>',
  shop:    '<path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
  earn:    '<rect x="3" y="6.5" width="18" height="12" rx="2.5"/><path d="M3 10h18"/><circle cx="16.5" cy="14" r="1.4" fill="currentColor" stroke="none"/>',
  ai:      '<path d="M12 3.5 13.6 9 19 10.5 13.6 12 12 17.5 10.4 12 5 10.5 10.4 9 12 3.5Z"/><path d="M18.5 4v3M20 5.5h-3" stroke-width="1.6"/>',
  search:  '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  scan:    '<path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"/><path d="M4 12h16"/>',
  bell:    '<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 19a2 2 0 0 0 4 0"/>',
  heart:   '<path d="M12 20s-7-4.6-9.2-9C1.3 8 2.8 4.8 6 4.8c2 0 3.2 1.3 4 2.5.8-1.2 2-2.5 4-2.5 3.2 0 4.7 3.2 3.2 6.2C19 15.4 12 20 12 20Z"/>',
  share:   '<circle cx="6" cy="12" r="2.5"/><circle cx="17.5" cy="6" r="2.5"/><circle cx="17.5" cy="18" r="2.5"/><path d="m8.2 10.8 7-3.6M8.2 13.2l7 3.6"/>',
  cart:    '<circle cx="9" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/><path d="M3 4h2l2.2 11h10.3l1.8-8H6"/>',
  box:     '<path d="m4 7 8-4 8 4-8 4-8-4Z"/><path d="M4 7v10l8 4 8-4V7M12 11v10"/>',
  plus:    '<path d="M12 5v14M5 12h14"/>',
  close:   '<path d="m6 6 12 12M18 6 6 18"/>',
  chevR:   '<path d="m9 5 7 7-7 7"/>',
  chevL:   '<path d="m15 5-7 7 7 7"/>',
  star:    '<path d="m12 3 2.6 5.6 6 .7-4.4 4.1 1.2 6L12 16.8 6.6 19.5l1.2-6L3.4 9.3l6-.7L12 3Z" fill="currentColor" stroke="none"/>',
  filter:  '<path d="M4 6h16M7 12h10M10 18h4"/>',
  bolt:    '<path d="M13 3 5 13h5l-1 8 8-10h-5l1-8Z"/>',
  users:   '<circle cx="9" cy="9" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M16 6.2a3 3 0 0 1 0 5.6M16.5 19a5.5 5.5 0 0 0-2-4.3"/>',
  trend:   '<path d="M3 17 9 11l3.5 3.5L21 6"/><path d="M15 6h6v6"/>',
  send:    '<path d="M4 12 20 4l-6 16-3.5-6.5L4 12Z"/>',
  shield:  '<path d="M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z"/><path d="m9 11.5 2 2 4-4.5"/>',
  truck:   '<rect x="2.5" y="7" width="11" height="9" rx="1"/><path d="M13.5 10h4l3 3v3h-7"/><circle cx="6" cy="17.5" r="1.6"/><circle cx="17" cy="17.5" r="1.6"/>',
  headset: '<path d="M5 13v-1a7 7 0 0 1 14 0v1"/><rect x="3.5" y="13" width="3.5" height="6" rx="1.5"/><rect x="17" y="13" width="3.5" height="6" rx="1.5"/><path d="M19 19a4 4 0 0 1-4 3h-2"/>',
  play:    '<path d="M7 5v14l12-7L7 5Z" fill="currentColor" stroke="none"/>',
  eye:     '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.8"/>',
  check:   '<path d="m5 12.5 4.5 4.5L19 7"/>',
  flame:   '<path d="M12 3s5 4 5 9a5 5 0 0 1-10 0c0-1.5.6-2.7 1.3-3.6.4 1 1.2 1.6 2 1.6 0-2.5-1-4 1.7-7Z"/>',
  wallet:  '<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 9.5h13a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2H3"/><circle cx="16.5" cy="13" r="1.2" fill="currentColor" stroke="none"/>',
  mic:     '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
  ticket:  '<path d="M4 7.5h16v3a1.5 1.5 0 0 0 0 3v3H4v-3a1.5 1.5 0 0 0 0-3v-3Z"/>',
  verified:'<path d="m12 2.5 2.3 1.7 2.9-.2 1 2.7 2.4 1.6-.9 2.7.9 2.7-2.4 1.6-1 2.7-2.9-.2L12 21.5l-2.3-1.7-2.9.2-1-2.7-2.4-1.6.9-2.7-.9-2.7 2.4-1.6 1-2.7 2.9.2L12 2.5Z" fill="currentColor" stroke="none"/>',
  link:    '<path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>',
  globe:   '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 2.5 14.4 0 17M12 3.5c-2.5 2.6-2.5 14.4 0 17"/>',
  chevD:   '<path d="m5 9 7 7 7-7"/>',
  comment: '<path d="M4 5.5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 3.5V16.5H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z"/>',
  arrowUR: '<path d="M7 17 17 7M8 7h9v9"/>',
  clock:   '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  tag:     '<path d="M3 11.5 11.5 3H20a1 1 0 0 1 1 1v8.5L12.5 21a1 1 0 0 1-1.4 0L3 12.9a1 1 0 0 1 0-1.4Z"/><circle cx="16.5" cy="7.5" r="1.4" fill="currentColor" stroke="none"/>',
  gift:    '<rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M3 9h18M12 9v11"/>',
  hammer:  '<path d="M14 3.5 20.5 10l-3 3-6.5-6.5 3-3Z"/><path d="m11 6.5-7 7 2.5 2.5 7-7"/><path d="M3.5 20.5h10"/>',
  shirt:   '<path d="m8 4-5 3 2.5 4L8 9.5V21h8V9.5l2.5 1.5L21 7l-5-3c-.8 1.2-2.1 2-4 2S8.8 5.2 8 4Z"/>',
  dress:   '<path d="M9 3h6l-1 5 4 11H6l4-11-1-5Z"/><path d="M9.5 7.5h5"/>',
  shoe:    '<path d="M4 14c3 0 5-1 6-5 2 3 4 4 8 5 1.5.4 2.5 1.4 2.5 3H4v-3Z"/><path d="M8 13.5h8"/>',
  bag:     '<path d="M5 8h14l-1 13H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  gem:     '<path d="m7 4-4 6 9 11 9-11-4-6H7Z"/><path d="m3 10 9 2 9-2M8 4l4 8 4-8"/>',
  phone:   '<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M10 18.5h4"/>',
  sparkle: '<path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z"/><path d="M19 3v4M21 5h-4"/>',
  medical: '<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3Z"/>',
  sofa:    '<path d="M5 12V8a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v4"/><path d="M4 11a2 2 0 0 0-2 2v5h20v-5a2 2 0 0 0-2-2M5 18v3M19 18v3"/>',
  ball:    '<circle cx="12" cy="12" r="9"/><path d="m8 5 4 3 4-3M3.5 10l4 3-1 5M20.5 10l-4 3 1 5M8 13h8"/>',
  utensils:'<path d="M6 3v7M3.5 3v5c0 1.5 1 2 2.5 2s2.5-.5 2.5-2V3M6 10v11M15 3v18M15 3c4 2 5 6 0 9"/>',
  blocks:  '<rect x="3" y="12" width="8" height="8" rx="1"/><rect x="13" y="12" width="8" height="8" rx="1"/><rect x="8" y="3" width="8" height="7" rx="1"/>',
  book:    '<path d="M4 4.5h6a2 2 0 0 1 2 2V21a3 3 0 0 0-3-3H4V4.5ZM20 4.5h-6a2 2 0 0 0-2 2V21a3 3 0 0 1 3-3h5V4.5Z"/>',
  paw:     '<circle cx="12" cy="15" r="4"/><circle cx="5.5" cy="10" r="2"/><circle cx="9" cy="5.5" r="2"/><circle cx="15" cy="5.5" r="2"/><circle cx="18.5" cy="10" r="2"/>',
  baby:    '<circle cx="12" cy="13" r="7"/><path d="M10 5c0-2 1.5-3 3-3M9 13h.1M15 13h.1M9.5 16c1.5 1.2 3.5 1.2 5 0"/>',
  leaf:    '<path d="M20 4C10 4 5 9 5 16c0 2 1 4 3 5 7-1 12-6 12-17Z"/><path d="M5 20c3-5 7-8 12-11"/>',
  group:   '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20a6 6 0 0 1 12 0M14 14.5a5 5 0 0 1 7 4.5"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/>',
  crown:   '<path d="m4 7 4 4 4-7 4 7 4-4-2 11H6L4 7Z"/><path d="M6 21h12"/>',
  timer:   '<circle cx="12" cy="13" r="8"/><path d="M9 2h6M12 5v3M12 13l3-2"/>',
};

type Element =
  | { tag: 'path'; d: string; fill?: string; stroke?: string; strokeWidth?: number }
  | { tag: 'rect'; x: number; y: number; width: number; height: number; rx?: number; fill?: string; stroke?: string }
  | { tag: 'circle'; cx: number; cy: number; r: number; fill?: string; stroke?: string };

// Parse a single icon's raw XML string into structured elements.
// Recognizes <path>, <rect>, <circle> and the attrs we use: d, x/y/width/height/rx,
// cx/cy/r, fill, stroke, stroke-width.
function parseIcon(raw: string): Element[] {
  const elements: Element[] = [];
  const tagRegex = /<(path|rect|circle)\b([^>]*?)\s*\/?>/g;
  let m: RegExpExecArray | null;
  while ((m = tagRegex.exec(raw)) !== null) {
    const tag = m[1] as Element['tag'];
    const attrStr = m[2];
    const attrs: Record<string, string> = {};
    const attrRegex = /([a-zA-Z][a-zA-Z0-9-]*)="([^"]*)"/g;
    let a: RegExpExecArray | null;
    while ((a = attrRegex.exec(attrStr)) !== null) {
      attrs[a[1]] = a[2];
    }
    const num = (k: string, def?: number) => (attrs[k] != null ? parseFloat(attrs[k]) : def);
    if (tag === 'path') {
      elements.push({
        tag,
        d: attrs.d || '',
        fill: attrs.fill,
        stroke: attrs.stroke,
        strokeWidth: num('stroke-width'),
      });
    } else if (tag === 'rect') {
      elements.push({
        tag,
        x: num('x', 0)!,
        y: num('y', 0)!,
        width: num('width', 0)!,
        height: num('height', 0)!,
        rx: num('rx'),
        fill: attrs.fill,
        stroke: attrs.stroke,
      });
    } else {
      elements.push({
        tag,
        cx: num('cx', 0)!,
        cy: num('cy', 0)!,
        r: num('r', 0)!,
        fill: attrs.fill,
        stroke: attrs.stroke,
      });
    }
  }
  return elements;
}

// Pre-parse all icons at module load.
const PARSED: Record<string, Element[]> = Object.fromEntries(
  Object.entries(ICON_PATHS).map(([k, v]) => [k, parseIcon(v)])
);

export interface IconProps {
  name: string;
  size?: number;
  color?: string;
  stroke?: number;
  fill?: string;
}

export function Icon({ name, size = 22, color = '#fff', stroke = 1.8, fill = 'none' }: IconProps) {
  const els = useMemo(() => PARSED[name], [name]);
  if (!els) return null;
  // `currentColor` in element fills/strokes is resolved to the prop color.
  const resolve = (v?: string) => (v === 'currentColor' ? color : v);
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {els.map((e, i) => {
        if (e.tag === 'path') {
          return (
            <Path
              key={i}
              d={e.d}
              fill={resolve(e.fill)}
              stroke={resolve(e.stroke)}
              strokeWidth={e.strokeWidth}
            />
          );
        }
        if (e.tag === 'rect') {
          return (
            <Rect
              key={i}
              x={e.x}
              y={e.y}
              width={e.width}
              height={e.height}
              rx={e.rx}
              fill={resolve(e.fill)}
              stroke={resolve(e.stroke)}
            />
          );
        }
        return (
          <Circle
            key={i}
            cx={e.cx}
            cy={e.cy}
            r={e.r}
            fill={resolve(e.fill)}
            stroke={resolve(e.stroke)}
          />
        );
      })}
    </Svg>
  );
}
