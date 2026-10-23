#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export JAVA_HOME=/home/ubuntu/.local/jdk-21.0.12.1+1
export PATH=$JAVA_HOME/bin:/home/ubuntu/.local/bin:$PATH

echo "=== [1/3] Starting Database (PostgreSQL & pgAdmin) ==="
cd "$DIR"
docker compose up -d

echo "Waiting for PostgreSQL to become healthy..."
until docker exec aurafit-postgres pg_isready -U aurafit -d aurafit_db >/dev/null 2>&1; do
    sleep 1
done
echo "PostgreSQL is healthy on port 5433."

echo "=== [2/3] Starting AuraFit Backend (Spring Boot on :8085) ==="
if pgrep -f "aurafit-backend.*8085" >/dev/null; then
    echo "Backend is already running."
else
    cd "$DIR/backend"
    nohup java -Duser.timezone=Asia/Ho_Chi_Minh -jar target/aurafit-backend-0.0.1-SNAPSHOT.jar --server.port=8085 > "$DIR/backend.log" 2>&1 &
    echo "Backend started in background (PID: $!). Log: $DIR/backend.log"
fi

echo "Waiting for Backend to respond on port 8085..."
for i in {1..30}; do
    if curl -s http://localhost:8085/api/costumes >/dev/null 2>&1; then
        echo "Backend is ready!"
        break
    fi
    sleep 2
done

echo "=== [3/3] Starting AuraFit Frontend (Vite on :5174) ==="
if pgrep -f "vite preview.*5174" >/dev/null; then
    echo "Frontend is already running."
else
    cd "$DIR/frontend"
    nohup npx vite preview --host 0.0.0.0 --port 5174 > "$DIR/frontend.log" 2>&1 &
    echo "Frontend started in background (PID: $!). Log: $DIR/frontend.log"
fi

echo ""
echo "=========================================================="
echo "           AuraFit Deployment Complete!                  "
echo "=========================================================="
echo " - Frontend:    http://localhost:5174"
echo " - Backend API: http://localhost:8085/api"
echo " - pgAdmin 4:   http://localhost:5050 (truongthainhuu@gmail.com / admin123)"
echo " - PostgreSQL:  localhost:5433 (user: aurafit / db: aurafit_db)"
echo " - Default Admin: truongthainhuu@gmail.com / 12345678"
echo "=========================================================="
