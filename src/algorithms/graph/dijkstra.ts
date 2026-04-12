import { AlgorithmConfig, AnimationStep, GraphData } from '../types';

function buildWeightedGraph(): GraphData {
  const nodes = [
    { id: 0, x: 100, y: 150, label: '0' },
    { id: 1, x: 250, y: 50, label: '1' },
    { id: 2, x: 250, y: 250, label: '2' },
    { id: 3, x: 400, y: 100, label: '3' },
    { id: 4, x: 400, y: 220, label: '4' },
  ];

  const edges = [
    { from: 0, to: 1, weight: 4 },
    { from: 0, to: 2, weight: 1 },
    { from: 1, to: 3, weight: 1 },
    { from: 2, to: 1, weight: 2 },
    { from: 2, to: 4, weight: 5 },
    { from: 3, to: 4, weight: 3 },
  ];

  const adjacencyList = new Map<number, { node: number; weight: number }[]>();
  for (const node of nodes) {
    adjacencyList.set(node.id, []);
  }
  for (const edge of edges) {
    adjacencyList.get(edge.from)!.push({ node: edge.to, weight: edge.weight! });
  }

  return { nodes, edges, adjacencyList };
}

function* dijkstraGenerator(graph: GraphData, startNode: number): Generator<AnimationStep> {
  const { nodes, edges, adjacencyList } = graph;
  const dist = new Map<number, number>();
  const visited = new Set<number>();

  for (const node of nodes) {
    dist.set(node.id, Infinity);
  }
  dist.set(startNode, 0);

  yield {
    type: 'visit',
    indices: [startNode],
    data: {
      nodes,
      edges,
      adjacencyList,
      visited: new Set(visited),
      distances: new Map(dist),
    },
    codeLine: 4,
    explanation: `Initialize distances. Set dist[${startNode}] = 0, all others = ∞.`,
  };

  for (let i = 0; i < nodes.length; i++) {
    // Pick the unvisited node with the minimum distance
    let minDist = Infinity;
    let u = -1;
    for (const node of nodes) {
      if (!visited.has(node.id) && dist.get(node.id)! < minDist) {
        minDist = dist.get(node.id)!;
        u = node.id;
      }
    }

    if (u === -1) break;

    visited.add(u);

    yield {
      type: 'highlight',
      indices: [u],
      data: {
        nodes,
        edges,
        adjacencyList,
        visited: new Set(visited),
        distances: new Map(dist),
      },
      codeLine: 8,
      explanation: `Select node ${u} with minimum distance ${minDist}. Mark as finalized.`,
    };

    const neighbors = adjacencyList.get(u) ?? [];
    for (const { node: v, weight } of neighbors) {
      if (!visited.has(v)) {
        const newDist = dist.get(u)! + weight;

        yield {
          type: 'compare',
          indices: [u, v],
          data: {
            nodes,
            edges,
            adjacencyList,
            visited: new Set(visited),
            distances: new Map(dist),
          },
          codeLine: 12,
          explanation: `Relaxing edge ${u} → ${v} (weight ${weight}). Current dist[${v}] = ${dist.get(v) === Infinity ? '∞' : dist.get(v)}, new candidate = ${newDist}.`,
        };

        if (newDist < dist.get(v)!) {
          dist.set(v, newDist);

          yield {
            type: 'compare',
            indices: [u, v],
            data: {
              nodes,
              edges,
              adjacencyList,
              visited: new Set(visited),
              distances: new Map(dist),
            },
            codeLine: 14,
            explanation: `Updated dist[${v}] = ${newDist} (improved from ${dist.get(v) === newDist ? '∞ or larger' : 'previous value'}).`,
          };
        }
      }
    }
  }

  yield {
    type: 'done',
    indices: [],
    data: {
      nodes,
      edges,
      adjacencyList,
      visited: new Set(visited),
      distances: new Map(dist),
    },
    codeLine: 18,
    explanation: `Dijkstra complete. Shortest distances from node ${startNode}: ${[...dist.entries()].map(([k, v]) => `${k}=${v === Infinity ? '∞' : v}`).join(', ')}.`,
  };
}

const code = `function dijkstra(graph, start) {
  const dist = new Map();
  const visited = new Set();
  dist.set(start, 0); // all others = Infinity

  for (let i = 0; i < graph.nodes.length; i++) {
    // Pick unvisited node with min distance
    const u = minDistNode(dist, visited);
    if (u === null) break;
    visited.add(u);

    for (const [v, weight] of graph[u]) {
      if (!visited.has(v)) {
        const newDist = dist.get(u) + weight;
        if (newDist < dist.get(v)) {
          dist.set(v, newDist);
        }
      }
    }
  }
  return dist;
}`;

const defaultGraph = buildWeightedGraph();

export const dijkstra: AlgorithmConfig = {
  id: 'dijkstra',
  name: "Dijkstra's Algorithm",
  category: 'graph',
  difficulty: 'Hard',
  timeComplexity: 'O(V²)',
  spaceComplexity: 'O(V)',
  description:
    "Dijkstra's algorithm finds the shortest path from a source node to all other nodes in a weighted graph with non-negative edge weights. It greedily selects the unvisited node with the smallest known distance and relaxes its outgoing edges.",
  code,
  defaultInput: defaultGraph,
  generator: (graph: GraphData) => dijkstraGenerator(graph, 0),
};
