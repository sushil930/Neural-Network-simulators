import React, { useRef, useEffect, useState } from 'react';
import { NeuralNetworkState, SimulationPhase, NeuronDetails, WeightDetails } from '../types';
import { NeuronNode } from './NeuronNode';
import { ConnectionLine } from './ConnectionLine';
import { Eye, EyeOff } from 'lucide-react';

interface NetworkCanvasProps {
  state: NeuralNetworkState;
  phase: SimulationPhase;
  onNeuronClick: (details: NeuronDetails) => void;
  onWeightClick: (details: WeightDetails) => void;
}

export const NetworkCanvas: React.FC<NetworkCanvasProps> = ({
  state,
  phase,
  onNeuronClick,
  onWeightClick
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [showValues, setShowValues] = useState(false);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Layout Calculations
  const layerX = {
    input: dimensions.width * 0.2,
    hidden: dimensions.width * 0.5,
    output: dimensions.width * 0.8
  };

  const getNeuronY = (index: number, total: number) => {
    const spacing = Math.min(100, dimensions.height / (total + 1));
    const startY = (dimensions.height - (total - 1) * spacing) / 2;
    return startY + index * spacing;
  };

  return (
    <div ref={containerRef} className="w-full h-full relative bg-slate-950 overflow-hidden">
      {/* Grid Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ 
             backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', 
             backgroundSize: '20px 20px' 
           }} 
      />

      {/* Toggle Values Button */}
      <button
        onClick={() => setShowValues(!showValues)}
        className="absolute top-4 right-4 z-10 p-2 bg-slate-800/50 hover:bg-slate-700/50 backdrop-blur rounded-full text-slate-300 transition-colors"
        title={showValues ? "Hide Values" : "Show Values"}
      >
        {showValues ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>

      <svg width="100%" height="100%" className="absolute inset-0">
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="#64748b" />
          </marker>
        </defs>

        {/* Input -> Hidden Connections */}
        {state.weightsInputHidden.map((row, i) => 
          row.map((weight, h) => {
            // Only render if indices are valid
            if (i >= state.inputCount || h >= state.hiddenCount) return null;
            
            const x1 = layerX.input;
            const y1 = getNeuronY(i, state.inputCount);
            const x2 = layerX.hidden;
            const y2 = getNeuronY(h, state.hiddenCount);
            
            return (
              <ConnectionLine
                key={`ih-${i}-${h}`}
                x1={x1} y1={y1} x2={x2} y2={y2}
                weight={weight}
                phase={phase}
                showValues={showValues}
                onClick={() => onWeightClick({
                  id: `ih-${i}-${h}`,
                  sourceLayer: 'input',
                  targetLayer: 'hidden',
                  sourceIndex: i,
                  targetIndex: h,
                  value: weight
                })}
              />
            );
          })
        )}

        {/* Hidden -> Output Connections */}
        {state.weightsHiddenOutput.map((row, h) => 
          row.map((weight, o) => {
            if (h >= state.hiddenCount || o >= state.outputCount) return null;

            const x1 = layerX.hidden;
            const y1 = getNeuronY(h, state.hiddenCount);
            const x2 = layerX.output;
            const y2 = getNeuronY(o, state.outputCount);

            return (
              <ConnectionLine
                key={`ho-${h}-${o}`}
                x1={x1} y1={y1} x2={x2} y2={y2}
                weight={weight}
                phase={phase}
                showValues={showValues}
                onClick={() => onWeightClick({
                  id: `ho-${h}-${o}`,
                  sourceLayer: 'hidden',
                  targetLayer: 'output',
                  sourceIndex: h,
                  targetIndex: o,
                  value: weight
                })}
              />
            );
          })
        )}

        {/* Input Neurons */}
        {Array.from({ length: state.inputCount }).map((_, i) => (
          <NeuronNode
            key={`input-${i}`}
            cx={layerX.input}
            cy={getNeuronY(i, state.inputCount)}
            r={20}
            value={state.inputs[i]}
            label={`x${i+1}`}
            isInput
            phase={phase}
            showValues={showValues}
            onClick={() => onNeuronClick({
              id: `input-${i}`,
              layer: 'input',
              index: i,
              value: state.inputs[i]
            })}
          />
        ))}

        {/* Hidden Neurons */}
        {Array.from({ length: state.hiddenCount }).map((_, h) => (
          <NeuronNode
            key={`hidden-${h}`}
            cx={layerX.hidden}
            cy={getNeuronY(h, state.hiddenCount)}
            r={20}
            value={state.hiddenActivations[h]}
            label={`h${h+1}`}
            phase={phase}
            showValues={showValues}
            gradient={state.hiddenGradients[h]}
            onClick={() => onNeuronClick({
              id: `hidden-${h}`,
              layer: 'hidden',
              index: h,
              value: state.hiddenActivations[h],
              netInput: state.hiddenNetInputs[h],
              gradient: state.hiddenGradients[h],
              bias: state.biasHidden[h]
            })}
          />
        ))}

        {/* Output Neurons */}
        {Array.from({ length: state.outputCount }).map((_, o) => (
          <NeuronNode
            key={`output-${o}`}
            cx={layerX.output}
            cy={getNeuronY(o, state.outputCount)}
            r={24}
            value={state.outputActivations[o]}
            label={`y${o+1}`}
            phase={phase}
            showValues={showValues}
            gradient={state.outputGradients[o]}
            onClick={() => onNeuronClick({
              id: `output-${o}`,
              layer: 'output',
              index: o,
              value: state.outputActivations[o],
              netInput: state.outputNetInputs[o],
              gradient: state.outputGradients[o],
              bias: state.biasOutput[o]
            })}
          />
        ))}
      </svg>
    </div>
  );
};
