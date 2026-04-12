import { AlgorithmConfig, AnimationStep } from '../types';

function* quickSortGenerator(arr: number[]): Generator<AnimationStep> {
  const a = [...arr];
  yield* quickSortHelper(a, 0, a.length - 1);
  yield {
    type: 'done',
    indices: [],
    data: [...a],
    codeLine: 20,
    explanation: 'Array is sorted!',
  };
}

function* quickSortHelper(
  a: number[],
  low: number,
  high: number
): Generator<AnimationStep> {
  if (low >= high) return;

  const pivotIdx = yield* partition(a, low, high);
  yield* quickSortHelper(a, low, pivotIdx - 1);
  yield* quickSortHelper(a, pivotIdx + 1, high);
}

function* partition(
  a: number[],
  low: number,
  high: number
): Generator<AnimationStep, number> {
  const pivot = a[high];

  yield {
    type: 'highlight',
    indices: [high],
    data: [...a],
    codeLine: 4,
    explanation: `Pivot selected: a[${high}]=${pivot}`,
  };

  let i = low - 1;

  for (let j = low; j < high; j++) {
    yield {
      type: 'compare',
      indices: [j, high],
      data: [...a],
      codeLine: 8,
      explanation: `Comparing a[${j}]=${a[j]} with pivot=${pivot}`,
    };

    if (a[j] <= pivot) {
      i++;
      [a[i], a[j]] = [a[j], a[i]];
      if (i !== j) {
        yield {
          type: 'swap',
          indices: [i, j],
          data: [...a],
          codeLine: 10,
          explanation: `Swapping a[${i}]=${a[i]} and a[${j}]=${a[j]} (element <= pivot)`,
        };
      }
    }
  }

  [a[i + 1], a[high]] = [a[high], a[i + 1]];
  yield {
    type: 'swap',
    indices: [i + 1, high],
    data: [...a],
    codeLine: 13,
    explanation: `Placing pivot=${pivot} at its correct position ${i + 1}`,
  };

  return i + 1;
}

const code = `function quickSort(arr, low = 0, high = arr.length - 1) {
  if (low >= high) return;
  const pivotIdx = partition(arr, low, high);
  quickSort(arr, low, pivotIdx - 1);
  quickSort(arr, pivotIdx + 1, high);
}

function partition(arr, low, high) {
  const pivot = arr[high];
  let i = low - 1;
  for (let j = low; j < high; j++) {
    if (arr[j] <= pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
  return i + 1;
}`;

export const quickSort: AlgorithmConfig = {
  id: 'quickSort',
  name: 'Quick Sort',
  category: 'sorting',
  difficulty: 'Medium',
  timeComplexity: 'O(n log n)',
  spaceComplexity: 'O(log n)',
  description:
    'Quick Sort is a divide-and-conquer algorithm that selects a pivot element, partitions the array around the pivot, and recursively sorts the sub-arrays on each side.',
  code,
  defaultInput: [10, 80, 30, 90, 40, 50, 70, 60, 20, 15],
  generator: quickSortGenerator,
};
