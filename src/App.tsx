import React, { useState } from 'react';
import { useNeuralNetwork } from './hooks/useNeuralNetwork';
import { Sidebar } from './components/Sidebar';
import { NetworkCanvas } from './components/NetworkCanvas';
import { DetailsCard } from './components/DetailsCard';
import { WeightEditPopover } from './components/WeightEditPopover';
import { NeuronDetails, WeightDetails } from './types';
import { Activity, Zap } from 'lucide-react';

export default function App() {
  const nn = useNeuralNetwork();
  
  const [selectedNeuron, setSelectedNeuron] = useState<NeuronDetails | null>(null);
  const [selectedWeight, setSelectedWeight] = useState<WeightDetails | null>(null);

  const handlePlayPause = () => {
    if (nn.isPlaying) {
      nn.stopAutoPlay();
      return;
    }

    const input = window.prompt('Enter number of epochs to auto-run (0 or blank for infinite):', '0');
    if (input === null) return; // user canceled

    const epochs = Number(input);
    if (Number.isNaN(epochs) || epochs < 0) {
      window.alert('Please enter a non-negative number.');
      return;
    }

    if (epochs > 0) {
      nn.startAutoPlay(epochs);
    } else {
      nn.startAutoPlay();
    }
  };

  const handleNeuronClick = (details: NeuronDetails) => {
    setSelectedNeuron(details);
    setSelectedWeight(null); // Close weight popover if open
  };

  const handleWeightClick = (details: WeightDetails) => {
    setSelectedWeight(details);
    setSelectedNeuron(null); // Close neuron card if open
  };

  const handleWeightSave = (val: number) => {
    if (selectedWeight) {
      nn.updateWeight(
        selectedWeight.matrixIndex,
        selectedWeight.sourceIndex,
        selectedWeight.targetIndex,
        val
      );
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 overflow-hidden font-sans text-slate-200 selection:bg-indigo-500/30">
      {/* Sidebar Controls */}
      <Sidebar
        state={nn.state}
        phase={nn.phase}
        isPlaying={nn.isPlaying}
        onPlayPause={handlePlayPause}
        onNext={nn.nextStep}
        onReset={nn.reset}
        onUpdateArchitecture={nn.updateArchitecture}
        onSetInput={nn.setInput}
        onSetTarget={nn.setTarget}
        onSetLR={nn.setLearningRate}
        onUpdateWeight={nn.updateWeight}
        onUpdateBias={nn.updateBias}
      />

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Top Bar Stats */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 flex justify-between items-start pointer-events-none">
          <div className="bg-slate-900/80 backdrop-blur border border-slate-700 rounded-lg p-3 shadow-lg pointer-events-auto">
            <div className="flex items-center gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400">Epoch</div>
                <div className="text-xl font-mono font-bold text-white">{nn.state.epoch}</div>
              </div>
              <div className="w-px h-8 bg-slate-700"></div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400">Total Error (MSE)</div>
                <div className="text-xl font-mono font-bold text-red-400">{nn.state.totalError.toFixed(6)}</div>
              </div>
              <div className="w-px h-8 bg-slate-700"></div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400">Raw Error</div>
                <div className="text-xl font-mono font-bold text-amber-400">{nn.state.rawError.toFixed(6)}</div>
              </div>
            </div>
          </div>

          {/* Phase Indicator Pill */}
          <div className={`
            px-4 py-2 rounded-full font-bold text-sm shadow-lg backdrop-blur border transition-all duration-300
            ${nn.phase === 'IDLE' ? 'bg-slate-800/80 border-slate-600 text-slate-300' : ''}
            ${nn.phase === 'FORWARD' ? 'bg-blue-900/80 border-blue-500 text-blue-200' : ''}
            ${nn.phase === 'ERROR' ? 'bg-red-900/80 border-red-500 text-red-200' : ''}
            ${nn.phase === 'BACKWARD' ? 'bg-purple-900/80 border-purple-500 text-purple-200' : ''}
            ${nn.phase === 'UPDATE' ? 'bg-emerald-900/80 border-emerald-500 text-emerald-200' : ''}
          `}>
            <div className="flex items-center gap-2">
              {nn.phase === 'FORWARD' && <Activity className="w-4 h-4 animate-pulse" />}
              {nn.phase === 'UPDATE' && <Zap className="w-4 h-4 animate-pulse" />}
              {nn.phase} PHASE
            </div>
          </div>
        </div>

        {/* Interactive Canvas */}
        <div className="flex-1 relative">
          <NetworkCanvas
            state={nn.state}
            phase={nn.phase}
            onNeuronClick={handleNeuronClick}
            onWeightClick={handleWeightClick}
          />
          
          {/* Overlays */}
          <DetailsCard
            details={selectedNeuron}
            onClose={() => setSelectedNeuron(null)}
          />
          
          <WeightEditPopover
            details={selectedWeight}
            onClose={() => setSelectedWeight(null)}
            onSave={handleWeightSave}
          />
        </div>
      </div>
    </div>
  );
}
