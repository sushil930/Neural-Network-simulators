import React from 'react';
import { Play, Pause, SkipForward, RotateCcw, Settings, Activity, ChevronRight } from 'lucide-react';
import { NeuralNetworkState, SimulationPhase } from '../types';

interface SidebarProps {
  state: NeuralNetworkState;
  phase: SimulationPhase;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onReset: () => void;
  onUpdateArchitecture: (inputs: number, hiddenLayers: number[]) => void;
  onSetInput: (idx: number, val: number) => void;
  onSetTarget: (val: number) => void;
  onSetLR: (val: number) => void;
  onUpdateWeight: (matrixIndex: number, i: number, j: number, val: number) => void;
  onUpdateBias: (biasLayerIndex: number, index: number, val: number) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  state,
  phase,
  isPlaying,
  onPlayPause,
  onNext,
  onReset,
  onUpdateArchitecture,
  onSetInput,
  onSetTarget,
  onSetLR,
  onUpdateWeight,
  onUpdateBias
}) => {
  const layerCount = state.hiddenLayers.length;

  const updateLayerCount = (nextCount: number) => {
    const clamped = Math.max(1, Math.min(4, nextCount));
    const nextLayers = [...state.hiddenLayers];

    while (nextLayers.length < clamped) {
      nextLayers.push(2);
    }
    while (nextLayers.length > clamped) {
      nextLayers.pop();
    }

    onUpdateArchitecture(state.inputCount, nextLayers);
  };

  const updateHiddenLayerSize = (layerIndex: number, neuronCount: number) => {
    const nextLayers = [...state.hiddenLayers];
    nextLayers[layerIndex] = neuronCount;
    onUpdateArchitecture(state.inputCount, nextLayers);
  };

  const getLayerName = (layerIndex: number) => {
    if (layerIndex === 0) return 'Input';
    if (layerIndex === state.hiddenLayers.length + 1) return 'Output';
    return `Hidden ${layerIndex}`;
  };

  return (
    <div data-tour="sidebar" className="w-80 h-full bg-slate-900/90 backdrop-blur-md border-r border-slate-700 flex flex-col text-slate-100 overflow-y-auto custom-scrollbar">
      <div className="p-6 border-b border-slate-700 shrink-0">
        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-400" />
          NN Simulator
        </h1>
        <p className="text-xs text-slate-400 mt-1">Backpropagation Visualizer</p>
      </div>

      {/* Playback Controls */}
      <div data-tour="playback-controls" className="p-6 border-b border-slate-700 space-y-4 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-300">Controls</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            phase === 'IDLE' ? 'bg-slate-700 text-slate-300' :
            phase === 'FORWARD' ? 'bg-blue-500/20 text-blue-300' :
            phase === 'ERROR' ? 'bg-red-500/20 text-red-300' :
            phase === 'BACKWARD' ? 'bg-purple-500/20 text-purple-300' :
            'bg-emerald-500/20 text-emerald-300'
          }`}>
            {phase}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            data-tour="autoplay-btn"
            onClick={onPlayPause}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-all ${
              isPlaying 
                ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? 'Stop Auto' : 'Auto Play'}
          </button>
          <button
            data-tour="next-btn"
            onClick={onNext}
            disabled={isPlaying}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Next Step"
          >
            <SkipForward className="w-4 h-4" />
          </button>
          <button
            onClick={onReset}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Configuration */}
      <div className="p-6 space-y-6 shrink-0">
        <div data-tour="architecture" className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <Settings className="w-4 h-4" />
            Architecture
          </div>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1 text-slate-400">
                <span>Input Neurons</span>
                <span>{state.inputCount}</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={state.inputCount}
                onChange={(e) => onUpdateArchitecture(Number(e.target.value), state.hiddenLayers)}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1 text-slate-400">
                <span>Hidden Layers</span>
                <span>{layerCount}</span>
              </div>
              <input
                type="range"
                min="1"
                max="4"
                value={layerCount}
                onChange={(e) => updateLayerCount(Number(e.target.value))}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
            {state.hiddenLayers.map((count, layerIndex) => (
              <div key={`hidden-size-${layerIndex}`}>
                <div className="flex justify-between text-xs mb-1 text-slate-400">
                  <span>Hidden {layerIndex + 1} Neurons</span>
                  <span>{count}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={count}
                  onChange={(e) => updateHiddenLayerSize(layerIndex, Number(e.target.value))}
                  className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            ))}
          </div>
        </div>

        <div data-tour="parameters" className="space-y-4 pt-4 border-t border-slate-700">
          <div className="text-sm font-medium text-slate-300">Parameters</div>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1 text-slate-400">
                <span>Target Output</span>
                <span>{state.target.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={state.target}
                onChange={(e) => onSetTarget(Number(e.target.value))}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1 text-slate-400">
                <span>Learning Rate</span>
                <span>{state.learningRate.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.01"
                max="1"
                step="0.01"
                value={state.learningRate}
                onChange={(e) => onSetLR(Number(e.target.value))}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-700">
          <div className="text-sm font-medium text-slate-300">Input Values</div>
          <div className="space-y-3">
            {state.inputs.map((val, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-xs mb-1 text-slate-400">
                  <span>Input x{idx + 1}</span>
                  <span>{val.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={val}
                  onChange={(e) => onSetInput(idx, Number(e.target.value))}
                  className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weights & Biases List */}
      <div className="p-6 border-t border-slate-700 space-y-4">
        <div className="text-sm font-medium text-slate-300">Weights & Biases</div>

        {state.weights.map((matrix, matrixIndex) => {
          const sourceName = getLayerName(matrixIndex);
          const targetName = getLayerName(matrixIndex + 1);

          return (
            <details className="group" key={`weights-${matrixIndex}`}>
              <summary className="flex items-center gap-2 text-xs font-medium text-slate-400 cursor-pointer hover:text-slate-200 mb-2 list-none">
                <ChevronRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
                {sourceName} → {targetName} Weights
              </summary>
              <div className="space-y-3 pl-2 border-l border-slate-700 py-2">
                {matrix.map((row, sourceIndex) =>
                  row.map((weight, targetIndex) => (
                    <div key={`w-${matrixIndex}-${sourceIndex}-${targetIndex}`}>
                      <div className="flex justify-between text-[10px] mb-1 text-slate-500">
                        <span>w_l{matrixIndex + 1}_{sourceIndex + 1}-{targetIndex + 1}</span>
                        <span>{weight.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="-2"
                        max="2"
                        step="0.05"
                        value={weight}
                        onChange={(e) => onUpdateWeight(matrixIndex, sourceIndex, targetIndex, Number(e.target.value))}
                        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                    </div>
                  ))
                )}
              </div>
            </details>
          );
        })}

        {state.hiddenLayers.map((_, hiddenLayerIndex) => (
          <details className="group" key={`hidden-bias-${hiddenLayerIndex}`}>
            <summary className="flex items-center gap-2 text-xs font-medium text-slate-400 cursor-pointer hover:text-slate-200 mb-2 list-none">
              <ChevronRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
              Hidden {hiddenLayerIndex + 1} Biases
            </summary>
            <div className="space-y-3 pl-2 border-l border-slate-700 py-2">
              {state.biases[hiddenLayerIndex].map((bias, neuronIndex) => (
                <div key={`bh-${hiddenLayerIndex}-${neuronIndex}`}>
                  <div className="flex justify-between text-[10px] mb-1 text-slate-500">
                    <span>b_h{hiddenLayerIndex + 1}_{neuronIndex + 1}</span>
                    <span>{bias.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    step="0.05"
                    value={bias}
                    onChange={(e) => onUpdateBias(hiddenLayerIndex, neuronIndex, Number(e.target.value))}
                    className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              ))}
            </div>
          </details>
        ))}

        <details className="group">
          <summary className="flex items-center gap-2 text-xs font-medium text-slate-400 cursor-pointer hover:text-slate-200 mb-2 list-none">
            <ChevronRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
            Output Biases
          </summary>
          <div className="space-y-3 pl-2 border-l border-slate-700 py-2">
            {state.biases[state.hiddenLayers.length].map((bias, outputIndex) => {
              return (
                <div key={`bo-${outputIndex}`}>
                  <div className="flex justify-between text-[10px] mb-1 text-slate-500">
                    <span>b_o{outputIndex + 1}</span>
                    <span>{bias.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    step="0.05"
                    value={bias}
                    onChange={(e) => onUpdateBias(state.hiddenLayers.length, outputIndex, Number(e.target.value))}
                    className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              );
            })}
          </div>
        </details>
      </div>
      
      <div className="mt-auto p-4 text-[10px] text-slate-600 text-center shrink-0">
        v1.0.0 • React + Tailwind
      </div>
    </div>
  );
};
