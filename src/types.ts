export interface NeuralNetworkState {
  inputs: number[];
  target: number;
  learningRate: number;
  
  // Architecture
  inputCount: number;
  hiddenLayers: number[];
  outputCount: number; // Fixed at 1 for this sim

  // Weights & Biases
  // weights[layerIndex][sourceNeuronIndex][targetNeuronIndex]
  // layerIndex 0: input -> hidden1, ..., last: hiddenN -> output
  weights: number[][][];
  // biases[targetLayerIndex][targetNeuronIndex]
  // targetLayerIndex 0..hiddenLayers.length-1 => hidden layers
  // targetLayerIndex hiddenLayers.length => output layer
  biases: number[][];

  // Computed Values (Forward)
  hiddenNetInputs: number[][];
  hiddenActivations: number[][];
  outputNetInputs: number[];
  outputActivations: number[];

  // Computed Values (Backward)
  outputGradients: number[]; // delta_o
  hiddenGradients: number[][]; // delta_h per hidden layer
  
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
  hiddenLayerIndex?: number;
  value: number; // activation or input value
  netInput?: number;
  gradient?: number;
  bias?: number;
}

export interface WeightDetails {
  id: string;
  matrixIndex: number;
  sourceLayer: 'input' | 'hidden';
  targetLayer: 'hidden' | 'output';
  sourceLayerIndex?: number;
  targetLayerIndex?: number;
  sourceLabel?: string;
  targetLabel?: string;
  sourceIndex: number;
  targetIndex: number;
  value: number;
}
