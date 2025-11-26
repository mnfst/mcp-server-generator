import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  NodeChange,
  applyNodeChanges,
} from "reactflow";
import "reactflow/dist/style.css";
import dagre from "dagre";

import { AddNode } from "./AddNode";
import { AddMCPServerNode } from "./AddMCPServerNode";
import { DatasourceNode } from "./DatasourceNode";
import { MCPServerNode } from "./MCPServerNode";
import { ToolNode } from "./ToolNode";
import { ResourceNode } from "./ResourceNode";
import { MCPServerMenuDialog } from "../dialogs/MCPServerMenuDialog";
import { CreateMCPServerDialog } from "../dialogs/CreateMCPServerDialog";
import { CreateDatasourceDialog } from "../dialogs/CreateDatasourceDialog";
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
import { CanvasNodeType, Datasource, MCPServer, Tool, Resource } from "shared";
import { ChevronDown, Database, Server } from "lucide-react";

// Custom node types mapping
const nodeTypes = {
  add: AddNode,
  datasource: DatasourceNode,
  mcpServer: MCPServerNode,
  tool: ToolNode,
  resource: ResourceNode,
  addMcpServer: AddMCPServerNode,
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
  const [createMCPDialogOpen, setCreateMCPDialogOpen] = useState(false);
  const [createMCPDatasourceId, setCreateMCPDatasourceId] = useState<string | null>(null);
  const [editDatasourceDialogOpen, setEditDatasourceDialogOpen] = useState(false);
  const [editingDatasource, setEditingDatasource] = useState<Datasource | null>(null);
  const [editMCPServerDialogOpen, setEditMCPServerDialogOpen] = useState(false);
  const [editingMCPServer, setEditingMCPServer] = useState<MCPServer | null>(null);
  const [testingConnectionId, setTestingConnectionId] = useState<string | null>(null);

  // Fetch canvas nodes, datasources, and MCP servers from backend
  useEffect(() => {
    const fetchCanvasData = async () => {
      try {
        const [
          canvasResponse,
          datasourcesResponse,
          mcpServersResponse,
          toolsResponse,
          resourcesResponse,
        ] = await Promise.all([
          fetch(apiUrl("/api/canvas/nodes")),
          fetch(apiUrl("/api/datasources")),
          fetch(apiUrl("/api/mcp-servers")),
          fetch(apiUrl("/api/tools")),
          fetch(apiUrl("/api/resources")),
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
        const resources: Resource[] = resourcesResponse.ok
          ? await resourcesResponse.json()
          : [];

        // Create lookup maps
        const datasourceMap = new Map(datasources.map((ds) => [ds.id, ds]));
        const mcpServerMap = new Map(mcpServers.map((mcp) => [mcp.id, mcp]));
        const toolMap = new Map(tools.map((tool) => [tool.id, tool]));
        const resourceMap = new Map(resources.map((res) => [res.id, res]));

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
                onTestConnection: () => handleDatasourceTestConnection(node.datasourceId),
                hasChildren,
                isTestingConnection: testingConnectionId === node.datasourceId,
              },
            };
          } else if (node.type === "mcpServer" && node.mcpServerId) {
            const mcpServer = mcpServerMap.get(node.mcpServerId);
            const datasource = mcpServer
              ? datasourceMap.get(mcpServer.datasourceId)
              : undefined;
            const mcpServerTools = tools.filter(
              (tool) => tool.mcpServerId === node.mcpServerId
            );
            const mcpServerResources = resources.filter(
              (res) => res.mcpServerId === node.mcpServerId
            );
            const hasChildren = mcpServerTools.length > 0 || mcpServerResources.length > 0;
            return {
              ...baseNode,
              data: {
                mcpServer,
                onClick: () => handleMCPServerClick(mcpServer!, datasource!),
                onEdit: () => handleMCPServerEdit(mcpServer!),
                onDelete: () => handleMCPServerDelete(node.mcpServerId),
                onActivate: () => handleMCPServerActivate(node.mcpServerId),
                onDeactivate: () => handleMCPServerDeactivate(node.mcpServerId),
                hasChildren,
                toolCount: mcpServerTools.length,
                resourceCount: mcpServerResources.length,
                onResourceCreated: handleResourceCreated,
              },
            };
          } else if (node.type === "resource" && node.resourceId) {
            const resource = resourceMap.get(node.resourceId);
            return {
              ...baseNode,
              data: {
                resource,
                onClick: () => handleResourceClick(resource!),
                onDelete: () => handleResourceDelete(node.resourceId),
              },
            };
          } else if (node.type === "tool" && node.toolId) {
            const tool = toolMap.get(node.toolId);
            return {
              ...baseNode,
              data: {
                tool,
                onClick: () => handleToolClick(tool!),
                onEdit: () => handleToolClick(tool!),
                onDelete: () => handleToolDelete(node.toolId),
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

        // MCP Server -> Resource edges
        resources.forEach((resource) => {
          const mcpServerNodeId = `mcpServer-${resource.mcpServerId}`;
          const resourceNodeId = `resource-${resource.id}`;
          if (
            flowNodes.some((n) => n.id === mcpServerNodeId) &&
            flowNodes.some((n) => n.id === resourceNodeId)
          ) {
            flowEdges.push({
              id: `edge-${mcpServerNodeId}-${resourceNodeId}`,
              source: mcpServerNodeId,
              target: resourceNodeId,
              animated: true,
            });
          }
        });

        // Add "+" nodes for each datasource to create MCP servers
        const datasourceIdsWithMCPServer = new Set(mcpServers.map((mcp) => mcp.datasourceId));
        datasources.forEach((datasource) => {
          // Only add "+" node if datasource is connected and doesn't have an MCP server yet
          if (datasource.status === 'connected' && !datasourceIdsWithMCPServer.has(datasource.id)) {
            const datasourceNodeId = `datasource-${datasource.id}`;
            const addMcpNodeId = `add-mcp-${datasource.id}`;

            // Find datasource node position - align horizontally with source handle
            // Datasource node is 180px tall, handle at center (y + 90)
            // Add node is 64px tall, handle at center (y + 32)
            // So add node y = datasource y + 90 - 32 = datasource y + 58
            const datasourceNode = flowNodes.find((n) => n.id === datasourceNodeId);
            const position = datasourceNode
              ? { x: datasourceNode.position.x + 260, y: datasourceNode.position.y + 58 }
              : { x: 360, y: 158 };

            // Add the small "+" node
            flowNodes.push({
              id: addMcpNodeId,
              type: "addMcpServer",
              position,
              draggable: false,
              data: {
                datasourceId: datasource.id,
                onClick: () => handleAddMCPServerClick(datasource.id),
              },
            });

            // Add edge from datasource to add node
            flowEdges.push({
              id: `edge-${datasourceNodeId}-${addMcpNodeId}`,
              source: datasourceNodeId,
              target: addMcpNodeId,
              style: { strokeDasharray: "5,5", stroke: "#94a3b8" },
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

  // Update isTestingConnection flag when testingConnectionId changes
  useEffect(() => {
    if (testingConnectionId) {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === `datasource-${testingConnectionId}`) {
            return {
              ...node,
              data: {
                ...node.data,
                isTestingConnection: true,
              },
            };
          }
          return node;
        })
      );
    }
  }, [testingConnectionId, setNodes]);

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
   * Handle Resource node click - currently just logs, could open details dialog later
   */
  const handleResourceClick = (resource: Resource) => {
    console.log("Resource clicked:", resource.name);
    // Could open a resource details dialog in the future
  };

  /**
   * Handle Resource deletion from canvas with confirmation
   */
  const handleResourceDelete = async (resourceId: string) => {
    // Show confirmation dialog
    if (!window.confirm("Are you sure you want to delete this resource? The file will be permanently removed.")) {
      return;
    }

    try {
      const response = await fetch(apiUrl(`/api/resources/${resourceId}`), {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete resource");
      }

      const resourceNodeId = `resource-${resourceId}`;

      // Remove node
      setNodes((nds) => nds.filter((n) => n.id !== resourceNodeId));

      // Remove edges
      setEdges((eds) =>
        eds.filter((e) => e.source !== resourceNodeId && e.target !== resourceNodeId)
      );
    } catch (error) {
      console.error("Failed to delete resource:", error);
    }
  };

  /**
   * Handle Add MCP Server node click - opens create dialog with datasource preselected
   */
  const handleAddMCPServerClick = (datasourceId: string) => {
    setCreateMCPDatasourceId(datasourceId);
    setCreateMCPDialogOpen(true);
  };

  /**
   * Handle datasource edit - opens edit dialog
   */
  const handleDatasourceEdit = (datasource: Datasource) => {
    setEditingDatasource(datasource);
    setEditDatasourceDialogOpen(true);
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
      const addMcpNodeId = `add-mcp-${datasourceId}`;

      // Remove datasource node and its associated "+" node
      setNodes((nds) => nds.filter((n) => n.id !== datasourceNodeId && n.id !== addMcpNodeId));

      // Remove edges connected to either node
      setEdges((eds) =>
        eds.filter((e) =>
          e.source !== datasourceNodeId &&
          e.target !== datasourceNodeId &&
          e.source !== addMcpNodeId &&
          e.target !== addMcpNodeId
        )
      );
    } catch (error) {
      console.error("Failed to delete datasource:", error);
    }
  };

  /**
   * Handle MCP server edit - opens edit dialog
   */
  const handleMCPServerEdit = (mcpServer: MCPServer) => {
    setEditingMCPServer(mcpServer);
    setEditMCPServerDialogOpen(true);
  };

  /**
   * Handle MCP server activation
   */
  const handleMCPServerActivate = async (mcpServerId: string) => {
    try {
      const response = await fetch(apiUrl(`/api/mcp-servers/${mcpServerId}/activate`), {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to activate MCP server");
      }

      const updatedServer: MCPServer = await response.json();

      // Update the node data to reflect the new status
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === `mcpServer-${mcpServerId}` && node.data.mcpServer) {
            return {
              ...node,
              data: {
                ...node.data,
                mcpServer: updatedServer,
              },
            };
          }
          return node;
        })
      );

      console.log("MCP server activated successfully");
      toast.success("MCP server activated", {
        description: "The MCP server is now running and available.",
      });
    } catch (error) {
      console.error("Failed to activate MCP server:", error);
      toast.error("Activation failed", {
        description: "Failed to activate MCP server. Please try again.",
      });
    }
  };

  /**
   * Handle MCP server deactivation
   */
  const handleMCPServerDeactivate = async (mcpServerId: string) => {
    try {
      const response = await fetch(apiUrl(`/api/mcp-servers/${mcpServerId}/deactivate`), {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to deactivate MCP server");
      }

      const updatedServer: MCPServer = await response.json();

      // Update the node data to reflect the new status
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === `mcpServer-${mcpServerId}` && node.data.mcpServer) {
            return {
              ...node,
              data: {
                ...node.data,
                mcpServer: updatedServer,
              },
            };
          }
          return node;
        })
      );

      console.log("MCP server deactivated successfully");
      toast.success("MCP server deactivated", {
        description: "The MCP server has been stopped.",
      });
    } catch (error) {
      console.error("Failed to deactivate MCP server:", error);
      toast.error("Deactivation failed", {
        description: "Failed to deactivate MCP server. Please try again.",
      });
    }
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
   * Handle test connection for a datasource - tests and updates status
   */
  const handleDatasourceTestConnection = async (datasourceId: string) => {
    setTestingConnectionId(datasourceId);

    try {
      const response = await fetch(apiUrl(`/api/datasources/${datasourceId}/test`), {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to test connection");
      }

      const result = await response.json();
      const newStatus = result.success ? 'connected' : 'error';

      // Update the node data to reflect the new status
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === `datasource-${datasourceId}` && node.data.datasource) {
            return {
              ...node,
              data: {
                ...node.data,
                datasource: {
                  ...node.data.datasource,
                  status: newStatus,
                },
                isTestingConnection: false,
              },
            };
          }
          return node;
        })
      );

      if (result.success) {
        toast.success("Connection successful", {
          description: "Database connection is working correctly.",
        });
      } else {
        toast.error("Connection failed", {
          description: result.message || "Unable to connect to the database.",
        });
      }
    } catch (error) {
      console.error("Failed to test connection:", error);
      toast.error("Connection test failed", {
        description: "An error occurred while testing the connection.",
      });
    } finally {
      setTestingConnectionId(null);
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
   * Handle tool delete from dropdown menu - deletes from backend and removes from canvas
   */
  const handleToolDelete = async (toolId: string) => {
    try {
      const response = await fetch(apiUrl(`/api/tools/${toolId}`), {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete tool");
      }

      handleToolDeleted(toolId);
    } catch (error) {
      console.error("Failed to delete tool:", error);
    }
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
   * Handle resource creation - create canvas node and edge
   * Note: The backend already creates the canvas node when a resource is created,
   * so we just need to add the node and edge to the UI state
   */
  const handleResourceCreated = async (resource: Resource) => {
    try {
      const resourceNodeId = `resource-${resource.id}`;
      const mcpServerNodeId = `mcpServer-${resource.mcpServerId}`;

      // Find MCP server node to position resource near it
      const mcpServerNode = nodes.find((n) => n.id === mcpServerNodeId);
      const existingResourceNodes = nodes.filter((n) => n.id.startsWith('resource-') && n.id !== resourceNodeId);
      const yOffset = existingResourceNodes.length * 120; // Stack resources vertically
      const position = mcpServerNode
        ? { x: mcpServerNode.position.x + 300, y: mcpServerNode.position.y + yOffset }
        : { x: 500, y: 100 };

      // Add resource node to canvas
      const newNode: Node = {
        id: resourceNodeId,
        type: "resource",
        position,
        draggable: true,
        data: {
          resource,
          onClick: () => handleResourceClick(resource),
          onDelete: () => handleResourceDelete(resource.id),
        },
      };

      setNodes((nds) => [...nds, newNode]);

      // Add edge from MCP server to resource
      const newEdge: Edge = {
        id: `edge-${mcpServerNodeId}-${resourceNodeId}`,
        source: mcpServerNodeId,
        target: resourceNodeId,
        animated: true,
      };

      setEdges((eds) => [...eds, newEdge]);

      // Update canvas node position in backend (the backend already created the node, we just update position)
      await fetch(apiUrl(`/api/canvas/nodes/${resourceNodeId}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          positionX: position.x,
          positionY: position.y,
        }),
      });
    } catch (error) {
      console.error("Failed to add resource to canvas:", error);
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
        nodeTypes={nodeTypes}
        nodesConnectable={false}
        fitView
        proOptions={{ hideAttribution: true }}
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
          onToolCreated={handleToolCreated}
          onResourceCreated={handleResourceCreated}
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

      {/* Create MCP Server Dialog (from + node) */}
      <CreateMCPServerDialog
        open={createMCPDialogOpen}
        onOpenChange={setCreateMCPDialogOpen}
        datasourceId={createMCPDatasourceId || undefined}
        onSuccess={() => {
          setCreateMCPDialogOpen(false);
          setCreateMCPDatasourceId(null);
          // Refresh the canvas
          window.location.reload();
        }}
      />

      {/* Edit Datasource Dialog */}
      <CreateDatasourceDialog
        open={editDatasourceDialogOpen}
        onOpenChange={setEditDatasourceDialogOpen}
        datasource={editingDatasource || undefined}
        onSuccess={() => {
          setEditDatasourceDialogOpen(false);
          setEditingDatasource(null);
          // Refresh the canvas
          window.location.reload();
        }}
      />

      {/* Edit MCP Server Dialog */}
      <CreateMCPServerDialog
        open={editMCPServerDialogOpen}
        onOpenChange={setEditMCPServerDialogOpen}
        mcpServer={editingMCPServer || undefined}
        onSuccess={() => {
          setEditMCPServerDialogOpen(false);
          setEditingMCPServer(null);
          // Refresh the canvas
          window.location.reload();
        }}
      />
    </div>
  );
}
