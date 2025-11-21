# Instance Management Guide

This guide explains how to run multiple instances of the MCP Datasource Generator application concurrently.

## Overview

The application supports running multiple instances simultaneously, each with:
- Its own MySQL database container
- Isolated database data (separate volumes)
- Unique backend and frontend ports
- Independent configuration files

This is useful for:
- **Development**: Work on multiple features in parallel
- **Testing**: Run different configurations side-by-side
- **Comparison**: Compare different datasource configurations
- **Team Collaboration**: Multiple developers can run separate instances on the same machine

## Instance Configuration

Three pre-configured instances are provided out of the box:

| Instance | Backend Port | Frontend Port | MySQL Port | Database Name |
|----------|-------------|---------------|------------|---------------|
| 1 | 3001 | 5173 | 3306 | poc_origin_instance1 |
| 2 | 3002 | 5174 | 3307 | poc_origin_instance2 |
| 3 | 3003 | 5175 | 3308 | poc_origin_instance3 |

## Quick Start

### Option 1: Using Shell Scripts (Recommended)

1. **Start MySQL containers for all instances:**
   ```bash
   docker compose -f docker-compose.instances.yml up -d
   ```

2. **Run instances in separate terminals:**
   ```bash
   # Terminal 1 - Instance 1
   npm run dev:instance1

   # Terminal 2 - Instance 2
   npm run dev:instance2

   # Terminal 3 - Instance 3
   npm run dev:instance3
   ```

3. **Or use the start script (starts both MySQL and app):**
   ```bash
   # Terminal 1
   ./scripts/start-instance.sh 1

   # Terminal 2
   ./scripts/start-instance.sh 2

   # Terminal 3
   ./scripts/start-instance.sh 3
   ```

### Option 2: Run All Instances at Once

Start all MySQL containers and all instances simultaneously:

```bash
# Start all MySQL containers
docker compose -f docker-compose.instances.yml up -d

# Start all 3 instances in one terminal
npm run dev:all
```

**Note:** This will show all logs in a single terminal with colored prefixes.

## Configuration Files

The application uses a **cascading environment variable system**:

- **Main `.env` file**: Contains sensitive data (API keys, encryption keys) - gitignored
- **Instance files**: Instance-specific settings (ports, database names) - can be version controlled
  - `.env.instance1`
  - `.env.instance2`
  - `.env.instance3`

### Environment File Structure

**Main `.env` file** (contains secrets):
```bash
# Security Configuration
CREDENTIALS_ENCRYPTION_KEY=your-32-character-encryption-key-here

# LLM Configuration
OPENAI_API_KEY=sk-your-actual-openai-api-key-here

# Other shared configuration...
```

**Instance files** (`.env.instance1`, `.env.instance2`, etc.):
```bash
# Instance 1 Configuration
# Inherits OPENAI_API_KEY, CREDENTIALS_ENCRYPTION_KEY, and other sensitive data from main .env

# Database Configuration
DB_HOST=localhost
DB_PORT=3306                    # Different for each instance
DB_USERNAME=root
DB_PASSWORD=root
DB_DATABASE=poc_origin_instance1  # Different for each instance
MYSQL_ROOT_PASSWORD=root

# Application Configuration
BACKEND_PORT=3001               # Different for each instance
FRONTEND_PORT=5173              # Different for each instance

# Instance Identifier
INSTANCE=1                      # Different for each instance
```

**How the cascading system works:**
1. Variables are loaded from `.env` first (base configuration with secrets)
2. Then variables are loaded from `.env.instanceX` (instance-specific overrides)
3. If a variable exists in both files, the instance file value takes precedence
4. This allows you to:
   - Keep secrets in one gitignored file (`.env`)
   - Version control instance configurations (`.env.instance*`)
   - Override any base setting on a per-instance basis if needed

## Docker Compose Configuration

The `docker-compose.instances.yml` file defines all three MySQL containers:

- Each container has its own:
  - Container name (e.g., `mcp-generator-mysql-instance1`)
  - Port mapping (3306, 3307, 3308)
  - Data volume (persistent storage)
  - Health check
  - Database name

## Available Scripts

### Management Scripts

Located in the `scripts/` directory:

1. **`start-instance.sh <instance_number>`**
   - Starts the MySQL container for the specified instance
   - Waits for MySQL to be ready
   - Starts both backend and frontend with the instance configuration
   - Example: `./scripts/start-instance.sh 1`

2. **`stop-instance.sh <instance_number>`**
   - Stops the MySQL container for the specified instance
   - Example: `./scripts/stop-instance.sh 1`
   - Note: You need to manually stop backend/frontend processes (Ctrl+C)

3. **`list-instances.sh`**
   - Shows all running MySQL containers
   - Lists available instance configurations
   - Shows running backend and frontend processes
   - Example: `./scripts/list-instances.sh`

4. **`create-instance.sh <instance_number> [backend_port] [frontend_port] [mysql_port]`**
   - Creates a new instance configuration file
   - Auto-calculates ports if not provided
   - Example: `./scripts/create-instance.sh 4`
   - Example with custom ports: `./scripts/create-instance.sh 4 3004 5176 3309`

### NPM Scripts

Added to root `package.json`:

- `npm run dev:instance1` - Run instance 1
- `npm run dev:instance2` - Run instance 2
- `npm run dev:instance3` - Run instance 3
- `npm run dev:all` - Run all three instances concurrently

## Docker Commands

### Managing MySQL Containers

```bash
# Start all MySQL containers
docker compose -f docker-compose.instances.yml up -d

# Start specific instance
docker compose -f docker-compose.instances.yml up -d mysql-instance1

# Stop all MySQL containers
docker compose -f docker-compose.instances.yml stop

# Stop specific instance
docker compose -f docker-compose.instances.yml stop mysql-instance1

# View logs
docker compose -f docker-compose.instances.yml logs -f

# View logs for specific instance
docker compose -f docker-compose.instances.yml logs -f mysql-instance1

# Remove containers (data is preserved in volumes)
docker compose -f docker-compose.instances.yml down

# Remove containers AND data volumes
docker compose -f docker-compose.instances.yml down -v

# Check container status
docker compose -f docker-compose.instances.yml ps
```

### Managing Data Volumes

```bash
# List volumes
docker volume ls | grep poc_origin

# Inspect a volume
docker volume inspect mcp-generator-mysql-data-instance1

# Remove a specific volume (WARNING: deletes all data)
docker volume rm mysql-data-instance1

# Remove all unused volumes
docker volume prune
```

## Accessing the Instances

Once running, access each instance via:

### Instance 1
- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- MySQL: localhost:3306

### Instance 2
- Frontend: http://localhost:5174
- Backend: http://localhost:3002
- MySQL: localhost:3307

### Instance 3
- Frontend: http://localhost:5175
- Backend: http://localhost:3003
- MySQL: localhost:3308

## Creating Additional Instances

To create a 4th instance (or more):

1. **Create the configuration:**
   ```bash
   ./scripts/create-instance.sh 4
   ```

2. **Edit the configuration file:**
   ```bash
   nano .env.instance4
   # Add your OpenAI API key
   ```

3. **Add MySQL service to `docker-compose.instances.yml`:**
   ```yaml
   mysql-instance4:
     image: mysql:9.3.0
     container_name: mcp-generator-mysql-instance4
     environment:
       MYSQL_ROOT_PASSWORD: root
       MYSQL_DATABASE: poc_origin_instance4
       MYSQL_USER: mcp_app
       MYSQL_PASSWORD: root
     ports:
       - "3309:3306"
     volumes:
       - mysql-data-instance4:/var/lib/mysql
     healthcheck:
       test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-proot"]
       timeout: 5s
       retries: 10
       interval: 10s
     networks:
       - mcp-network
   ```

4. **Add the volume:**
   ```yaml
   volumes:
     mysql-data-instance4:
   ```

5. **Add npm script to `package.json`:**
   ```json
   "dev:instance4": "dotenv -e .env.instance4 -- concurrently --names \"backend-4,frontend-4\" --prefix-colors \"cyan,magenta\" \"npm run dev --workspace=backend\" \"npm run dev --workspace=frontend\""
   ```

6. **Start the new instance:**
   ```bash
   ./scripts/start-instance.sh 4
   ```

## Troubleshooting

### Port Already in Use

If you get a "port already in use" error:

1. Check what's using the port:
   ```bash
   lsof -i :3001  # Check backend port
   lsof -i :5173  # Check frontend port
   lsof -i :3306  # Check MySQL port
   ```

2. Kill the process:
   ```bash
   kill -9 <PID>
   ```

3. Or use a different port by editing the `.env.instanceX` file

### MySQL Container Won't Start

1. Check Docker logs:
   ```bash
   docker compose -f docker-compose.instances.yml logs mysql-instance1
   ```

2. Ensure no other MySQL is using the port:
   ```bash
   docker ps | grep mysql
   lsof -i :3306
   ```

3. Remove and recreate the container:
   ```bash
   docker compose -f docker-compose.instances.yml rm -f mysql-instance1
   docker compose -f docker-compose.instances.yml up -d mysql-instance1
   ```

### Backend Can't Connect to Database

1. Verify MySQL is running:
   ```bash
   docker compose -f docker-compose.instances.yml ps
   ```

2. Test MySQL connection:
   ```bash
   docker compose -f docker-compose.instances.yml exec mysql-instance1 mysql -u root -proot -e "SHOW DATABASES;"
   ```

3. Check environment variables are loaded:
   ```bash
   # In your instance terminal
   echo $DB_PORT
   echo $DB_DATABASE
   ```

### Instance Configuration Not Loading

1. Verify the environment file exists:
   ```bash
   ls -la .env.instance*
   ```

2. Check file permissions:
   ```bash
   chmod 600 .env.instance*
   ```

3. Verify dotenv-cli is installed:
   ```bash
   npm list dotenv-cli
   ```

## Data Persistence

Each instance's database data is stored in a Docker volume:
- `mysql-data-instance1`
- `mysql-data-instance2`
- `mysql-data-instance3`

**Data persists across container restarts** unless you explicitly remove the volumes.

To reset an instance's data:
```bash
docker compose -f docker-compose.instances.yml down
docker volume rm mysql-data-instance1
docker compose -f docker-compose.instances.yml up -d mysql-instance1
```

## Security Considerations

### Cascading Environment Variables

The cascading environment variable system provides security benefits:

✅ **Benefits:**
- Secrets (API keys, encryption keys) are kept in a single `.env` file
- The main `.env` file is gitignored and never committed to version control
- Instance files (`.env.instanceX`) can be safely committed without exposing secrets
- Team members can share instance configurations without sharing credentials
- Each developer maintains their own `.env` file with their personal API keys

⚠️ **Important:**
- **NEVER** commit the main `.env` file to version control
- Only put non-sensitive, instance-specific configuration in `.env.instanceX` files
- If an instance file needs a secret that differs from the main `.env`, consider if that's really necessary or if you should use separate projects instead

### Multi-Instance Security

- Each instance shares the same encryption key (by default, from main `.env`)
- Each instance can access the same user datasources (if credentials match)
- There is no authentication between instances
- All MCP servers are accessible from any frontend port (due to CORS configuration)

For production use, consider:
- Using different encryption keys per instance (override in instance files if needed)
- Implementing proper authentication and authorization
- Restricting CORS to specific origins
- Using environment-specific secrets management (e.g., AWS Secrets Manager, HashiCorp Vault)

## Tips and Best Practices

1. **Use separate terminals** for each instance to easily monitor logs

2. **Name your terminal windows/tabs** with the instance number for clarity

3. **Keep a reference table** of which instance is working on what feature

4. **Use git branches** in combination with instances for parallel feature development

5. **Stop unused instances** to free up system resources:
   ```bash
   docker compose -f docker-compose.instances.yml stop mysql-instance2
   # Ctrl+C in the instance terminal
   ```

6. **Back up important data** before removing volumes:
   ```bash
   docker compose -f docker-compose.instances.yml exec mysql-instance1 mysqldump -u root -proot poc_origin_instance1 > backup.sql
   ```

## Resource Usage

Running multiple instances requires:
- **CPU**: Each Node.js process (backend + frontend) per instance
- **Memory**: ~200-300MB per MySQL container, ~500MB per backend, ~200MB per frontend
- **Disk**: Separate volume for each MySQL instance

Estimate: ~1GB RAM and 2 CPU cores per instance for comfortable development.
