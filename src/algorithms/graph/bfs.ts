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

function* bfsGenerator(graph: GraphData, startNode: number): Generator<AnimationStep> {
  const { nodes, edges, adjacencyList } = graph;
  const visited = new Set<number>();
  const queue: number[] = [startNode];
  visited.add(startNode);

  yield {
    type: 'visit',
    indices: [startNode],
    data: { nodes, edges, adjacencyList, visited: new Set(visited) },
    codeLine: 3,
    explanation: `Start BFS from node ${startNode}. Add it to the queue and mark as visited.`,
  };

  while (queue.length > 0) {
    const current = queue.shift()!;

    yield {
      type: 'highlight',
      indices: [current],
      data: { nodes, edges, adjacencyList, visited: new Set(visited) },
      codeLine: 6,
      explanation: `Processing node ${current} from the front of the queue.`,
    };

    const neighbors = adjacencyList.get(current) ?? [];
    for (const { node: neighbor } of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);

        yield {
          type: 'visit',
          indices: [neighbor],
          data: { nodes, edges, adjacencyList, visited: new Set(visited) },
          codeLine: 9,
          explanation: `Discovered node ${neighbor} from node ${current}. Adding to queue.`,
        };
      }
    }
  }

  yield {
    type: 'done',
    indices: [],
    data: { nodes, edges, adjacencyList, visited: new Set(visited) },
    codeLine: 13,
    explanation: 'BFS complete. All reachable nodes have been visited.',
  };
}

const code = `function bfs(graph, start) {
  const visited = new Set();
  const queue = [start];
  visited.add(start);

  while (queue.length > 0) {
    const current = queue.shift();

    for (const neighbor of graph[current]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
  return visited;
}`;

const defaultGraph = buildDefaultGraph();

export const bfs: AlgorithmConfig = {
  id: 'bfs',
  name: 'Breadth-First Search',
  category: 'graph',
  difficulty: 'Medium',
  timeComplexity: 'O(V+E)',
  spaceComplexity: 'O(V)',
  description:
    'Breadth-First Search (BFS) explores a graph level by level, visiting all neighbors of a node before moving deeper. It uses a queue to track nodes to visit and guarantees the shortest path in unweighted graphs.',
  code,
  defaultInput: defaultGraph,
  generator: (graph: GraphData) => bfsGenerator(graph, 0),
};
