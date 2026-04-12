import { AlgorithmConfig, AnimationStep } from '../types';

function* bubbleSortGenerator(arr: number[]): Generator<AnimationStep> {
  const a = [...arr];
  const n = a.length;

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      yield {
        type: 'compare',
        indices: [j, j + 1],
        data: [...a],
        codeLine: 4,
        explanation: `Comparing a[${j}]=${a[j]} and a[${j + 1}]=${a[j + 1]}`,
      };

      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        yield {
          type: 'swap',
          indices: [j, j + 1],
          data: [...a],
          codeLine: 5,
          explanation: `Swapping a[${j}]=${a[j]} and a[${j + 1}]=${a[j + 1]}`,
        };
      }
    }
  }

  yield {
    type: 'done',
    indices: [],
    data: [...a],
    codeLine: 8,
    explanation: 'Array is sorted!',
  };
}

const code = `function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j+1]] = [arr[j+1], arr[j]];
      }
    }
  }
  return arr;
}`;

export const bubbleSort: AlgorithmConfig = {
  id: 'bubbleSort',
  name: 'Bubble Sort',
  category: 'sorting',
  difficulty: 'Easy',
  timeComplexity: 'O(n²)',
  spaceComplexity: 'O(1)',
  description:
    'Bubble Sort repeatedly steps through the list, compares adjacent elements and swaps them if they are in the wrong order. The pass through the list is repeated until the list is sorted.',
  code,
  defaultInput: [64, 34, 25, 12, 22, 11, 90, 45, 78, 56],
  generator: bubbleSortGenerator,
};
