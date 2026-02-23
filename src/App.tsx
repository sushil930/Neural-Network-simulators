import React, { useEffect, useState } from 'react';
import { useNeuralNetwork } from './hooks/useNeuralNetwork';
import { Sidebar } from './components/Sidebar';
import { NetworkCanvas } from './components/NetworkCanvas';
import { DetailsCard } from './components/DetailsCard';
import { WeightEditPopover } from './components/WeightEditPopover';
import { EducationPage } from './components/EducationPage';
import { NeuronDetails, WeightDetails } from './types';
import { Activity, Zap, BookOpen, CircleHelp } from 'lucide-react';
import { TutorialTour, TourStep } from './components/TutorialTour';
import { MobileWarning } from './components/MobileWarning';

const TOUR_STEPS: TourStep[] = [
  {
    target: 'sidebar',
    title: 'Control Panel',
    description: 'The left sidebar is your main control panel. Configure the network architecture, adjust inputs, target output, and learning rate here.',
  },
  {
    target: 'playback-controls',
    title: 'Playback Controls',
    description: 'Use these three buttons to drive training: Auto Play runs epochs continuously, the step button advances one phase at a time, and Reset restarts everything.',
  },
  {
    target: 'autoplay-btn',
    title: 'Auto Play',
    description: 'Click Auto Play and enter a number of epochs (or 0 for infinite). The simulation runs all four training phases automatically until you stop it.',
  },
  {
    target: 'next-btn',
    title: 'Step-by-Step Mode',
    description: 'Click this to advance one phase at a time: FORWARD → ERROR → BACKWARD → UPDATE. Great for understanding each step of backpropagation in detail.',
  },
  {
    target: 'architecture',
    title: 'Network Architecture',
    description: 'Drag sliders to change the number of input neurons, hidden layers, and neurons per hidden layer. The network rebuilds instantly with fresh random weights.',
  },
  {
    target: 'parameters',
    title: 'Training Parameters',
    description: 'Adjust the Target Output (what the network should learn to predict) and Learning Rate (how big each weight update step is). Higher LR = faster but less stable learning.',
  },
  {
    target: 'canvas',
    title: 'Visualization Canvas',
    description: 'Watch neurons and connections animate live. Click any neuron to inspect its activation, net input, and gradient. Click any connection line to view and edit its weight.',
  },
  {
    target: 'stats-bar',
    title: 'Training Statistics',
    description: 'Live stats update after every phase. Epoch tracks training iterations. MSE (Mean Squared Error) shows how far the output is from the target — lower is better.',
  },
  {
    target: 'phase-pill',
    title: 'Phase Indicator',
    description: 'Shows the current training phase. FORWARD computes activations, ERROR measures loss, BACKWARD computes gradients, UPDATE applies weight changes.',
  },
  {
    target: 'log-btn',
    title: 'Training Log & Formulas',
    description: 'Opens the Education page — a detailed log of every training step with exact values, plus a reference card of all the math formulas used in backpropagation.',
  },
];

const TUTORIAL_STORAGE_KEY = 'nn-simulator-tutorial-seen';

export default function App() {
  const nn = useNeuralNetwork();
  
  const [selectedNeuron, setSelectedNeuron] = useState<NeuronDetails | null>(null);
  const [selectedWeight, setSelectedWeight] = useState<WeightDetails | null>(null);
  const [page, setPage] = useState<'simulator' | 'education'>('simulator');
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    const seen = window.localStorage.getItem(TUTORIAL_STORAGE_KEY);
    if (!seen) {
      setShowTutorial(true);
    }
  }, []);

  const closeTutorial = (remember: boolean) => {
    if (remember) {
      window.localStorage.setItem(TUTORIAL_STORAGE_KEY, '1');
    }
    setShowTutorial(false);
  };

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

  if (page === 'education') {
    return (
      <>
        <EducationPage
          state={nn.state}
          trainingLog={nn.trainingLog}
          onBack={() => setPage('simulator')}
          onClearLog={nn.clearLog}
        />
        <MobileWarning />
      </>
    );
  }

  return (
    <>
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
          <div data-tour="stats-bar" className="bg-slate-900/80 backdrop-blur border border-slate-700 rounded-lg p-3 shadow-lg pointer-events-auto">
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
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => setShowTutorial(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full font-medium text-sm shadow-lg backdrop-blur border bg-slate-800/80 border-slate-600 text-slate-200 hover:bg-slate-700/80 transition-colors"
              title="How to use"
            >
              <CircleHelp className="w-4 h-4" />
              Help
            </button>
            <button
              data-tour="log-btn"
              onClick={() => setPage('education')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full font-medium text-sm shadow-lg backdrop-blur border bg-indigo-900/80 border-indigo-500 text-indigo-200 hover:bg-indigo-800/80 transition-colors"
              title="Training Log & Formulas"
            >
              <BookOpen className="w-4 h-4" />
              Log & Formulas
            </button>
            <div data-tour="phase-pill" className={`
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
        </div>

        {/* Interactive Canvas */}
        <div data-tour="canvas" className="flex-1 relative">
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

          {showTutorial && (
            <TutorialTour steps={TOUR_STEPS} onFinish={closeTutorial} />
          )}
        </div>
      </div>
      </div>
      <MobileWarning />
    </>
  );
}
