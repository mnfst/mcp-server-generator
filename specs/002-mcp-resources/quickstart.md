# Quickstart: MCP Server Resources

**Feature**: 002-mcp-resources
**Date**: 2025-11-25

## Overview

This feature adds file resource support to MCP servers, allowing users to:
1. Upload files through a dialog interface
2. View resources as nodes on the canvas connected to their MCP server
3. Delete resources when no longer needed
4. Access file content via the MCP resources protocol

## Prerequisites

- Running POC Origin application (backend + frontend)
- At least one MCP server created and active
- Familiarity with the canvas interface

## Adding a Resource

### Step 1: Open the MCP Server Menu

1. Navigate to the canvas view
2. Click on an existing MCP server node
3. In the dropdown menu, select **"Add Resource"**

### Step 2: Fill in Resource Details

The dialog will appear with three fields:

| Field | Description | Requirements |
|-------|-------------|--------------|
| Name | Display name for the resource | Required, max 255 chars |
| Description | What this resource contains | Required |
| File | Upload a file | Required, max 10MB |

### Step 3: Submit

Click **"Create Resource"** to upload the file and create the resource.

**What happens**:
- File is uploaded to `public/storage/` with a unique filename
- Resource record is created in the database
- Canvas node is created and positioned next to the MCP server
- Edge is drawn connecting the resource to its MCP server

## Viewing Resources on Canvas

Resources appear as distinct nodes with:
- **Icon**: Different from tool nodes (file icon)
- **Color**: Unique color scheme to distinguish from tools
- **Connection**: Visual edge linking to parent MCP server
- **Label**: Resource name displayed on the node

### Node Layout

```
[Datasource] → [MCP Server] → [Tool 1]
                            → [Tool 2]
                            → [Resource 1]  ← NEW
                            → [Resource 2]  ← NEW
```

## Deleting a Resource

1. Click on the resource node
2. Select **"Delete"** from the context menu
3. Confirm the deletion

**What happens**:
- Resource record is deleted from database
- Canvas node is removed
- Uploaded file is deleted from storage

## Accessing Resources via MCP Protocol

Once resources are added to an active MCP server, AI assistants can access them using the MCP resources protocol.

### List Resources

```json
{
  "jsonrpc": "2.0",
  "method": "resources/list",
  "params": {},
  "id": 1
}
```

**Response**:
```json
{
  "jsonrpc": "2.0",
  "result": {
    "resources": [
      {
        "uri": "resource://mcp-server-id/resource-id",
        "name": "Product Catalog",
        "description": "CSV file with product data",
        "mimeType": "text/csv"
      }
    ]
  },
  "id": 1
}
```

### Read Resource Content

```json
{
  "jsonrpc": "2.0",
  "method": "resources/read",
  "params": {
    "uri": "resource://mcp-server-id/resource-id"
  },
  "id": 2
}
```

**Response** (text file):
```json
{
  "jsonrpc": "2.0",
  "result": {
    "contents": [
      {
        "uri": "resource://mcp-server-id/resource-id",
        "mimeType": "text/csv",
        "text": "id,name,price\n1,Widget,9.99\n2,Gadget,19.99"
      }
    ]
  },
  "id": 2
}
```

**Response** (binary file):
```json
{
  "jsonrpc": "2.0",
  "result": {
    "contents": [
      {
        "uri": "resource://mcp-server-id/resource-id",
        "mimeType": "application/pdf",
        "blob": "JVBERi0xLjQKJeLjz9MKN..."
      }
    ]
  },
  "id": 2
}
```

## API Reference

### Create Resource

```bash
curl -X POST http://localhost:3001/api/resources \
  -F "name=Product Catalog" \
  -F "description=CSV file with product data" \
  -F "mcpServerId=your-mcp-server-id" \
  -F "file=@/path/to/products.csv"
```

### List Resources

```bash
# All resources
curl http://localhost:3001/api/resources

# Resources for specific MCP server
curl http://localhost:3001/api/resources?mcpServerId=your-mcp-server-id
```

### Get Resource

```bash
curl http://localhost:3001/api/resources/resource-id
```

### Delete Resource

```bash
curl -X DELETE http://localhost:3001/api/resources/resource-id
```

### Download File

```bash
curl http://localhost:3001/api/resources/resource-id/download -o filename.ext
```

## File Type Support

All file types are supported for upload. The system automatically:
- Detects MIME type from file extension
- Stores text content as plain text for MCP protocol
- Encodes binary content as base64 for MCP protocol

### Common MIME Types

| Extension | MIME Type | MCP Format |
|-----------|-----------|------------|
| .txt | text/plain | text |
| .csv | text/csv | text |
| .json | application/json | text |
| .md | text/markdown | text |
| .pdf | application/pdf | blob (base64) |
| .png | image/png | blob (base64) |
| .jpg | image/jpeg | blob (base64) |

## Limitations (POC)

- **File size**: Maximum 10MB per file
- **Storage**: Local filesystem only (no cloud storage)
- **Authentication**: None (POC scope)
- **Editing**: Resources are read-only after upload
- **Subscriptions**: No real-time resource updates

## Troubleshooting

### "File too large" error
Reduce file size to under 10MB or split into multiple files.

### Resource not appearing on canvas
Refresh the page. If issue persists, check browser console for errors.

### MCP client can't find resources
Ensure the MCP server is in **Active** status. Resources are only available when the server is running.

### File upload fails
Check that `public/storage/` directory exists and is writable.
