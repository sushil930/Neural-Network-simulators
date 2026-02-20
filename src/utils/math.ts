export const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

export const sigmoidDerivative = (x: number) => {
  const sx = sigmoid(x);
  return sx * (1 - sx);
};

// Derivative using the activation value directly (since a = sigmoid(z))
export const sigmoidDerivativeFromActivation = (activation: number) => {
  return activation * (1 - activation);
};

export const mse = (target: number, output: number) => {
  return 0.5 * Math.pow(target - output, 2);
};

export const randomWeight = () => (Math.random() * 2 - 1); // -1 to 1

export const formatNumber = (num: number) => Number(num.toFixed(4));
