#!/bin/bash

# List all running application instances
# Usage: ./scripts/list-instances.sh

echo "=== Running MySQL Instances ==="
docker compose -f docker-compose.instances.yml ps

echo ""
echo "=== Available Instance Configurations ==="
for env_file in .env.instance*; do
  if [ -f "$env_file" ]; then
    instance=$(echo "$env_file" | sed 's/.env.instance//')
    backend_port=$(grep "^BACKEND_PORT=" "$env_file" | cut -d'=' -f2)
    frontend_port=$(grep "^FRONTEND_PORT=" "$env_file" | cut -d'=' -f2)
    db_port=$(grep "^DB_PORT=" "$env_file" | cut -d'=' -f2)
    echo "Instance $instance: Backend :$backend_port | Frontend :$frontend_port | MySQL :$db_port"
  fi
done

echo ""
echo "=== Process Information ==="
echo "Backend processes:"
lsof -ti:3001,3002,3003 2>/dev/null | while read pid; do
  ps -p $pid -o pid,cmd | tail -n +2
done || echo "  No backend processes running"

echo ""
echo "Frontend processes:"
lsof -ti:5173,5174,5175 2>/dev/null | while read pid; do
  ps -p $pid -o pid,cmd | tail -n +2
done || echo "  No frontend processes running"
