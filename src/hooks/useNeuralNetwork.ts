import { useState, useCallback, useRef, useEffect } from 'react';
import { NeuralNetworkState, SimulationPhase, TrainingLogEntry } from '../types';
import { sigmoid, sigmoidDerivativeFromActivation, mse, randomWeight } from '../utils/math';

const DEFAULT_INPUTS = [0.1, 0.1];
const DEFAULT_TARGET = 0.1;
const DEFAULT_LR = 0.2;
const DEFAULT_HIDDEN_LAYERS = [2];

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const createMatrix = (rows: number, cols: number, fill: () => number) =>
  Array.from({ length: rows }, () => Array.from({ length: cols }, fill));

const resizeVector = (prev: number[] | undefined, size: number, fallback: () => number) =>
  Array.from({ length: size }, (_, index) => prev?.[index] ?? fallback());

const resizeMatrix = (
  prev: number[][] | undefined,
  rows: number,
  cols: number,
  fallback: () => number
) =>
  Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => prev?.[row]?.[col] ?? fallback())
  );

const buildLayerSizes = (inputCount: number, hiddenLayers: number[], outputCount: number) => [
  inputCount,
  ...hiddenLayers,
  outputCount,
];

const ensureArchitecture = (
  prev: NeuralNetworkState,
  newInputCount: number,
  newHiddenLayers: number[]
): NeuralNetworkState => {
  const inputCount = clamp(newInputCount, 1, 5);
  const hiddenLayers = newHiddenLayers.map((count) => clamp(count, 1, 5));
  const outputCount = prev.outputCount;

  const newInputs = resizeVector(prev.inputs, inputCount, () => 0.1);
  const layerSizes = buildLayerSizes(inputCount, hiddenLayers, outputCount);

  const weights = Array.from({ length: layerSizes.length - 1 }, (_, matrixIndex) => {
    const from = layerSizes[matrixIndex];
    const to = layerSizes[matrixIndex + 1];
    return resizeMatrix(prev.weights[matrixIndex], from, to, randomWeight);
  });

  const biases = Array.from({ length: hiddenLayers.length + 1 }, (_, biasLayerIndex) => {
    const size = biasLayerIndex < hiddenLayers.length ? hiddenLayers[biasLayerIndex] : outputCount;
    return resizeVector(prev.biases[biasLayerIndex], size, randomWeight);
  });

  return {
    ...prev,
    inputCount,
    hiddenLayers,
    inputs: newInputs,
    weights,
    biases,
    hiddenNetInputs: hiddenLayers.map((count) => Array(count).fill(0)),
    hiddenActivations: hiddenLayers.map((count) => Array(count).fill(0)),
    hiddenGradients: hiddenLayers.map((count) => Array(count).fill(0)),
    outputNetInputs: Array(outputCount).fill(0),
    outputActivations: Array(outputCount).fill(0),
    outputGradients: Array(outputCount).fill(0),
  };
};

const createInitialState = (): NeuralNetworkState => {
  const inputCount = 2;
  const hiddenLayers = [...DEFAULT_HIDDEN_LAYERS];
  const outputCount = 1;
  const layerSizes = buildLayerSizes(inputCount, hiddenLayers, outputCount);

  const weights = Array.from({ length: layerSizes.length - 1 }, (_, matrixIndex) =>
    createMatrix(layerSizes[matrixIndex], layerSizes[matrixIndex + 1], randomWeight)
  );

  const biases = Array.from({ length: hiddenLayers.length + 1 }, (_, index) => {
    const size = index < hiddenLayers.length ? hiddenLayers[index] : outputCount;
    return Array(size).fill(0).map(randomWeight);
  });

  return {
    inputs: [...DEFAULT_INPUTS],
    target: DEFAULT_TARGET,
    learningRate: DEFAULT_LR,
    inputCount,
    hiddenLayers,
    outputCount,
    weights,
    biases,
    hiddenNetInputs: hiddenLayers.map((count) => Array(count).fill(0)),
    hiddenActivations: hiddenLayers.map((count) => Array(count).fill(0)),
    outputNetInputs: Array(outputCount).fill(0),
    outputActivations: Array(outputCount).fill(0),
    outputGradients: Array(outputCount).fill(0),
    hiddenGradients: hiddenLayers.map((count) => Array(count).fill(0)),
    epoch: 0,
    totalError: 0,
    rawError: 0,
  };
};

export const useNeuralNetwork = () => {
  const [phase, setPhase] = useState<SimulationPhase>('IDLE');
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlayTargetEpoch, setAutoPlayTargetEpoch] = useState<number | null>(null);
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [state, setState] = useState<NeuralNetworkState>(createInitialState);
  const [trainingLog, setTrainingLog] = useState<TrainingLogEntry[]>([]);

  const appendLog = useCallback((s: NeuralNetworkState, p: SimulationPhase) => {
    setTrainingLog((prev) => {
      const entry: TrainingLogEntry = {
        epoch: s.epoch,
        phase: p,
        timestamp: Date.now(),
        inputs: [...s.inputs],
        target: s.target,
        learningRate: s.learningRate,
        hiddenActivations: s.hiddenActivations.map((a) => [...a]),
        outputActivations: [...s.outputActivations],
        hiddenNetInputs: s.hiddenNetInputs.map((a) => [...a]),
        outputNetInputs: [...s.outputNetInputs],
        outputGradients: [...s.outputGradients],
        hiddenGradients: s.hiddenGradients.map((a) => [...a]),
        weights: s.weights.map((m) => m.map((r) => [...r])),
        biases: s.biases.map((r) => [...r]),
        totalError: s.totalError,
        rawError: s.rawError,
      };
      // Keep last 500 entries to avoid memory issues
      const next = [...prev, entry];
      return next.length > 500 ? next.slice(-500) : next;
    });
  }, []);

  const updateArchitecture = (newInputCount: number, newHiddenLayers: number[]) => {
    setState((prev) => ensureArchitecture(prev, newInputCount, newHiddenLayers));
    setPhase('IDLE');
  };

  const stepForward = useCallback(() => {
    setState((prev) => {
      const hiddenNetInputs: number[][] = [];
      const hiddenActivations: number[][] = [];

      let prevActivations = [...prev.inputs];

      for (let layerIndex = 0; layerIndex < prev.hiddenLayers.length; layerIndex++) {
        const weights = prev.weights[layerIndex];
        const biases = prev.biases[layerIndex];

        const netInputs = biases.map((bias, neuronIndex) => {
          let sum = bias;
          for (let source = 0; source < prevActivations.length; source++) {
            sum += prevActivations[source] * weights[source][neuronIndex];
          }
          return sum;
        });

        const activations = netInputs.map(sigmoid);
        hiddenNetInputs.push(netInputs);
        hiddenActivations.push(activations);
        prevActivations = activations;
      }

      const outputMatrixIndex = prev.hiddenLayers.length;
      const outputWeights = prev.weights[outputMatrixIndex];
      const outputBiases = prev.biases[outputMatrixIndex];

      const outputNetInputs = outputBiases.map((bias, outputIndex) => {
        let sum = bias;
        for (let source = 0; source < prevActivations.length; source++) {
          sum += prevActivations[source] * outputWeights[source][outputIndex];
        }
        return sum;
      });

      const outputActivations = outputNetInputs.map(sigmoid);

      return {
        ...prev,
        hiddenNetInputs,
        hiddenActivations,
        outputNetInputs,
        outputActivations,
      };
    });
  }, []);

  const stepError = useCallback(() => {
    setState((prev) => {
      const output = prev.outputActivations[0] ?? 0;
      const err = mse(prev.target, output);
      const raw = prev.target - output;
      return {
        ...prev,
        totalError: err,
        rawError: raw,
      };
    });
  }, []);

  const stepBackward = useCallback(() => {
    setState((prev) => {
      const outputGradients = prev.outputActivations.map((output, outputIndex) => {
        const target = outputIndex === 0 ? prev.target : 0;
        return (output - target) * sigmoidDerivativeFromActivation(output);
      });

      const hiddenGradients: number[][] = prev.hiddenLayers.map((count) => Array(count).fill(0));

      for (let layerIndex = prev.hiddenLayers.length - 1; layerIndex >= 0; layerIndex--) {
        const activations = prev.hiddenActivations[layerIndex];
        const nextGradients =
          layerIndex === prev.hiddenLayers.length - 1
            ? outputGradients
            : hiddenGradients[layerIndex + 1];
        const nextWeights = prev.weights[layerIndex + 1];

        for (let neuronIndex = 0; neuronIndex < activations.length; neuronIndex++) {
          let weightedSum = 0;
          for (let nextIndex = 0; nextIndex < nextGradients.length; nextIndex++) {
            weightedSum += nextGradients[nextIndex] * nextWeights[neuronIndex][nextIndex];
          }
          hiddenGradients[layerIndex][neuronIndex] =
            weightedSum * sigmoidDerivativeFromActivation(activations[neuronIndex]);
        }
      }

      return {
        ...prev,
        outputGradients,
        hiddenGradients,
      };
    });
  }, []);

  const stepUpdate = useCallback(() => {
    setState((prev) => {
      const lr = prev.learningRate;
      const newWeights = prev.weights.map((matrix) => matrix.map((row) => [...row]));
      const newBiases = prev.biases.map((row) => [...row]);

      for (let matrixIndex = 0; matrixIndex < newWeights.length; matrixIndex++) {
        const sourceActivations =
          matrixIndex === 0 ? prev.inputs : prev.hiddenActivations[matrixIndex - 1];
        const targetGradients =
          matrixIndex === prev.hiddenLayers.length
            ? prev.outputGradients
            : prev.hiddenGradients[matrixIndex];

        for (let sourceIndex = 0; sourceIndex < newWeights[matrixIndex].length; sourceIndex++) {
          for (let targetIndex = 0; targetIndex < newWeights[matrixIndex][sourceIndex].length; targetIndex++) {
            const gradient = sourceActivations[sourceIndex] * targetGradients[targetIndex];
            newWeights[matrixIndex][sourceIndex][targetIndex] -= lr * gradient;
          }
        }

        for (let targetIndex = 0; targetIndex < newBiases[matrixIndex].length; targetIndex++) {
          newBiases[matrixIndex][targetIndex] -= lr * targetGradients[targetIndex];
        }
      }

      return {
        ...prev,
        weights: newWeights,
        biases: newBiases,
        epoch: prev.epoch + 1,
      };
    });
  }, []);

  const stopAutoPlay = useCallback(() => {
    setIsPlaying(false);
    setAutoPlayTargetEpoch(null);
  }, []);

  const startAutoPlay = useCallback(
    (epochs?: number) => {
      if (epochs && epochs > 0) {
        setAutoPlayTargetEpoch(state.epoch + epochs);
      } else {
        setAutoPlayTargetEpoch(null);
      }
      setIsPlaying(true);
    },
    [state.epoch]
  );

  const phaseRef = useRef<SimulationPhase>('IDLE');

  // Keep the ref in sync with state
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const nextStep = useCallback(() => {
    const current = phaseRef.current;
    let nextPhase: SimulationPhase = 'IDLE';
    switch (current) {
      case 'IDLE':
      case 'UPDATE':
        stepForward();
        nextPhase = 'FORWARD';
        break;
      case 'FORWARD':
        stepError();
        nextPhase = 'ERROR';
        break;
      case 'ERROR':
        stepBackward();
        nextPhase = 'BACKWARD';
        break;
      case 'BACKWARD':
        stepUpdate();
        nextPhase = 'UPDATE';
        break;
    }
    setPhase(nextPhase);
    phaseRef.current = nextPhase;
    // Log after state update settles (use setTimeout to read latest state)
    setTimeout(() => {
      setState((s) => {
        appendLog(s, nextPhase);
        return s; // don't mutate
      });
    }, 0);
  }, [stepForward, stepError, stepBackward, stepUpdate, appendLog]);

  const clearLog = useCallback(() => {
    setTrainingLog([]);
  }, []);

  const reset = useCallback(() => {
    stopAutoPlay();
    setPhase('IDLE');
    phaseRef.current = 'IDLE';
    setTrainingLog([]);
    setState((prev) => ({
      ...prev,
      epoch: 0,
      totalError: 0,
      rawError: 0,
      hiddenNetInputs: prev.hiddenLayers.map((count) => Array(count).fill(0)),
      hiddenActivations: prev.hiddenLayers.map((count) => Array(count).fill(0)),
      outputNetInputs: Array(prev.outputCount).fill(0),
      outputActivations: Array(prev.outputCount).fill(0),
      outputGradients: Array(prev.outputCount).fill(0),
      hiddenGradients: prev.hiddenLayers.map((count) => Array(count).fill(0)),
    }));
  }, [stopAutoPlay]);

  const setInput = (index: number, val: number) => {
    setState((prev) => {
      const newInputs = [...prev.inputs];
      newInputs[index] = val;
      return { ...prev, inputs: newInputs };
    });
  };

  const setTarget = (val: number) => {
    setState((prev) => ({ ...prev, target: val }));
  };

  const setLearningRate = (val: number) => {
    setState((prev) => ({ ...prev, learningRate: val }));
  };

  const updateWeight = (matrixIndex: number, sourceIndex: number, targetIndex: number, value: number) => {
    setState((prev) => {
      const weights = prev.weights.map((matrix) => matrix.map((row) => [...row]));
      if (weights[matrixIndex]?.[sourceIndex]?.[targetIndex] === undefined) {
        return prev;
      }
      weights[matrixIndex][sourceIndex][targetIndex] = value;
      return { ...prev, weights };
    });
  };

  const updateBias = (biasLayerIndex: number, index: number, value: number) => {
    setState((prev) => {
      const biases = prev.biases.map((row) => [...row]);
      if (biases[biasLayerIndex]?.[index] === undefined) {
        return prev;
      }
      biases[biasLayerIndex][index] = value;
      return { ...prev, biases };
    });
  };

  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        nextStep();
      }, 1000);
    } else if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying, nextStep]);

  useEffect(() => {
    if (isPlaying && autoPlayTargetEpoch !== null && state.epoch >= autoPlayTargetEpoch) {
      stopAutoPlay();
    }
  }, [autoPlayTargetEpoch, isPlaying, state.epoch, stopAutoPlay]);

  return {
    state,
    phase,
    isPlaying,
    setIsPlaying,
    startAutoPlay,
    stopAutoPlay,
    nextStep,
    reset,
    updateArchitecture,
    setInput,
    setTarget,
    setLearningRate,
    updateWeight,
    updateBias,
    trainingLog,
    clearLog,
  };
};
