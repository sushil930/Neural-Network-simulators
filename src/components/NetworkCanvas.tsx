import React, { useRef, useEffect, useState } from 'react';
import { NeuralNetworkState, SimulationPhase, NeuronDetails, WeightDetails } from '../types';
import { NeuronNode } from './NeuronNode';
import { ConnectionLine } from './ConnectionLine';
import { Eye, EyeOff, ZoomIn, ZoomOut } from 'lucide-react';

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
  onWeightClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [showValues, setShowValues] = useState(false);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const layerCounts = [state.inputCount, ...state.hiddenLayers, state.outputCount];

  const getLayerX = (layerIndex: number) => {
    const totalLayers = layerCounts.length;
    return (dimensions.width * (layerIndex + 1)) / (totalLayers + 1);
  };

  const getNeuronY = (index: number, total: number) => {
    const spacing = Math.min(120, dimensions.height / (total + 1));
    const startY = (dimensions.height - (total - 1) * spacing) / 2;
    return startY + index * spacing;
  };

  const getLayerName = (layerIndex: number) => {
    if (layerIndex === 0) return 'input';
    if (layerIndex === layerCounts.length - 1) return 'output';
    return 'hidden';
  };

  const adjustZoom = (delta: number) => {
    setScale((prev) => Math.max(0.7, Math.min(1.8, prev + delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only start dragging if clicking on the background (svg)
    if ((e.target as Element).closest('circle') || (e.target as Element).closest('line')) {
      return;
    }
    setIsDragging(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    
    setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div 
      ref={containerRef} 
      className={`w-full h-full relative bg-slate-950 overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        {/* Buttons previously here, now moved to bottom left but we keep structure if needed or just SVG next */}
      </div>

      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2">
        <button
          onClick={() => adjustZoom(-0.1)}
          className="p-2 bg-slate-800/60 hover:bg-slate-700/60 backdrop-blur rounded-full text-slate-300 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => adjustZoom(0.1)}
          className="p-2 bg-slate-800/60 hover:bg-slate-700/60 backdrop-blur rounded-full text-slate-300 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowValues(!showValues)}
          className="p-2 bg-slate-800/50 hover:bg-slate-700/50 backdrop-blur rounded-full text-slate-300 transition-colors"
          title={showValues ? 'Hide Values' : 'Show Values'}
        >
          {showValues ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      <svg width="100%" height="100%" className="absolute inset-0 pointer-events-none">
        <g
          transform={`translate(${dimensions.width / 2 + pan.x} ${dimensions.height / 2 + pan.y}) scale(${scale}) translate(${-dimensions.width / 2} ${-dimensions.height / 2})`}
          className="pointer-events-auto"
        >
          {state.weights.map((matrix, matrixIndex) => {
            const sourceLayerIndex = matrixIndex;
            const targetLayerIndex = matrixIndex + 1;
            const sourceX = getLayerX(sourceLayerIndex);
            const targetX = getLayerX(targetLayerIndex);
            const sourceCount = layerCounts[sourceLayerIndex];
            const targetCount = layerCounts[targetLayerIndex];

            return matrix.map((row, sourceIndex) =>
              row.map((weight, targetIndex) => (
                <ConnectionLine
                  key={`m-${matrixIndex}-${sourceIndex}-${targetIndex}`}
                  x1={sourceX}
                  y1={getNeuronY(sourceIndex, sourceCount)}
                  x2={targetX}
                  y2={getNeuronY(targetIndex, targetCount)}
                  weight={weight}
                  phase={phase}
                  showValues={showValues}
                  epoch={state.epoch}
                  onClick={() =>
                    onWeightClick({
                      id: `m-${matrixIndex}-${sourceIndex}-${targetIndex}`,
                      matrixIndex,
                      sourceLayer: getLayerName(sourceLayerIndex) as 'input' | 'hidden',
                      targetLayer: getLayerName(targetLayerIndex) as 'hidden' | 'output',
                      sourceLayerIndex: sourceLayerIndex === 0 ? undefined : sourceLayerIndex - 1,
                      targetLayerIndex:
                        targetLayerIndex === layerCounts.length - 1 ? undefined : targetLayerIndex - 1,
                      sourceLabel:
                        sourceLayerIndex === 0
                          ? 'Input'
                          : sourceLayerIndex === layerCounts.length - 1
                            ? 'Output'
                            : `Hidden ${sourceLayerIndex}`,
                      targetLabel:
                        targetLayerIndex === layerCounts.length - 1
                          ? 'Output'
                          : `Hidden ${targetLayerIndex}`,
                      sourceIndex,
                      targetIndex,
                      value: weight,
                    })
                  }
                />
              ))
            );
          })}

          {Array.from({ length: state.inputCount }).map((_, inputIndex) => (
            <NeuronNode
              key={`input-${inputIndex}`}
              cx={getLayerX(0)}
              cy={getNeuronY(inputIndex, state.inputCount)}
              r={28}
              value={state.inputs[inputIndex]}
              label={`x${inputIndex + 1}`}
              isInput
              phase={phase}
              showValues={showValues}
              onClick={() =>
                onNeuronClick({
                  id: `input-${inputIndex}`,
                  layer: 'input',
                  index: inputIndex,
                  value: state.inputs[inputIndex],
                })
              }
            />
          ))}

          {state.hiddenLayers.map((hiddenCount, hiddenLayerIndex) =>
            Array.from({ length: hiddenCount }).map((_, hiddenIndex) => (
              <NeuronNode
                key={`hidden-${hiddenLayerIndex}-${hiddenIndex}`}
                cx={getLayerX(hiddenLayerIndex + 1)}
                cy={getNeuronY(hiddenIndex, hiddenCount)}
                r={28}
                value={state.hiddenActivations[hiddenLayerIndex]?.[hiddenIndex] ?? 0}
                label={`h${hiddenLayerIndex + 1}.${hiddenIndex + 1}`}
                phase={phase}
                showValues={showValues}
                gradient={state.hiddenGradients[hiddenLayerIndex]?.[hiddenIndex]}
                onClick={() =>
                  onNeuronClick({
                    id: `hidden-${hiddenLayerIndex}-${hiddenIndex}`,
                    layer: 'hidden',
                    hiddenLayerIndex,
                    index: hiddenIndex,
                    value: state.hiddenActivations[hiddenLayerIndex]?.[hiddenIndex] ?? 0,
                    netInput: state.hiddenNetInputs[hiddenLayerIndex]?.[hiddenIndex],
                    gradient: state.hiddenGradients[hiddenLayerIndex]?.[hiddenIndex],
                    bias: state.biases[hiddenLayerIndex]?.[hiddenIndex],
                  })
                }
              />
            ))
          )}

          {Array.from({ length: state.outputCount }).map((_, outputIndex) => (
            <NeuronNode
              key={`output-${outputIndex}`}
              cx={getLayerX(layerCounts.length - 1)}
              cy={getNeuronY(outputIndex, state.outputCount)}
              r={32}
              value={state.outputActivations[outputIndex]}
              label={`y${outputIndex + 1}`}
              phase={phase}
              showValues={showValues}
              gradient={state.outputGradients[outputIndex]}
              onClick={() =>
                onNeuronClick({
                  id: `output-${outputIndex}`,
                  layer: 'output',
                  index: outputIndex,
                  value: state.outputActivations[outputIndex],
                  netInput: state.outputNetInputs[outputIndex],
                  gradient: state.outputGradients[outputIndex],
                  bias: state.biases[state.hiddenLayers.length]?.[outputIndex],
                })
              }
            />
          ))}
        </g>
      </svg>
    </div>
  );
};
