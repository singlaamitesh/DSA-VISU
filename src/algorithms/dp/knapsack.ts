import { AlgorithmConfig, AnimationStep, DPTableData } from '../types';

function* knapsackGenerator(
  weights: number[],
  values: number[],
  capacity: number
): Generator<AnimationStep> {
  const n = weights.length;

  // Build row and column labels
  const rowLabels: string[] = ['0'];
  for (let i = 1; i <= n; i++) {
    rowLabels.push(`Item ${i} (w=${weights[i - 1]}, v=${values[i - 1]})`);
  }
  const colLabels: string[] = Array.from({ length: capacity + 1 }, (_, w) => String(w));

  // Initialize DP table with zeros
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(capacity + 1).fill(0));

  const buildTableData = (highlightRow: number, highlightCol: number): DPTableData => ({
    table: dp.map(row => [...row]),
    rows: rowLabels,
    cols: colLabels,
    highlightCell: [highlightRow, highlightCol],
  });

  // Highlight initialization (row 0 and col 0 are all zeros)
  yield {
    type: 'highlight',
    indices: [0],
    data: buildTableData(0, 0),
    codeLine: 3,
    explanation: 'Initialize DP table: dp[0][w] = 0 for all w (no items), dp[i][0] = 0 for all i (zero capacity)',
  };

  // Fill the DP table
  for (let i = 1; i <= n; i++) {
    const itemWeight = weights[i - 1];
    const itemValue = values[i - 1];

    for (let w = 0; w <= capacity; w++) {
      // Show comparison: can we include this item?
      yield {
        type: 'compare',
        indices: [i, w],
        data: buildTableData(i, w),
        codeLine: 7,
        explanation: `Item ${i} (w=${itemWeight}, v=${itemValue}): checking capacity w=${w}. Item weight ${itemWeight} ${itemWeight <= w ? '<=' : '>'} ${w}`,
      };

      if (itemWeight <= w) {
        dp[i][w] = Math.max(dp[i - 1][w], dp[i - 1][w - itemWeight] + itemValue);
        yield {
          type: 'fill',
          indices: [i, w],
          data: buildTableData(i, w),
          codeLine: 8,
          explanation: `Include or skip Item ${i}: max(dp[${i - 1}][${w}]=${dp[i - 1][w]}, dp[${i - 1}][${w - itemWeight}]+${itemValue}=${dp[i - 1][w - itemWeight] + itemValue}) = ${dp[i][w]}`,
        };
      } else {
        dp[i][w] = dp[i - 1][w];
        yield {
          type: 'fill',
          indices: [i, w],
          data: buildTableData(i, w),
          codeLine: 10,
          explanation: `Cannot include Item ${i} (weight ${itemWeight} > capacity ${w}): dp[${i}][${w}] = dp[${i - 1}][${w}] = ${dp[i][w]}`,
        };
      }
    }
  }

  yield {
    type: 'done',
    indices: [],
    data: buildTableData(n, capacity),
    codeLine: 14,
    explanation: `Knapsack complete. Maximum value = ${dp[n][capacity]}`,
  };
}

const code = `function knapsack(weights, values, capacity) {
  const n = weights.length;
  const dp = Array.from({length: n+1}, () => new Array(capacity+1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= capacity; w++) {
      if (weights[i-1] <= w) {
        dp[i][w] = Math.max(dp[i-1][w],
          dp[i-1][w - weights[i-1]] + values[i-1]);
      } else {
        dp[i][w] = dp[i-1][w];
      }
    }
  }
  return dp[n][capacity];
}`;

export const knapsack: AlgorithmConfig = {
  id: 'knapsack',
  name: '0/1 Knapsack',
  category: 'dp',
  difficulty: 'Medium',
  timeComplexity: 'O(nW)',
  spaceComplexity: 'O(nW)',
  description:
    'The 0/1 Knapsack problem finds the maximum value achievable by selecting items with given weights and values without exceeding a capacity. Each item can either be included (1) or excluded (0), solved using a 2D DP table.',
  code,
  defaultInput: { weights: [2, 3, 4, 5], values: [3, 4, 5, 6], capacity: 8 },
  generator: (input: { weights: number[]; values: number[]; capacity: number }) =>
    knapsackGenerator(input.weights, input.values, input.capacity),
};
