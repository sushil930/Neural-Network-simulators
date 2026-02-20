import React from 'react';
import { motion } from 'motion/react';

interface ConnectionLineProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  weight: number;
  phase: string;
  onClick: () => void;
  showValues: boolean;
  gradient?: number; // Gradient flowing through this connection
}

export const ConnectionLine: React.FC<ConnectionLineProps> = ({
  x1,
  y1,
  x2,
  y2,
  weight,
  phase,
  onClick,
  showValues,
  gradient
}) => {
  // Visual properties
  const strokeWidth = Math.max(1, Math.min(8, Math.abs(weight) * 3));
  const isPositive = weight >= 0;
  const color = isPositive ? '#3b82f6' : '#ef4444'; // Blue vs Red
  const opacity = Math.min(1, Math.abs(weight) + 0.2);

  // Animation for data flow
  const isForward = phase === 'FORWARD';
  const isBackward = phase === 'BACKWARD';
  const isUpdate = phase === 'UPDATE';

  return (
    <g onClick={(e) => { e.stopPropagation(); onClick(); }} className="cursor-pointer group">
      {/* Invisible wider stroke for easier clicking */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="transparent"
        strokeWidth="15"
      />

      {/* Visible Weight Line */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={strokeWidth}
        opacity={opacity}
        strokeLinecap="round"
        className="transition-all duration-300 group-hover:opacity-100"
      />

      {/* Flow Particles */}
      {isForward && (
        <circle r="3" fill="#fff">
          <animateMotion
            dur="1s"
            repeatCount="indefinite"
            path={`M${x1},${y1} L${x2},${y2}`}
          />
        </circle>
      )}

      {isBackward && (
        <circle r="3" fill="#fbbf24"> {/* Amber for gradients */}
          <animateMotion
            dur="1s"
            repeatCount="indefinite"
            path={`M${x2},${y2} L${x1},${y1}`} // Reverse direction
          />
        </circle>
      )}

      {isUpdate && (
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#10b981" // Emerald flash
          strokeWidth={strokeWidth + 2}
          opacity="0.5"
        >
          <animate
            attributeName="opacity"
            values="0;0.8;0"
            dur="0.5s"
            repeatCount="1"
          />
        </line>
      )}

      {/* Weight Value Label */}
      {showValues && (
        <g transform={`translate(${(x1 + x2) / 2}, ${(y1 + y2) / 2})`}>
          <rect
            x="-16"
            y="-8"
            width="32"
            height="16"
            rx="4"
            fill="rgba(15, 23, 42, 0.8)"
          />
          <text
            x="0"
            y="0"
            dy=".3em"
            textAnchor="middle"
            className="fill-slate-200 text-[9px] font-mono select-none pointer-events-none"
          >
            {weight.toFixed(2)}
          </text>
        </g>
      )}
    </g>
  );
};
