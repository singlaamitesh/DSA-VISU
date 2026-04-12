export interface AnimationStep {
  type: 'compare' | 'swap' | 'visit' | 'fill' | 'highlight' | 'done';
  indices: number[];
  data: number[] | GraphData | DPTableData;
  codeLine: number;
  explanation: string;
  metadata?: Record<string, unknown>;
}

export interface GraphNode {
  id: number;
  x: number;
  y: number;
  label: string;
}

export interface GraphEdge {
  from: number;
  to: number;
  weight?: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  adjacencyList: Map<number, { node: number; weight: number }[]>;
  visited?: Set<number>;
  distances?: Map<number, number>;
}

export interface DPTableData {
  table: number[][];
  rows: string[];
  cols: string[];
  highlightCell?: [number, number];
}

export type AlgorithmCategory = 'sorting' | 'searching' | 'graph' | 'dp';

export interface AlgorithmConfig {
  id: string;
  name: string;
  category: AlgorithmCategory;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timeComplexity: string;
  spaceComplexity: string;
  description: string;
  code: string;
  defaultInput: unknown;
  generator: (...args: any[]) => Generator<AnimationStep>;
}
