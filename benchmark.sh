#!/bin/bash

# Performance benchmarking script for VacciChain
# Usage: ./benchmark.sh [backend|contract|all]

set -e

BENCHMARK_TYPE=${1:-all}
RESULTS_DIR="benchmark-results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$RESULTS_DIR"

echo "🚀 Starting VacciChain performance benchmarks..."

# Backend benchmarks
if [ "$BENCHMARK_TYPE" = "backend" ] || [ "$BENCHMARK_TYPE" = "all" ]; then
  echo ""
  echo "📊 Backend API Benchmarks"
  echo "========================"
  
  if ! command -v autocannon &> /dev/null; then
    echo "Installing autocannon..."
    npm install -g autocannon
  fi
  
  # Check if backend is running
  if ! curl -s http://localhost:4000/health > /dev/null; then
    echo "❌ Backend not running on port 4000"
    echo "Start it with: cd backend && npm run dev"
    exit 1
  fi
  
  echo "Benchmarking /health endpoint..."
  autocannon -c 10 -d 30 -p 10 http://localhost:4000/health \
    > "$RESULTS_DIR/health_${TIMESTAMP}.txt"
  
  echo "Benchmarking /verify endpoint..."
  autocannon -c 10 -d 30 -p 10 \
    -H "Content-Type: application/json" \
    http://localhost:4000/verify/GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4 \
    > "$RESULTS_DIR/verify_${TIMESTAMP}.txt"
  
  echo "✅ Backend benchmarks complete"
  echo "Results saved to $RESULTS_DIR/"
fi

# Contract gas benchmarks
if [ "$BENCHMARK_TYPE" = "contract" ] || [ "$BENCHMARK_TYPE" = "all" ]; then
  echo ""
  echo "📊 Contract Gas Usage Benchmarks"
  echo "================================"
  
  cd contracts
  
  echo "Building contract..."
  make build > /dev/null
  
  echo "Running gas benchmarks..."
  cargo test --release -- --nocapture --test-threads=1 2>&1 | tee "../$RESULTS_DIR/gas_${TIMESTAMP}.txt"
  
  echo "✅ Contract benchmarks complete"
  cd ..
fi

echo ""
echo "📈 Benchmark Summary"
echo "==================="
echo "Results saved to: $RESULTS_DIR/"
echo ""
echo "To compare with baseline:"
echo "  git show origin/main:backend/benchmarks/health-benchmark.txt"
echo ""
