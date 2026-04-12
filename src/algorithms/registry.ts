import { AlgorithmConfig } from './types';

const algorithms: AlgorithmConfig[] = [];

export const getAlgorithms = () => algorithms;

export const getAlgorithmById = (id: string) =>
  algorithms.find((a) => a.id === id);

export const getAlgorithmsByCategory = (category: string) =>
  algorithms.filter((a) => a.category === category);

export const registerAlgorithm = (config: AlgorithmConfig) => {
  algorithms.push(config);
};
