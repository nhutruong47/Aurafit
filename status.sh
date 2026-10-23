#!/usr/bin/env bash

echo "=== AuraFit Deployment Status ==="
echo ""
echo "--- Docker Containers ---"
docker ps --filter "name=aurafit" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

echo "--- Backend Process (:8085) ---"
if pgrep -f "aurafit-backend.*8085" >/dev/null; then
    PID=$(pgrep -f "aurafit-backend.*8085")
    echo "Running (PID: $PID)"
    HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8085/api/costumes)
    echo "Health check (GET /api/costumes): HTTP $HEALTH"
else
    echo "Not running"
fi
echo ""

echo "--- Frontend Process (:5174) ---"
if pgrep -f "vite preview.*5174" >/dev/null; then
    PID=$(pgrep -f "vite preview.*5174")
    echo "Running (PID: $PID)"
    HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5174/)
    echo "Health check (GET /): HTTP $HEALTH"
else
    echo "Not running"
fi
echo ""
