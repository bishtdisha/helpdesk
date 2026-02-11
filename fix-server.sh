#!/bin/bash

echo "🔧 Fixing Production Server Issues"
echo "===================================="
echo ""

# Step 1: Check current state
echo "📋 Step 1: Checking current state..."
echo ""

echo "Checking for Vercel Analytics in client-providers.tsx:"
if grep -q "@vercel/analytics" components/providers/client-providers.tsx; then
    echo "❌ FOUND - File still has Vercel Analytics import"
    echo "   This needs to be removed!"
else
    echo "✅ NOT FOUND - File is clean"
fi
echo ""

echo "Checking for Vercel Analytics in package.json:"
if grep -q "@vercel/analytics" package.json; then
    echo "❌ FOUND - package.json still has @vercel/analytics"
    echo "   This needs to be removed!"
else
    echo "✅ NOT FOUND - package.json is clean"
fi
echo ""

echo "Checking if @vercel/analytics is installed:"
if [ -d "node_modules/@vercel/analytics" ]; then
    echo "❌ FOUND - node_modules still has @vercel/analytics"
    echo "   Need to reinstall dependencies"
else
    echo "✅ NOT FOUND - node_modules is clean"
fi
echo ""

# Step 2: Check build
echo "📦 Step 2: Checking build status..."
if [ -d ".next" ]; then
    echo "✅ .next folder exists"
    if [ -f ".next/BUILD_ID" ]; then
        BUILD_ID=$(cat .next/BUILD_ID)
        BUILD_TIME=$(stat -c %y .next/BUILD_ID 2>/dev/null || stat -f "%Sm" .next/BUILD_ID 2>/dev/null)
        echo "   Build ID: $BUILD_ID"
        echo "   Build Time: $BUILD_TIME"
    else
        echo "❌ BUILD_ID missing"
    fi
else
    echo "❌ .next folder NOT FOUND - Need to build!"
fi
echo ""

# Step 3: Check PM2
echo "🚀 Step 3: Checking PM2 status..."
pm2 list | grep odoo-helpdesk
echo ""

# Step 4: Show what needs to be done
echo "===================================="
echo "📝 REQUIRED ACTIONS:"
echo "===================================="
echo ""

NEEDS_FIX=false

if grep -q "@vercel/analytics" components/providers/client-providers.tsx 2>/dev/null; then
    echo "1. ❌ Remove Vercel Analytics from client-providers.tsx"
    NEEDS_FIX=true
fi

if grep -q "@vercel/analytics" package.json 2>/dev/null; then
    echo "2. ❌ Remove @vercel/analytics from package.json"
    NEEDS_FIX=true
fi

if [ -d "node_modules/@vercel/analytics" ]; then
    echo "3. ❌ Clean and reinstall node_modules"
    NEEDS_FIX=true
fi

if [ ! -d ".next" ] || [ ! -f ".next/BUILD_ID" ]; then
    echo "4. ❌ Rebuild the application"
    NEEDS_FIX=true
fi

if [ "$NEEDS_FIX" = false ]; then
    echo "✅ All checks passed! Server should be working."
    echo ""
    echo "If tickets still not showing, check:"
    echo "1. Database has tickets: psql -U postgres -d rbac_system -c 'SELECT COUNT(*) FROM tickets;'"
    echo "2. API is working: curl http://localhost:6789/api/tickets"
    echo "3. PM2 logs: pm2 logs helpdesk --lines 50"
else
    echo ""
    echo "===================================="
    echo "🔧 AUTO-FIX AVAILABLE"
    echo "===================================="
    echo ""
    echo "Run these commands to fix:"
    echo ""
    echo "# Stop PM2"
    echo "pm2 stop helpdesk"
    echo ""
    echo "# Clean everything"
    echo "rm -rf .next node_modules package-lock.json"
    echo ""
    echo "# Reinstall (without @vercel/analytics)"
    echo "npm install"
    echo ""
    echo "# Rebuild"
    echo "npm run build"
    echo ""
    echo "# Restart PM2"
    echo "pm2 restart helpdesk"
    echo ""
    echo "# Check logs"
    echo "pm2 logs odoo-helpdesk --lines 50"
fi

echo ""
echo "===================================="
echo "Script completed"
echo "===================================="
