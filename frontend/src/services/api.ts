import axios from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreateToolDto, Tool, ToolTestResult, DatabaseSchema } from 'shared';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error:', error.message);
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// ==================== Tool Mutation Hooks ====================

/**
 * Hook to create a new tool with AI-generated SQL query.
 * POST /api/tools
 */
export function useCreateTool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateToolDto) => {
      const response = await apiClient.post<Tool>('/api/tools', data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate tools query to refetch the list
      queryClient.invalidateQueries({ queryKey: ['tools'] });
    },
  });
}

/**
 * Hook to update an existing tool (including regenerating SQL from prompt).
 * PATCH /api/tools/:id
 */
export function useUpdateTool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Tool> }) => {
      const response = await apiClient.patch<Tool>(`/api/tools/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate tools query to refetch the list
      queryClient.invalidateQueries({ queryKey: ['tools'] });
    },
  });
}

/**
 * Hook to delete a tool.
 * DELETE /api/tools/:id
 */
export function useDeleteTool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/tools/${id}`);
    },
    onSuccess: () => {
      // Invalidate tools query to refetch the list
      queryClient.invalidateQueries({ queryKey: ['tools'] });
    },
  });
}

/**
 * Hook to delete a canvas node.
 * DELETE /api/canvas/nodes/:nodeId
 */
export function useDeleteCanvasNode() {
  return useMutation({
    mutationFn: async (nodeId: string) => {
      await apiClient.delete(`/api/canvas/nodes/${nodeId}`);
    },
  });
}

/**
 * Hook to test a tool by executing its SQL query with parameters.
 * POST /api/tools/:id/test
 */
export function useTestTool() {
  return useMutation({
    mutationFn: async ({ id, parameters }: { id: string; parameters?: Record<string, any> }) => {
      const response = await apiClient.post<ToolTestResult>(`/api/tools/${id}/test`, { parameters });
      return response.data;
    },
  });
}

/**
 * Hook to refresh the database schema for a datasource.
 * POST /api/schema/:datasourceId/refresh
 */
export function useRefreshSchema() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (datasourceId: string) => {
      const response = await apiClient.post<DatabaseSchema>(`/api/schema/${datasourceId}/refresh`);
      return response.data;
    },
    onSuccess: (_data, datasourceId) => {
      // Invalidate schema query for this datasource
      queryClient.invalidateQueries({ queryKey: ['schema', datasourceId] });
    },
  });
}

// ==================== Tool Query Hooks ====================

/**
 * Hook to fetch database schema for a datasource.
 * GET /api/schema/:datasourceId
 */
export function useSchema(datasourceId: string | undefined) {
  return useQuery({
    queryKey: ['schema', datasourceId],
    queryFn: async () => {
      if (!datasourceId) throw new Error('Datasource ID is required');
      const response = await apiClient.get<DatabaseSchema>(`/api/schema/${datasourceId}`);
      return response.data;
    },
    enabled: !!datasourceId,
  });
}

/**
 * Hook to fetch tools, optionally filtered by MCP server ID.
 * GET /api/tools?mcpServerId=...
 */
export function useTools(mcpServerId?: string) {
  return useQuery({
    queryKey: ['tools', mcpServerId],
    queryFn: async () => {
      const params = mcpServerId ? { mcpServerId } : {};
      const response = await apiClient.get<Tool[]>('/api/tools', { params });
      return response.data;
    },
  });
}
