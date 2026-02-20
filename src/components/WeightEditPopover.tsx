import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { WeightDetails } from '../types';

interface WeightEditPopoverProps {
  details: WeightDetails | null;
  onClose: () => void;
  onSave: (val: number) => void;
}

export const WeightEditPopover: React.FC<WeightEditPopoverProps> = ({ details, onClose, onSave }) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (details) setValue(details.value);
  }, [details]);

  if (!details) return null;

  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 w-64 bg-slate-900 border border-slate-600 rounded-xl shadow-2xl p-4 text-slate-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
          Edit Weight
        </h3>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mb-4 text-center">
        <div className="text-xs text-slate-500 mb-1">
          {(details.sourceLabel ?? (details.sourceLayer === 'input' ? 'Input' : 'Hidden'))} #{details.sourceIndex + 1}
          {' → '}
          {(details.targetLabel ?? (details.targetLayer === 'hidden' ? 'Hidden' : 'Output'))} #{details.targetIndex + 1}
        </div>
        <div className="text-2xl font-mono font-bold text-white">
          {value.toFixed(3)}
        </div>
      </div>

      <input
        type="range"
        min="-2"
        max="2"
        step="0.01"
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 mb-4"
      />

      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 py-2 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            onSave(value);
            onClose();
          }}
          className="flex-1 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center justify-center gap-1"
        >
          <Check className="w-3 h-3" /> Save
        </button>
      </div>
    </div>
  );
};
