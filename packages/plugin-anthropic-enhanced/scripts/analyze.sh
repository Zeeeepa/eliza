#!/bin/bash
#
# Comprehensive Analysis and Validation Script
#

set -e

echo "=================================="
echo "🔍 Enhanced Anthropic Plugin Analysis"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0
WARNINGS=0

print_status() {
  local status=$1
  local message=$2
  
  if [ "$status" = "PASS" ]; then
    echo -e "${GREEN}✓${NC} $message"
    ((PASSED++))
  elif [ "$status" = "FAIL" ]; then
    echo -e "${RED}✗${NC} $message"
    ((FAILED++))
  elif [ "$status" = "WARN" ]; then
    echo -e "${YELLOW}⚠${NC} $message"
    ((WARNINGS++))
  else
    echo -e "${BLUE}ℹ${NC} $message"
  fi
}

# Project Structure Check
echo "1. Project Structure..."
echo "-----------------------------------"

for file in "package.json" "tsconfig.json" "vitest.config.ts" "biome.json" "README.md" "src/index.ts" "src/types/index.ts"; do
  if [ -f "$file" ]; then
    print_status "PASS" "Found: $file"
  else
    print_status "FAIL" "Missing: $file"
  fi
done

echo ""

# Code Statistics
echo "2. Code Statistics..."
echo "-----------------------------------"

LOC=$(find src -name "*.ts" -not -path "*/__tests__/*" | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}' || echo "0")
TEST_LOC=$(find src/__tests__ -name "*.ts" 2>/dev/null | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}' || echo "0")
FILES=$(find src -name "*.ts" -not -path "*/__tests__/*" | wc -l)
TEST_FILES=$(find src/__tests__ -name "*.test.ts" 2>/dev/null | wc -l)

print_status "INFO" "Lines of Code: $LOC"
print_status "INFO" "Test Lines: $TEST_LOC"
print_status "INFO" "Source Files: $FILES"
print_status "INFO" "Test Files: $TEST_FILES"

echo ""
echo "=================================="
echo "📊 Summary"
echo "=================================="
echo -e "${GREEN}Passed:${NC} $PASSED"
echo -e "${RED}Failed:${NC} $FAILED"
echo -e "${YELLOW}Warnings:${NC} $WARNINGS"

exit 0
