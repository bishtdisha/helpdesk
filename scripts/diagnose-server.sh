#!/bin/bash

echo "🔍 Server Diagnostics"
echo "===================="
echo ""

# Check Node version
echo "📦 Node Version:"
node --version
echo ""

# Check npm version
echo "📦 NPM Version:"
npm --version
echo ""

# Check if .next exists
echo "🏗️  Build Status:"
if [ -d ".next" ]; then
    echo "✅ .next folder exists"
    if [ -f ".next/BUILD_ID" ]; then
        echo "✅ BUILD_ID: $(cat .next/BUILD_ID)"
    else
        echo "❌ BUILD_ID missing"
    fi
else
    echo "❌ .next folder NOT found - BUILD REQUIRED!"
fi
echo ""

# Check PM2 status
echo "🚀 PM2 Status:"
pm2 list
echo ""

# Check if port is in use
echo "🔌 Port 6789 Status:"
if lsof -Pi :6789 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ Port 6789 is in use"
    lsof -i :6789
else
    echo "❌ Port 6789 is NOT in use"
fi
echo ""

# Check PostgreSQL
echo "🗄️  PostgreSQL Status:"
if command -v systemctl &> /dev/null; then
    systemctl status postgresql | grep Active
else
    echo "systemctl not available"
fi
echo ""

# Check database connection
echo "🔗 Database Connection:"
if command -v psql &> /dev/null; then
    psql -U postgres -d rbac_system -c "SELECT COUNT(*) as ticket_count FROM tickets;" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ Database connection successful"
    else
        echo "❌ Database connection failed"
    fi
else
    echo "psql not available"
fi
echo ""

# Check .env file
echo "⚙️  Environment Variables:"
if [ -f ".env" ]; then
    echo "✅ .env file exists"
    echo "NODE_ENV: $(grep NODE_ENV .env | cut -d '=' -f2)"
    echo "USE_SECURE_COOKIES: $(grep USE_SECURE_COOKIES .env | cut -d '=' -f2)"
    echo "NEXT_PUBLIC_APP_URL: $(grep NEXT_PUBLIC_APP_URL .env | cut -d '=' -f2)"
else
    echo "❌ .env file NOT found"
fi
echo ""

# Check disk space
echo "💾 Disk Space:"
df -h . | tail -1
echo ""

# Check memory
echo "🧠 Memory Usage:"
free -h | grep Mem
echo ""

echo "===================="
echo "Diagnostics Complete"
