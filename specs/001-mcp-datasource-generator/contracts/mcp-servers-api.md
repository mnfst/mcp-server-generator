# MCP Servers API Contract

**Base Path**: `/api/mcp-servers`

## Endpoints

### Create MCP Server

**POST** `/api/mcp-servers`

Creates a new MCP server configuration for a datasource. The server will be accessible at `/mcp/:slug` once activated.

**Request Body**:
```json
{
  "datasourceId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Validation**:
- `datasourceId`: required, must reference existing datasource

**Response** (201 Created):
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "name": "My MySQL DB",
  "slug": "my-mysql-db",
  "datasourceId": "550e8400-e29b-41d4-a716-446655440000",
  "config": null,
  "status": "draft",
  "mcpEndpoint": "/mcp/my-mysql-db",
  "createdAt": "2025-11-20T10:35:00Z",
  "updatedAt": "2025-11-20T10:35:00Z"
}
```

**Response** (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": ["datasourceId is required"],
  "error": "Bad Request"
}
```

**Response** (404 Not Found) - Invalid Datasource:
```json
{
  "statusCode": 404,
  "message": "Datasource not found",
  "error": "Not Found"
}
```

**Response** (409 Conflict) - Datasource Already Has Server:
```json
{
  "statusCode": 409,
  "message": "Datasource already has an MCP server",
  "error": "Conflict"
}
```

---

### List MCP Servers

**GET** `/api/mcp-servers`

Retrieves all MCP servers.

**Query Parameters**:
- `datasourceId` (optional): Filter by datasource UUID

**Response** (200 OK):
```json
[
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "name": "My MySQL DB",
    "slug": "my-mysql-db",
    "datasourceId": "550e8400-e29b-41d4-a716-446655440000",
    "config": null,
    "status": "active",
    "mcpEndpoint": "/mcp/my-mysql-db",
    "createdAt": "2025-11-20T10:35:00Z",
    "updatedAt": "2025-11-20T10:40:00Z"
  }
]
```

---

### Get MCP Server by ID

**GET** `/api/mcp-servers/:id`

Retrieves a single MCP server by ID.

**Path Parameters**:
- `id`: UUID of the MCP server

**Response** (200 OK):
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "name": "My MySQL DB",
  "slug": "my-mysql-db",
  "datasourceId": "550e8400-e29b-41d4-a716-446655440000",
  "config": null,
  "status": "active",
  "mcpEndpoint": "/mcp/my-mysql-db",
  "createdAt": "2025-11-20T10:35:00Z",
  "updatedAt": "2025-11-20T10:40:00Z"
}
```

**Response** (404 Not Found):
```json
{
  "statusCode": 404,
  "message": "MCP server not found",
  "error": "Not Found"
}
```

---

### Update MCP Server

**PATCH** `/api/mcp-servers/:id`

Updates MCP server configuration. Sets status to "draft" to indicate reactivation needed.

**Path Parameters**:
- `id`: UUID of the MCP server

**Request Body** (partial update):
```json
{
  "name": "Updated Server Name"
}
```

**Response** (200 OK):
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "name": "Updated Server Name",
  "slug": "my-mysql-db",
  "datasourceId": "550e8400-e29b-41d4-a716-446655440000",
  "config": null,
  "status": "draft",
  "mcpEndpoint": "/mcp/my-mysql-db",
  "createdAt": "2025-11-20T10:35:00Z",
  "updatedAt": "2025-11-20T11:50:00Z"
}
```

**Response** (404 Not Found): Same as GET by ID

---

### Delete MCP Server

**DELETE** `/api/mcp-servers/:id`

Deletes an MCP server and all associated tools. Stops the server endpoint if it's running.

**Path Parameters**:
- `id`: UUID of the MCP server

**Response** (204 No Content): Empty body

**Response** (404 Not Found): Same as GET by ID

---

### Activate MCP Server

**POST** `/api/mcp-servers/:id/activate`

Activates or reactivates the MCP server, making it accessible at `/mcp/:slug`. Registers all tools and starts the server endpoint.

**Path Parameters**:
- `id`: UUID of the MCP server

**Request Body**: None

**Response** (200 OK):
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "name": "My MySQL DB",
  "slug": "my-mysql-db",
  "datasourceId": "550e8400-e29b-41d4-a716-446655440000",
  "config": null,
  "status": "active",
  "mcpEndpoint": "/mcp/my-mysql-db",
  "toolCount": 3,
  "createdAt": "2025-11-20T10:35:00Z",
  "updatedAt": "2025-11-20T10:40:00Z"
}
```

**Response** (404 Not Found): Same as GET by ID

**Response** (500 Internal Server Error) - Activation Failed:
```json
{
  "statusCode": 500,
  "message": "Failed to activate server: Cannot connect to datasource",
  "error": "Internal Server Error"
}
```

---

### Get MCP Server Configuration

**GET** `/api/mcp-servers/:id/config`

Returns the complete MCP server configuration as JSON (for inspection/export).

**Path Parameters**:
- `id`: UUID of the MCP server

**Response** (200 OK):
```json
{
  "name": "my-data-server",
  "version": "1.0.0",
  "datasource": {
    "type": "mysql",
    "host": "localhost",
    "port": 3306,
    "database": "mydb"
  },
  "tools": [
    {
      "name": "get_users",
      "description": "Fetch all users from the database",
      "parameters": [],
      "query": "SELECT * FROM users"
    }
  ]
}
```

**Response** (404 Not Found): Same as GET by ID

---

## MCP Protocol Endpoint

### Connect to MCP Server

**POST** `/mcp/:slug`

This is the MCP protocol endpoint that clients connect to. It implements the MCP JSON-RPC 2.0 specification.

**Path Parameters**:
- `slug`: URL slug of the MCP server (kebab-case)

**Request Body** (JSON-RPC 2.0):
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}
```

**Response** (200 OK):
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "get_users",
        "description": "Fetch all users from the database",
        "inputSchema": {
          "type": "object",
          "properties": {},
          "required": []
        }
      }
    ]
  }
}
```

**Response** (404 Not Found) - Server Not Found:
```json
{
  "statusCode": 404,
  "message": "MCP server not found at slug: my-server",
  "error": "Not Found"
}
```

**Response** (502 Bad Gateway) - Datasource Unavailable:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32000,
    "message": "Datasource unavailable: Connection timeout"
  }
}
```

**Note**: This endpoint implements the full MCP protocol specification. Clients should use MCP client SDKs to connect. See [MCP documentation](https://modelcontextprotocol.io) for details.

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
- MCP servers are served dynamically at `/mcp/:slug` endpoints (HTTP with JSON-RPC 2.0)
- Server slug is auto-generated from datasource name in kebab-case
- If slug conflicts with existing server, numeric suffix is appended (e.g., my-db-2, my-db-3)
- Status automatically managed by system:
  - `draft`: Server created but not activated yet, or modified since last activation
  - `active`: Server running and accessible at `/mcp/:slug` endpoint
  - `error`: Server activation failed (check error message)
- Servers persist across backend restarts (stored in database, auto-reloaded on startup)
- One datasource can have only one MCP server (one-to-one relationship)
- MCP servers are publicly accessible (no authentication in POC)
