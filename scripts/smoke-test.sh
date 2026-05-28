#!/usr/bin/env bash
set -euo pipefail

# Yêu cầu API chạy ở http://127.0.0.1:3001.
# Script này dùng mock-valid-token và mock Muadi, chỉ work khi mock providers active
# (NODE_ENV=test hoặc GOOGLE/MUADI explicit DI/env swap).

API="${API:-http://127.0.0.1:3001/api/v1}"

echo "=== OpenFly smoke test ==="

if curl -s "$API/health" | grep -q '"status":"ok"'; then
  echo "✓ health"
else
  echo "✗ health"
  exit 1
fi

RES=$(curl -s -X POST "$API/auth/google" -H "Content-Type: application/json" -d '{"idToken":"mock-valid-token"}')
ACCESS=$(printf '%s' "$RES" | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p')
REFRESH=$(printf '%s' "$RES" | sed -n 's/.*"refreshToken":"\([^"]*\)".*/\1/p')
if [ -n "$ACCESS" ] && [ -n "$REFRESH" ]; then
  echo "✓ google sign-in"
else
  echo "✗ google sign-in"
  echo "$RES"
  exit 1
fi

if curl -s "$API/me" -H "Authorization: Bearer $ACCESS" | grep -q '"role":"CUSTOMER"'; then
  echo "✓ /me"
else
  echo "✗ /me"
  exit 1
fi

sleep 1
NEW_RES=$(curl -s -X POST "$API/auth/refresh" -H "Content-Type: application/json" -d "{\"refreshToken\":\"$REFRESH\"}")
NEW_ACCESS=$(printf '%s' "$NEW_RES" | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p')
if [ -n "$NEW_ACCESS" ] && [ "$NEW_ACCESS" != "$ACCESS" ]; then
  echo "✓ refresh rotation"
else
  echo "✗ refresh rotation"
  echo "$NEW_RES"
  exit 1
fi

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/auth/refresh" -H "Content-Type: application/json" -d "{\"refreshToken\":\"$REFRESH\"}")
if [ "$STATUS" = "401" ]; then
  echo "✓ rotated token rejected"
else
  echo "✗ rotated token rejected (got $STATUS)"
  exit 1
fi

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/auth/google" -H "Content-Type: application/json" -d '{"idToken":"invalid"}')
if [ "$STATUS" = "401" ]; then
  echo "✓ invalid google token"
else
  echo "✗ invalid google token (got $STATUS)"
  exit 1
fi

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/auth/otp/request" -H "Content-Type: application/json" -d '{"phone":"+84938111111"}')
if [ "$STATUS" = "404" ]; then
  echo "✓ phone OTP disabled"
else
  echo "✗ phone OTP disabled (got $STATUS)"
  exit 1
fi

SEARCH_RES=$(curl -s -X POST "$API/flights/search" -H "Content-Type: application/json" -d '{"origin":"SGN","destination":"HAN","date":"2026-06-15","paxAdt":1,"paxChd":0,"paxInf":0}')
if printf '%s' "$SEARCH_RES" | grep -q '"offers":' && printf '%s' "$SEARCH_RES" | grep -q '"cheapestPriceVnd":'; then
  echo "✓ flights search"
else
  echo "✗ flights search"
  echo "$SEARCH_RES"
  exit 1
fi

echo "=== All smoke tests passed ==="
