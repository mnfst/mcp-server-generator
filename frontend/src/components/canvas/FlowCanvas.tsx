import { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  Connection,
  addEdge,
  NodeChange,
  applyNodeChanges,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';

import { AddNode } from './AddNode';
import { DatasourceNode } from './DatasourceNode';
import { MCPServerNode } from './MCPServerNode';
import { apiUrl } from '@/lib/api';

// Custom node types mapping
const nodeTypes = {
  add: AddNode,
  datasource: DatasourceNode,
  mcpServer: MCPServerNode,
};

/**
 * Props for the FlowCanvas component.
 */
interface FlowCanvasProps {
  /** Callback function triggered when the user initiates datasource creation */
  onCreateDatasource?: () => void;
  /** Callback function triggered when the user initiates MCP server creation */
  onCreateMCPServer?: () => void;
}

/**
 * FlowCanvas component provides an interactive visual canvas for managing datasources,
 * MCP servers, and their connections using React Flow.
 *
 * Features:
 * - Fetches and displays nodes from the backend API
 * - Supports drag-and-drop node positioning with automatic persistence
 * - Provides auto-layout functionality using the Dagre library
 * - Handles node connections and visual relationships
 * - Shows loading state during initial data fetch
 *
 * @param props - The component props
 * @returns A React Flow canvas with controls and background
 */
export function FlowCanvas({ onCreateDatasource, onCreateMCPServer }: FlowCanvasProps) {
  const [nodes, setNodes] = useNodesState<Node>([]);
  const [edges, setEdges] = useEdgesState<Edge>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch canvas nodes from backend
  useEffect(() => {
    const fetchCanvasData = async () => {
      try {
        const response = await fetch(apiUrl('/api/canvas/nodes'));
        if (!response.ok) throw new Error('Failed to fetch canvas nodes');

        const canvasNodes = await response.json();

        // Convert backend canvas nodes to React Flow nodes
        const flowNodes: Node[] = canvasNodes.map((node: any) => ({
          id: node.nodeId,
          type: node.type,
          position: { x: node.positionX, y: node.positionY },
          draggable: true,
          data: {
            datasource: node.datasource,
            mcpServer: node.mcpServer,
            toolId: node.toolId,
          },
        }));

        // Add initial "Add Datasource" node if no nodes exist
        if (flowNodes.length === 0) {
          flowNodes.push({
            id: 'add-datasource-initial',
            type: 'add',
            position: { x: 100, y: 100 },
            data: { label: 'Add Datasource', onClick: onCreateDatasource },
          });
        }

        setNodes(flowNodes);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching canvas data:', error);
        // Show initial add node on error
        setNodes([
          {
            id: 'add-datasource-initial',
            type: 'add',
            position: { x: 100, y: 100 },
            data: { label: 'Add Datasource', onClick: onCreateDatasource },
          },
        ]);
        setIsLoading(false);
      }
    };

    fetchCanvasData();
  }, [onCreateDatasource]);

  /**
   * Handles node changes including position updates, selections, and removals.
   * Automatically persists position changes to the backend API when dragging completes.
   *
   * @param changes - Array of node change objects from React Flow
   */
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // Apply changes first and get updated nodes
      setNodes((nds) => {
        const updatedNodes = applyNodeChanges(changes, nds);

        // Update positions in backend for position changes
        changes.forEach((change) => {
          if (change.type === 'position' && !change.dragging) {
            // Position change completed (not dragging)
            const nodeId = change.id;
            const node = updatedNodes.find(n => n.id === nodeId);

            if (node && node.position) {
              fetch(apiUrl(`/api/canvas/nodes/${nodeId}`), {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  positionX: node.position.x,
                  positionY: node.position.y,
                }),
              }).catch((error) => {
                console.error('Failed to update node position:', error);
              });
            }
          }
        });

        return updatedNodes;
      });
    },
    [setNodes]
  );

  /**
   * Handles new connections between nodes.
   *
   * @param connection - The connection object containing source and target node information
   */
  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  /**
   * Applies automatic layout to all nodes using the Dagre graph layout algorithm.
   * Arranges nodes in a left-to-right hierarchical layout and persists positions to the backend.
   *
   * Layout configuration:
   * - Direction: Left to right (LR)
   * - Rank separation: 150px
   * - Node separation: 80px
   */
  const onLayout = useCallback(() => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: 'LR', ranksep: 150, nodesep: 80 });

    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: 200, height: 180 });
    });

    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - 100,
          y: nodeWithPosition.y - 90,
        },
      };
    });

    setNodes(layoutedNodes);

    // Batch update positions in backend
    const updates = layoutedNodes.map((node) => ({
      nodeId: node.id,
      positionX: node.position.x,
      positionY: node.position.y,
    }));

    fetch(apiUrl('/api/canvas/nodes/batch'), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates }),
    }).catch((error) => {
      console.error('Failed to batch update node positions:', error);
    });
  }, [nodes, edges, setNodes]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-muted-foreground">Loading canvas...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Controls />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>

      {/* Layout button */}
      <button
        onClick={onLayout}
        className="absolute top-20 right-4 z-10 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
      >
        Auto Layout
      </button>
    </div>
  );
}
