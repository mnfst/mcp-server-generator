# Canvas API Contract

**Base Path**: `/api/canvas`

## Endpoints

### Get All Canvas Nodes

**GET** `/api/canvas/nodes`

Retrieves all canvas nodes with their positions for rendering the React Flow canvas.

**Query Parameters**: None

**Response** (200 OK):
```json
[
  {
    "id": "880e8400-e29b-41d4-a716-446655440003",
    "nodeId": "datasource-550e8400-e29b-41d4-a716-446655440000",
    "type": "datasource",
    "positionX": 100,
    "positionY": 150,
    "datasourceId": "550e8400-e29b-41d4-a716-446655440000",
    "mcpServerId": null,
    "toolId": null,
    "createdAt": "2025-11-20T10:30:00Z",
    "updatedAt": "2025-11-20T10:30:00Z"
  },
  {
    "id": "990e8400-e29b-41d4-a716-446655440004",
    "nodeId": "add-mcpserver-550e8400-e29b-41d4-a716-446655440000",
    "type": "add",
    "positionX": 100,
    "positionY": 300,
    "datasourceId": null,
    "mcpServerId": null,
    "toolId": null,
    "createdAt": "2025-11-20T10:30:00Z",
    "updatedAt": "2025-11-20T10:30:00Z"
  }
]
```

---

### Create Canvas Node

**POST** `/api/canvas/nodes`

Creates a new canvas node for a datasource, MCP server, tool, or add node.

**Request Body**:
```json
{
  "nodeId": "datasource-550e8400-e29b-41d4-a716-446655440000",
  "type": "datasource",
  "positionX": 100,
  "positionY": 150,
  "datasourceId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Validation**:
- `nodeId`: required, 1-100 characters, unique
- `type`: required, must be 'datasource', 'mcpServer', 'tool', or 'add'
- `positionX`: required, number
- `positionY`: required, number
- `datasourceId`: required if type is 'datasource', otherwise null
- `mcpServerId`: required if type is 'mcpServer', otherwise null
- `toolId`: required if type is 'tool', otherwise null
- All foreign keys must be null if type is 'add'

**Response** (201 Created):
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440003",
  "nodeId": "datasource-550e8400-e29b-41d4-a716-446655440000",
  "type": "datasource",
  "positionX": 100,
  "positionY": 150,
  "datasourceId": "550e8400-e29b-41d4-a716-446655440000",
  "mcpServerId": null,
  "toolId": null,
  "createdAt": "2025-11-20T10:30:00Z",
  "updatedAt": "2025-11-20T10:30:00Z"
}
```

**Response** (400 Bad Request) - Validation Error:
```json
{
  "statusCode": 400,
  "message": ["nodeId must be unique", "type must be one of: datasource, mcpServer, tool, add"],
  "error": "Bad Request"
}
```

**Response** (404 Not Found) - Invalid Foreign Key:
```json
{
  "statusCode": 404,
  "message": "Datasource not found",
  "error": "Not Found"
}
```

**Response** (409 Conflict) - Node Already Exists:
```json
{
  "statusCode": 409,
  "message": "Canvas node with this nodeId already exists",
  "error": "Conflict"
}
```

---

### Update Canvas Node Position

**PATCH** `/api/canvas/nodes/:nodeId`

Updates the position of a canvas node (used when user drags nodes on canvas).

**Path Parameters**:
- `nodeId`: React Flow node ID (e.g., 'datasource-uuid')

**Request Body**:
```json
{
  "positionX": 250,
  "positionY": 300
}
```

**Validation**:
- `positionX`: optional, number
- `positionY`: optional, number
- At least one field must be provided

**Response** (200 OK):
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440003",
  "nodeId": "datasource-550e8400-e29b-41d4-a716-446655440000",
  "type": "datasource",
  "positionX": 250,
  "positionY": 300,
  "datasourceId": "550e8400-e29b-41d4-a716-446655440000",
  "mcpServerId": null,
  "toolId": null,
  "createdAt": "2025-11-20T10:30:00Z",
  "updatedAt": "2025-11-20T11:50:00Z"
}
```

**Response** (404 Not Found):
```json
{
  "statusCode": 404,
  "message": "Canvas node not found",
  "error": "Not Found"
}
```

---

### Batch Update Canvas Node Positions

**PATCH** `/api/canvas/nodes/batch`

Updates multiple canvas node positions in a single request (optimized for canvas drag operations).

**Request Body**:
```json
{
  "updates": [
    {
      "nodeId": "datasource-550e8400-e29b-41d4-a716-446655440000",
      "positionX": 250,
      "positionY": 300
    },
    {
      "nodeId": "tool-770e8400-e29b-41d4-a716-446655440002",
      "positionX": 400,
      "positionY": 450
    }
  ]
}
```

**Validation**:
- `updates`: required, array with at least 1 element
- Each update must have `nodeId`, `positionX`, and `positionY`

**Response** (200 OK):
```json
{
  "updated": 2,
  "nodes": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440003",
      "nodeId": "datasource-550e8400-e29b-41d4-a716-446655440000",
      "type": "datasource",
      "positionX": 250,
      "positionY": 300,
      "datasourceId": "550e8400-e29b-41d4-a716-446655440000",
      "mcpServerId": null,
      "toolId": null,
      "createdAt": "2025-11-20T10:30:00Z",
      "updatedAt": "2025-11-20T11:50:00Z"
    },
    {
      "id": "aa0e8400-e29b-41d4-a716-446655440005",
      "nodeId": "tool-770e8400-e29b-41d4-a716-446655440002",
      "type": "tool",
      "positionX": 400,
      "positionY": 450,
      "datasourceId": null,
      "mcpServerId": null,
      "toolId": "770e8400-e29b-41d4-a716-446655440002",
      "createdAt": "2025-11-20T10:45:00Z",
      "updatedAt": "2025-11-20T11:50:00Z"
    }
  ]
}
```

**Response** (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": ["updates array must contain at least 1 element"],
  "error": "Bad Request"
}
```

**Response** (404 Not Found) - One or More Nodes Not Found:
```json
{
  "statusCode": 404,
  "message": "Canvas nodes not found: datasource-invalid-uuid",
  "error": "Not Found"
}
```

---

### Delete Canvas Node

**DELETE** `/api/canvas/nodes/:nodeId`

Deletes a canvas node by its node ID. This is automatically called when the associated entity (datasource, MCP server, tool) is deleted due to cascade deletion.

**Path Parameters**:
- `nodeId`: React Flow node ID

**Response** (204 No Content): Empty body

**Response** (404 Not Found):
```json
{
  "statusCode": 404,
  "message": "Canvas node not found",
  "error": "Not Found"
}
```

---

### Get Canvas Node by Entity

**GET** `/api/canvas/nodes/entity/:entityType/:entityId`

Retrieves the canvas node for a specific entity (datasource, MCP server, or tool).

**Path Parameters**:
- `entityType`: 'datasource', 'mcpServer', or 'tool'
- `entityId`: UUID of the entity

**Response** (200 OK):
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440003",
  "nodeId": "datasource-550e8400-e29b-41d4-a716-446655440000",
  "type": "datasource",
  "positionX": 100,
  "positionY": 150,
  "datasourceId": "550e8400-e29b-41d4-a716-446655440000",
  "mcpServerId": null,
  "toolId": null,
  "createdAt": "2025-11-20T10:30:00Z",
  "updatedAt": "2025-11-20T10:30:00Z"
}
```

**Response** (404 Not Found):
```json
{
  "statusCode": 404,
  "message": "Canvas node not found for datasource",
  "error": "Not Found"
}
```

**Response** (400 Bad Request) - Invalid Entity Type:
```json
{
  "statusCode": 400,
  "message": "entityType must be one of: datasource, mcpServer, tool",
  "error": "Bad Request"
}
```

---

## Error Responses

All endpoints may return:

**401 Unauthorized** (if authentication added later):
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**500 Internal Server Error**:
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

## Notes

- All timestamps in ISO 8601 format (UTC)
- Canvas nodes are automatically created when datasources, MCP servers, and tools are created
- Canvas nodes are automatically deleted when associated entities are deleted (cascade deletion)
- Node positions are updated frequently as users drag nodes on the canvas
- Batch update endpoint is optimized for canvas interactions (e.g., dragging multiple nodes)
- "add" type nodes are special UI-only nodes that don't reference any entity
- Node ID format:
  - Datasource nodes: `datasource-{uuid}`
  - MCP server nodes: `mcpserver-{uuid}`
  - Tool nodes: `tool-{uuid}`
  - Add datasource node: `add-datasource`
  - Add MCP server nodes: `add-mcpserver-{datasource-uuid}`
