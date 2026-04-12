import React from 'react';
import { motion } from 'framer-motion';
import { AnimationStep, GraphData, GraphNode, GraphEdge } from '../../algorithms/types';

interface GraphRendererProps {
  step: AnimationStep | null;
}

const GraphRenderer: React.FC<GraphRendererProps> = ({ step }) => {
  const data = step?.data as GraphData | null;

  if (!data || !data.nodes || data.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 text-sm">
        No graph data to display
      </div>
    );
  }

  const { nodes, edges, visited, distances } = data;
  const activeIndices = new Set(step?.indices ?? []);

  const getNodeFill = (node: GraphNode): string => {
    if (activeIndices.has(node.id)) return '#facc15';
    if (visited?.has(node.id)) return '#22c55e';
    return '#334155';
  };

  const getNodeTextColor = (node: GraphNode): string => {
    if (activeIndices.has(node.id)) return '#1e293b';
    if (visited?.has(node.id)) return '#1e293b';
    return '#e2e8f0';
  };

  return (
    <div className="w-full overflow-auto">
      <svg viewBox="0 0 450 350" className="w-full max-h-80" xmlns="http://www.w3.org/2000/svg">
        {/* Edges */}
        {edges.map((edge: GraphEdge, i: number) => {
          const from = nodes.find((n) => n.id === edge.from);
          const to = nodes.find((n) => n.id === edge.to);
          if (!from || !to) return null;
          const midX = (from.x + to.x) / 2;
          const midY = (from.y + to.y) / 2;
          return (
            <g key={`edge-${i}`}>
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="#475569"
                strokeWidth={2}
              />
              {edge.weight !== undefined && (
                <text
                  x={midX}
                  y={midY - 6}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize={11}
                  fontFamily="monospace"
                >
                  {edge.weight}
                </text>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map((node: GraphNode) => {
          const fill = getNodeFill(node);
          const textColor = getNodeTextColor(node);
          const distance = distances?.get(node.id);

          return (
            <motion.g
              key={`node-${node.id}`}
              initial={false}
              animate={{ scale: activeIndices.has(node.id) ? 1.15 : 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              style={{ transformOrigin: `${node.x}px ${node.y}px` }}
            >
              <circle
                cx={node.x}
                cy={node.y}
                r={22}
                fill={fill}
                stroke={activeIndices.has(node.id) ? '#facc15' : '#475569'}
                strokeWidth={2}
              />
              <text
                x={node.x}
                y={node.y + 4}
                textAnchor="middle"
                fill={textColor}
                fontSize={13}
                fontWeight="bold"
                fontFamily="sans-serif"
              >
                {node.label}
              </text>
              {distance !== undefined && distance !== Infinity && (
                <text
                  x={node.x}
                  y={node.y + 36}
                  textAnchor="middle"
                  fill="#60a5fa"
                  fontSize={11}
                  fontFamily="monospace"
                >
                  d:{distance}
                </text>
              )}
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
};

export default GraphRenderer;
