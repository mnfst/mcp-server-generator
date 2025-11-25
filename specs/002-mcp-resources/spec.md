# Feature Specification: MCP Server Resources

**Feature Branch**: `002-mcp-resources`
**Created**: 2025-11-25
**Status**: Draft
**Input**: User description: "Add resources to the MCP server. In addition to tools, users will be prompted to add a resource to the MCP server from the same menu. When adding a resource, a dialog should show with a name and description of the file and a file input. Uploads should be stored in a storage folder on file system (public, it's a POC). The resources are connected to the MCP server and the UI has to show a connector between the MCP node and the resource node."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add Resource to MCP Server (Priority: P1)

A user wants to add a file resource to an existing MCP server so that AI assistants can access the file content through the MCP protocol. The user navigates to an MCP server on the canvas, opens the server menu, and selects "Add Resource". A dialog appears where they enter a resource name, description, and select a file to upload. Upon submission, the file is stored and the resource becomes available through the MCP server.

**Why this priority**: This is the core functionality of the feature - without the ability to add resources, no other functionality is useful.

**Independent Test**: Can be fully tested by creating an MCP server, adding a resource through the dialog, and verifying the file is stored and the resource appears in the MCP server's resource list.

**Acceptance Scenarios**:

1. **Given** an active MCP server exists on the canvas, **When** the user clicks on the MCP server node and selects "Add Resource" from the menu, **Then** a dialog appears with fields for resource name, description, and file upload.

2. **Given** the "Add Resource" dialog is open, **When** the user enters a name, description, and selects a valid file, **Then** the submit button becomes enabled.

3. **Given** all resource fields are filled, **When** the user submits the form, **Then** the file is uploaded, stored on the file system, and a success message is displayed.

4. **Given** a resource is successfully created, **When** the dialog closes, **Then** the resource appears as a new node on the canvas connected to the MCP server.

---

### User Story 2 - View Resource on Canvas (Priority: P2)

A user wants to see all resources connected to an MCP server visually on the canvas. After adding resources, they should appear as distinct nodes with visual connectors linking them to their parent MCP server, similar to how tools are displayed.

**Why this priority**: Visual representation is essential for users to understand the relationship between MCP servers and their resources, though the core add functionality must work first.

**Independent Test**: Can be tested by verifying that after page load, all existing resources appear as nodes connected to their respective MCP servers with visible edges.

**Acceptance Scenarios**:

1. **Given** an MCP server has one or more resources, **When** the canvas loads, **Then** each resource appears as a distinct node visually connected to the MCP server node.

2. **Given** a resource node exists on the canvas, **When** the user views the node, **Then** it displays the resource name and an icon indicating it is a resource (distinct from tool nodes).

---

### User Story 3 - Delete Resource (Priority: P3)

A user wants to remove a resource from an MCP server when it is no longer needed. They can delete a resource through a context menu on the resource node, which removes both the resource record and the uploaded file.

**Why this priority**: Deletion is a supporting feature that enables resource management but is not required for the primary use case of adding and using resources.

**Independent Test**: Can be tested by creating a resource, then deleting it and verifying both the node disappears from canvas and the file is removed from storage.

**Acceptance Scenarios**:

1. **Given** a resource node exists on the canvas, **When** the user opens the resource context menu and selects "Delete", **Then** a confirmation is requested.

2. **Given** deletion is confirmed, **When** the delete operation completes, **Then** the resource node is removed from the canvas, the database record is deleted, and the uploaded file is removed from storage.

---

### Edge Cases

- What happens when a user uploads a file with the same name as an existing resource? The system should generate a unique filename to avoid overwriting.
- How does the system handle file upload failures (network issues, server errors)? Display an error message and allow retry without losing entered form data.
- What happens when a user tries to delete an MCP server that has resources? The resources should be deleted along with the MCP server (cascade delete).
- What if the uploaded file exceeds size limits? Display a validation error before upload starts.
- What happens if storage folder doesn't exist or is not writable? Display an appropriate error message.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an "Add Resource" option in the MCP server menu alongside "Add Tool".
- **FR-002**: System MUST display a dialog with fields for resource name (required), description (required), and file upload (required) when adding a resource.
- **FR-003**: System MUST store uploaded files in a dedicated storage folder on the file system.
- **FR-004**: System MUST generate unique filenames to prevent collisions when storing uploaded files.
- **FR-005**: System MUST create a resource record linking the uploaded file to the MCP server.
- **FR-006**: System MUST display resource nodes on the canvas connected to their parent MCP server with visual edges.
- **FR-007**: System MUST provide a delete option for resources that removes both the database record and the stored file.
- **FR-008**: System MUST cascade delete all resources when their parent MCP server is deleted.
- **FR-009**: System MUST validate that uploaded files do not exceed 10MB in size.
- **FR-010**: System MUST expose resources through the MCP protocol so AI assistants can read the file content.
- **FR-011**: Resource nodes MUST be visually distinct from tool nodes (different icon/color).

### Key Entities

- **Resource**: Represents a file resource attached to an MCP server. Contains: id, name, description, filename (stored name), original filename, file path, mime type, size, creation timestamp, and reference to parent MCP server.
- **CanvasNode**: Extended to support resource type nodes with a reference to the resource entity.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can add a resource to an MCP server in under 1 minute (excluding file upload time).
- **SC-002**: All resources display correctly on the canvas with visible connections to their MCP server upon page load.
- **SC-003**: Resource deletion removes all associated data (file and record) with no orphaned files remaining in storage.
- **SC-004**: MCP protocol clients can successfully retrieve resource content after resources are added to an active server.
- **SC-005**: System handles file uploads up to 10MB without timeout or failure.

## Assumptions

- File storage will use the local file system in `backend/public/storage/` folder (acceptable for POC).
- No authentication/authorization is required for file access (POC scope).
- Supported file types are not restricted (any file type can be uploaded).
- Resources are read-only once uploaded (no in-place editing).
- The MCP resources/list and resources/read protocol methods will be implemented for AI assistant access.
