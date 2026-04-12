import { AlgorithmConfig, AnimationStep, DPTableData } from '../types';

function* fibonacciGenerator(n: number): Generator<AnimationStep> {
  const dp: number[] = new Array(n + 1).fill(0);
  const indices = Array.from({ length: n + 1 }, (_, i) => i);

  const buildTableData = (highlightCol: number): DPTableData => ({
    table: [indices, [...dp]],
    rows: ['Index', 'Value'],
    cols: indices.map(String),
    highlightCell: [1, highlightCol],
  });

  // Base case: F(0) = 0
  dp[0] = 0;
  yield {
    type: 'fill',
    indices: [0],
    data: buildTableData(0),
    codeLine: 2,
    explanation: 'Base case: F(0) = 0',
  };

  if (n >= 1) {
    // Base case: F(1) = 1
    dp[1] = 1;
    yield {
      type: 'fill',
      indices: [1],
      data: buildTableData(1),
      codeLine: 3,
      explanation: 'Base case: F(1) = 1',
    };
  }

  for (let i = 2; i <= n; i++) {
    // Show the comparison: F(i-1) + F(i-2)
    yield {
      type: 'compare',
      indices: [i - 1, i - 2],
      data: buildTableData(i),
      codeLine: 6,
      explanation: `Computing F(${i}) = F(${i - 1}) + F(${i - 2}) = ${dp[i - 1]} + ${dp[i - 2]}`,
    };

    dp[i] = dp[i - 1] + dp[i - 2];

    // Fill the computed value
    yield {
      type: 'fill',
      indices: [i],
      data: buildTableData(i),
      codeLine: 7,
      explanation: `F(${i}) = ${dp[i]}`,
    };
  }

  yield {
    type: 'done',
    indices: [],
    data: buildTableData(n),
    codeLine: 10,
    explanation: `Fibonacci sequence complete. F(${n}) = ${dp[n]}`,
  };
}

const code = `function fibonacci(n) {
  const dp = new Array(n + 1).fill(0);
  dp[0] = 0;
  dp[1] = 1;

  for (let i = 2; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2];
  }

  return dp[n];
}`;

export const fibonacci: AlgorithmConfig = {
  id: 'fibonacci',
  name: 'Fibonacci (DP)',
  category: 'dp',
  difficulty: 'Easy',
  timeComplexity: 'O(n)',
  spaceComplexity: 'O(n)',
  description:
    'Computes the nth Fibonacci number using dynamic programming (bottom-up tabulation). Each value is computed once and stored in a table, avoiding the exponential recomputation of naive recursion.',
  code,
  defaultInput: 10,
  generator: (n: number) => fibonacciGenerator(n),
};
