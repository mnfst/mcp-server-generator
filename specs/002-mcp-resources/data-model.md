# Data Model: MCP Server Resources

**Feature**: 002-mcp-resources
**Date**: 2025-11-25

## Entity Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    MCPServer    │       │    Resource     │       │   CanvasNode    │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │──┐    │ id (PK)         │──┐    │ id (PK)         │
│ name            │  │    │ name            │  │    │ nodeId          │
│ slug            │  │    │ description     │  │    │ type            │
│ datasourceId    │  │    │ filename        │  │    │ positionX       │
│ status          │  │    │ originalFilename│  │    │ positionY       │
│ ...             │  │    │ filePath        │  │    │ datasourceId    │
└─────────────────┘  │    │ mimeType        │  │    │ mcpServerId     │
                     │    │ size            │  │    │ toolId          │
                     └───>│ mcpServerId (FK)│  └───>│ resourceId (FK) │ ← NEW
                          │ createdAt       │       │ createdAt       │
                          │ updatedAt       │       │ updatedAt       │
                          └─────────────────┘       └─────────────────┘
```

## Entities

### Resource (NEW)

File resource attached to an MCP server, exposed via MCP resources protocol.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Unique identifier |
| name | string | required, max 255 | Display name for the resource |
| description | string | required, text | Human-readable description |
| filename | string | required, max 500 | UUID-prefixed stored filename |
| originalFilename | string | required, max 255 | User's original filename |
| filePath | string | required, max 1000 | Relative path to stored file |
| mimeType | string | required, max 100 | MIME type (e.g., text/plain, application/pdf) |
| size | integer | required | File size in bytes |
| mcpServerId | UUID | FK → MCPServer.id, indexed | Parent MCP server |
| createdAt | timestamp | auto-generated | Creation timestamp |
| updatedAt | timestamp | auto-updated | Last update timestamp |

**Validation Rules**:
- `name`: Non-empty, max 255 characters
- `description`: Non-empty, max 5000 characters
- `size`: Must be > 0 and <= 10,485,760 (10MB)
- `mimeType`: Valid MIME type format
- `mcpServerId`: Must reference existing MCP server

**Indexes**:
- Primary: `id`
- Foreign key: `mcpServerId`
- Unique composite: `(mcpServerId, name)` - Resource names unique within server

### CanvasNode (MODIFIED)

Add `resourceId` field to support resource node type.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| resourceId | UUID | FK → Resource.id, nullable | Reference to resource (when type = RESOURCE) |

**Change Impact**:
- Add new column `resourceId` (nullable)
- Add foreign key constraint to Resource entity
- Add relation mapping in TypeORM entity

### CanvasNodeType Enum (MODIFIED)

Add RESOURCE enum value.

```typescript
export enum CanvasNodeType {
  DATASOURCE = 'datasource',
  MCP_SERVER = 'mcpServer',
  TOOL = 'tool',
  ADD = 'add',
  RESOURCE = 'resource',  // NEW
}
```

## TypeORM Entity Definitions

### Resource Entity

```typescript
// backend/src/resources/entities/resource.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { MCPServer } from '../../mcp-servers/entities/mcp-server.entity';

@Entity('resources')
@Unique(['mcpServerId', 'name'])
export class Resource {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ length: 500 })
  filename!: string;

  @Column({ length: 255 })
  originalFilename!: string;

  @Column({ length: 1000 })
  filePath!: string;

  @Column({ length: 100 })
  mimeType!: string;

  @Column({ type: 'int' })
  size!: number;

  @Column()
  @Index()
  mcpServerId!: string;

  @ManyToOne(() => MCPServer)
  @JoinColumn({ name: 'mcpServerId' })
  mcpServer!: MCPServer;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
```

### CanvasNode Entity Update

```typescript
// Add to backend/src/canvas/entities/canvas-node.entity.ts

import { Resource } from '../../resources/entities/resource.entity';

// Add to class:
@Column({ type: 'varchar', nullable: true })
resourceId!: string | null;

@ManyToOne(() => Resource, { nullable: true })
@JoinColumn({ name: 'resourceId' })
resource!: Resource | null;
```

## Shared Types

### Resource Type

```typescript
// shared/src/types/resource.ts
export interface Resource {
  id: string;
  name: string;
  description: string;
  filename: string;
  originalFilename: string;
  filePath: string;
  mimeType: string;
  size: number;
  mcpServerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateResourceDto {
  name: string;
  description: string;
  mcpServerId: string;
  // file is handled separately via multipart form
}
```

## Database Migration

```sql
-- Migration: Add resources table and update canvas_nodes

-- Create resources table
CREATE TABLE resources (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  filename VARCHAR(500) NOT NULL,
  originalFilename VARCHAR(255) NOT NULL,
  filePath VARCHAR(1000) NOT NULL,
  mimeType VARCHAR(100) NOT NULL,
  size INT NOT NULL,
  mcpServerId VARCHAR(36) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (mcpServerId) REFERENCES mcp_servers(id) ON DELETE CASCADE,
  UNIQUE KEY unique_resource_name (mcpServerId, name),
  INDEX idx_resources_mcp_server (mcpServerId)
);

-- Add resourceId to canvas_nodes
ALTER TABLE canvas_nodes
ADD COLUMN resourceId VARCHAR(36) NULL,
ADD FOREIGN KEY (resourceId) REFERENCES resources(id) ON DELETE SET NULL;

-- Update canvas_nodes type enum to include 'resource'
ALTER TABLE canvas_nodes
MODIFY COLUMN type ENUM('datasource', 'mcpServer', 'tool', 'add', 'resource') NOT NULL;
```

## Relationships Summary

| Relationship | Type | Description |
|--------------|------|-------------|
| MCPServer → Resource | 1:N | MCP server has many resources |
| Resource → CanvasNode | 1:1 | Each resource has one canvas node |
| Resource deletion | CASCADE | Canvas node set to NULL, file deleted |
| MCPServer deletion | CASCADE | All resources and files deleted |

## File Storage Structure

```
public/
└── storage/
    ├── {uuid1}-document.pdf
    ├── {uuid2}-config.json
    └── {uuid3}-data.csv
```

- Files stored with UUID prefix for uniqueness
- Original filename preserved in database for display
- All files in flat directory (no subdirectories for POC)
- `filePath` stores relative path: `storage/{filename}`
