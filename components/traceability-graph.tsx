'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface TraceabilityNode {
  id: string;
  title: string;
  type: 'epic' | 'user-story' | 'technical-spec' | 'test-case';
  status: string;
  children: TraceabilityNode[];
}

interface TraceabilityGraphProps {
  rootSpecId: string;
  onNodeClick?: (specId: string) => void;
}

// Color mapping for spec types
const typeColors: Record<string, string> = {
  epic: '#8b5cf6', // purple
  'user-story': '#3b82f6', // blue
  'technical-spec': '#10b981', // green
  'test-case': '#f59e0b', // amber
};

// Type labels for display
const typeLabels: Record<string, string> = {
  epic: 'Epic',
  'user-story': 'User Story',
  'technical-spec': 'Technical Spec',
  'test-case': 'Test Case',
};

/**
 * Convert traceability tree to React Flow nodes and edges
 */
function convertToFlowData(
  tree: TraceabilityNode,
  parentId: string | null = null,
  level: number = 0,
  xOffset: number = 0
): { nodes: Node[]; edges: Edge[]; width: number } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const nodeWidth = 200;
  const nodeHeight = 80;
  const horizontalSpacing = 50;
  const verticalSpacing = 120;

  // Create current node
  const currentNode: Node = {
    id: tree.id,
    type: 'default',
    position: { x: xOffset, y: level * verticalSpacing },
    data: {
      label: (
        <div className="p-2">
          <div className="text-xs font-semibold text-gray-500 mb-1">
            {typeLabels[tree.type]}
          </div>
          <div className="text-sm font-medium text-gray-900 truncate">
            {tree.title}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {tree.status}
          </div>
        </div>
      ),
    },
    style: {
      background: 'white',
      border: `2px solid ${typeColors[tree.type]}`,
      borderRadius: '8px',
      width: nodeWidth,
      padding: 0,
    },
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
  };

  nodes.push(currentNode);

  // Create edge from parent if exists
  if (parentId) {
    edges.push({
      id: `${parentId}-${tree.id}`,
      source: parentId,
      target: tree.id,
      type: 'smoothstep',
      animated: false,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#9ca3af',
      },
      style: {
        stroke: '#9ca3af',
        strokeWidth: 2,
      },
    });
  }

  // Process children
  let currentXOffset = xOffset;
  const childrenData = tree.children.map((child) => {
    const childData = convertToFlowData(child, tree.id, level + 1, currentXOffset);
    currentXOffset += childData.width + horizontalSpacing;
    return childData;
  });

  // Add all children nodes and edges
  childrenData.forEach((childData) => {
    nodes.push(...childData.nodes);
    edges.push(...childData.edges);
  });

  // Calculate total width
  const totalChildrenWidth = childrenData.reduce(
    (sum, child) => sum + child.width,
    0
  ) + (tree.children.length - 1) * horizontalSpacing;

  const totalWidth = Math.max(nodeWidth, totalChildrenWidth);

  // Center the current node if it has children
  if (tree.children.length > 0) {
    const centerOffset = (totalChildrenWidth - nodeWidth) / 2;
    currentNode.position.x = xOffset + centerOffset;
  }

  return { nodes, edges, width: totalWidth };
}

export function TraceabilityGraph({ rootSpecId, onNodeClick }: TraceabilityGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch traceability graph data
  useEffect(() => {
    async function fetchGraph() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/traceability/graph/${rootSpecId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Failed to load traceability graph');
        }

        const data = await response.json();
        const { nodes: flowNodes, edges: flowEdges } = convertToFlowData(data.graph);

        setNodes(flowNodes);
        setEdges(flowEdges);
      } catch (err) {
        console.error('Error fetching traceability graph:', err);
        setError(err instanceof Error ? err.message : 'Failed to load graph');
      } finally {
        setLoading(false);
      }
    }

    if (rootSpecId) {
      fetchGraph();
    }
  }, [rootSpecId, setNodes, setEdges]);

  // Handle node click
  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (onNodeClick) {
        onNodeClick(node.id);
      }
    },
    [onNodeClick]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading traceability graph...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 mb-2">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-gray-900 font-medium mb-1">Failed to load graph</p>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">No traceability data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={1.5}
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node: Node) => {
            const foundNode = nodes.find((n) => n.id === node.id);
            if (!foundNode) return '#9ca3af';
            
            // Extract type from node data
            const nodeData = foundNode.data as any;
            const type = nodeData?.label?.props?.children?.[0]?.props?.children;
            return typeColors[type as string] || '#9ca3af';
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>
    </div>
  );
}
