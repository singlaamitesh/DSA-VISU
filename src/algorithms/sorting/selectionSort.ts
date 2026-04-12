import { AlgorithmConfig, AnimationStep } from '../types';

function* selectionSortGenerator(arr: number[]): Generator<AnimationStep> {
  const a = [...arr];
  const n = a.length;

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;

    yield {
      type: 'highlight',
      indices: [i],
      data: [...a],
      codeLine: 3,
      explanation: `Finding minimum element starting from index ${i}`,
    };

    for (let j = i + 1; j < n; j++) {
      yield {
        type: 'compare',
        indices: [j, minIdx],
        data: [...a],
        codeLine: 5,
        explanation: `Comparing a[${j}]=${a[j]} with current min a[${minIdx}]=${a[minIdx]}`,
      };

      if (a[j] < a[minIdx]) {
        minIdx = j;
      }
    }

    if (minIdx !== i) {
      [a[i], a[minIdx]] = [a[minIdx], a[i]];
      yield {
        type: 'swap',
        indices: [i, minIdx],
        data: [...a],
        codeLine: 9,
        explanation: `Placing minimum a[${i}]=${a[i]} at position ${i}`,
      };
    }
  }

  yield {
    type: 'done',
    indices: [],
    data: [...a],
    codeLine: 12,
    explanation: 'Array is sorted!',
  };
}

const code = `function selectionSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      if (arr[j] < arr[minIdx]) {
        minIdx = j;
      }
    }
    if (minIdx !== i) {
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
    }
  }
  return arr;
}`;

export const selectionSort: AlgorithmConfig = {
  id: 'selectionSort',
  name: 'Selection Sort',
  category: 'sorting',
  difficulty: 'Easy',
  timeComplexity: 'O(n²)',
  spaceComplexity: 'O(1)',
  description:
    'Selection Sort divides the array into a sorted and unsorted region. It repeatedly selects the minimum element from the unsorted region and places it at the end of the sorted region.',
  code,
  defaultInput: [64, 25, 12, 22, 11, 90, 45, 78, 34, 56],
  generator: selectionSortGenerator,
};
