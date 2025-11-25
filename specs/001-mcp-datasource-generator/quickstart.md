# Quickstart Guide: MCP Datasource Tool Generator

**Purpose**: Get the MCP Datasource Tool Generator running locally in under 15 minutes.

**Audience**: Developers setting up the application for the first time.

## Prerequisites

Before starting, ensure you have:

- **Node.js** 20.x LTS or higher
- **npm** 9.x or higher
- **MySQL** 8.0 running locally (or Docker to run it)
- **LLM API Key** (OpenAI or Anthropic)
- **Git** for cloning the repository

## Quick Setup (5 minutes)

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd poc-origin

# Install all workspace dependencies
npm install

# This installs dependencies for:
# - Root workspace
# - backend/
# - frontend/
# - shared/
```

### 2. Start MySQL Database

**Option A: Using Docker (recommended)**

```bash
# Start MySQL container
docker-compose up -d

# Verify MySQL is running
docker ps | grep mysql
```

**Option B: Using Local MySQL**

```bash
# Ensure MySQL is running
mysql --version

# Create application database
mysql -u root -p
CREATE DATABASE mcp_generator;
EXIT;
```

### 3. Configure Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your values
nano .env
```

**Required environment variables**:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
DB_DATABASE=mcp_generator

# Security Configuration
CREDENTIALS_ENCRYPTION_KEY=your-32-character-encryption-key-here

# LLM Configuration (OpenAI only for POC)
OPENAI_API_KEY=sk-...                  # OpenAI API key

# Application Configuration
BACKEND_PORT=3001
FRONTEND_PORT=5173
```

### 4. Initialize Database

```bash
# Backend will auto-create tables on first run
# (TypeORM synchronize: true in development)

cd backend
npm run start:dev

# Watch console for "Database connected" message
# Press Ctrl+C once tables are created
```

### 5. Start Development Servers

**Terminal 1 - Backend:**

```bash
cd backend
npm run start:dev

# Backend starts on http://localhost:3001
# Watch for: "NestJS application started on port 3001"
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev

# Frontend starts on http://localhost:5173
# Watch for: "Local: http://localhost:5173"
```

### 6. Open Application

Navigate to **http://localhost:5173** in your browser.

## First Use Walkthrough (10 minutes)

This application uses a **React Flow canvas-based interface** where you visually connect datasources to MCP servers and tools through an interactive node-based workflow.

### Step 1: Connect a Database via Canvas

1. **Open the Canvas**: Navigate to **http://localhost:5173**
2. **Add Datasource Node**: You'll see a single **"+" node** labeled "Add Datasource" on the canvas
3. **Click the "+" Node**: A modal dialog opens for entering datasource connection details
4. **Fill in Connection Details**:
   - **Name**: "My Test Database"
   - **Type**: MySQL (only option)
   - **Host**: localhost
   - **Port**: 3306
   - **Database**: your_database_name
   - **Username**: your_username
   - **Password**: your_password
5. **Submit**: Click **"Connect"** in the dialog
6. **Connection Test**: System validates the connection
7. **Canvas Updates**:
   - Dialog closes
   - New **datasource node** appears on canvas with icon and name
   - New **"+" node** appears connected to the datasource, labeled "Create MCP Server"

**Result**: Datasource node created on canvas, ready to create MCP server.

### Step 2: Create MCP Server via Canvas

1. **Click the "Create MCP Server" (+) Node**: Modal dialog opens
2. **Name the Server**: Enter server name (e.g., "My Data Server")
3. **Submit**: Click **"Create"**
4. **Canvas Updates**:
   - Dialog closes
   - New **MCP server node** appears on canvas, connected to the datasource
   - Server is now accessible at `/mcp/my-data-server` endpoint

**Result**: MCP server running at `/mcp/:slug`, ready to add tools.

### Step 3: View Database Schema (Optional)

1. **Click the MCP Server Node**: Modal dialog opens with two options
2. **Select "View Schema"**: A simple table/list view dialog opens
3. **Explore Schema**:
   - See all tables as accordion items
   - Expand tables to see columns with data types
   - Foreign keys indicated with arrow icons
   - Use search bar to filter tables/columns
4. **Keep Open for Reference**: Leave this dialog open while creating tools (optional)

**Result**: Visual understanding of available database tables and columns.

### Step 4: Create a Tool via Canvas Dialog

1. **Click the MCP Server Node** (if schema dialog closed)
2. **Select "Create Tool"**: Tool creation dialog opens
3. **Enter Natural Language Prompt**:
   - **Prompt**: "Get all users where status is 'active', showing their email and registration date"
4. **Click "Generate SQL"**: Wait 5-10 seconds for OpenAI LLM to generate query
5. **Review Generated SQL**: System displays the generated MySQL query in the dialog
6. **See Highlighted Schema** (if schema view open): Referenced tables/columns are highlighted
7. **Name the Tool**:
   - **Name**: `get_active_users`
   - **Description**: "Fetch all active users"
8. **Test the Tool** (Optional): Click **"Test"** to see sample results (first 10 rows)
9. **Save**: Click **"Save Tool"**
10. **Create Another?** (Optional): Click **"Create Another Tool"** to repeat the flow, or close dialog
11. **Canvas Updates**:
    - New **tool node** appears on canvas, connected to the MCP server
    - Tool node shows tool icon and name

**Result**: Tool node created on canvas, MCP server updated with new tool.

### Step 5: Create Additional Tools

1. **Repeat Step 4** for additional tools:
   - Example: "Get orders from the last 30 days with customer names"
   - Example: "Count total users by status"
2. **Use "Create Another Tool" Button**: Streamline creation of multiple tools without reopening dialogs
3. **Canvas Grows**: Each new tool adds a connected node to the MCP server

**Result**: Multiple tool nodes on canvas, all connected to MCP server.

### Step 6: Test and Manage Tools

1. **Click Any Tool Node**: Tool details dialog opens
2. **View Tool Information**:
   - Tool name, description
   - Natural language prompt
   - Generated SQL query
   - Last modified date
3. **Test Tool**: Click **"Test"** button, enter parameter values (if any), see results
4. **Edit Tool**: Click **"Edit Prompt"** to modify and regenerate SQL
5. **Delete Tool**: Click **"Delete"** to remove tool from MCP server

**Result**: Full lifecycle management of tools via canvas nodes.

### Step 7: Access MCP Server

The MCP server is **already running** at the `/mcp/:slug` endpoint within the backend application. No separate server process needed!

**Connect an MCP Client** (e.g., Claude Desktop):

1. **Get Server URL**: The server runs at `http://localhost:3001/mcp/my-data-server`
2. **Configure Client**: Add server URL to your MCP client configuration
3. **Test Connection**: Client should discover available tools via MCP protocol
4. **Use Tools**: Execute tools through your MCP client

**Example MCP Client Configuration** (Claude Desktop):

```json
{
  "mcpServers": {
    "my-data-server": {
      "url": "http://localhost:3001/mcp/my-data-server"
    }
  }
}
```

**Result**: MCP server accessible to clients, tools ready to use.

## Project Structure

```
poc-origin/
├── backend/          # NestJS API server
│   ├── src/
│   │   ├── datasources/    # Database connection management
│   │   ├── mcp-servers/    # MCP server runtime and serving
│   │   ├── tools/          # Tool CRUD
│   │   ├── schema/         # Schema introspection
│   │   ├── query-generation/ # OpenAI LLM integration
│   │   └── canvas/         # Canvas node position management
│   └── test/
├── frontend/         # React application with React Flow
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/         # shadcn/ui components
│   │   │   ├── canvas/     # React Flow canvas and nodes
│   │   │   ├── dialogs/    # Modal dialogs for data entry
│   │   │   └── schema/     # Database schema list view
│   │   ├── pages/          # Canvas page (main view)
│   │   └── services/       # API client with TanStack Query
│   └── test/
├── shared/           # Shared TypeScript types
│   └── src/
│       ├── types/          # Entity types (including CanvasNode)
│       └── dtos/           # Data transfer objects
├── docker-compose.yml      # MySQL for development
└── package.json            # Workspace configuration
```

## Common Tasks

### Run Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Build for Production

```bash
# Build all packages
npm run build

# Builds:
# - backend/dist/
# - frontend/dist/
# - shared/dist/
```

### Reset Database

```bash
# Drop and recreate database
mysql -u root -p
DROP DATABASE mcp_generator;
CREATE DATABASE mcp_generator;
EXIT;

# Restart backend to recreate tables
cd backend
npm run start:dev
```

### Add Multiple Datasources

You can add multiple datasources to the canvas simultaneously:

1. After creating first datasource, there will still be an "Add Datasource" node on canvas
2. Click it to add another datasource
3. Each datasource can have its own MCP server and tools
4. All datasources visible on canvas in a single view
5. Zoom, pan, and rearrange nodes as needed

## Troubleshooting

### Database Connection Fails

**Symptom**: "Failed to connect to database" error

**Solutions**:
- Verify MySQL is running: `mysql --version`
- Check credentials in `.env` match MySQL user
- Ensure database exists: `SHOW DATABASES;` in MySQL
- Check port is not blocked: `netstat -an | grep 3306`

### LLM Query Generation Fails

**Symptom**: "Failed to generate SQL" error in tool creation dialog

**Solutions**:
- Verify OpenAI API key in `.env` is correct (starts with `sk-`)
- Check API quota/billing on OpenAI dashboard
- Check internet connection (OpenAI API is cloud-based)
- Verify you have available credits on OpenAI account
- Check backend logs for specific API error messages

### Schema List View Doesn't Load

**Symptom**: Empty list or loading spinner forever when clicking "View Schema"

**Solutions**:
- Check browser console for errors (F12 → Console)
- Verify datasource connection is active (check datasource node on canvas)
- Verify database has tables (empty database shows empty list, this is expected)
- Check backend logs for schema introspection errors
- Ensure MySQL information_schema is accessible

### Canvas Nodes Not Appearing

**Symptom**: Clicked "Add Datasource" but no node appears on canvas

**Solutions**:
- Check browser console for errors (F12 → Console)
- Verify backend API is running (http://localhost:3001/health should return 200)
- Check network tab in browser DevTools for failed API requests
- Refresh the page and try again
- Check backend logs for database/entity errors

### MCP Server Endpoint Not Accessible

**Symptom**: MCP client cannot connect to `/mcp/:slug` endpoint

**Solutions**:
- Verify backend is running and listening on correct port
- Check MCP server was activated (not just created)
- Verify slug in URL matches server slug (check server node on canvas)
- Test endpoint manually: `curl http://localhost:3001/mcp/your-slug`
- Check backend logs for runtime errors

### Port Already in Use

**Symptom**: "Port 3001 already in use" or "Port 5173 already in use"

**Solutions**:
- Kill existing processes: `lsof -ti:3001 | xargs kill` (or :5173)
- Change ports in `.env` (BACKEND_PORT, FRONTEND_PORT)
- Restart terminals after changing environment variables

## Development Tips

### Hot Reload

Both frontend and backend support hot reload:
- **Backend**: NestJS watch mode (`npm run start:dev`)
- **Frontend**: Vite HMR (automatic)

Changes to code reload automatically—no manual restart needed.

### Database Schema Changes

TypeORM auto-syncs schema in development:
1. Modify entity files (`*.entity.ts`)
2. Restart backend
3. Tables updated automatically

**Warning**: This drops tables in production! Use migrations instead.

### Shared Types

To add new shared types:

1. Edit `shared/src/types/your-type.ts`
2. Export from `shared/src/types/index.ts`
3. Both frontend and backend auto-detect changes (TypeScript project references)

No manual build step needed during development.

## Next Steps

After completing this quickstart:

1. Read [data-model.md](./data-model.md) to understand entities
2. Review [contracts/](./contracts/) for API documentation
3. Check [plan.md](./plan.md) for implementation details
4. See [tasks.md](./tasks.md) for development roadmap (after `/speckit.tasks`)

## Support

For issues or questions:
- Check [troubleshooting](#troubleshooting) section above
- Review backend logs: `cd backend && npm run start:dev`
- Check frontend console: Browser DevTools (F12)
- Verify environment variables in `.env`

**POC Note**: This is a proof-of-concept application. Security, authentication, and edge case handling are intentionally minimal to focus on core functionality.
