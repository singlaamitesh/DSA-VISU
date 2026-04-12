import { AlgorithmConfig } from './types';
import { bubbleSort } from './sorting/bubbleSort';
import { selectionSort } from './sorting/selectionSort';
import { insertionSort } from './sorting/insertionSort';
import { mergeSort } from './sorting/mergeSort';
import { quickSort } from './sorting/quickSort';
import { linearSearch } from './searching/linearSearch';
import { binarySearch } from './searching/binarySearch';
import { bfs } from './graph/bfs';
import { dfs } from './graph/dfs';
import { dijkstra } from './graph/dijkstra';
import { fibonacci } from './dp/fibonacci';
import { knapsack } from './dp/knapsack';

const algorithms: AlgorithmConfig[] = [
  bubbleSort,
  selectionSort,
  insertionSort,
  mergeSort,
  quickSort,
  linearSearch,
  binarySearch,
  bfs,
  dfs,
  dijkstra,
  fibonacci,
  knapsack,
];

export const getAlgorithms = () => algorithms;

export const getAlgorithmById = (id: string) =>
  algorithms.find((a) => a.id === id);

export const getAlgorithmsByCategory = (category: string) =>
  algorithms.filter((a) => a.category === category);

export const registerAlgorithm = (config: AlgorithmConfig) => {
  algorithms.push(config);
};
