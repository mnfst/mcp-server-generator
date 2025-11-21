#!/bin/bash

# Create a new instance configuration
# Usage: ./scripts/create-instance.sh <instance_number> [backend_port] [frontend_port] [mysql_port]

set -e

INSTANCE=$1
BACKEND_PORT=$2
FRONTEND_PORT=$3
MYSQL_PORT=$4

if [ -z "$INSTANCE" ]; then
  echo "Usage: $0 <instance_number> [backend_port] [frontend_port] [mysql_port]"
  echo "Example: $0 4"
  echo "Example: $0 4 3004 5176 3309"
  exit 1
fi

ENV_FILE=".env.instance${INSTANCE}"

if [ -f "$ENV_FILE" ]; then
  echo "Error: $ENV_FILE already exists"
  exit 1
fi

# Auto-calculate ports if not provided
if [ -z "$BACKEND_PORT" ]; then
  BACKEND_PORT=$((3000 + INSTANCE))
fi

if [ -z "$FRONTEND_PORT" ]; then
  FRONTEND_PORT=$((5172 + INSTANCE))
fi

if [ -z "$MYSQL_PORT" ]; then
  MYSQL_PORT=$((3305 + INSTANCE))
fi

echo "Creating instance $INSTANCE configuration..."
echo "  Backend port: $BACKEND_PORT"
echo "  Frontend port: $FRONTEND_PORT"
echo "  MySQL port: $MYSQL_PORT"

cat > "$ENV_FILE" <<EOF
# Instance $INSTANCE Configuration
# Inherits OPENAI_API_KEY, CREDENTIALS_ENCRYPTION_KEY, and other sensitive data from main .env

# Database Configuration
DB_HOST=localhost
DB_PORT=$MYSQL_PORT
DB_USERNAME=root
DB_PASSWORD=root
DB_DATABASE=poc_origin_instance${INSTANCE}
MYSQL_ROOT_PASSWORD=root

# Application Configuration
BACKEND_PORT=$BACKEND_PORT
FRONTEND_PORT=$FRONTEND_PORT

# Instance Identifier
INSTANCE=$INSTANCE
EOF

echo ""
echo "Instance $INSTANCE configuration created at $ENV_FILE"
echo ""
echo "Next steps:"
echo "  1. Ensure your main .env file contains OPENAI_API_KEY and CREDENTIALS_ENCRYPTION_KEY"
echo "  2. (Optional) Customize instance-specific settings in $ENV_FILE"
echo "  3. Start the instance with: ./scripts/start-instance.sh $INSTANCE"
