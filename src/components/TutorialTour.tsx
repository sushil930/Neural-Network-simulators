import React, { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, CircleHelp, X } from 'lucide-react';

const SPOTLIGHT_PAD = 10;
const TOOLTIP_W = 296;

export interface TourStep {
  target: string; // value of data-tour attribute
  title: string;
  description: string;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Props {
  steps: TourStep[];
  onFinish: (remember: boolean) => void;
}

function tooltipPosition(
  r: Rect,
  vpW: number,
  vpH: number,
): { left: number; top: number } {
  const gapX = 16;
  const gapY = 14;
  const estimatedH = 200;

  const spaceRight = vpW - (r.x + r.width + SPOTLIGHT_PAD);
  const spaceLeft = r.x - SPOTLIGHT_PAD;

  if (spaceRight >= TOOLTIP_W + gapX) {
    return {
      left: r.x + r.width + SPOTLIGHT_PAD + gapX,
      top: Math.max(8, Math.min(vpH - estimatedH - 8, r.y + r.height / 2 - estimatedH / 2)),
    };
  }
  if (spaceLeft >= TOOLTIP_W + gapX) {
    return {
      left: r.x - SPOTLIGHT_PAD - gapX - TOOLTIP_W,
      top: Math.max(8, Math.min(vpH - estimatedH - 8, r.y + r.height / 2 - estimatedH / 2)),
    };
  }
  // Fallback: below or above
  const cx = Math.max(8, Math.min(vpW - TOOLTIP_W - 8, r.x + r.width / 2 - TOOLTIP_W / 2));
  if (vpH - (r.y + r.height) > estimatedH + gapY + SPOTLIGHT_PAD) {
    return { left: cx, top: r.y + r.height + SPOTLIGHT_PAD + gapY };
  }
  return { left: cx, top: Math.max(8, r.y - SPOTLIGHT_PAD - gapY - estimatedH) };
}

export function TutorialTour({ steps, onFinish }: Props) {
  const [stepIdx, setStepIdx] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [vpSize, setVpSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  const current = steps[stepIdx];
  const total = steps.length;

  const measure = useCallback(() => {
    const el = document.querySelector<HTMLElement>(`[data-tour="${current.target}"]`);
    setVpSize({ w: window.innerWidth, h: window.innerHeight });
    if (el) {
      const r = el.getBoundingClientRect();
      // Scroll element into view if needed
      el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      const r2 = el.getBoundingClientRect();
      setRect({ x: r2.x, y: r2.y, width: r2.width, height: r2.height });
    } else {
      setRect(null);
    }
  }, [current.target]);

  useEffect(() => {
    // Small delay lets the browser settle (scroll, layout)
    const id = setTimeout(measure, 60);
    window.addEventListener('resize', measure);
    return () => {
      clearTimeout(id);
      window.removeEventListener('resize', measure);
    };
  }, [measure]);

  const hl = rect
    ? {
        x: rect.x - SPOTLIGHT_PAD,
        y: rect.y - SPOTLIGHT_PAD,
        w: rect.width + SPOTLIGHT_PAD * 2,
        h: rect.height + SPOTLIGHT_PAD * 2,
      }
    : null;

  const tipPos = rect ? tooltipPosition(rect, vpSize.w, vpSize.h) : { left: vpSize.w / 2 - TOOLTIP_W / 2, top: vpSize.h / 2 - 100 };

  const goNext = () => setStepIdx((s) => Math.min(s + 1, total - 1));
  const goPrev = () => setStepIdx((s) => Math.max(s - 1, 0));

  return (
    <div className="fixed inset-0 z-50 pointer-events-none font-sans">
      {/* Spotlight overlay */}
      <svg
        className="absolute inset-0 pointer-events-auto"
        width={vpSize.w}
        height={vpSize.h}
        style={{ display: 'block' }}
      >
        <defs>
          <mask id="tur-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {hl && (
              <rect x={hl.x} y={hl.y} width={hl.w} height={hl.h} rx="10" ry="10" fill="black" />
            )}
          </mask>
        </defs>

        {/* Dimmed backdrop */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(2,6,23,0.80)"
          mask="url(#tur-mask)"
        />

        {/* Pulsing spotlight ring */}
        {hl && (
          <rect
            x={hl.x}
            y={hl.y}
            width={hl.w}
            height={hl.h}
            rx="10"
            ry="10"
            fill="none"
            stroke="#818cf8"
            strokeWidth="2.5"
          >
            <animate
              attributeName="stroke-opacity"
              values="0.4;1;0.4"
              dur="2s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="stroke-width"
              values="2;3;2"
              dur="2s"
              repeatCount="indefinite"
            />
          </rect>
        )}
      </svg>

      {/* Tooltip card */}
      <div
        className="absolute pointer-events-auto flex flex-col gap-3 p-4 rounded-xl bg-slate-900 border border-indigo-500/50 shadow-2xl"
        style={{ left: tipPos.left, top: tipPos.top, width: TOOLTIP_W }}
      >
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <CircleHelp className="w-4 h-4 text-indigo-400 shrink-0 mt-px" />
            <span className="text-sm font-bold text-white leading-tight">{current.title}</span>
          </div>
          <button
            onClick={() => onFinish(false)}
            className="shrink-0 p-0.5 rounded text-slate-500 hover:text-slate-200 transition-colors"
            title="Close tour"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-300 leading-relaxed">{current.description}</p>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-1.5 py-0.5">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setStepIdx(i)}
              className={`rounded-full transition-all duration-300 ${
                i === stepIdx
                  ? 'w-4 h-2 bg-indigo-400'
                  : i < stepIdx
                  ? 'w-2 h-2 bg-indigo-700'
                  : 'w-2 h-2 bg-slate-700'
              }`}
              title={`Step ${i + 1}`}
            />
          ))}
        </div>

        {/* Prev / counter / Next */}
        <div className="flex items-center gap-2">
          <button
            onClick={goPrev}
            disabled={stepIdx === 0}
            className="flex items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Prev
          </button>

          <span className="flex-1 text-center text-[10px] text-slate-600 select-none">
            {stepIdx + 1} / {total}
          </span>

          {stepIdx < total - 1 ? (
            <button
              onClick={goNext}
              className="flex items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-xs bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => onFinish(true)}
              className="px-2.5 py-1.5 rounded-lg text-xs bg-emerald-600 hover:bg-emerald-500 text-white transition-colors font-semibold"
            >
              Done ✓
            </button>
          )}
        </div>

        {stepIdx < total - 1 && (
          <button
            onClick={() => onFinish(false)}
            className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors text-center leading-none"
          >
            Skip tour
          </button>
        )}
      </div>
    </div>
  );
}
