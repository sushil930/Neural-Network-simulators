export interface NeuralNetworkState {
  inputs: number[];
  target: number;
  learningRate: number;
  
  // Architecture
  inputCount: number;
  hiddenCount: number;
  outputCount: number; // Fixed at 1 for this sim

  // Weights & Biases
  // weightsInputHidden[inputIndex][hiddenIndex]
  weightsInputHidden: number[][]; 
  biasHidden: number[];
  
  // weightsHiddenOutput[hiddenIndex][outputIndex] (outputIndex is always 0 here)
  weightsHiddenOutput: number[][];
  biasOutput: number[];

  // Computed Values (Forward)
  hiddenNetInputs: number[];
  hiddenActivations: number[];
  outputNetInputs: number[];
  outputActivations: number[];

  // Computed Values (Backward)
  outputGradients: number[]; // delta_o
  hiddenGradients: number[]; // delta_h
  
  // Stats
  epoch: number;
  totalError: number; // MSE
  rawError: number; // Output - Target
}

export type SimulationPhase = 'IDLE' | 'FORWARD' | 'ERROR' | 'BACKWARD' | 'UPDATE';

export interface NeuronDetails {
  id: string;
  layer: 'input' | 'hidden' | 'output';
  index: number;
  value: number; // activation or input value
  netInput?: number;
  gradient?: number;
  bias?: number;
}

export interface WeightDetails {
  id: string;
  sourceLayer: 'input' | 'hidden';
  targetLayer: 'hidden' | 'output';
  sourceIndex: number;
  targetIndex: number;
  value: number;
}
