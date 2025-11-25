# Tools API Contract

**Base Path**: `/api/tools`

## Endpoints

### Create Tool

**POST** `/api/tools`

Creates a new tool by generating SQL from a natural language prompt.

**Request Body**:
```json
{
  "mcpServerId": "660e8400-e29b-41d4-a716-446655440001",
  "name": "get_active_users",
  "description": "Fetch all active users from the database",
  "prompt": "Get all users where status is active, showing their email and registration date"
}
```

**Validation**:
- `mcpServerId`: required, must reference existing MCP server
- `name`: required, 1-100 characters, alphanumeric + underscores, must start with letter, unique per server
- `description`: required, 1-500 characters
- `prompt`: required, 1-2000 characters

**Response** (201 Created):
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "mcpServerId": "660e8400-e29b-41d4-a716-446655440001",
  "name": "get_active_users",
  "description": "Fetch all active users from the database",
  "prompt": "Get all users where status is active, showing their email and registration date",
  "sqlQuery": "SELECT email, registration_date FROM users WHERE status = 'active'",
  "parameters": null,
  "createdAt": "2025-11-20T10:45:00Z",
  "updatedAt": "2025-11-20T10:45:00Z"
}
```

**Response** (400 Bad Request) - Validation Error:
```json
{
  "statusCode": 400,
  "message": ["name must be unique within MCP server", "name must start with a letter"],
  "error": "Bad Request"
}
```

**Response** (404 Not Found) - Invalid MCP Server:
```json
{
  "statusCode": 404,
  "message": "MCP server not found",
  "error": "Not Found"
}
```

**Response** (422 Unprocessable Entity) - LLM Generation Failed:
```json
{
  "statusCode": 422,
  "message": "Failed to generate SQL: LLM returned invalid SQL syntax",
  "error": "Unprocessable Entity"
}
```

**Response** (502 Bad Gateway) - LLM API Error:
```json
{
  "statusCode": 502,
  "message": "LLM API unavailable",
  "error": "Bad Gateway"
}
```

---

### List Tools

**GET** `/api/tools`

Retrieves all tools.

**Query Parameters**:
- `mcpServerId` (optional): Filter by MCP server UUID

**Response** (200 OK):
```json
[
  {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "mcpServerId": "660e8400-e29b-41d4-a716-446655440001",
    "name": "get_active_users",
    "description": "Fetch all active users from the database",
    "prompt": "Get all users where status is active",
    "sqlQuery": "SELECT email, registration_date FROM users WHERE status = 'active'",
    "parameters": null,
    "createdAt": "2025-11-20T10:45:00Z",
    "updatedAt": "2025-11-20T10:45:00Z"
  }
]
```

---

### Get Tool by ID

**GET** `/api/tools/:id`

Retrieves a single tool by ID.

**Path Parameters**:
- `id`: UUID of the tool

**Response** (200 OK):
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "mcpServerId": "660e8400-e29b-41d4-a716-446655440001",
  "name": "get_active_users",
  "description": "Fetch all active users from the database",
  "prompt": "Get all users where status is active",
  "sqlQuery": "SELECT email, registration_date FROM users WHERE status = 'active'",
  "parameters": null,
  "createdAt": "2025-11-20T10:45:00Z",
  "updatedAt": "2025-11-20T10:45:00Z"
}
```

**Response** (404 Not Found):
```json
{
  "statusCode": 404,
  "message": "Tool not found",
  "error": "Not Found"
}
```

---

### Update Tool

**PATCH** `/api/tools/:id`

Updates a tool. If prompt is changed, regenerates SQL query via LLM.

**Path Parameters**:
- `id`: UUID of the tool

**Request Body** (partial update):
```json
{
  "prompt": "Get all active users ordered by registration date descending",
  "description": "Fetch active users sorted by newest first"
}
```

**Response** (200 OK):
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "mcpServerId": "660e8400-e29b-41d4-a716-446655440001",
  "name": "get_active_users",
  "description": "Fetch active users sorted by newest first",
  "prompt": "Get all active users ordered by registration date descending",
  "sqlQuery": "SELECT email, registration_date FROM users WHERE status = 'active' ORDER BY registration_date DESC",
  "parameters": null,
  "createdAt": "2025-11-20T10:45:00Z",
  "updatedAt": "2025-11-20T11:55:00Z"
}
```

**Response** (404 Not Found): Same as GET by ID

**Response** (422 Unprocessable Entity): Same as Create Tool

---

### Delete Tool

**DELETE** `/api/tools/:id`

Deletes a tool from the MCP server.

**Path Parameters**:
- `id`: UUID of the tool

**Response** (204 No Content): Empty body

**Response** (404 Not Found): Same as GET by ID

---

### Test Tool

**POST** `/api/tools/:id/test`

Executes the tool's SQL query against the datasource and returns sample results.

**Path Parameters**:
- `id`: UUID of the tool

**Request Body** (optional parameters):
```json
{
  "parameters": {
    "userId": "123",
    "startDate": "2025-01-01"
  }
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "rows": [
    {
      "email": "user1@example.com",
      "registration_date": "2025-11-15"
    },
    {
      "email": "user2@example.com",
      "registration_date": "2025-11-10"
    }
  ],
  "rowCount": 42,
  "executionTime": 15,
  "error": null
}
```

**Response** (200 OK) - Query Failed:
```json
{
  "success": false,
  "rows": [],
  "rowCount": 0,
  "executionTime": 0,
  "error": "SQL syntax error near 'FORM'"
}
```

**Response** (404 Not Found): Same as GET by ID

**Response** (502 Bad Gateway) - Database Connection Failed:
```json
{
  "statusCode": 502,
  "message": "Cannot connect to datasource",
  "error": "Bad Gateway"
}
```

**Note**: Query results limited to first 10 rows for preview purposes.

---

### Regenerate Tool SQL

**POST** `/api/tools/:id/regenerate`

Regenerates the SQL query from the existing prompt using LLM.

**Path Parameters**:
- `id`: UUID of the tool

**Request Body**: None

**Response** (200 OK):
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "mcpServerId": "660e8400-e29b-41d4-a716-446655440001",
  "name": "get_active_users",
  "description": "Fetch all active users from the database",
  "prompt": "Get all users where status is active",
  "sqlQuery": "SELECT id, email, registration_date FROM users WHERE status = 'active'",
  "parameters": null,
  "createdAt": "2025-11-20T10:45:00Z",
  "updatedAt": "2025-11-20T12:00:00Z"
}
```

**Response** (404 Not Found): Same as GET by ID

**Response** (422 Unprocessable Entity): Same as Create Tool

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
- SQL queries automatically validated to be SELECT-only (no INSERT, UPDATE, DELETE, DROP, etc.)
- Test endpoint returns maximum 10 rows for preview
- Parameters JSON structure matches data model specification
- Tool name must be unique within its MCP server (compound unique constraint)
- Updating a tool's prompt automatically regenerates SQL via LLM
