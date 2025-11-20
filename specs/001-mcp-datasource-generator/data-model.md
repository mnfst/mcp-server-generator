# Data Model: MCP Datasource Tool Generator

**Phase**: 1 (Design & Contracts)
**Date**: 2025-11-20
**Purpose**: Define entities, relationships, and validation rules for the application

## Entity Relationship Overview

```
┌─────────────────┐                  ┌─────────────────┐
│   Datasource    │                  │   CanvasNode    │
│                 │                  │                 │
│ - id            │◄─────────────────┤ - id            │
│ - name          │  references      │ - nodeId        │
│ - type          │                  │ - type          │
│ - host          │                  │ - positionX     │
│ - port          │                  │ - positionY     │
│ - database      │                  │ - datasourceId  │
│ - username      │                  │ - mcpServerId   │
│ - password      │                  │ - toolId        │
│ - status        │                  │ - createdAt     │
│ - createdAt     │                  │ - updatedAt     │
│ - updatedAt     │                  └─────────────────┘
└────────┬────────┘
         │ 1
         │
         │ has one
         │
         │ 1
┌────────┴────────┐                  ┌─────────────────┐
│   MCPServer     │                  │   CanvasNode    │
│                 │◄─────────────────┤                 │
│ - id            │  references      │ (see above)     │
│ - name          │                  └─────────────────┘
│ - slug          │
│ - datasourceId  │◄──── Foreign Key
│ - config        │
│ - status        │
│ - createdAt     │
│ - updatedAt     │
└────────┬────────┘
         │ 1
         │
         │ has many
         │
         │ *
┌────────┴────────┐                  ┌─────────────────┐
│      Tool       │                  │   CanvasNode    │
│                 │◄─────────────────┤                 │
│ - id            │  references      │ (see above)     │
│ - name          │                  └─────────────────┘
│ - description   │
│ - mcpServerId   │◄──── Foreign Key
│ - prompt        │
│ - sqlQuery      │
│ - parameters    │
│ - createdAt     │
│ - updatedAt     │
└─────────────────┘
```

**Note**: CanvasNode stores React Flow node positions for all node types (datasource, MCP server, tool, and "+" add nodes). Each CanvasNode has nullable foreign keys (datasourceId, mcpServerId, toolId) to identify which entity it represents.

## Entities

### Datasource

Represents a connection to a user's database.

**Fields**:

| Field | Type | Nullable | Validation | Description |
|-------|------|----------|------------|-------------|
| id | UUID | No | Auto-generated | Primary key |
| name | string | No | 1-100 chars, alphanumeric + spaces | User-friendly name for the datasource |
| type | enum | No | 'mysql' | Database type (PostgreSQL support deferred) |
| host | string | No | Valid hostname or IP | Database server host |
| port | number | No | 1-65535 | Database server port |
| database | string | No | 1-64 chars | Database name to connect to |
| username | string | No | 1-64 chars | Database username |
| password | string | No | 1-255 chars, AES-256 encrypted | Database password (encrypted at rest using AES-256 with encryption key from environment variable CREDENTIALS_ENCRYPTION_KEY) |
| status | enum | No | 'pending', 'connected', 'failed' | Connection status |
| createdAt | timestamp | No | Auto-generated | Record creation time |
| updatedAt | timestamp | No | Auto-updated | Last modification time |

**Relationships**:
- Has one `MCPServer` (one-to-one)

**State Transitions**:
```
pending → connected   (successful connection test)
pending → failed      (connection test fails)
connected → failed    (connection lost)
failed → connected    (reconnection succeeds)
```

**Validation Rules**:
- Port must be a valid port number (1-65535)
- Type must be exactly 'mysql' (PostgreSQL support deferred to future iteration)
- Host cannot be empty
- Username and password cannot be empty
- Name must be unique per user (POC: globally unique since single-user)
- Password is encrypted using AES-256 before storage and decrypted on retrieval for database connections

**Indexes**:
- Primary key on `id`
- Unique index on `name`

### MCPServer

Represents a dynamically served MCP server configuration accessible at /mcp/:slug.

**Fields**:

| Field | Type | Nullable | Validation | Description |
|-------|------|----------|------------|-------------|
| id | UUID | No | Auto-generated | Primary key |
| name | string | No | 1-100 chars, alphanumeric + hyphens | Server name |
| slug | string | No | Kebab-case, unique, 1-100 chars | URL slug derived from datasource name (used in /mcp/:slug endpoint) |
| datasourceId | UUID | No | Foreign key | Reference to datasource |
| config | JSON | Yes | Valid JSON object | Additional server configuration |
| status | enum | No | 'draft', 'active', 'error' | Server status |
| createdAt | timestamp | No | Auto-generated | Record creation time |
| updatedAt | timestamp | No | Auto-updated | Last modification time |

**Relationships**:
- Belongs to one `Datasource` (one-to-one)
- Has many `Tool` (one-to-many)

**State Transitions**:
```
draft → active        (server configuration saved and active)
draft → error         (server startup fails)
active → draft        (user modifies tools or configuration)
active → active       (configuration updated while running)
active → error        (server encounters runtime error)
```

**Validation Rules**:
- Slug must be unique across all MCP servers
- Slug must be valid kebab-case (lowercase letters, numbers, hyphens only)
- Slug is auto-generated from datasource name on creation
- If slug conflicts, append numeric suffix (e.g., my-db, my-db-2, my-db-3)
- datasourceId must reference existing datasource
- Cannot delete if tools exist (cascade or prevent)

**Indexes**:
- Primary key on `id`
- Unique index on `slug`
- Foreign key on `datasourceId` (unique)
- Index on `status`

### Tool

Represents a custom query tool for an MCP server.

**Fields**:

| Field | Type | Nullable | Validation | Description |
|-------|------|----------|------------|-------------|
| id | UUID | No | Auto-generated | Primary key |
| name | string | No | 1-100 chars, alphanumeric + underscores | Tool name (used as MCP tool identifier) |
| description | string | No | 1-500 chars | Human-readable tool description |
| mcpServerId | UUID | No | Foreign key | Reference to MCP server |
| prompt | text | No | 1-2000 chars | Natural language prompt used to generate SQL |
| sqlQuery | text | No | Valid SQL SELECT statement | Generated SQL query |
| parameters | JSON | Yes | Valid JSON array | Query parameter definitions |
| createdAt | timestamp | No | Auto-generated | Record creation time |
| updatedAt | timestamp | No | Auto-updated | Last modification time |

**Relationships**:
- Belongs to one `MCPServer` (many-to-one)

**Validation Rules**:
- Name must be unique within an MCP server
- Name must be valid identifier (alphanumeric + underscores, start with letter)
- sqlQuery must be a valid SELECT statement (no INSERT, UPDATE, DELETE, DROP, etc.)
- sqlQuery must match database type of associated datasource
- parameters must be valid JSON array if provided

**Parameters JSON Structure**:
```json
[
  {
    "name": "userId",
    "type": "string",
    "required": true,
    "description": "User ID to filter by"
  },
  {
    "name": "startDate",
    "type": "date",
    "required": false,
    "description": "Start date for date range filter"
  }
]
```

**Indexes**:
- Primary key on `id`
- Foreign key on `mcpServerId`
- Unique compound index on `(mcpServerId, name)`
- Index on `updatedAt` for "recently modified" queries

### CanvasNode

Represents the position and metadata of a node on the React Flow canvas. Used to persist canvas layout across sessions.

**Fields**:

| Field | Type | Nullable | Validation | Description |
|-------|------|----------|------------|-------------|
| id | UUID | No | Auto-generated | Primary key |
| nodeId | string | No | 1-100 chars, unique | React Flow node ID (e.g., 'datasource-uuid', 'tool-uuid', 'add-datasource-1') |
| type | enum | No | 'datasource', 'mcpServer', 'tool', 'add' | Node type (determines which entity it represents) |
| positionX | number | No | Any number | X coordinate on canvas |
| positionY | number | No | Any number | Y coordinate on canvas |
| datasourceId | UUID | Yes | Foreign key | Reference to Datasource (null for non-datasource nodes) |
| mcpServerId | UUID | Yes | Foreign key | Reference to MCPServer (null for non-MCP nodes) |
| toolId | UUID | Yes | Foreign key | Reference to Tool (null for non-tool nodes) |
| createdAt | timestamp | No | Auto-generated | Record creation time |
| updatedAt | timestamp | No | Auto-updated | Last modification time |

**Relationships**:
- May reference one `Datasource` (optional, for datasource nodes)
- May reference one `MCPServer` (optional, for MCP server nodes)
- May reference one `Tool` (optional, for tool nodes)
- "add" type nodes have no entity references (special UI nodes)

**Validation Rules**:
- nodeId must be unique across all canvas nodes
- type must be one of: 'datasource', 'mcpServer', 'tool', 'add'
- Exactly one of datasourceId, mcpServerId, toolId must be set (except for 'add' type where all are null)
- If type is 'datasource', datasourceId must be set and others null
- If type is 'mcpServer', mcpServerId must be set and others null
- If type is 'tool', toolId must be set and others null
- If type is 'add', all foreign keys must be null
- When entity is deleted, cascade delete corresponding CanvasNode

**Indexes**:
- Primary key on `id`
- Unique index on `nodeId`
- Foreign key on `datasourceId` (nullable)
- Foreign key on `mcpServerId` (nullable)
- Foreign key on `toolId` (nullable)
- Index on `type` for filtering by node type

**Node ID Format**:
- Datasource nodes: `datasource-{uuid}`
- MCP server nodes: `mcpserver-{uuid}`
- Tool nodes: `tool-{uuid}`
- Add datasource node: `add-datasource`
- Add MCP server nodes: `add-mcpserver-{datasource-uuid}` (one per datasource)

## Non-Persisted Entities

These entities exist in application memory but are not stored in the database.

### DatabaseSchema

Represents the introspected schema of a connected datasource.

**Fields**:

| Field | Type | Description |
|-------|------|-------------|
| datasourceId | UUID | Reference to datasource |
| tables | Table[] | Array of table definitions |
| lastFetched | timestamp | When schema was last introspected |

**Table Structure**:
```typescript
{
  name: string;              // Table name
  columns: Column[];         // Column definitions
  primaryKey: string[];      // Column names in primary key
  foreignKeys: ForeignKey[]; // Foreign key relationships
}
```

**Column Structure**:
```typescript
{
  name: string;         // Column name
  dataType: string;     // Native data type (e.g., 'VARCHAR', 'INTEGER')
  nullable: boolean;    // Can contain NULL
  defaultValue?: any;   // Default value if any
}
```

**ForeignKey Structure**:
```typescript
{
  columnName: string;        // Source column
  referencedTable: string;   // Target table
  referencedColumn: string;  // Target column
}
```

### QueryResult

Represents the result of testing a tool's SQL query.

**Fields**:

| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Whether query executed successfully |
| rows | any[] | Result rows (limited to first 10 for preview) |
| rowCount | number | Total number of rows returned |
| executionTime | number | Query execution time in milliseconds |
| error | string | Error message if query failed |

## Data Flow

### 1. Connect Datasource → Generate MCP Server (via React Flow Canvas)

```
User clicks "Add Datasource" node on canvas
    ↓
Modal dialog opens for connection details
    ↓
User enters connection details and submits
    ↓
Create Datasource entity (status: pending)
    ↓
Test database connection
    ↓
Update Datasource status (connected | failed)
    ↓
If connected:
  - Create CanvasNode for datasource with auto-layout position
  - Create MCPServer entity (status: draft)
  - Create CanvasNode for "Add MCP Server" node connected to datasource
```

### 2. Create Tool (via Canvas Node Dialog)

```
User clicks MCP Server node on canvas
    ↓
Modal dialog opens with "Create Tool" and "View Schema" options
    ↓
User clicks "Create Tool"
    ↓
Tool creation dialog opens with natural language prompt input
    ↓
User enters natural language prompt and submits
    ↓
Fetch DatabaseSchema for datasource
    ↓
Send prompt + schema to LLM (OpenAI)
    ↓
Parse LLM response → SQL query + parameters
    ↓
Validate SQL (syntax, SELECT-only)
    ↓
Display generated SQL in dialog for review
    ↓
User provides tool name and saves
    ↓
Create Tool entity with prompt + sqlQuery + parameters
    ↓
Create CanvasNode for tool with auto-layout position
    ↓
Update MCPServer status to draft (needs regeneration)
    ↓
Option to "Create Another Tool" (repeat flow) or close dialog
```

### 3. Activate/Update MCP Server

```
Fetch MCPServer and all associated Tools
    ↓
Register/update server configuration in MCP runtime
    ↓
Start server endpoint at /mcp/:slug (or update if already running)
    ↓
Update MCPServer status to active
    ↓
MCP server now accessible and responds to protocol requests
```

## Validation Summary

**At Create**:
- Datasource: All fields required, valid port/host/type, password encrypted before storage, CanvasNode created with auto-layout position
- MCPServer: Valid datasourceId, slug auto-generated from datasource name (kebab-case with conflict resolution), CanvasNode created
- Tool: Valid mcpServerId, unique name within server, SELECT-only SQL, CanvasNode created with auto-layout position
- CanvasNode: Valid nodeId, type, and appropriate foreign key set based on type

**At Update**:
- Datasource: Can update connection details, re-test on change, password re-encrypted if changed
- MCPServer: Can update name/configuration, status → draft on tool changes
- Tool: Can update prompt/SQL, must remain SELECT-only, triggers server status → draft
- CanvasNode: Can update positionX/positionY when user drags nodes on canvas

**At Delete**:
- Datasource: Cascade delete MCPServer, Tools, and CanvasNodes, or prevent if server exists
- MCPServer: Cascade delete Tools and CanvasNodes, or prevent if tools exist
- Tool: Cascade delete CanvasNode, safe to delete
- CanvasNode: When entity deleted, corresponding CanvasNode automatically deleted

## Database Indexes for Performance

1. **Datasource**:
   - `idx_datasource_name` on `name` (unique lookup)
   - `idx_datasource_status` on `status` (filter connected datasources)

2. **MCPServer**:
   - `idx_mcpserver_slug` on `slug` (unique lookup for /mcp/:slug endpoint)
   - `idx_mcpserver_datasource` on `datasourceId` (one-to-one lookup)
   - `idx_mcpserver_status` on `status` (filter by server status)

3. **Tool**:
   - `idx_tool_mcpserver` on `mcpServerId` (fetch all tools for server)
   - `idx_tool_mcpserver_name` on `(mcpServerId, name)` (unique constraint)
   - `idx_tool_updated` on `updatedAt` (recent tools query)

4. **CanvasNode**:
   - `idx_canvas_node_id` on `nodeId` (unique lookup for React Flow node ID)
   - `idx_canvas_datasource` on `datasourceId` (find canvas node for datasource)
   - `idx_canvas_mcpserver` on `mcpServerId` (find canvas node for MCP server)
   - `idx_canvas_tool` on `toolId` (find canvas node for tool)
   - `idx_canvas_type` on `type` (filter by node type)

## Migration Strategy

For this POC, use TypeORM synchronization (`synchronize: true` in development). For production, would use TypeORM migrations.

**Initial Schema**:
1. Create `datasources` table
2. Create `mcp_servers` table with foreign key to `datasources`
3. Create `tools` table with foreign key to `mcp_servers`
4. Create `canvas_nodes` table with nullable foreign keys to `datasources`, `mcp_servers`, and `tools`

**Seed Data** (optional for development):
- Sample datasource pointing to local MySQL
- Sample tools with common queries
- Sample canvas nodes with initial positions for seeded entities
