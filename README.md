# MCP Datasource Tool Generator

A visual canvas-based application that enables users to create Model Context Protocol (MCP) servers from their database datasources. Users can build custom SQL query tools through natural language prompts, with AI-powered SQL generation.

## Overview

This application provides a React Flow canvas interface where users can:

- Connect to MySQL databases
- Generate persistent MCP servers at dynamic endpoints
- Create custom tools using natural language prompts (AI converts to SQL)
- Visually manage datasources, MCP servers, and tools
- View database schemas and test generated queries

## Architecture

This is a monorepo application with three main workspaces:

```
poc-origin/
├── backend/          # NestJS backend with TypeORM
├── frontend/         # React + Vite + React Flow
├── shared/           # Shared TypeScript types & DTOs
└── specs/            # Feature specifications
```

### Technology Stack

**Backend:**

- NestJS 10.x
- TypeORM with MySQL
- MCP SDK (@modelcontextprotocol/sdk)
- OpenAI API for SQL generation

**Frontend:**

- React 18.x
- Vite 5.x
- React Flow (canvas interface)
- TanStack Query (data fetching)
- Radix UI + Tailwind CSS

**Database:**

- MySQL 9.3 (application data)
- MySQL 5.7+ (user datasources)

## Prerequisites

- Node.js 20.x or higher
- npm 9.x or higher
- Docker & Docker Compose (for database instances)
- OpenAI API key

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd poc-origin
```

### 2. Install Dependencies

```bash
npm install
```

This will install dependencies for all workspaces (backend, frontend, shared).

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
# Copy the example file
cp .env.example .env

# Edit the .env file
nano .env
```

Add your configuration:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=root
DB_DATABASE=poc_origin
MYSQL_ROOT_PASSWORD=root

# Security Configuration
CREDENTIALS_ENCRYPTION_KEY=your-32-character-encryption-key-here

# LLM Configuration
OPENAI_API_KEY=sk-your-actual-openai-api-key-here

# Application Configuration
BACKEND_PORT=3001
FRONTEND_PORT=5173
```

### 4. Start the Application

Start the MySQL database and application:

```bash
# Start MySQL container
docker compose up -d

# Start both backend and frontend
npm run dev
```

Access the application at:

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

The backend will automatically create the necessary database tables on first run.

## Usage

### Connecting a Database

1. Open the application at http://localhost:5173
2. Click the "Add Datasource" node on the canvas
3. Enter your database connection details:
   - Host
   - Port
   - Database name
   - Username
   - Password
4. Click "Test Connection" to verify
5. Save to create the datasource node

### Creating an MCP Server

1. Click the "Create MCP Server" node that appears after adding a datasource
2. Enter a name for your MCP server
3. The system will generate a unique slug and create a persistent server at `/mcp/:slug`
4. Your MCP server is now running and ready to accept tools

### Adding Tools with Natural Language

1. Click on an MCP server node
2. Select "Create Tool"
3. Enter a natural language description of what data you want:
   - Example: "get all active users from the last 30 days"
   - Example: "find orders by customer ID with their total amount"
4. The AI will generate the SQL query automatically
5. Review the generated query and test it with sample parameters
6. Save the tool with a descriptive name

### Viewing Database Schema

1. Click on an MCP server node
2. Select "View Schema"
3. Browse tables, columns, data types, and relationships
4. Use the search/filter to find specific tables or columns

### Managing Tools

- Click on any tool node to view details
- Edit the natural language prompt to regenerate SQL
- Test tools with different parameter values
- Delete tools you no longer need

## Project Structure

```
backend/
├── src/
│   ├── app.module.ts           # Main application module
│   ├── main.ts                 # Application entry point
│   ├── datasources/            # Datasource management
│   ├── mcp-servers/            # MCP server lifecycle
│   ├── canvas/                 # Canvas node persistence
│   └── config/                 # Configuration modules

frontend/
├── src/
│   ├── App.tsx                 # Main React component
│   ├── components/             # UI components
│   │   ├── Canvas/             # React Flow canvas
│   │   ├── Dialogs/            # Modal dialogs
│   │   └── ui/                 # Reusable UI components
│   ├── hooks/                  # Custom React hooks
│   ├── services/               # API client services
│   └── types/                  # TypeScript type definitions

shared/
├── src/
│   ├── types/                  # Shared TypeScript types
│   ├── dtos/                   # Data Transfer Objects
│   └── enums/                  # Shared enumerations
```

## API Endpoints

### Datasources

- `POST /api/datasources` - Create a new datasource
- `GET /api/datasources` - List all datasources
- `GET /api/datasources/:id` - Get datasource details
- `PATCH /api/datasources/:id` - Update datasource
- `DELETE /api/datasources/:id` - Delete datasource
- `POST /api/datasources/test` - Test connection
- `POST /api/datasources/:id/test` - Test existing datasource

### MCP Servers

- `POST /api/mcp-servers` - Create MCP server
- `GET /api/mcp-servers` - List all MCP servers
- `GET /api/mcp-servers/:id` - Get MCP server details
- `PATCH /api/mcp-servers/:id` - Update MCP server
- `DELETE /api/mcp-servers/:id` - Delete MCP server
- `POST /api/mcp-servers/:id/activate` - Activate MCP server

### Canvas

- `POST /api/canvas/nodes` - Create canvas node
- `GET /api/canvas/nodes` - List all canvas nodes
- `PATCH /api/canvas/nodes/:nodeId` - Update node position
- `DELETE /api/canvas/nodes/:nodeId` - Delete canvas node

### MCP Protocol

- `POST /mcp/:slug` - MCP protocol endpoint (JSON-RPC 2.0)

## Development

### Build

```bash
# Build all workspaces
npm run build

# Build specific workspace
npm run build --workspace=backend
npm run build --workspace=frontend
npm run build --workspace=shared
```

### Testing

```bash
# Run tests for all workspaces
npm test

# Run tests for specific workspace
npm test --workspace=backend
npm test --workspace=frontend
```

### Linting

```bash
# Lint all workspaces
npm run lint

# Lint specific workspace
npm run lint --workspace=backend
npm run lint --workspace=frontend
```

## Environment Variables Reference

| Variable                     | Description              | Required | Default      |
| ---------------------------- | ------------------------ | -------- | ------------ |
| `DB_HOST`                    | MySQL host               | Yes      | `localhost`  |
| `DB_PORT`                    | MySQL port               | Yes      | `3306`       |
| `DB_USERNAME`                | MySQL username           | Yes      | `mcp_app`    |
| `DB_PASSWORD`                | MySQL password           | Yes      | -            |
| `DB_DATABASE`                | Database name            | Yes      | `poc_origin` |
| `CREDENTIALS_ENCRYPTION_KEY` | 32-char encryption key   | Yes      | -            |
| `OPENAI_API_KEY`             | OpenAI API key           | Yes      | -            |
| `BACKEND_PORT`               | Backend server port      | No       | `3001`       |
| `FRONTEND_PORT`              | Frontend dev server port | No       | `5173`       |

## Security Notes

**This is a POC (Proof of Concept) application with the following security limitations:**

- No user authentication or authorization
- All MCP servers are publicly accessible
- Datasource credentials are encrypted but accessible to all users
- No rate limiting on API endpoints
- No input sanitization beyond basic validation

**Do not use this application in production without implementing proper security measures.**

## Troubleshooting

### Backend fails to start

1. Check that MySQL is running: `docker ps` or `mysql -u root -p`
2. Verify `.env` file has correct database credentials
3. Check that the database exists: `mysql -u root -p -e "SHOW DATABASES;"`
4. Rebuild the shared package: `npm run build --workspace=shared`

### Frontend cannot connect to backend

1. Verify backend is running: http://localhost:3001
2. Check CORS settings in `backend/src/main.ts`
3. Verify `BACKEND_PORT` in `.env` matches the running backend

### MCP Server creation fails

1. Ensure OpenAI API key is valid in `.env`
2. Check that the datasource connection is successful
3. Review backend logs for specific error messages

### Database connection errors

1. Verify MySQL is running and accessible
2. Check firewall settings allow connection to port 3306
3. Verify database credentials are correct
4. Test connection manually: `mysql -h localhost -u mcp_app -p poc_origin`

## Contributing

This is a POC project. For production use, consider:

1. Adding user authentication and authorization
2. Implementing proper security measures
3. Adding comprehensive error handling
4. Supporting additional database types (PostgreSQL, etc.)
5. Adding rate limiting and request validation
6. Implementing audit logging
7. Adding unit and integration tests

## License

[Add your license information here]

## Documentation

### Feature Specifications

For detailed specifications and implementation details, see the `/specs` directory:

- [Feature Specification](./specs/001-mcp-datasource-generator/spec.md)
- [Implementation Plan](./specs/001-mcp-datasource-generator/plan.md)
- [API Contracts](./specs/001-mcp-datasource-generator/contracts/)
- [Data Model](./specs/001-mcp-datasource-generator/data-model.md)
