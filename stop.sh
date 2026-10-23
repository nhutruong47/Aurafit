#!/usr/bin/env bash

echo "Stopping AuraFit Frontend..."
pkill -f "vite preview.*5174" || true

echo "Stopping AuraFit Backend..."
pkill -f "aurafit-backend.*8085" || true

if [ "$1" == "--all" ]; then
    echo "Stopping Database containers..."
    DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    cd "$DIR" && docker compose down
fi

echo "AuraFit stopped."
