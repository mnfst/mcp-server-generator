# Schema API Contract

**Base Path**: `/api/schema`

## Endpoints

### Get Database Schema

**GET** `/api/schema/:datasourceId`

Retrieves the complete database schema for a datasource, including tables, columns, and relationships.

**Path Parameters**:
- `datasourceId`: UUID of the datasource

**Response** (200 OK):
```json
{
  "datasourceId": "550e8400-e29b-41d4-a716-446655440000",
  "tables": [
    {
      "name": "users",
      "columns": [
        {
          "name": "id",
          "dataType": "INTEGER",
          "nullable": false,
          "defaultValue": null
        },
        {
          "name": "email",
          "dataType": "VARCHAR(255)",
          "nullable": false,
          "defaultValue": null
        },
        {
          "name": "status",
          "dataType": "VARCHAR(20)",
          "nullable": false,
          "defaultValue": "active"
        },
        {
          "name": "registration_date",
          "dataType": "TIMESTAMP",
          "nullable": false,
          "defaultValue": "CURRENT_TIMESTAMP"
        }
      ],
      "primaryKey": ["id"],
      "foreignKeys": []
    },
    {
      "name": "orders",
      "columns": [
        {
          "name": "id",
          "dataType": "INTEGER",
          "nullable": false,
          "defaultValue": null
        },
        {
          "name": "user_id",
          "dataType": "INTEGER",
          "nullable": false,
          "defaultValue": null
        },
        {
          "name": "order_date",
          "dataType": "TIMESTAMP",
          "nullable": false,
          "defaultValue": "CURRENT_TIMESTAMP"
        },
        {
          "name": "total",
          "dataType": "DECIMAL(10,2)",
          "nullable": false,
          "defaultValue": null
        }
      ],
      "primaryKey": ["id"],
      "foreignKeys": [
        {
          "columnName": "user_id",
          "referencedTable": "users",
          "referencedColumn": "id"
        }
      ]
    }
  ],
  "lastFetched": "2025-11-20T10:50:00Z"
}
```

**Response** (404 Not Found) - Datasource Not Found:
```json
{
  "statusCode": 404,
  "message": "Datasource not found",
  "error": "Not Found"
}
```

**Response** (502 Bad Gateway) - Database Connection Failed:
```json
{
  "statusCode": 502,
  "message": "Cannot connect to datasource: Connection timeout",
  "error": "Bad Gateway"
}
```

**Response** (500 Internal Server Error) - Schema Introspection Failed:
```json
{
  "statusCode": 500,
  "message": "Failed to fetch schema: Permission denied on information_schema",
  "error": "Internal Server Error"
}
```

---

### Get Schema for React Flow

**GET** `/api/schema/:datasourceId/graph`

Returns schema formatted for React Flow visualization (nodes and edges).

**Path Parameters**:
- `datasourceId`: UUID of the datasource

**Response** (200 OK):
```json
{
  "nodes": [
    {
      "id": "users",
      "type": "table",
      "position": { "x": 100, "y": 100 },
      "data": {
        "label": "users",
        "columns": [
          { "name": "id", "type": "INTEGER", "isPrimaryKey": true },
          { "name": "email", "type": "VARCHAR(255)", "isPrimaryKey": false },
          { "name": "status", "type": "VARCHAR(20)", "isPrimaryKey": false },
          { "name": "registration_date", "type": "TIMESTAMP", "isPrimaryKey": false }
        ]
      }
    },
    {
      "id": "orders",
      "type": "table",
      "position": { "x": 400, "y": 100 },
      "data": {
        "label": "orders",
        "columns": [
          { "name": "id", "type": "INTEGER", "isPrimaryKey": true },
          { "name": "user_id", "type": "INTEGER", "isPrimaryKey": false },
          { "name": "order_date", "type": "TIMESTAMP", "isPrimaryKey": false },
          { "name": "total", "type": "DECIMAL(10,2)", "isPrimaryKey": false }
        ]
      }
    }
  ],
  "edges": [
    {
      "id": "e1-orders-users",
      "source": "orders",
      "target": "users",
      "sourceHandle": "user_id",
      "targetHandle": "id",
      "type": "smoothstep",
      "label": "user_id → id",
      "animated": false
    }
  ]
}
```

**Response** (404 Not Found): Same as Get Database Schema

**Response** (502 Bad Gateway): Same as Get Database Schema

---

### Refresh Schema Cache

**POST** `/api/schema/:datasourceId/refresh`

Forces a refresh of the cached schema for a datasource.

**Path Parameters**:
- `datasourceId`: UUID of the datasource

**Request Body**: None

**Response** (200 OK):
```json
{
  "datasourceId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Schema refreshed successfully",
  "tableCount": 15,
  "lastFetched": "2025-11-20T12:05:00Z"
}
```

**Response** (404 Not Found): Same as Get Database Schema

**Response** (502 Bad Gateway): Same as Get Database Schema

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
- Schema is cached per datasource to avoid repeated queries
- Cache invalidated on datasource update or manual refresh
- React Flow graph endpoint includes auto-layout positions (can be overridden by frontend)
- Foreign key relationships determine edge connections in graph
- Maximum 100 tables supported (configurable limit)
- Data types are database-native (e.g., VARCHAR, INTEGER, TIMESTAMP)
