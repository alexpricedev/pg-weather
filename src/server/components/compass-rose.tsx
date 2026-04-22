import type { JSX } from "react";
import { normalizeDegrees, type WindArc } from "../utils/wind";

interface CompassRoseProps {
  arcs: WindArc[];
  /** Wind direction the wind is blowing FROM (degrees). Arrow tail sits at that edge, tip at centre. */
  windDirection?: number;
  size?: number;
  /** Hide cardinal labels — useful at very small sizes. */
  compact?: boolean;
}

const POLAR_RADIUS = 45;
const CX = 50;
const CY = 50;

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

export const CompassRose = ({
  arcs,
  windDirection,
  size = 220,
  compact = false,
}: CompassRoseProps): JSX.Element => {
  return (
    <svg
      className="compass-rose"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label="Compass rose showing accepted wind arcs"
    >
      <title>Accepted wind arcs</title>
      <circle
        cx={CX}
        cy={CY}
        r={POLAR_RADIUS}
        className="compass-rose-circle"
      />
      {arcs.map((arc, i) => (
        <path
          key={`${arc[0]}-${arc[1]}-${i}`}
          d={arcPath(arc[0], arc[1], POLAR_RADIUS)}
          className="compass-rose-arc"
        />
      ))}
      {!compact &&
        cardinalLabels.map(({ label, deg }) => {
          const point = polarPoint(deg, POLAR_RADIUS + 7);
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
      {typeof windDirection === "number" && Number.isFinite(windDirection) && (
        <g
          transform={`rotate(${windDirection} ${CX} ${CY})`}
          className="compass-rose-arrow"
        >
          <line x1={CX} y1={CY - POLAR_RADIUS + 4} x2={CX} y2={CY - 6} />
          <polygon
            points={`${CX - 3},${CY - 6} ${CX + 3},${CY - 6} ${CX},${CY}`}
          />
        </g>
      )}
      <circle cx={CX} cy={CY} r={1.5} className="compass-rose-centre" />
    </svg>
  );
};
