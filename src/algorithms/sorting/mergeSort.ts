import { AlgorithmConfig, AnimationStep } from '../types';

function* mergeSortGenerator(arr: number[]): Generator<AnimationStep> {
  const a = [...arr];
  yield* mergeSortHelper(a, 0, a.length - 1);
  yield {
    type: 'done',
    indices: [],
    data: [...a],
    codeLine: 18,
    explanation: 'Array is sorted!',
  };
}

function* mergeSortHelper(
  a: number[],
  left: number,
  right: number
): Generator<AnimationStep> {
  if (left >= right) return;

  const mid = Math.floor((left + right) / 2);

  yield {
    type: 'highlight',
    indices: Array.from({ length: right - left + 1 }, (_, k) => left + k),
    data: [...a],
    codeLine: 3,
    explanation: `Dividing subarray [${left}..${right}] at midpoint ${mid}`,
  };

  yield* mergeSortHelper(a, left, mid);
  yield* mergeSortHelper(a, mid + 1, right);
  yield* merge(a, left, mid, right);
}

function* merge(
  a: number[],
  left: number,
  mid: number,
  right: number
): Generator<AnimationStep> {
  const leftArr = a.slice(left, mid + 1);
  const rightArr = a.slice(mid + 1, right + 1);

  let i = 0;
  let j = 0;
  let k = left;

  while (i < leftArr.length && j < rightArr.length) {
    yield {
      type: 'compare',
      indices: [left + i, mid + 1 + j],
      data: [...a],
      codeLine: 12,
      explanation: `Comparing left[${i}]=${leftArr[i]} and right[${j}]=${rightArr[j]}`,
    };

    if (leftArr[i] <= rightArr[j]) {
      a[k] = leftArr[i];
      i++;
    } else {
      a[k] = rightArr[j];
      j++;
    }

    yield {
      type: 'fill',
      indices: [k],
      data: [...a],
      codeLine: 14,
      explanation: `Placing ${a[k]} at position ${k}`,
    };

    k++;
  }

  while (i < leftArr.length) {
    a[k] = leftArr[i];
    yield {
      type: 'fill',
      indices: [k],
      data: [...a],
      codeLine: 15,
      explanation: `Copying remaining left element ${a[k]} to position ${k}`,
    };
    i++;
    k++;
  }

  while (j < rightArr.length) {
    a[k] = rightArr[j];
    yield {
      type: 'fill',
      indices: [k],
      data: [...a],
      codeLine: 16,
      explanation: `Copying remaining right element ${a[k]} to position ${k}`,
    };
    j++;
    k++;
  }
}

const code = `function mergeSort(arr, left = 0, right = arr.length - 1) {
  if (left >= right) return;
  const mid = Math.floor((left + right) / 2);
  mergeSort(arr, left, mid);
  mergeSort(arr, mid + 1, right);
  merge(arr, left, mid, right);
}

function merge(arr, left, mid, right) {
  const L = arr.slice(left, mid + 1);
  const R = arr.slice(mid + 1, right + 1);
  let i = 0, j = 0, k = left;
  while (i < L.length && j < R.length) {
    if (L[i] <= R[j]) arr[k++] = L[i++];
    else arr[k++] = R[j++];
  }
  while (i < L.length) arr[k++] = L[i++];
  while (j < R.length) arr[k++] = R[j++];
}`;

export const mergeSort: AlgorithmConfig = {
  id: 'mergeSort',
  name: 'Merge Sort',
  category: 'sorting',
  difficulty: 'Medium',
  timeComplexity: 'O(n log n)',
  spaceComplexity: 'O(n)',
  description:
    'Merge Sort is a divide-and-conquer algorithm that splits the array into halves, recursively sorts each half, and then merges the sorted halves back together.',
  code,
  defaultInput: [38, 27, 43, 3, 9, 82, 10, 56, 71, 24],
  generator: mergeSortGenerator,
};
