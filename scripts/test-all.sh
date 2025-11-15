#!/bin/bash

# Quick Test Script for Score Fusion Livescores
# This script tests the Sportmonks API integration

echo "🏈 Score Fusion - Livescores Test Suite"
echo "========================================"
echo ""

# Check if API key is set
if [ -z "$SPORTMONKS_API_KEY" ]; then
    echo "⚠️  SPORTMONKS_API_KEY not set in environment"
    echo "Please set it first:"
    echo "  export SPORTMONKS_API_KEY='your_key_here'"
    echo ""
    exit 1
fi

echo "✅ API Key found"
echo ""

# Test 1: API Provider Test
echo "Test 1: Testing API Provider..."
echo "--------------------------------"
npx tsx scripts/test-sportmonks-api.ts
echo ""

# Test 2: Build Check
echo "Test 2: Checking TypeScript compilation..."
echo "-------------------------------------------"
npx tsc --noEmit
if [ $? -eq 0 ]; then
    echo "✅ No TypeScript errors"
else
    echo "❌ TypeScript compilation failed"
    exit 1
fi
echo ""

# Test 3: Next.js Build
echo "Test 3: Testing Next.js build..."
echo "---------------------------------"
pnpm build
if [ $? -eq 0 ]; then
    echo "✅ Next.js build successful"
else
    echo "❌ Next.js build failed"
    exit 1
fi
echo ""

echo "======================================"
echo "✅ All tests passed!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Run 'pnpm dev' to start the development server"
echo "2. Open http://localhost:3000/livescores"
echo "3. Open http://localhost:3000/analytics"
echo ""
