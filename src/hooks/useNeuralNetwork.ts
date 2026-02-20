import { useState, useCallback, useRef, useEffect } from 'react';
import { NeuralNetworkState, SimulationPhase } from '../types';
import { sigmoid, sigmoidDerivativeFromActivation, mse, randomWeight } from '../utils/math';

const DEFAULT_INPUTS = [0.1, 0.1];
const DEFAULT_TARGET = 0.1;
const DEFAULT_LR = 0.2;

// Initial specific scenario weights
// w_i1_h1=0.6, w_i2_h1=-0.3, b_h1=0.3
// We'll fill the rest with some reasonable defaults or randoms if not specified, 
// but let's try to make a nice starting state.
const INITIAL_WEIGHTS_IH = [
  [0.6, -0.1, 0.2, 0.1, -0.2], // Input 1 weights to H1, H2, H3, H4, H5
  [-0.3, 0.4, -0.5, 0.2, 0.3], // Input 2 weights
  [0.1, -0.2, 0.3, -0.4, 0.5], // Input 3
  [-0.2, 0.1, -0.1, 0.3, -0.3], // Input 4
  [0.3, -0.3, 0.2, -0.2, 0.1], // Input 5
];

const INITIAL_BIAS_H = [0.3, -0.2, 0.1, -0.1, 0.2];

const INITIAL_WEIGHTS_HO = [
  [0.4], [-0.5], [0.3], [-0.2], [0.1] // Hidden 1..5 to Output
];

const INITIAL_BIAS_O = [-0.1];

export const useNeuralNetwork = () => {
  const [phase, setPhase] = useState<SimulationPhase>('IDLE');
  const [isPlaying, setIsPlaying] = useState(false);
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [state, setState] = useState<NeuralNetworkState>({
    inputs: [...DEFAULT_INPUTS],
    target: DEFAULT_TARGET,
    learningRate: DEFAULT_LR,
    inputCount: 2,
    hiddenCount: 2,
    outputCount: 1,
    weightsInputHidden: [
      [INITIAL_WEIGHTS_IH[0][0], INITIAL_WEIGHTS_IH[0][1]],
      [INITIAL_WEIGHTS_IH[1][0], INITIAL_WEIGHTS_IH[1][1]]
    ],
    biasHidden: [INITIAL_BIAS_H[0], INITIAL_BIAS_H[1]],
    weightsHiddenOutput: [
      [INITIAL_WEIGHTS_HO[0][0]],
      [INITIAL_WEIGHTS_HO[1][0]]
    ],
    biasOutput: [INITIAL_BIAS_O[0]],
    hiddenNetInputs: [0, 0],
    hiddenActivations: [0, 0],
    outputNetInputs: [0],
    outputActivations: [0],
    outputGradients: [0],
    hiddenGradients: [0, 0],
    epoch: 0,
    totalError: 0,
    rawError: 0,
  });

  // Helper to resize arrays when architecture changes
  const updateArchitecture = (newInputCount: number, newHiddenCount: number) => {
    setState(prev => {
      const newInputs = [...prev.inputs];
      while (newInputs.length < newInputCount) newInputs.push(0.1);
      while (newInputs.length > newInputCount) newInputs.pop();

      // Resize Input->Hidden Weights
      const newWeightsIH = Array(newInputCount).fill(0).map((_, i) => {
        return Array(newHiddenCount).fill(0).map((_, h) => {
          if (prev.weightsInputHidden[i] && prev.weightsInputHidden[i][h] !== undefined) {
            return prev.weightsInputHidden[i][h];
          }
          // Use our preset constants if available for stability, else random
          if (INITIAL_WEIGHTS_IH[i] && INITIAL_WEIGHTS_IH[i][h] !== undefined) {
            return INITIAL_WEIGHTS_IH[i][h];
          }
          return randomWeight();
        });
      });

      // Resize Hidden Biases
      const newBiasH = Array(newHiddenCount).fill(0).map((_, h) => {
        if (prev.biasHidden[h] !== undefined) return prev.biasHidden[h];
        if (INITIAL_BIAS_H[h] !== undefined) return INITIAL_BIAS_H[h];
        return randomWeight();
      });

      // Resize Hidden->Output Weights
      const newWeightsHO = Array(newHiddenCount).fill(0).map((_, h) => {
        return Array(prev.outputCount).fill(0).map((_, o) => {
          if (prev.weightsHiddenOutput[h] && prev.weightsHiddenOutput[h][o] !== undefined) {
            return prev.weightsHiddenOutput[h][o];
          }
           if (INITIAL_WEIGHTS_HO[h] && INITIAL_WEIGHTS_HO[h][o] !== undefined) {
            return INITIAL_WEIGHTS_HO[h][o];
          }
          return randomWeight();
        });
      });

      return {
        ...prev,
        inputCount: newInputCount,
        hiddenCount: newHiddenCount,
        inputs: newInputs,
        weightsInputHidden: newWeightsIH,
        biasHidden: newBiasH,
        weightsHiddenOutput: newWeightsHO,
        // Reset computed values to avoid index out of bounds before next forward pass
        hiddenNetInputs: Array(newHiddenCount).fill(0),
        hiddenActivations: Array(newHiddenCount).fill(0),
        hiddenGradients: Array(newHiddenCount).fill(0),
        phase: 'IDLE' // Reset phase on architecture change
      };
    });
    setPhase('IDLE');
  };

  const stepForward = useCallback(() => {
    setState(prev => {
      // 1. Calculate Hidden Layer
      const hiddenNetInputs = prev.biasHidden.map((b, hIdx) => {
        let sum = b;
        for (let i = 0; i < prev.inputCount; i++) {
          sum += prev.inputs[i] * prev.weightsInputHidden[i][hIdx];
        }
        return sum;
      });
      const hiddenActivations = hiddenNetInputs.map(sigmoid);

      // 2. Calculate Output Layer
      const outputNetInputs = prev.biasOutput.map((b, oIdx) => {
        let sum = b;
        for (let h = 0; h < prev.hiddenCount; h++) {
          sum += hiddenActivations[h] * prev.weightsHiddenOutput[h][oIdx];
        }
        return sum;
      });
      const outputActivations = outputNetInputs.map(sigmoid);

      return {
        ...prev,
        hiddenNetInputs,
        hiddenActivations,
        outputNetInputs,
        outputActivations
      };
    });
    setPhase('FORWARD');
  }, []);

  const stepError = useCallback(() => {
    setState(prev => {
      const output = prev.outputActivations[0];
      const err = mse(prev.target, output);
      const raw = prev.target - output;
      return {
        ...prev,
        totalError: err,
        rawError: raw
      };
    });
    setPhase('ERROR');
  }, []);

  const stepBackward = useCallback(() => {
    setState(prev => {
      // Output Gradient (delta_o)
      // dE/dOut = -(target - out)
      // dOut/dNet = out * (1 - out)
      // delta_o = dE/dNet = -(target - out) * out * (1 - out)
      // Note: Some texts define error as (out - target), we used 0.5(target - out)^2
      // Let's stick to: delta = (output - target) * sigmoid_derivative(output)
      // If Loss = 0.5(target - output)^2 -> dE/dOut = -(target - output) = (output - target)
      
      const output = prev.outputActivations[0];
      const deltaOutput = (output - prev.target) * sigmoidDerivativeFromActivation(output);
      
      // Hidden Gradient (delta_h)
      // delta_h = (sum(delta_o * w_ho)) * sigmoid_derivative(hidden_out)
      const hiddenGradients = prev.hiddenActivations.map((hVal, hIdx) => {
        let sumWeightedDeltas = 0;
        for (let o = 0; o < prev.outputCount; o++) {
          // In this sim outputCount is 1, but keeping loop for generality
          // We use the deltaOutput we just calculated (which is a single value array effectively)
          sumWeightedDeltas += deltaOutput * prev.weightsHiddenOutput[hIdx][o];
        }
        return sumWeightedDeltas * sigmoidDerivativeFromActivation(hVal);
      });

      return {
        ...prev,
        outputGradients: [deltaOutput],
        hiddenGradients
      };
    });
    setPhase('BACKWARD');
  }, []);

  const stepUpdate = useCallback(() => {
    setState(prev => {
      const lr = prev.learningRate;
      
      // Update Hidden->Output Weights
      const newWeightsHO = prev.weightsHiddenOutput.map((row, hIdx) => {
        return row.map((w, oIdx) => {
          // dE/dw = delta_o * hidden_activation
          const gradient = prev.outputGradients[oIdx] * prev.hiddenActivations[hIdx];
          return w - lr * gradient;
        });
      });

      // Update Output Bias
      const newBiasO = prev.biasOutput.map((b, oIdx) => {
        return b - lr * prev.outputGradients[oIdx];
      });

      // Update Input->Hidden Weights
      const newWeightsIH = prev.weightsInputHidden.map((row, iIdx) => {
        return row.map((w, hIdx) => {
          // dE/dw = delta_h * input_value
          const gradient = prev.hiddenGradients[hIdx] * prev.inputs[iIdx];
          return w - lr * gradient;
        });
      });

      // Update Hidden Bias
      const newBiasH = prev.biasHidden.map((b, hIdx) => {
        return b - lr * prev.hiddenGradients[hIdx];
      });

      return {
        ...prev,
        weightsHiddenOutput: newWeightsHO,
        biasOutput: newBiasO,
        weightsInputHidden: newWeightsIH,
        biasHidden: newBiasH,
        epoch: prev.epoch + 1
      };
    });
    setPhase('UPDATE');
  }, []);

  const nextStep = useCallback(() => {
    setPhase(current => {
      switch (current) {
        case 'IDLE':
        case 'UPDATE':
          stepForward();
          return 'FORWARD';
        case 'FORWARD':
          stepError();
          return 'ERROR';
        case 'ERROR':
          stepBackward();
          return 'BACKWARD';
        case 'BACKWARD':
          stepUpdate();
          return 'UPDATE';
        default:
          return 'IDLE';
      }
    });
  }, [stepForward, stepError, stepBackward, stepUpdate]);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setPhase('IDLE');
    setState(prev => ({
      ...prev,
      epoch: 0,
      totalError: 0,
      rawError: 0,
      hiddenNetInputs: Array(prev.hiddenCount).fill(0),
      hiddenActivations: Array(prev.hiddenCount).fill(0),
      outputNetInputs: Array(prev.outputCount).fill(0),
      outputActivations: Array(prev.outputCount).fill(0),
      outputGradients: Array(prev.outputCount).fill(0),
      hiddenGradients: Array(prev.hiddenCount).fill(0),
    }));
  }, []);

  const setInput = (index: number, val: number) => {
    setState(prev => {
      const newInputs = [...prev.inputs];
      newInputs[index] = val;
      return { ...prev, inputs: newInputs };
    });
  };

  const setTarget = (val: number) => {
    setState(prev => ({ ...prev, target: val }));
  };

  const setLearningRate = (val: number) => {
    setState(prev => ({ ...prev, learningRate: val }));
  };

  const updateWeight = (layer: 'input' | 'hidden', i: number, j: number, val: number) => {
    setState(prev => {
      if (layer === 'input') {
        const newW = prev.weightsInputHidden.map(row => [...row]);
        newW[i][j] = val;
        return { ...prev, weightsInputHidden: newW };
      } else {
        const newW = prev.weightsHiddenOutput.map(row => [...row]);
        newW[i][j] = val;
        return { ...prev, weightsHiddenOutput: newW };
      }
    });
  };

  const updateBias = (layer: 'hidden' | 'output', index: number, val: number) => {
    setState(prev => {
       if (layer === 'hidden') {
         const newB = [...prev.biasHidden];
         newB[index] = val;
         return { ...prev, biasHidden: newB };
       } else {
         const newB = [...prev.biasOutput];
         newB[index] = val;
         return { ...prev, biasOutput: newB };
       }
    });
  };

  // Auto Play Logic
  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        nextStep();
      }, 1000); // 1 second per step
    } else {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    }
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [isPlaying, nextStep]);

  return {
    state,
    phase,
    isPlaying,
    setIsPlaying,
    nextStep,
    reset,
    updateArchitecture,
    setInput,
    setTarget,
    setLearningRate,
    updateWeight,
    updateBias
  };
};
