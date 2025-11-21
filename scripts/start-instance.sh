#!/bin/bash

# Start a specific application instance with its own database and ports
# Usage: ./scripts/start-instance.sh <instance_number>

set -e

INSTANCE=$1

if [ -z "$INSTANCE" ]; then
  echo "Usage: $0 <instance_number>"
  echo "Example: $0 1"
  exit 1
fi

ENV_FILE=".env.instance${INSTANCE}"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: Environment file $ENV_FILE not found"
  echo "Please create it or use ./scripts/create-instance.sh $INSTANCE"
  exit 1
fi

echo "Starting instance $INSTANCE..."
echo "Loading configuration from .env and $ENV_FILE"

# Load environment variables from main .env first, then instance file (instance overrides main)
set -a
[ -f ".env" ] && source ".env"
source "$ENV_FILE"
set +a

# Start MySQL container for this instance
echo "Starting MySQL container for instance $INSTANCE (port $DB_PORT)..."
docker compose -f docker-compose.instances.yml up -d mysql-instance${INSTANCE}

# Wait for MySQL to be ready
echo "Waiting for MySQL to be ready..."
until docker compose -f docker-compose.instances.yml exec -T mysql-instance${INSTANCE} mysqladmin ping -h localhost -u root -p${MYSQL_ROOT_PASSWORD} --silent 2>/dev/null; do
  echo -n "."
  sleep 2
done
echo ""
echo "MySQL is ready!"

# Start backend and frontend with the instance configuration
echo "Starting backend on port $BACKEND_PORT and frontend on port $FRONTEND_PORT..."
ENV_FILE="$ENV_FILE" npx concurrently \
  --names "backend-$INSTANCE,frontend-$INSTANCE" \
  --prefix-colors "cyan,magenta" \
  "npm run dev --workspace=backend" \
  "npm run dev --workspace=frontend"
