import React from 'react';
import { motion } from 'motion/react';
import { formatNumber } from '../utils/math';

interface NeuronNodeProps {
  cx: number;
  cy: number;
  r: number;
  value: number; // Activation or Input value
  label: string;
  isInput?: boolean;
  isSelected?: boolean;
  onClick: () => void;
  showValues: boolean;
  phase: string;
  gradient?: number;
}

export const NeuronNode: React.FC<NeuronNodeProps> = ({
  cx,
  cy,
  r,
  value,
  label,
  isInput,
  isSelected,
  onClick,
  showValues,
  phase,
  gradient
}) => {
  // Determine fill color based on value (0 to 1)
  // 0 -> Dark Slate, 1 -> Bright Blue/Cyan
  const intensity = Math.max(0.1, Math.min(1, value));
  
  // During backward phase, maybe show gradient intensity?
  // For now let's stick to activation visualization as primary, 
  // but add a glow if there's a high gradient in backward phase.
  
  const isBackprop = phase === 'BACKWARD' || phase === 'UPDATE';
  const gradientIntensity = gradient ? Math.min(1, Math.abs(gradient) * 5) : 0; // Scale up for visibility

  return (
    <motion.g
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="cursor-pointer"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* Selection Halo */}
      {isSelected && (
        <circle
          cx={cx}
          cy={cy}
          r={r + 6}
          fill="none"
          stroke="#6366f1"
          strokeWidth="2"
          className="animate-pulse"
        />
      )}

      {/* Backprop Gradient Halo (Red/Purple) */}
      {isBackprop && gradient !== undefined && (
        <circle
          cx={cx}
          cy={cy}
          r={r + 4}
          fill="none"
          stroke={gradient > 0 ? '#ef4444' : '#a855f7'}
          strokeWidth={2 * gradientIntensity}
          opacity={gradientIntensity}
        />
      )}

      {/* Main Neuron Body */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={`rgba(56, 189, 248, ${intensity * 0.8 + 0.2})`} // Sky blue with varying opacity
        stroke="#e2e8f0"
        strokeWidth="2"
        className="transition-colors duration-300"
      />

      {/* Inner value indicator (fill level) */}
      <circle
        cx={cx}
        cy={cy}
        r={r * Math.sqrt(value)} // Area proportional to value
        fill="#0ea5e9"
        opacity="0.5"
      />

      {/* Label */}
      <text
        x={cx}
        y={cy + r + 16}
        textAnchor="middle"
        className="fill-slate-400 text-xs font-mono select-none pointer-events-none"
      >
        {label}
      </text>

      {/* Value Label (Optional) */}
      {showValues && (
        <text
          x={cx}
          y={cy}
          dy=".3em"
          textAnchor="middle"
          className="fill-white text-[10px] font-mono font-bold select-none pointer-events-none drop-shadow-md"
        >
          {formatNumber(value)}
        </text>
      )}
    </motion.g>
  );
};
