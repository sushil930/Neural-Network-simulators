import React, { useMemo, useState } from 'react';
import { NeuralNetworkState, SimulationPhase, TrainingLogEntry } from '../types';
import { ArrowLeft, BookOpen, ChevronDown, ChevronRight, Trash2, Filter } from 'lucide-react';
import { formatNumber } from '../utils/math';

interface EducationPageProps {
  state: NeuralNetworkState;
  trainingLog: TrainingLogEntry[];
  onBack: () => void;
  onClearLog: () => void;
}

const phaseColors: Record<SimulationPhase, string> = {
  IDLE: 'text-slate-400 bg-slate-800 border-slate-600',
  FORWARD: 'text-blue-300 bg-blue-900/60 border-blue-500',
  ERROR: 'text-red-300 bg-red-900/60 border-red-500',
  BACKWARD: 'text-purple-300 bg-purple-900/60 border-purple-500',
  UPDATE: 'text-emerald-300 bg-emerald-900/60 border-emerald-500',
};

function FormulaCard({
  title,
  formula,
  description,
  color = 'indigo',
}: {
  title: string;
  formula: string;
  description: string;
  color?: string;
}) {
  const borderColor = `border-${color}-500/30`;
  const bgColor = `bg-${color}-500/5`;
  const titleColor = `text-${color}-400`;

  return (
    <div className={`rounded-xl border ${borderColor} ${bgColor} p-4 space-y-2`}>
      <h4 className={`font-semibold text-sm ${titleColor}`}>{title}</h4>
      <div className="font-mono text-base text-white bg-slate-900/60 rounded-lg px-3 py-2 text-center">
        {formula}
      </div>
      <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}

function LogEntryRow({ entry, index }: { entry: TrainingLogEntry; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-slate-700/50 rounded-lg overflow-hidden">
      {/* Summary line */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800/50 transition-colors text-left"
      >
        <span className="text-slate-500 font-mono text-xs w-8">#{index + 1}</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded border ${phaseColors[entry.phase]}`}>
          {entry.phase}
        </span>
        <span className="text-slate-400 text-xs font-mono">Epoch {entry.epoch}</span>
        <span className="flex-1" />
        {entry.phase === 'ERROR' && (
          <span className="text-red-400 text-xs font-mono">
            MSE: {formatNumber(entry.totalError)}
          </span>
        )}
        {entry.phase === 'UPDATE' && (
          <span className="text-emerald-400 text-xs font-mono">
            MSE: {formatNumber(entry.totalError)}
          </span>
        )}
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-slate-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-500" />
        )}
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 space-y-3 bg-slate-900/30 border-t border-slate-700/50">
          {/* Inputs & Target */}
          <DetailSection title="Inputs & Target">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500">Inputs:</span>{' '}
                <span className="text-cyan-300 font-mono">
                  [{entry.inputs.map(formatNumber).join(', ')}]
                </span>
              </div>
              <div>
                <span className="text-slate-500">Target:</span>{' '}
                <span className="text-amber-300 font-mono">{formatNumber(entry.target)}</span>
              </div>
              <div>
                <span className="text-slate-500">Learning Rate:</span>{' '}
                <span className="text-green-300 font-mono">{entry.learningRate}</span>
              </div>
            </div>
          </DetailSection>

          {/* Forward Pass Values */}
          {(entry.phase === 'FORWARD' || entry.phase === 'ERROR' || entry.phase === 'BACKWARD' || entry.phase === 'UPDATE') && (
            <DetailSection title="Forward Pass Values">
              <div className="space-y-2 text-xs">
                {entry.hiddenNetInputs.map((layer, li) => (
                  <div key={li}>
                    <span className="text-slate-500">Hidden Layer {li + 1} Net Inputs:</span>{' '}
                    <span className="text-blue-300 font-mono">
                      [{layer.map(formatNumber).join(', ')}]
                    </span>
                  </div>
                ))}
                {entry.hiddenActivations.map((layer, li) => (
                  <div key={li}>
                    <span className="text-slate-500">Hidden Layer {li + 1} Activations:</span>{' '}
                    <span className="text-blue-200 font-mono">
                      [{layer.map(formatNumber).join(', ')}]
                    </span>
                  </div>
                ))}
                <div>
                  <span className="text-slate-500">Output Net Input:</span>{' '}
                  <span className="text-blue-300 font-mono">
                    [{entry.outputNetInputs.map(formatNumber).join(', ')}]
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Output Activation:</span>{' '}
                  <span className="text-blue-200 font-mono">
                    [{entry.outputActivations.map(formatNumber).join(', ')}]
                  </span>
                </div>
              </div>
            </DetailSection>
          )}

          {/* Error */}
          {(entry.phase === 'ERROR' || entry.phase === 'BACKWARD' || entry.phase === 'UPDATE') && (
            <DetailSection title="Error Calculation">
              <div className="space-y-1 text-xs">
                <div>
                  <span className="text-slate-500">Raw Error (output - target):</span>{' '}
                  <span className="text-red-300 font-mono">{formatNumber(entry.rawError)}</span>
                </div>
                <div>
                  <span className="text-slate-500">Total Error (MSE = 0.5 * error²):</span>{' '}
                  <span className="text-red-400 font-mono">{formatNumber(entry.totalError)}</span>
                </div>
              </div>
            </DetailSection>
          )}

          {/* Gradients */}
          {(entry.phase === 'BACKWARD' || entry.phase === 'UPDATE') && (
            <DetailSection title="Gradients (Backpropagation)">
              <div className="space-y-1 text-xs">
                <div>
                  <span className="text-slate-500">Output Gradients (δ_o):</span>{' '}
                  <span className="text-purple-300 font-mono">
                    [{entry.outputGradients.map(formatNumber).join(', ')}]
                  </span>
                </div>
                {entry.hiddenGradients.map((layer, li) => (
                  <div key={li}>
                    <span className="text-slate-500">Hidden Layer {li + 1} Gradients (δ_h):</span>{' '}
                    <span className="text-purple-200 font-mono">
                      [{layer.map(formatNumber).join(', ')}]
                    </span>
                  </div>
                ))}
              </div>
            </DetailSection>
          )}

          {/* Weights & Biases */}
          <DetailSection title="Weights & Biases">
            <div className="space-y-2 text-xs">
              {entry.weights.map((matrix, mi) => (
                <div key={mi} className="space-y-1">
                  <div className="text-slate-400 font-semibold">
                    Weight Matrix {mi} ({mi === 0 ? 'Input → Hidden 1' : mi === entry.weights.length - 1 ? `Hidden ${mi} → Output` : `Hidden ${mi} → Hidden ${mi + 1}`}):
                  </div>
                  {matrix.map((row, ri) => (
                    <div key={ri} className="pl-2">
                      <span className="text-slate-500">Neuron {ri}:</span>{' '}
                      <span className="text-emerald-300 font-mono">
                        [{row.map(formatNumber).join(', ')}]
                      </span>
                    </div>
                  ))}
                </div>
              ))}
              <div className="mt-2">
                <div className="text-slate-400 font-semibold">Biases:</div>
                {entry.biases.map((layer, li) => (
                  <div key={li} className="pl-2">
                    <span className="text-slate-500">Layer {li}:</span>{' '}
                    <span className="text-yellow-300 font-mono">
                      [{layer.map(formatNumber).join(', ')}]
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </DetailSection>
        </div>
      )}
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 font-bold">{title}</div>
      {children}
    </div>
  );
}

const phaseFilters: Array<SimulationPhase | 'ALL'> = [
  'ALL',
  'IDLE',
  'FORWARD',
  'ERROR',
  'BACKWARD',
  'UPDATE',
];

export function EducationPage({ state, trainingLog, onBack, onClearLog }: EducationPageProps) {
  const [phaseFilter, setPhaseFilter] = useState<SimulationPhase | 'ALL'>('ALL');

  const filteredLog = useMemo(() => {
    if (phaseFilter === 'ALL') return trainingLog;
    return trainingLog.filter((e) => e.phase === phaseFilter);
  }, [trainingLog, phaseFilter]);

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <header className="flex items-center gap-4 px-6 py-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Simulator
        </button>
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          <h1 className="text-lg font-bold text-white">Training Log &amp; Formulas</h1>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Formulas Panel (left) */}
        <aside className="w-[380px] shrink-0 border-r border-slate-800 overflow-y-auto custom-scrollbar p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            Formulas Reference
          </h2>

          <FormulaCard
            title="1. Net Input (Weighted Sum)"
            formula="net_j = Σ(wᵢⱼ · xᵢ) + bⱼ"
            description="Each neuron sums its inputs multiplied by their weights, then adds a bias term. This is the raw activation before applying the activation function."
            color="blue"
          />

          <FormulaCard
            title="2. Sigmoid Activation"
            formula="σ(x) = 1 / (1 + e⁻ˣ)"
            description="The sigmoid function squashes any real number into the range (0, 1). It introduces non-linearity, enabling the network to learn complex patterns."
            color="cyan"
          />

          <FormulaCard
            title="3. Sigmoid Derivative"
            formula="σ'(x) = σ(x) · (1 - σ(x))"
            description="The derivative of the sigmoid function. It tells us how much the output changes for a small change in input. Maximum at σ(x) = 0.5, minimum at extremes."
            color="teal"
          />

          <FormulaCard
            title="4. Mean Squared Error (MSE)"
            formula="E = ½ · (target - output)²"
            description="Measures how far the network's output is from the desired target. The ½ is a mathematical convenience — it cancels nicely when computing the derivative."
            color="red"
          />

          <FormulaCard
            title="5. Output Layer Gradient"
            formula="δₒ = (output - target) · σ'(output)"
            description="The gradient at the output neuron combines the error signal with the activation function's derivative. This tells us how much the output neuron contributed to the error."
            color="purple"
          />

          <FormulaCard
            title="6. Hidden Layer Gradient"
            formula="δₕ = (Σ δₒ · wₕₒ) · σ'(hₕ)"
            description="For hidden neurons, the gradient is computed by propagating the output gradient backward through the weights, then scaling by the local sigmoid derivative."
            color="violet"
          />

          <FormulaCard
            title="7. Weight Update Rule"
            formula="wᵢⱼ ← wᵢⱼ - η · δⱼ · aᵢ"
            description="Each weight is adjusted by subtracting the product of: learning rate (η), the target neuron's gradient (δⱼ), and the source neuron's activation (aᵢ). This is gradient descent."
            color="emerald"
          />

          <FormulaCard
            title="8. Bias Update Rule"
            formula="bⱼ ← bⱼ - η · δⱼ"
            description="Biases are updated similarly to weights, but without the input activation term (since a bias acts as if connected to a constant input of 1)."
            color="green"
          />

          {/* Current Network Summary */}
          <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4 space-y-3 mt-4">
            <h3 className="font-semibold text-sm text-slate-300">Current Network State</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500">Architecture:</span>{' '}
                <span className="text-white font-mono">
                  {state.inputCount} → {state.hiddenLayers.join(' → ')} → {state.outputCount}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Epoch:</span>{' '}
                <span className="text-white font-mono">{state.epoch}</span>
              </div>
              <div>
                <span className="text-slate-500">Learning Rate:</span>{' '}
                <span className="text-green-400 font-mono">{state.learningRate}</span>
              </div>
              <div>
                <span className="text-slate-500">Total Error:</span>{' '}
                <span className="text-red-400 font-mono">{formatNumber(state.totalError)}</span>
              </div>
              <div>
                <span className="text-slate-500">Inputs:</span>{' '}
                <span className="text-cyan-300 font-mono">
                  [{state.inputs.map(formatNumber).join(', ')}]
                </span>
              </div>
              <div>
                <span className="text-slate-500">Target:</span>{' '}
                <span className="text-amber-300 font-mono">{formatNumber(state.target)}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Training Log (right) */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Log toolbar */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-800 bg-slate-900/30 shrink-0">
            <Filter className="w-4 h-4 text-slate-500" />
            <div className="flex flex-wrap gap-1">
              {phaseFilters.map((p) => (
                <button
                  key={p}
                  onClick={() => setPhaseFilter(p)}
                  aria-pressed={phaseFilter === p}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    phaseFilter === p
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <span className="flex-1" />
            <span className="text-xs text-slate-500">{filteredLog.length} entries</span>
            <button
              onClick={onClearLog}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs bg-red-900/40 text-red-400 hover:bg-red-900/60 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Clear
            </button>
          </div>

          {/* Log list */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
            {filteredLog.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
                <BookOpen className="w-10 h-10 text-slate-600" />
                <p className="text-sm">No training log entries yet.</p>
                <p className="text-xs text-slate-600">
                  Run the simulation to see step-by-step values here.
                </p>
              </div>
            ) : (
              filteredLog.map((entry, i) => (
                <LogEntryRow key={`${entry.epoch}-${entry.phase}-${entry.timestamp}`} entry={entry} index={i} />
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
