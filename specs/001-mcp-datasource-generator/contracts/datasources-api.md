# Datasources API Contract

**Base Path**: `/api/datasources`

## Endpoints

### Create Datasource

**POST** `/api/datasources`

Creates a new datasource connection and tests it.

**Request Body**:
```json
{
  "name": "My MySQL DB",
  "type": "mysql",
  "host": "localhost",
  "port": 3306,
  "database": "mydb",
  "username": "dbuser",
  "password": "secretpassword"
}
```

**Validation**:
- `name`: required, 1-100 characters, unique
- `type`: required, must be "mysql" (PostgreSQL support deferred)
- `host`: required, non-empty string
- `port`: required, integer 1-65535
- `database`: required, 1-64 characters
- `username`: required, 1-64 characters
- `password`: required, 1-255 characters

**Response** (201 Created):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "My MySQL DB",
  "type": "mysql",
  "host": "localhost",
  "port": 3306,
  "database": "mydb",
  "username": "dbuser",
  "status": "connected",
  "createdAt": "2025-11-20T10:30:00Z",
  "updatedAt": "2025-11-20T10:30:00Z"
}
```

**Response** (400 Bad Request) - Validation Error:
```json
{
  "statusCode": 400,
  "message": ["name must be unique", "port must be between 1 and 65535"],
  "error": "Bad Request"
}
```

**Response** (502 Bad Gateway) - Connection Failed:
```json
{
  "statusCode": 502,
  "message": "Failed to connect to database: Connection refused",
  "error": "Bad Gateway"
}
```

---

### List Datasources

**GET** `/api/datasources`

Retrieves all datasources.

**Query Parameters**: None

**Response** (200 OK):
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "My MySQL DB",
    "type": "mysql",
    "host": "localhost",
    "port": 3306,
    "database": "mydb",
    "username": "dbuser",
    "status": "connected",
    "createdAt": "2025-11-20T10:30:00Z",
    "updatedAt": "2025-11-20T10:30:00Z"
  }
]
```

**Note**: Password field is never returned in responses.

---

### Get Datasource by ID

**GET** `/api/datasources/:id`

Retrieves a single datasource by ID.

**Path Parameters**:
- `id`: UUID of the datasource

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "My MySQL DB",
  "type": "mysql",
  "host": "localhost",
  "port": 3306,
  "database": "mydb",
  "username": "dbuser",
  "status": "connected",
  "createdAt": "2025-11-20T10:30:00Z",
  "updatedAt": "2025-11-20T10:30:00Z"
}
```

**Response** (404 Not Found):
```json
{
  "statusCode": 404,
  "message": "Datasource not found",
  "error": "Not Found"
}
```

---

### Update Datasource

**PATCH** `/api/datasources/:id`

Updates datasource connection details and retests connection.

**Path Parameters**:
- `id`: UUID of the datasource

**Request Body** (partial update):
```json
{
  "host": "newhost.example.com",
  "port": 3306
}
```

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "My MySQL DB",
  "type": "mysql",
  "host": "newhost.example.com",
  "port": 3306,
  "database": "mydb",
  "username": "dbuser",
  "status": "connected",
  "createdAt": "2025-11-20T10:30:00Z",
  "updatedAt": "2025-11-20T11:45:00Z"
}
```

**Response** (404 Not Found): Same as GET by ID

---

### Delete Datasource

**DELETE** `/api/datasources/:id`

Deletes a datasource and its associated MCP server and tools.

**Path Parameters**:
- `id`: UUID of the datasource

**Response** (204 No Content): Empty body

**Response** (404 Not Found): Same as GET by ID

---

### Test Datasource Connection

**POST** `/api/datasources/:id/test`

Tests the connection to a datasource.

**Path Parameters**:
- `id`: UUID of the datasource

**Response** (200 OK):
```json
{
  "connected": true,
  "message": "Connection successful"
}
```

**Response** (502 Bad Gateway):
```json
{
  "connected": false,
  "message": "Connection failed: Timeout",
  "error": "Bad Gateway"
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
- Password never returned in responses (stored encrypted at rest using AES-256)
- Password is encrypted before storage and decrypted only for database connection attempts
- Encryption key stored in environment variable `CREDENTIALS_ENCRYPTION_KEY`
- Status field automatically updated based on connection tests
- Database type cannot be changed after creation (would require new datasource)
