#!/usr/bin/env bash
set -euo pipefail

echo "=== Literature Game: Setting up dev environment ==="

# 1. Check Node version (requires >=18)
NODE_OK=$(node -e "process.exit(parseInt(process.version.slice(1)) < 18 ? 1 : 0)" 2>/dev/null && echo "ok" || echo "fail")
if [ "$NODE_OK" = "fail" ]; then
  echo "ERROR: Node.js 18+ is required. Current: $(node --version 2>/dev/null || echo 'not found')"
  exit 1
fi
echo "Node.js: $(node --version) ✓"

# 2. Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing npm dependencies..."
  npm install
else
  echo "node_modules present ✓"
fi

# 3. Build puzzle data if missing
if [ ! -f "public/data/puzzles.json" ]; then
  echo "Puzzle data not found. Generating sample puzzles..."
  mkdir -p public/data
  node scripts/generate-sample-puzzles.js
else
  echo "Puzzle data present ✓"
fi

echo "=== Dev environment ready. Run: npm run dev ==="
