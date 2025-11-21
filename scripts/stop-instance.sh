#!/bin/bash

# Stop a specific application instance
# Usage: ./scripts/stop-instance.sh <instance_number>

set -e

INSTANCE=$1

if [ -z "$INSTANCE" ]; then
  echo "Usage: $0 <instance_number>"
  echo "Example: $0 1"
  exit 1
fi

echo "Stopping instance $INSTANCE..."

# Stop MySQL container for this instance
echo "Stopping MySQL container for instance $INSTANCE..."
docker compose -f docker-compose.instances.yml stop mysql-instance${INSTANCE}

echo "Instance $INSTANCE stopped."
echo "Note: Backend and frontend processes need to be stopped manually (Ctrl+C in their terminals)"
echo "To completely remove the MySQL container, run:"
echo "  docker compose -f docker-compose.instances.yml rm -f mysql-instance${INSTANCE}"
