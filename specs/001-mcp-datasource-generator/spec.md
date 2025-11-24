# Feature Specification: MCP Datasource Tool Generator

**Feature Branch**: `001-mcp-datasource-generator`
**Created**: 2025-11-20
**Status**: Draft
**Input**: User description: "Build an application that will let users create an MCP server for their datasource. Datasources will be databases for now and the MCP servers they will create will let user create manually tools that correspond to SQL queries. The SQL queries will be generated from an LLM by a prompt. The whole application will be visual with diagrams. It will be simple yet powerfull, focusing on the main value of it. This is a POC, it should not consider security and edge cases."

## Clarifications

### Session 2025-11-20

- Q: MCP server lifecycle - how are servers started/stopped? → A: MCP servers are always running at /mcp/:serverSlug once created (persistent)
- Q: Server slug format - how is the URL slug generated? → A: Server slug derived from datasource name (kebab-case, auto-unique)
- Q: MCP protocol transport mechanism? → A: MCP protocol over HTTP with JSON-RPC (standard MCP implementation)
- Q: Server restart behavior and access control? → A: MCP servers stored in database, automatically restart on backend startup, no user management (all servers publicly accessible in POC)
- Q: What happens when datasource becomes unavailable? → A: MCP server remains available but returns errors with clear messages indicating datasource unavailable
- Q: How are datasource credentials stored securely? → A: Encrypt datasource passwords at rest using AES-256 with encryption key stored in environment variables
- Q: Which database types should be supported in initial implementation? → A: MySQL only for now
- Q: Which LLM provider(s) should be supported for SQL query generation? → A: OpenAI only, with API key stored in .env file
- Q: When should cached database schema information be refreshed? → A: Cache until datasource connection details change or manual refresh requested
- Q: How should SQL query parameters be identified and extracted? → A: LLM automatically detects and extracts parameters from natural language prompt
- Q: How should the system handle LLM API failures (network, rate limit, auth errors)? → A: Display specific error message with retry button for user to try again
- Q: What should be the primary UI interaction model for managing datasources, MCP servers, and tools? → A: React Flow canvas-based interface where users start with a "+" node to add datasource, then connected nodes appear for creating MCP server, then tools are created one by one through dialogs
- Q: Should users be able to create multiple tools in quick succession or return to MCP server node each time? → A: After creating a tool, dialog offers "Create Another Tool" button for streamlined bulk creation
- Q: Should the canvas support multiple datasources simultaneously or one at a time? → A: Multiple datasources can exist on canvas simultaneously, users see all datasources and their MCP servers in one view
- Q: What should the React Flow canvas display? → A: Only the logical connections between datasources, MCP servers, and tools - NOT the database schema (tables/columns). Database schema is shown separately in dialogs.
- Q: How should the database schema (tables, columns, foreign keys) be displayed when user selects "View Schema"? → A: Simple table/list view in a dialog showing tables and columns - minimal but functional for POC
- Q: What should happen when user tries to delete a datasource that has connected MCP servers? → A: Prevent deletion and display error message requiring user to delete MCP servers first
- Q: What information should be displayed on each node in the React Flow canvas? → A: Minimal display - only node type icon and name for clean visual appearance

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Connect Database and Generate MCP Server (Priority: P1)

A user connects their database to the application and generates a functional MCP server that is served dynamically within the backend application. The user provides database connection information through a visual interface, and the system creates a persistent MCP server accessible at a dedicated URL endpoint.

**Why this priority**: This is the foundational capability that enables all other functionality. Without the ability to connect a database and generate a server, no other features matter. This represents the minimum viable product.

**Independent Test**: Can be fully tested by connecting a sample MySQL database with a test schema, generating the MCP server, and verifying the server is accessible at /mcp/:serverSlug and responds to MCP protocol requests.

**Acceptance Scenarios**:

1. **Given** a user opens the application, **When** they see the React Flow canvas, **Then** a single node with "+" sign and "Add Datasource" label is displayed
2. **Given** the initial "Add Datasource" node is visible, **When** the user clicks on it, **Then** a dialog opens to enter database connection details (host, port, database name, credentials)
3. **Given** database credentials are entered in the dialog, **When** the user submits, **Then** the system validates the connection and creates a datasource node on the canvas
4. **Given** a datasource node is created, **When** the connection is successful, **Then** a new "+" node connected to the datasource appears with "Create MCP Server" label
5. **Given** the "Create MCP Server" node is visible, **When** the user clicks on it, **Then** a dialog opens to name the MCP server
6. **Given** the MCP server name is entered, **When** the user submits, **Then** the system creates a persistent MCP server accessible at /mcp/:serverSlug and displays an MCP server node on the canvas
7. **Given** an MCP server node is created, **When** a client connects to /mcp/:serverSlug, **Then** the server is running and can accept MCP protocol connections with an empty tools list

---

### User Story 2 - Create SQL Query Tools Visually (Priority: P2)

A user creates custom tools for their MCP server by describing what data they want in natural language. The system uses an LLM to generate appropriate SQL queries and displays the database schema visually to help users understand available data.

**Why this priority**: This is the core value proposition - enabling non-technical users to create data access tools through natural language instead of writing SQL. The visual schema representation helps users understand what data is available.

**Independent Test**: Can be tested independently by loading a generated MCP server, describing a data need in natural language (e.g., "get all active users"), having the system generate SQL, visualizing the query against the schema, and verifying the tool executes correctly.

**Acceptance Scenarios**:

1. **Given** an MCP server node exists on the canvas, **When** the user clicks on it, **Then** a dialog opens with options to "Create Tool" or "View Schema"
2. **Given** the user selects "View Schema", **When** the dialog displays, **Then** the system shows all tables, columns, data types, and foreign key relationships in the Schema Viewer
3. **Given** the user selects "Create Tool", **When** the tool creation dialog opens, **Then** the user can enter a natural language prompt (e.g., "get all orders from the last 30 days")
4. **Given** a natural language prompt is entered, **When** the user submits, **Then** the system generates an appropriate SQL query using an LLM and displays it in the dialog
5. **Given** a generated SQL query is displayed, **When** the user reviews it, **Then** the system highlights which tables and columns are being used in the Schema Viewer
6. **Given** a reviewed query, **When** the user provides a tool name and saves, **Then** the system adds the tool to the MCP server configuration and creates a tool node connected to the MCP server node on the canvas
7. **Given** a saved tool, **When** the user tests it from the dialog, **Then** the system executes the query and displays sample results

---

### User Story 3 - Manage and Edit Existing Tools (Priority: P3)

A user can view all tools they've created, edit their prompts or SQL queries, test them with different parameters, and remove tools they no longer need. This provides full lifecycle management of the custom tools.

**Why this priority**: While important for ongoing maintenance and iteration, users can derive value from creating tools even without sophisticated management capabilities. This enhances the user experience but isn't required for the core value proposition.

**Independent Test**: Can be tested by creating several tools, editing one tool's prompt to generate different SQL, testing the updated tool, and deleting an unused tool, then verifying all changes persist in the MCP server configuration.

**Acceptance Scenarios**:

1. **Given** an MCP server node with connected tool nodes on the canvas, **When** the user views the canvas, **Then** all tool nodes are displayed connected to the MCP server with their names
2. **Given** a tool node is visible on the canvas, **When** the user clicks on it, **Then** a dialog opens showing the tool details (name, description, SQL query, last modified date)
3. **Given** the tool details dialog is open, **When** the user clicks "Edit Prompt", **Then** the user can modify the natural language prompt and regenerate the SQL query
4. **Given** a tool with parameters, **When** the user clicks "Test" in the dialog, **Then** input fields appear for parameter values and the system executes the query with those values and displays results
5. **Given** a tool node is selected, **When** the user clicks "Delete" in the dialog, **Then** the system removes the tool from the MCP server configuration and removes the node from the canvas
6. **Given** modified tools, **When** the user saves changes, **Then** the system updates the MCP server and refreshes the tool node information on the canvas

---

### Edge Cases

- What happens when database connection is lost during tool creation? System displays error message and allows retry
- What happens when the LLM generates invalid SQL? System displays validation error and allows manual editing or regeneration
- What happens when the LLM API call fails (network error, rate limit, invalid API key)? System displays specific error message (e.g., "Rate limit exceeded", "Network timeout", "Invalid API key") with retry button
- What happens when a user tries to connect to an empty database with no tables? System allows connection but shows empty schema list
- What happens when the generated SQL query returns no results during testing? System displays "No results" message with query execution details
- What happens when a user creates a tool with a duplicate name? System rejects with validation error indicating name must be unique
- What happens when datasource becomes unavailable after MCP server creation? MCP server remains accessible at /mcp/:serverSlug but returns clear error messages for tool execution requests indicating datasource connection failure
- What happens when a user tries to delete a datasource that has connected MCP servers? System prevents deletion and displays error "Cannot delete datasource. Please delete the MCP server first."
- What happens when a user tries to delete an MCP server that has connected tools? System prevents deletion and displays error "Cannot delete MCP server. Please delete all tools first."
- What happens when a user modifies datasource connection details (host, port, database, username) while MCP server is active? MCP server continues running with previous connection until reactivated; tools return errors indicating datasource connection changed; user must deactivate and reactivate server with new connection details
- What happens when OpenAI returns SQL query for wrong database type (e.g., PostgreSQL syntax instead of MySQL)? System validates generated SQL contains MySQL-compatible syntax before saving; if validation fails, displays error with regeneration option

## Requirements *(mandatory)*

### Functional Requirements

#### Database Connection
- **FR-001**: System MUST allow users to enter database connection parameters (host, port, database name, username, password)
- **FR-002**: System MUST support MySQL database type (PostgreSQL support deferred to future iteration)
- **FR-003**: System MUST validate database connections before allowing server generation
- **FR-004**: System MUST retrieve and cache database schema information (tables, columns, data types, relationships), invalidating cache when any of the following datasource connection details change (host, port, database name, username) or when user requests manual refresh
- **FR-005**: System MUST encrypt datasource passwords at rest in the application database using AES-256 encryption with encryption key stored in environment variables

#### MCP Server Generation
- **FR-006**: System MUST create a persistent MCP server from a connected database, accessible at /mcp/:serverSlug
  - Server configurations MUST be stored in the application database for persistence across backend restarts
  - Servers MUST be served dynamically within the backend application using standard MCP protocol over HTTP with JSON-RPC 2.0
  - Servers MUST automatically reload and start when the backend application starts
  - Servers MUST keep running persistently once created until explicitly deleted
- **FR-007**: System MUST generate a unique URL slug for each MCP server derived from the datasource name (converted to kebab-case), appending a numeric suffix if the name conflicts with existing servers
- **FR-008**: System MUST keep MCP servers accessible even when datasource connection fails, returning clear error messages for tool execution requests
- **FR-009**: System MUST allow users to update the server configuration when datasource connection details or tools change
- **FR-010**: System MUST make all MCP servers publicly accessible without authentication (POC constraint)

#### Schema Viewer (Separate from React Flow Canvas)
- **FR-015**: System MUST display database schema in a dialog as an expandable list view showing tables and their columns (NOT on the React Flow canvas). Minimum requirements: tables as expandable/collapsible list items, columns nested under tables showing name and data type, maximum 2-level nesting (tables → columns), basic text-based search filter
- **FR-016**: System MUST show each table name with its columns and data types in the Schema Viewer
- **FR-017**: System MUST indicate foreign key relationships in the Schema Viewer with arrow icon (→) and target table name annotation
- **FR-018**: System MUST provide search/filter functionality to find specific tables or columns in the Schema Viewer
- **FR-019**: System MUST highlight tables and columns referenced in a generated SQL query within the Schema Viewer using visual highlighting (e.g., background color, bold text)
- **FR-020**: System MUST provide a manual refresh option to reload schema from database on user request

#### LLM-Powered Query Generation
- **FR-021**: System MUST accept natural language prompts describing desired data queries
- **FR-022**: System MUST use OpenAI API to convert natural language prompts into MySQL queries appropriate for the connected database
- **FR-023**: System MUST use OpenAI API to automatically detect and extract query parameters from natural language prompts
- **FR-024**: System MUST display the generated SQL query in a readable format with identified parameters
- **FR-025**: System MUST allow users to manually edit generated SQL queries before saving, with validation constraints: edited query MUST remain SELECT-only (reject queries containing INSERT, UPDATE, DELETE, DROP, CREATE, ALTER, TRUNCATE, REPLACE, GRANT, REVOKE keywords), basic MySQL syntax validation MUST be performed

#### Tool Management
- **FR-026**: System MUST allow users to save generated queries as named tools in the MCP server
- **FR-027**: System MUST store tool metadata (name, description, SQL query, parameters)
- **FR-028**: System MUST allow users to test tools with sample parameter values before saving
- **FR-029**: System MUST display all created tools in a list with basic information
- **FR-030**: System MUST allow users to edit existing tools (name, description, prompt, SQL)
- **FR-031**: System MUST allow users to delete tools from the MCP server
- **FR-032**: System MUST validate tool names are unique within an MCP server using case-insensitive comparison with leading/trailing whitespace trimmed before validation

#### User Experience
- **FR-033**: System MUST provide visual feedback during LLM query generation (loading states)
- **FR-034**: System MUST display specific error messages when LLM API failures occur (network timeout, rate limit exceeded, invalid API key, etc.) with retry button
- **FR-035**: System MUST display clear error messages when operations fail
- **FR-036**: System MUST show sample query results when users test tools
- **FR-037**: System MUST display the MCP server URL (/mcp/:serverSlug) on the MCP server node immediately after server creation for client configuration

#### Code Documentation
- **FR-055**: All public methods, functions, and classes MUST include comprehensive TSDoc/JSDoc annotations
- **FR-056**: TSDoc annotations MUST include description, @param tags for all parameters, @returns tag for return values, and @throws tags for exceptions
- **FR-057**: All DTO classes MUST include class-level and property-level documentation with validation rules and examples
- **FR-058**: All React components MUST include component-level documentation and props interface descriptions

#### React Flow Canvas Interface
- **FR-038**: System MUST display a React Flow canvas as the primary interface for managing datasources, MCP servers, and tools
- **FR-039**: System MUST show a "+" node with "Add Datasource" label on the canvas (initial node when empty, or additional node to add more datasources)
- **FR-040**: System MUST open a modal dialog for entering datasource connection details when the "Add Datasource" node is clicked
- **FR-041**: System MUST create a datasource node on the canvas after successful connection validation
- **FR-042**: System MUST display a "+" node connected to each datasource node with "Create MCP Server" label
- **FR-043**: System MUST open a modal dialog for naming the MCP server when the "Create MCP Server" node is clicked
- **FR-044**: System MUST create an MCP server node on the canvas connected to the datasource node after server creation
- **FR-045**: System MUST open a modal dialog with "Create Tool" and "View Schema" options when an MCP server node is clicked
- **FR-046**: System MUST create tool nodes on the canvas connected to the MCP server node for each created tool
- **FR-047**: System MUST open a tool details dialog showing name, description, SQL query, and actions (Edit, Test, Delete) when a tool node is clicked
- **FR-048**: System MUST display nodes with minimal information - only node type icon and name for clean visual appearance
- **FR-049**: System MUST allow users to zoom, pan, and rearrange nodes on the canvas
- **FR-050**: System MUST persist canvas node positions across sessions
- **FR-051**: System MUST provide a "Create Another Tool" button in the tool creation dialog after successful tool creation to allow streamlined bulk tool creation
- **FR-052**: System MUST support multiple datasource nodes on the canvas simultaneously, allowing users to view and manage all datasources, MCP servers, and tools in a single view
- **FR-053**: System MUST prevent deletion of a datasource node if it has connected MCP server nodes, displaying error message "Cannot delete datasource. Please delete the MCP server first."
- **FR-054**: System MUST prevent deletion of an MCP server node if it has connected tool nodes, displaying error message "Cannot delete MCP server. Please delete all tools first."

### Assumptions

- Users have basic understanding of their database schema and what data they want to access
- Users have access to a MySQL database they can connect to with appropriate credentials
- Users have an OpenAI API key stored in .env file for query generation
- The POC focuses on read-only queries (SELECT statements only)
- MCP servers are served dynamically within the backend application at /mcp/:serverSlug endpoints
- MCP server configurations are stored in the application database and automatically reloaded on backend startup
- No user management or authentication in POC - all MCP servers are publicly accessible to anyone with the URL
- Database schemas are reasonably sized (under 100 tables) for effective visualization

### Key Entities

- **Datasource Connection**: Represents a connection to a database, including connection parameters (host, port, database name, type), credentials, and connection status. Has a one-to-one relationship with an MCP Server configuration.

- **MCP Server Configuration**: Represents the dynamically served server, including server name, URL slug (used in /mcp/:serverSlug endpoint), associated datasource, and collection of tools. Contains metadata about when it was created and last modified. Server runs persistently within the backend application.

- **Database Schema**: Represents the structure of the connected database, including tables, columns, data types, primary keys, foreign keys, and relationships. Used for visual representation and query validation.

- **Tool Definition**: Represents a custom tool in the MCP server, including tool name, description, natural language prompt used to generate it, generated SQL query, parameter definitions (if any), and creation/modification timestamps. Belongs to one MCP Server configuration.

- **Query Result**: Represents the output from testing a tool, including result data, execution time, row count, and any error messages. Used for validation and preview purposes only.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can connect a database and generate a functional MCP server in under 5 minutes from start to finish
- **SC-002**: Users can create a custom tool from a natural language prompt and have it generate valid SQL in under 30 seconds (including LLM response time)
- **SC-003**: 90% of generated SQL queries from common natural language prompts are syntactically valid and executable without manual editing. Test corpus of 20 representative prompts: "get all users", "find recent orders", "show top 10 customers by revenue", "list products with low inventory", "get user by email", "find orders in the last 30 days", "count active users", "show average order value by month", "list users who never ordered", "find duplicate email addresses", "get total sales by product category", "show pending orders", "list customers with addresses", "find products never ordered", "get order details with customer info", "count orders per customer", "show revenue by date range", "list users registered this year", "find orders above $100", "get product inventory status"
- **SC-004**: Users can successfully visualize database schemas with up to 50 tables without performance degradation (diagrams load and render in under 3 seconds)
- **SC-005**: MCP servers are accessible at /mcp/:serverSlug endpoints and respond to tool queries within 2 seconds for databases with up to 20 custom tools
- **SC-006**: Users can complete the full workflow (connect database → generate server → create 3 tools → test tools) in under 15 minutes
- **SC-007**: System handles database connections that timeout or fail with clear error messages that help users diagnose the issue
- **SC-008**: Visual schema diagrams accurately represent 100% of tables, columns, and foreign key relationships from the connected database

### User Satisfaction

- **SC-009**: Users unfamiliar with SQL can successfully create working data access tools using only natural language prompts
- **SC-010**: Users can understand what data is available in their database by viewing the visual schema diagram without needing to query the database directly
