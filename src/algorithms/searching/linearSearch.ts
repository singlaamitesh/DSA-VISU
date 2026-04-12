import { AlgorithmConfig, AnimationStep } from '../types';

function* linearSearchGenerator(arr: number[], target: number): Generator<AnimationStep> {
  const a = [...arr];
  const n = a.length;

  for (let i = 0; i < n; i++) {
    yield {
      type: 'compare',
      indices: [i],
      data: [...a],
      codeLine: 3,
      explanation: `Comparing a[${i}]=${a[i]} with target=${target}`,
    };

    if (a[i] === target) {
      yield {
        type: 'done',
        indices: [i],
        data: [...a],
        codeLine: 4,
        explanation: `Found target ${target} at index ${i}`,
        metadata: { found: true },
      };
      return;
    }
  }

  yield {
    type: 'done',
    indices: [],
    data: [...a],
    codeLine: 7,
    explanation: `Target ${target} not found in array`,
    metadata: { found: false },
  };
}

const code = `function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) {
      return i;
    }
  }
  return -1;
}`;

export const linearSearch: AlgorithmConfig = {
  id: 'linearSearch',
  name: 'Linear Search',
  category: 'searching',
  difficulty: 'Easy',
  timeComplexity: 'O(n)',
  spaceComplexity: 'O(1)',
  description:
    'Linear Search sequentially checks each element of the list until a match is found or the whole list has been searched. It is the simplest searching algorithm.',
  code,
  defaultInput: [23, 45, 12, 67, 34, 89, 56, 78, 90, 11],
  generator: (arr: number[]) => linearSearchGenerator(arr, 67),
};
