import { AlgorithmConfig, AnimationStep } from '../types';

function* insertionSortGenerator(arr: number[]): Generator<AnimationStep> {
  const a = [...arr];
  const n = a.length;

  for (let i = 1; i < n; i++) {
    const key = a[i];

    yield {
      type: 'highlight',
      indices: [i],
      data: [...a],
      codeLine: 3,
      explanation: `Picking key element a[${i}]=${key} to insert into sorted portion`,
    };

    let j = i - 1;

    while (j >= 0) {
      yield {
        type: 'compare',
        indices: [j, j + 1],
        data: [...a],
        codeLine: 5,
        explanation: `Comparing a[${j}]=${a[j]} with key=${key}`,
      };

      if (a[j] > key) {
        a[j + 1] = a[j];
        yield {
          type: 'swap',
          indices: [j, j + 1],
          data: [...a],
          codeLine: 6,
          explanation: `Shifting a[${j}]=${a[j]} one position right`,
        };
        j--;
      } else {
        break;
      }
    }

    a[j + 1] = key;
  }

  yield {
    type: 'done',
    indices: [],
    data: [...a],
    codeLine: 10,
    explanation: 'Array is sorted!',
  };
}

const code = `function insertionSort(arr) {
  for (let i = 1; i < arr.length; i++) {
    const key = arr[i];
    let j = i - 1;
    while (j >= 0 && arr[j] > key) {
      arr[j + 1] = arr[j];
      j--;
    }
    arr[j + 1] = key;
  }
  return arr;
}`;

export const insertionSort: AlgorithmConfig = {
  id: 'insertionSort',
  name: 'Insertion Sort',
  category: 'sorting',
  difficulty: 'Easy',
  timeComplexity: 'O(n²)',
  spaceComplexity: 'O(1)',
  description:
    'Insertion Sort builds the sorted array one element at a time by picking each element and inserting it into its correct position within the already sorted portion of the array.',
  code,
  defaultInput: [12, 11, 13, 5, 6, 7, 45, 23, 89, 34],
  generator: insertionSortGenerator,
};
