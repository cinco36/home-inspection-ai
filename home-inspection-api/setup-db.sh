#!/bin/bash

echo "Setting up PostgreSQL database and Redis for Home Inspection API..."

# Start PostgreSQL and Redis containers
echo "Starting PostgreSQL and Redis containers..."
docker-compose up -d postgres redis

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 10

# Check if PostgreSQL is accessible
echo "Testing PostgreSQL connection..."
docker exec home-inspection-postgres psql -U postgres -d home_inspection -c "SELECT version();"

# Check if Redis is accessible
echo "Testing Redis connection..."
docker exec home-inspection-redis redis-cli ping

echo "Database and Redis setup complete!"
echo "You can now start the API server with: npm run dev"
echo "You can now start the worker with: npm run worker" 