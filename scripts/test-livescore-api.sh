#!/bin/bash

# Live Score API Test Script
# This script tests all the live score API endpoints

BASE_URL="http://localhost:3000"
API_ENDPOINT="${BASE_URL}/api/livescores/matches"

echo "🧪 Testing Live Score API Endpoints"
echo "=================================="
echo ""

# Test 1: Get live matches
echo "✅ Test 1: Get live matches"
curl -s "${API_ENDPOINT}?status=live&limit=5" | jq '.success, .data.pagination, .data.matches | length'
echo ""

# Test 2: Get scheduled matches
echo "✅ Test 2: Get scheduled matches"
curl -s "${API_ENDPOINT}?status=scheduled&limit=5" | jq '.success, .data.pagination'
echo ""

# Test 3: Search for matches (requires API key)
echo "✅ Test 3: Search for matches"
curl -s "${API_ENDPOINT}?search=Arsenal&source=api&limit=10" | jq '.success, .data.pagination, (.data.matches | length)'
echo ""

# Test 4: Pagination
echo "✅ Test 4: Test pagination"
echo "Page 1:"
curl -s "${API_ENDPOINT}?page=1&limit=5" | jq '.success, .data.pagination'
echo ""
echo "Page 2:"
curl -s "${API_ENDPOINT}?page=2&limit=5" | jq '.success, .data.pagination'
echo ""

# Test 5: Filter by date range
echo "✅ Test 5: Filter by date range"
curl -s "${API_ENDPOINT}?dateFrom=2025-01-01&dateTo=2025-01-31&limit=5" | jq '.success, .data.pagination'
echo ""

# Test 6: Database source
echo "✅ Test 6: Get from database"
curl -s "${API_ENDPOINT}?source=database&limit=5" | jq '.success, .data.source, .data.pagination'
echo ""

# Test 7: Get provider health status
echo "✅ Test 7: Get provider health status"
curl -s -X POST "${API_ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d '{"action": "status"}' | jq '.'
echo ""

# Test 8: Refresh live scores
echo "✅ Test 8: Refresh live scores"
curl -s -X POST "${API_ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d '{"action": "refresh"}' | jq '.'
echo ""

# Test 9: Invalid query parameters
echo "✅ Test 9: Test error handling (invalid status)"
curl -s "${API_ENDPOINT}?status=invalid" | jq '.success, .error'
echo ""

# Test 10: Search with filters
echo "✅ Test 10: Search with filters"
curl -s "${API_ENDPOINT}?search=Chelsea&status=live&source=api" | jq '.success, .data.filters'
echo ""

echo "=================================="
echo "✅ All tests completed!"
echo ""
echo "💡 Tips:"
echo "- Make sure your dev server is running (pnpm dev)"
echo "- Add API keys to .env for external API tests"
echo "- Install jq for better JSON formatting: brew install jq"
