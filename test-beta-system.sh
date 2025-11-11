#!/bin/bash

# ============================================================================
# BETA SYSTEM END-TO-END TESTING SCRIPT
# ============================================================================
# This script tests all beta system functionality
# Usage: bash test-beta-system.sh [port]
# Default port: 3000
# ============================================================================

set -e

PORT=${1:-3000}
BASE_URL="http://localhost:$PORT"

echo "🧪 Beta System Testing Script"
echo "=============================="
echo "Base URL: $BASE_URL"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to test endpoint
test_endpoint() {
    local test_name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local headers=$5
    local expected_status=${6:-200}

    echo -n "Testing: $test_name... "

    # Build curl command
    CMD="curl -s -w '\n%{http_code}' -X $method $BASE_URL$endpoint"

    if [ ! -z "$headers" ]; then
        CMD="$CMD $headers"
    fi

    if [ ! -z "$data" ]; then
        CMD="$CMD -H 'Content-Type: application/json' -d '$data'"
    fi

    # Execute and capture output
    RESPONSE=$(eval $CMD)
    STATUS_CODE=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$STATUS_CODE" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} (Status: $STATUS_CODE)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (Expected: $expected_status, Got: $STATUS_CODE)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        echo "$BODY"
        return 1
    fi
}

# Check if server is running
echo "🔍 Checking if server is running..."
if ! curl -s -f "$BASE_URL" > /dev/null 2>&1; then
    echo -e "${RED}❌ Server is not running at $BASE_URL${NC}"
    echo "   Start server with: npm start"
    exit 1
fi
echo -e "${GREEN}✅ Server is running${NC}"
echo ""

# Check if jq is installed (for pretty JSON output)
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠️  jq not installed (JSON output will be raw)${NC}"
    echo "   Install: brew install jq"
    echo ""
fi

# Get admin password from .env
if [ -f ".env" ]; then
    export $(grep BETA_ADMIN_PASSWORD .env | xargs)
else
    echo -e "${RED}❌ .env file not found${NC}"
    exit 1
fi

if [ -z "$BETA_ADMIN_PASSWORD" ]; then
    echo -e "${RED}❌ BETA_ADMIN_PASSWORD not set in .env${NC}"
    exit 1
fi

echo "📋 Test Suite: Beta System Functionality"
echo ""

# ============================================================================
# TEST 1: Admin Authentication
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 1: Admin Authentication"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_endpoint \
    "Admin login with correct password" \
    "POST" \
    "/api/beta/admin/auth" \
    "{\"password\":\"$BETA_ADMIN_PASSWORD\"}" \
    "" \
    200

# Extract token from response
ADMIN_TOKEN=$(curl -s -X POST "$BASE_URL/api/beta/admin/auth" \
    -H "Content-Type: application/json" \
    -d "{\"password\":\"$BETA_ADMIN_PASSWORD\"}" | jq -r '.token')

if [ "$ADMIN_TOKEN" = "null" ] || [ -z "$ADMIN_TOKEN" ]; then
    echo -e "${RED}❌ Failed to obtain admin token${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Obtained admin token: ${ADMIN_TOKEN:0:20}...${NC}"
echo ""

test_endpoint \
    "Admin login with wrong password" \
    "POST" \
    "/api/beta/admin/auth" \
    "{\"password\":\"wrong-password\"}" \
    "" \
    401

echo ""

# ============================================================================
# TEST 2: Password Generation
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 2: Beta Password Generation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_endpoint \
    "Generate password without auth token" \
    "POST" \
    "/api/beta/admin/generate" \
    "{\"label\":\"Test User\"}" \
    "" \
    401

test_endpoint \
    "Generate password with auth token" \
    "POST" \
    "/api/beta/admin/generate" \
    "{\"label\":\"Automated Test User $(date +%s)\"}" \
    "-H 'Authorization: Bearer $ADMIN_TOKEN'" \
    200

# Extract generated password
BETA_PASSWORD=$(curl -s -X POST "$BASE_URL/api/beta/admin/generate" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d "{\"label\":\"Test User Main\"}" | jq -r '.password')

if [ "$BETA_PASSWORD" = "null" ] || [ -z "$BETA_PASSWORD" ]; then
    echo -e "${RED}❌ Failed to generate beta password${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Generated beta password: $BETA_PASSWORD${NC}"
echo ""

# ============================================================================
# TEST 3: Beta Password Verification
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 3: Beta Password Verification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_endpoint \
    "Verify with wrong password" \
    "POST" \
    "/api/beta/verify" \
    "{\"password\":\"wrong-password\"}" \
    "" \
    401

test_endpoint \
    "Verify with correct password" \
    "POST" \
    "/api/beta/verify" \
    "{\"password\":\"$BETA_PASSWORD\"}" \
    "" \
    200

# Extract session token
SESSION_TOKEN=$(curl -s -X POST "$BASE_URL/api/beta/verify" \
    -H "Content-Type: application/json" \
    -d "{\"password\":\"$BETA_PASSWORD\"}" | jq -r '.session_token')

if [ "$SESSION_TOKEN" = "null" ] || [ -z "$SESSION_TOKEN" ]; then
    echo -e "${RED}❌ Failed to obtain session token${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Obtained session token: ${SESSION_TOKEN:0:20}...${NC}"
echo ""

# ============================================================================
# TEST 4: Session Verification
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 4: Session Verification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_endpoint \
    "Verify with wrong session token" \
    "POST" \
    "/api/beta/verify-session" \
    "{\"session_token\":\"invalid-token\"}" \
    "" \
    401

test_endpoint \
    "Verify with correct session token" \
    "POST" \
    "/api/beta/verify-session" \
    "{\"session_token\":\"$SESSION_TOKEN\"}" \
    "" \
    200

echo ""

# ============================================================================
# TEST 5: List Passwords
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 5: List Beta Passwords"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_endpoint \
    "List passwords without auth token" \
    "GET" \
    "/api/beta/admin/list" \
    "" \
    "" \
    401

test_endpoint \
    "List passwords with auth token" \
    "GET" \
    "/api/beta/admin/list" \
    "" \
    "-H 'Authorization: Bearer $ADMIN_TOKEN'" \
    200

echo ""

# ============================================================================
# TEST 6: Revoke Password
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 6: Revoke Beta Password"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Generate a password to revoke
REVOKE_PASSWORD=$(curl -s -X POST "$BASE_URL/api/beta/admin/generate" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d "{\"label\":\"To Be Revoked\"}" | jq -r '.password')

echo "Generated password to revoke: $REVOKE_PASSWORD"

test_endpoint \
    "Revoke password without auth token" \
    "POST" \
    "/api/beta/admin/revoke" \
    "{\"password\":\"$REVOKE_PASSWORD\"}" \
    "" \
    401

test_endpoint \
    "Revoke password with auth token" \
    "POST" \
    "/api/beta/admin/revoke" \
    "{\"password\":\"$REVOKE_PASSWORD\"}" \
    "-H 'Authorization: Bearer $ADMIN_TOKEN'" \
    200

test_endpoint \
    "Try to use revoked password" \
    "POST" \
    "/api/beta/verify" \
    "{\"password\":\"$REVOKE_PASSWORD\"}" \
    "" \
    401

echo ""

# ============================================================================
# TEST 7: Case Insensitivity
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 7: Password Case Insensitivity"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Try uppercase version of beta password
UPPER_PASSWORD=$(echo "$BETA_PASSWORD" | tr '[:lower:]' '[:upper:]')

test_endpoint \
    "Verify with uppercase password" \
    "POST" \
    "/api/beta/verify" \
    "{\"password\":\"$UPPER_PASSWORD\"}" \
    "" \
    200

# Try mixed case
MIXED_PASSWORD=$(echo "$BETA_PASSWORD" | sed 's/\(.\)\(.\)/\U\1\L\2/g')

test_endpoint \
    "Verify with mixed case password" \
    "POST" \
    "/api/beta/verify" \
    "{\"password\":\"$MIXED_PASSWORD\"}" \
    "" \
    200

echo ""

# ============================================================================
# TEST 8: Edge Cases
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 8: Edge Cases & Error Handling"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_endpoint \
    "Verify with empty password" \
    "POST" \
    "/api/beta/verify" \
    "{\"password\":\"\"}" \
    "" \
    400

test_endpoint \
    "Verify without password field" \
    "POST" \
    "/api/beta/verify" \
    "{}" \
    "" \
    400

test_endpoint \
    "Generate password without label" \
    "POST" \
    "/api/beta/admin/generate" \
    "{}" \
    "-H 'Authorization: Bearer $ADMIN_TOKEN'" \
    400

test_endpoint \
    "Verify session without token" \
    "POST" \
    "/api/beta/verify-session" \
    "{}" \
    "" \
    400

echo ""

# ============================================================================
# SUMMARY
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))

echo "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"

if [ $TESTS_FAILED -gt 0 ]; then
    echo -e "${RED}Failed: $TESTS_FAILED${NC}"
    echo ""
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
else
    echo -e "${GREEN}Failed: 0${NC}"
    echo ""
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo ""
    echo "🎉 Beta system is working correctly!"
fi

echo ""
echo "📝 Test Artifacts:"
echo "   Admin Token: ${ADMIN_TOKEN:0:30}..."
echo "   Beta Password: $BETA_PASSWORD"
echo "   Session Token: ${SESSION_TOKEN:0:30}..."
echo ""
echo "🌐 You can now:"
echo "   1. Visit $BASE_URL/beta-admin.html"
echo "   2. Login with BETA_ADMIN_PASSWORD"
echo "   3. Manage beta passwords"
echo "   4. Visit $BASE_URL/beta.html"
echo "   5. Use beta password: $BETA_PASSWORD"
echo ""
