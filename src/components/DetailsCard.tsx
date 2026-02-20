import React from 'react';
import { X } from 'lucide-react';
import { NeuronDetails } from '../types';
import { formatNumber } from '../utils/math';

interface DetailsCardProps {
  details: NeuronDetails | null;
  onClose: () => void;
}

export const DetailsCard: React.FC<DetailsCardProps> = ({ details, onClose }) => {
  if (!details) return null;

  return (
    <div className="absolute top-4 left-4 z-20 w-64 bg-slate-900/95 backdrop-blur border border-slate-700 rounded-xl shadow-2xl p-4 text-slate-200">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-indigo-400 uppercase text-xs tracking-wider">
          {details.layer === 'hidden' && details.hiddenLayerIndex !== undefined
            ? `hidden ${details.hiddenLayerIndex + 1} Neuron #${details.index + 1}`
            : `${details.layer} Neuron #${details.index + 1}`}
        </h3>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3 text-sm">
        {details.layer === 'input' ? (
          <div className="flex justify-between items-center p-2 bg-slate-800/50 rounded">
            <span className="text-slate-400">Input Value</span>
            <span className="font-mono font-bold">{formatNumber(details.value)}</span>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Net Input (z)</span>
              <span className="font-mono">{formatNumber(details.netInput || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Bias (b)</span>
              <span className="font-mono font-bold text-slate-200">{formatNumber(details.bias || 0)}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-slate-800/50 rounded">
              <span className="text-slate-400">Activation (a)</span>
              <span className="font-mono font-bold text-blue-400">{formatNumber(details.value)}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-slate-800/50 rounded border border-slate-700/50">
              <span className="text-slate-400">Gradient (δ)</span>
              <span className="font-mono font-bold text-amber-400">{formatNumber(details.gradient || 0)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
