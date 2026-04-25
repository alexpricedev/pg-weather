import type { JSX } from "react";
import {
  isDegreeInAnyArc,
  normalizeDegrees,
  type WindArc,
} from "../utils/wind";

interface CompassRoseProps {
  arcs: WindArc[];
  /** Wind direction the wind is blowing FROM (degrees). Needle tip points at that bearing. */
  windDirection?: number;
  size?: number;
  /** Hide bezel, ticks, cardinal letters, and bearing badge — useful at very small sizes. */
  compact?: boolean;
}

const CX = 50;
const CY = 50;

/* Full instrument layout (non-compact) */
const BEZEL_OUTER = 44;
const BEZEL_INNER = 38;
const ARC_RADIUS = 38;
const NEEDLE_TIP = 36;
const NEEDLE_TAIL = 12;
const CARDINAL_RADIUS = 51;

/* Compact layout (matches the original minimal rose) */
const COMPACT_RADIUS = 45;

/** Convert a compass degree (0 = N, clockwise) to an SVG point on the rose. */
const polarPoint = (deg: number, radius: number): { x: number; y: number } => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return {
    x: CX + radius * Math.cos(rad),
    y: CY + radius * Math.sin(rad),
  };
};

const arcPath = (from: number, to: number, radius: number): string => {
  const start = polarPoint(from, radius);
  const end = polarPoint(to, radius);
  const sweep = normalizeDegrees(to - from);
  const largeArc = sweep > 180 ? 1 : 0;
  return `M ${CX} ${CY} L ${start.x.toFixed(3)} ${start.y.toFixed(3)} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x.toFixed(3)} ${end.y.toFixed(3)} Z`;
};

const cardinalLabels = [
  { label: "N", deg: 0 },
  { label: "E", deg: 90 },
  { label: "S", deg: 180 },
  { label: "W", deg: 270 },
];

interface Tick {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  className: string;
}

/** Generate 36 tick marks (every 10°) with three weights: cardinal, major (30°), minor (10°). */
const generateTicks = (): Tick[] => {
  const ticks: Tick[] = [];
  for (let i = 0; i < 36; i++) {
    const deg = i * 10;
    const isCardinal = i % 9 === 0;
    const isMajor = i % 3 === 0;
    const innerR = isCardinal ? 39 : isMajor ? 40 : 42;
    const outer = polarPoint(deg, BEZEL_INNER);
    const inner = polarPoint(deg, innerR);
    ticks.push({
      x1: outer.x,
      y1: outer.y,
      x2: inner.x,
      y2: inner.y,
      className: isCardinal
        ? "compass-rose-tick is-cardinal"
        : isMajor
          ? "compass-rose-tick is-major"
          : "compass-rose-tick",
    });
  }
  return ticks;
};

const TICKS = generateTicks();

export const CompassRose = ({
  arcs,
  windDirection,
  size = 220,
  compact = false,
}: CompassRoseProps): JSX.Element => {
  const radius = compact ? COMPACT_RADIUS : ARC_RADIUS;
  const hasBearing =
    typeof windDirection === "number" && Number.isFinite(windDirection);
  const inArc =
    hasBearing &&
    arcs.length > 0 &&
    isDegreeInAnyArc(windDirection as number, arcs);
  const offArc = hasBearing && arcs.length > 0 && !inArc;
  const stateClass = offArc ? " is-off" : inArc ? " is-active" : "";

  return (
    <svg
      className={`compass-rose${stateClass}`}
      viewBox={compact ? "0 0 100 100" : "-5 -5 110 110"}
      width={size}
      height={size}
      role="img"
      aria-label="Compass rose showing accepted wind arcs"
    >
      <title>Accepted wind arcs</title>

      {!compact && (
        <>
          <circle
            cx={CX}
            cy={CY}
            r={BEZEL_OUTER}
            className="compass-rose-bezel"
          />
          <circle
            cx={CX}
            cy={CY}
            r={BEZEL_INNER}
            className="compass-rose-bezel-inner"
          />
          {TICKS.map((tick) => (
            <line
              key={`${tick.x1.toFixed(2)}-${tick.y1.toFixed(2)}`}
              x1={tick.x1}
              y1={tick.y1}
              x2={tick.x2}
              y2={tick.y2}
              className={tick.className}
            />
          ))}
        </>
      )}

      {compact && (
        <circle
          cx={CX}
          cy={CY}
          r={COMPACT_RADIUS}
          className="compass-rose-circle"
        />
      )}

      {arcs.map((arc, i) => (
        <path
          key={`${arc[0]}-${arc[1]}-${i}`}
          d={arcPath(arc[0], arc[1], radius)}
          className="compass-rose-arc"
        />
      ))}

      {!compact &&
        cardinalLabels.map(({ label, deg }) => {
          const point = polarPoint(deg, CARDINAL_RADIUS);
          return (
            <text
              key={label}
              x={point.x}
              y={point.y}
              className="compass-rose-label"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {label}
            </text>
          );
        })}

      {hasBearing && (
        <g
          transform={`rotate(${windDirection} ${CX} ${CY})`}
          className="compass-rose-needle"
        >
          {/* Tail — short, dark, opposite the wind direction */}
          <polygon
            points={`${CX},${CY} ${CX - 1.6},${CY + NEEDLE_TAIL} ${CX + 1.6},${CY + NEEDLE_TAIL}`}
            className="compass-rose-needle-tail"
          />
          {/* Tip — long, accent, points at the bearing */}
          <polygon
            points={`${CX},${CY} ${CX - 2},${CY - NEEDLE_TIP + 5} ${CX},${CY - NEEDLE_TIP} ${CX + 2},${CY - NEEDLE_TIP + 5}`}
            className="compass-rose-needle-tip"
          />
        </g>
      )}

      {/* Center hub — dark dot with white pinhole */}
      <circle
        cx={CX}
        cy={CY}
        r={compact ? 1.5 : 2.4}
        className="compass-rose-hub"
      />
      {!compact && (
        <circle cx={CX} cy={CY} r={0.9} className="compass-rose-hub-pin" />
      )}
    </svg>
  );
};
