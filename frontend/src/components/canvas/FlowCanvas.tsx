import { useCallback, useEffect, useState } from "react";
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
} from "reactflow";
import "reactflow/dist/style.css";
import dagre from "dagre";

import { AddNode } from "./AddNode";
import { DatasourceNode } from "./DatasourceNode";
import { MCPServerNode } from "./MCPServerNode";
import { ToolNode } from "./ToolNode";
import { MCPServerMenuDialog } from "../dialogs/MCPServerMenuDialog";
import { ToolDialog } from "../dialogs/ToolDialog";
import { SchemaViewDialog } from "../dialogs/SchemaViewDialog";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { apiUrl } from "@/lib/api";
import { CanvasNodeType, Datasource, MCPServer, Tool } from "shared";
import { ChevronDown, Database, Server } from "lucide-react";

// Custom node types mapping
const nodeTypes = {
  [CanvasNodeType.ADD]: AddNode,
  [CanvasNodeType.DATASOURCE]: DatasourceNode,
  [CanvasNodeType.MCP_SERVER]: MCPServerNode,
  [CanvasNodeType.TOOL]: ToolNode,
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
export function FlowCanvas({
  onCreateDatasource,
  onCreateMCPServer,
}: FlowCanvasProps) {
  const [nodes, setNodes] = useNodesState<Node>([]);
  const [edges, setEdges] = useEdgesState<Edge>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [menuDialogOpen, setMenuDialogOpen] = useState(false);
  const [selectedMCPServer, setSelectedMCPServer] = useState<{
    mcpServer: MCPServer;
    datasource: Datasource;
  } | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [schemaDialogOpen, setSchemaDialogOpen] = useState(false);
  const [selectedDatasource, setSelectedDatasource] = useState<Datasource | null>(null);

  // Fetch canvas nodes, datasources, and MCP servers from backend
  useEffect(() => {
    const fetchCanvasData = async () => {
      try {
        const [
          canvasResponse,
          datasourcesResponse,
          mcpServersResponse,
          toolsResponse,
        ] = await Promise.all([
          fetch(apiUrl("/api/canvas/nodes")),
          fetch(apiUrl("/api/datasources")),
          fetch(apiUrl("/api/mcp-servers")),
          fetch(apiUrl("/api/tools")),
        ]);

        if (!canvasResponse.ok) throw new Error("Failed to fetch canvas nodes");

        const canvasNodes = await canvasResponse.json();
        const datasources: Datasource[] = datasourcesResponse.ok
          ? await datasourcesResponse.json()
          : [];
        const mcpServers: MCPServer[] = mcpServersResponse.ok
          ? await mcpServersResponse.json()
          : [];
        const tools: Tool[] = toolsResponse.ok
          ? await toolsResponse.json()
          : [];

        // Create lookup maps
        const datasourceMap = new Map(datasources.map((ds) => [ds.id, ds]));
        const mcpServerMap = new Map(mcpServers.map((mcp) => [mcp.id, mcp]));
        const toolMap = new Map(tools.map((tool) => [tool.id, tool]));

        // Convert backend canvas nodes to React Flow nodes
        const flowNodes: Node[] = canvasNodes.map((node: any) => {
          const baseNode = {
            id: node.nodeId,
            type: node.type,
            position: { x: node.positionX, y: node.positionY },
            draggable: true,
          };

          if (node.type === "datasource" && node.datasourceId) {
            const datasource = datasourceMap.get(node.datasourceId);
            const hasChildren = mcpServers.some(
              (mcp) => mcp.datasourceId === node.datasourceId
            );
            return {
              ...baseNode,
              data: {
                datasource,
                onEdit: () => handleDatasourceEdit(datasource!),
                onDelete: () => handleDatasourceDelete(node.datasourceId),
                onViewSchema: () => handleDatasourceViewSchema(node.datasourceId),
                hasChildren,
              },
            };
          } else if (node.type === "mcpServer" && node.mcpServerId) {
            const mcpServer = mcpServerMap.get(node.mcpServerId);
            const datasource = mcpServer
              ? datasourceMap.get(mcpServer.datasourceId)
              : undefined;
            const hasChildren = tools.some(
              (tool) => tool.mcpServerId === node.mcpServerId
            );
            return {
              ...baseNode,
              data: {
                mcpServer,
                onClick: () => handleMCPServerClick(mcpServer!, datasource!),
                onEdit: () => handleMCPServerEdit(mcpServer!),
                onDelete: () => handleMCPServerDelete(node.mcpServerId),
                hasChildren,
              },
            };
          } else if (node.type === "tool" && node.toolId) {
            const tool = toolMap.get(node.toolId);
            return {
              ...baseNode,
              data: {
                tool,
                onClick: () => handleToolClick(tool!),
              },
            };
          }

          return baseNode;
        });

        // Create edges between datasources and MCP servers, and MCP servers and tools
        const flowEdges: Edge[] = [];

        // Datasource -> MCP Server edges
        mcpServers.forEach((mcpServer) => {
          const datasourceNodeId = `datasource-${mcpServer.datasourceId}`;
          const mcpServerNodeId = `mcpServer-${mcpServer.id}`;
          if (
            flowNodes.some((n) => n.id === datasourceNodeId) &&
            flowNodes.some((n) => n.id === mcpServerNodeId)
          ) {
            flowEdges.push({
              id: `edge-${datasourceNodeId}-${mcpServerNodeId}`,
              source: datasourceNodeId,
              target: mcpServerNodeId,
              animated: true,
            });
          }
        });

        // MCP Server -> Tool edges
        tools.forEach((tool) => {
          const mcpServerNodeId = `mcpServer-${tool.mcpServerId}`;
          const toolNodeId = `tool-${tool.id}`;
          if (
            flowNodes.some((n) => n.id === mcpServerNodeId) &&
            flowNodes.some((n) => n.id === toolNodeId)
          ) {
            flowEdges.push({
              id: `edge-${mcpServerNodeId}-${toolNodeId}`,
              source: mcpServerNodeId,
              target: toolNodeId,
              animated: true,
            });
          }
        });

        // Add initial "Add Datasource" node if no nodes exist
        if (flowNodes.length === 0) {
          flowNodes.push({
            id: "add-datasource-initial",
            type: CanvasNodeType.ADD,
            position: { x: 100, y: 100 },
            data: { label: "Add Datasource", onClick: onCreateDatasource },
          });
        }

        setNodes(flowNodes);
        setEdges(flowEdges);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching canvas data:", error);
        // Show initial add node on error
        setNodes([
          {
            id: "add-datasource-initial",
            type: CanvasNodeType.ADD,
            position: { x: 100, y: 100 },
            data: { label: "Add Datasource", onClick: onCreateDatasource },
          },
        ]);
        setIsLoading(false);
      }
    };

    fetchCanvasData();
  }, [onCreateDatasource]);

  /**
   * Handle MCP Server node click - opens menu dialog
   */
  const handleMCPServerClick = (
    mcpServer: MCPServer,
    datasource: Datasource
  ) => {
    setSelectedMCPServer({ mcpServer, datasource });
    setMenuDialogOpen(true);
  };

  /**
   * Handle Tool node click - opens edit dialog
   */
  const handleToolClick = (tool: Tool) => {
    setSelectedTool(tool);
    setEditDialogOpen(true);
  };

  /**
   * Handle datasource edit
   */
  const handleDatasourceEdit = (datasource: Datasource) => {
    console.log("Edit datasource:", datasource);
    // TODO: Open datasource edit dialog
  };

  /**
   * Handle datasource deletion
   */
  const handleDatasourceDelete = async (datasourceId: string) => {
    try {
      const response = await fetch(apiUrl(`/api/datasources/${datasourceId}`), {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete datasource");
      }

      const datasourceNodeId = `datasource-${datasourceId}`;

      // Remove node
      setNodes((nds) => nds.filter((n) => n.id !== datasourceNodeId));

      // Remove edges
      setEdges((eds) =>
        eds.filter((e) => e.source !== datasourceNodeId && e.target !== datasourceNodeId)
      );
    } catch (error) {
      console.error("Failed to delete datasource:", error);
    }
  };

  /**
   * Handle MCP server edit
   */
  const handleMCPServerEdit = (mcpServer: MCPServer) => {
    console.log("Edit MCP server:", mcpServer);
    // TODO: Open MCP server edit dialog
  };

  /**
   * Handle MCP server deletion
   */
  const handleMCPServerDelete = async (mcpServerId: string) => {
    try {
      const response = await fetch(apiUrl(`/api/mcp-servers/${mcpServerId}`), {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete MCP server");
      }

      const mcpServerNodeId = `mcpServer-${mcpServerId}`;

      // Remove node
      setNodes((nds) => nds.filter((n) => n.id !== mcpServerNodeId));

      // Remove edges
      setEdges((eds) =>
        eds.filter((e) => e.source !== mcpServerNodeId && e.target !== mcpServerNodeId)
      );
    } catch (error) {
      console.error("Failed to delete MCP server:", error);
    }
  };

  /**
   * Handle view schema for a datasource
   */
  const handleDatasourceViewSchema = async (datasourceId: string) => {
    try {
      // Fetch datasource details
      const response = await fetch(apiUrl(`/api/datasources/${datasourceId}`));
      if (!response.ok) {
        throw new Error("Failed to fetch datasource");
      }
      const datasource: Datasource = await response.json();

      setSelectedDatasource(datasource);
      setSchemaDialogOpen(true);
    } catch (error) {
      console.error("Failed to fetch datasource:", error);
    }
  };

  /**
   * Handle tool deletion - remove node and edges from canvas
   */
  const handleToolDeleted = (toolId: string) => {
    const toolNodeId = `tool-${toolId}`;

    // Remove node
    setNodes((nds) => nds.filter((n) => n.id !== toolNodeId));

    // Remove edges
    setEdges((eds) =>
      eds.filter((e) => e.source !== toolNodeId && e.target !== toolNodeId)
    );

    // Close dialog
    setEditDialogOpen(false);
    setSelectedTool(null);
  };

  /**
   * Handle tool creation - create canvas node and edge
   */
  const handleToolCreated = async (tool: Tool) => {
    try {
      // Create canvas node for the tool
      const toolNodeId = `tool-${tool.id}`;
      const mcpServerNodeId = `mcpServer-${tool.mcpServerId}`;

      // Find MCP server node to position tool near it
      const mcpServerNode = nodes.find((n) => n.id === mcpServerNodeId);
      const position = mcpServerNode
        ? { x: mcpServerNode.position.x + 300, y: mcpServerNode.position.y }
        : { x: 500, y: 100 };

      // Create canvas node in backend
      await fetch(apiUrl("/api/canvas/nodes"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodeId: toolNodeId,
          type: "tool",
          positionX: position.x,
          positionY: position.y,
          toolId: tool.id,
        }),
      });

      // Add tool node to canvas
      const newNode: Node = {
        id: toolNodeId,
        type: "tool",
        position,
        draggable: true,
        data: {
          tool,
          onClick: () => handleToolClick(tool),
        },
      };

      setNodes((nds) => [...nds, newNode]);

      // Add edge from MCP server to tool
      const newEdge: Edge = {
        id: `edge-${mcpServerNodeId}-${toolNodeId}`,
        source: mcpServerNodeId,
        target: toolNodeId,
        animated: true,
      };

      setEdges((eds) => [...eds, newEdge]);
    } catch (error) {
      console.error("Failed to create tool canvas node:", error);
    }
  };

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
          if (change.type === "position" && !change.dragging) {
            // Position change completed (not dragging)
            const nodeId = change.id;
            const node = updatedNodes.find((n) => n.id === nodeId);

            if (node && node.position) {
              fetch(apiUrl(`/api/canvas/nodes/${nodeId}`), {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  positionX: node.position.x,
                  positionY: node.position.y,
                }),
              }).catch((error) => {
                console.error("Failed to update node position:", error);
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
    dagreGraph.setGraph({ rankdir: "LR", ranksep: 150, nodesep: 80 });

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

    fetch(apiUrl("/api/canvas/nodes/batch"), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates }),
    }).catch((error) => {
      console.error("Failed to batch update node positions:", error);
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

      {/* New Button */}
      <div className="absolute top-20 right-4 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="default" size="default">
              New
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onCreateDatasource}>
              <Database className="w-4 h-4 mr-2" />
              DB connection
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onCreateMCPServer}>
              <Server className="w-4 h-4 mr-2" />
              MCP server
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* MCP Server Menu Dialog */}
      {selectedMCPServer && (
        <MCPServerMenuDialog
          open={menuDialogOpen}
          onOpenChange={setMenuDialogOpen}
          mcpServerId={selectedMCPServer.mcpServer.id}
          mcpServerName={selectedMCPServer.mcpServer.name}
          datasourceId={selectedMCPServer.datasource.id}
          datasourceName={selectedMCPServer.datasource.name}
          onToolCreated={handleToolCreated}
        />
      )}

      {/* Tool Edit Dialog */}
      {selectedTool && (
        <ToolDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          mode="edit"
          tool={selectedTool}
          onDelete={handleToolDeleted}
        />
      )}

      {/* Schema View Dialog */}
      {selectedDatasource && (
        <SchemaViewDialog
          open={schemaDialogOpen}
          onOpenChange={setSchemaDialogOpen}
          datasourceId={selectedDatasource.id}
          datasourceName={selectedDatasource.name}
        />
      )}
    </div>
  );
}
