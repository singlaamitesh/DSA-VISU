import { AlgorithmConfig, AnimationStep, GraphData } from '../types';

function buildDefaultGraph(): GraphData {
  const nodes = [
    { id: 0, x: 200, y: 50, label: '0' },
    { id: 1, x: 100, y: 150, label: '1' },
    { id: 2, x: 300, y: 150, label: '2' },
    { id: 3, x: 50, y: 280, label: '3' },
    { id: 4, x: 200, y: 280, label: '4' },
    { id: 5, x: 350, y: 280, label: '5' },
  ];

  const edges = [
    { from: 0, to: 1 },
    { from: 0, to: 2 },
    { from: 1, to: 3 },
    { from: 1, to: 4 },
    { from: 2, to: 4 },
    { from: 2, to: 5 },
  ];

  const adjacencyList = new Map<number, { node: number; weight: number }[]>();
  for (const node of nodes) {
    adjacencyList.set(node.id, []);
  }
  for (const edge of edges) {
    adjacencyList.get(edge.from)!.push({ node: edge.to, weight: 1 });
    adjacencyList.get(edge.to)!.push({ node: edge.from, weight: 1 });
  }

  return { nodes, edges, adjacencyList };
}

function* dfsRecursive(
  graph: GraphData,
  node: number,
  visited: Set<number>
): Generator<AnimationStep> {
  const { nodes, edges, adjacencyList } = graph;
  visited.add(node);

  yield {
    type: 'visit',
    indices: [node],
    data: { nodes, edges, adjacencyList, visited: new Set(visited) },
    codeLine: 2,
    explanation: `Entering node ${node}. Mark as visited.`,
  };

  const neighbors = adjacencyList.get(node) ?? [];
  for (const { node: neighbor } of neighbors) {
    yield {
      type: 'compare',
      indices: [node, neighbor],
      data: { nodes, edges, adjacencyList, visited: new Set(visited) },
      codeLine: 5,
      explanation: `Exploring edge ${node} → ${neighbor}. ${visited.has(neighbor) ? 'Already visited.' : 'Not yet visited, will recurse.'}`,
    };

    if (!visited.has(neighbor)) {
      yield* dfsRecursive(graph, neighbor, visited);
    }
  }

  yield {
    type: 'highlight',
    indices: [node],
    data: { nodes, edges, adjacencyList, visited: new Set(visited) },
    codeLine: 9,
    explanation: `Backtracking from node ${node}. All neighbors have been explored.`,
  };
}

function* dfsGenerator(graph: GraphData, startNode: number): Generator<AnimationStep> {
  const { nodes, edges, adjacencyList } = graph;
  const visited = new Set<number>();

  yield* dfsRecursive(graph, startNode, visited);

  yield {
    type: 'done',
    indices: [],
    data: { nodes, edges, adjacencyList, visited: new Set(visited) },
    codeLine: 12,
    explanation: 'DFS complete. All reachable nodes have been visited.',
  };
}

const code = `function dfs(graph, node, visited = new Set()) {
  visited.add(node);

  for (const neighbor of graph[node]) {
    if (!visited.has(neighbor)) {
      dfs(graph, neighbor, visited);
    }
  }

  // backtrack
  return visited;
}`;

const defaultGraph = buildDefaultGraph();

export const dfs: AlgorithmConfig = {
  id: 'dfs',
  name: 'Depth-First Search',
  category: 'graph',
  difficulty: 'Medium',
  timeComplexity: 'O(V+E)',
  spaceComplexity: 'O(V)',
  description:
    'Depth-First Search (DFS) explores a graph by going as deep as possible along each branch before backtracking. It uses recursion (or an explicit stack) and is useful for topological sorting, cycle detection, and connected components.',
  code,
  defaultInput: defaultGraph,
  generator: (graph: GraphData) => dfsGenerator(graph, 0),
};
