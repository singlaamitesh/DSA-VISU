import { AlgorithmConfig, AnimationStep } from '../types';

function* binarySearchGenerator(arr: number[], target: number): Generator<AnimationStep> {
  const a = [...arr].sort((x, y) => x - y);
  let low = 0;
  let high = a.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);

    yield {
      type: 'highlight',
      indices: Array.from({ length: high - low + 1 }, (_, k) => low + k),
      data: [...a],
      codeLine: 4,
      explanation: `Searching range [${low}..${high}], mid=${mid}`,
      metadata: { low, high, mid },
    };

    yield {
      type: 'compare',
      indices: [mid],
      data: [...a],
      codeLine: 5,
      explanation: `Comparing a[${mid}]=${a[mid]} with target=${target}`,
      metadata: { low, high, mid },
    };

    if (a[mid] === target) {
      yield {
        type: 'done',
        indices: [mid],
        data: [...a],
        codeLine: 6,
        explanation: `Found target ${target} at index ${mid}`,
        metadata: { found: true, low, high, mid },
      };
      return;
    } else if (a[mid] < target) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  yield {
    type: 'done',
    indices: [],
    data: [...a],
    codeLine: 11,
    explanation: `Target ${target} not found in array`,
    metadata: { found: false },
  };
}

const code = `function binarySearch(arr, target) {
  const a = [...arr].sort((x, y) => x - y);
  let low = 0, high = a.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (a[mid] === target) return mid;
    else if (a[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}`;

export const binarySearch: AlgorithmConfig = {
  id: 'binarySearch',
  name: 'Binary Search',
  category: 'searching',
  difficulty: 'Easy',
  timeComplexity: 'O(log n)',
  spaceComplexity: 'O(1)',
  description:
    'Binary Search works on sorted arrays by repeatedly dividing the search interval in half. It compares the target with the middle element and eliminates half of the remaining elements each iteration.',
  code,
  defaultInput: [11, 22, 33, 44, 55, 66, 77, 88, 99],
  generator: (arr: number[]) => binarySearchGenerator(arr, 55),
};
