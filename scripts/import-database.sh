#!/bin/bash

# Database Import Script for Linux Production Server
# This script imports the database backup on your production server

echo ""
echo "🔄 Database Import Script"
echo "============================================================"

# Configuration
DB_NAME="rbac_system"
DB_USER="helpdesk_user"
BACKUP_FILE="/tmp/database_backup.dump"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ ERROR: Please run with sudo${NC}"
    echo "Usage: sudo bash scripts/import-database.sh"
    exit 1
fi

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ ERROR: Backup file not found: $BACKUP_FILE${NC}"
    echo ""
    echo "Please transfer your backup file first:"
    echo "  scp database_backup.dump username@server:/tmp/"
    exit 1
fi

echo -e "${GREEN}✅ Found backup file: $BACKUP_FILE${NC}"

# Get file size
FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo -e "${CYAN}File size: $FILE_SIZE${NC}"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ ERROR: PostgreSQL is not installed${NC}"
    echo ""
    echo "Install PostgreSQL first:"
    echo "  Ubuntu/Debian: sudo apt install postgresql postgresql-contrib"
    echo "  CentOS/RHEL: sudo yum install postgresql-server postgresql-contrib"
    exit 1
fi

echo -e "${GREEN}✅ PostgreSQL is installed${NC}"

# Check if PostgreSQL is running
if ! systemctl is-active --quiet postgresql; then
    echo -e "${YELLOW}⚠️  PostgreSQL is not running. Starting...${NC}"
    systemctl start postgresql
    sleep 2
fi

echo -e "${GREEN}✅ PostgreSQL is running${NC}"

# Prompt for database password
echo ""
echo -e "${CYAN}Enter password for database user '$DB_USER':${NC}"
read -s DB_PASSWORD
echo ""

# Check if database exists
echo -e "${YELLOW}📋 Checking if database exists...${NC}"
DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'")

if [ "$DB_EXISTS" = "1" ]; then
    echo -e "${YELLOW}⚠️  Database '$DB_NAME' already exists${NC}"
    echo ""
    echo "Options:"
    echo "  1) Drop and recreate (WARNING: This will delete existing data!)"
    echo "  2) Cancel import"
    read -p "Choose option (1 or 2): " OPTION
    
    if [ "$OPTION" = "1" ]; then
        echo -e "${YELLOW}🗑️  Dropping existing database...${NC}"
        sudo -u postgres psql -c "DROP DATABASE $DB_NAME;"
        echo -e "${GREEN}✅ Database dropped${NC}"
    else
        echo -e "${YELLOW}❌ Import cancelled${NC}"
        exit 0
    fi
fi

# Create database
echo -e "${YELLOW}📦 Creating database '$DB_NAME'...${NC}"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database created${NC}"
else
    echo -e "${RED}❌ ERROR: Failed to create database${NC}"
    exit 1
fi

# Create user if doesn't exist
echo -e "${YELLOW}👤 Creating/updating user '$DB_USER'...${NC}"
sudo -u postgres psql -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT FROM pg_user WHERE usename = '$DB_USER') THEN CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD'; END IF; END \$\$;"

# Grant privileges
echo -e "${YELLOW}🔐 Granting privileges...${NC}"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

# Import database
echo ""
echo -e "${YELLOW}📥 Importing database... (this may take a few minutes)${NC}"
echo -e "${CYAN}Progress will be shown below:${NC}"
echo ""

# Check if it's a custom format or SQL format
if file "$BACKUP_FILE" | grep -q "PostgreSQL custom database dump"; then
    # Custom format - use pg_restore
    sudo -u postgres pg_restore -d $DB_NAME -v "$BACKUP_FILE"
else
    # Plain SQL format - use psql
    sudo -u postgres psql -d $DB_NAME -f "$BACKUP_FILE"
fi

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Database imported successfully!${NC}"
else
    echo ""
    echo -e "${RED}❌ ERROR: Database import failed${NC}"
    echo "Check the error messages above for details"
    exit 1
fi

# Grant permissions on all tables
echo ""
echo -e "${YELLOW}🔐 Setting up permissions...${NC}"
sudo -u postgres psql -d $DB_NAME <<EOF
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;
EOF

echo -e "${GREEN}✅ Permissions set${NC}"

# Verify import
echo ""
echo -e "${YELLOW}🔍 Verifying import...${NC}"
echo ""

# Get row counts
sudo -u postgres psql -d $DB_NAME -c "SELECT 'Users: ' || COUNT(*) as info FROM users UNION ALL SELECT 'Tickets: ' || COUNT(*) FROM tickets UNION ALL SELECT 'Teams: ' || COUNT(*) FROM teams UNION ALL SELECT 'Roles: ' || COUNT(*) FROM roles;"

# Test connection with application user
echo ""
echo -e "${YELLOW}🧪 Testing connection with application user...${NC}"
PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -d $DB_NAME -h localhost -c "SELECT COUNT(*) as user_count FROM users;" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Application user can connect successfully${NC}"
else
    echo -e "${RED}❌ WARNING: Application user cannot connect${NC}"
    echo "You may need to update pg_hba.conf"
fi

# Summary
echo ""
echo "============================================================"
echo -e "${CYAN}📊 Import Summary:${NC}"
echo -e "Database: ${GREEN}$DB_NAME${NC}"
echo -e "User: ${GREEN}$DB_USER${NC}"
echo -e "Status: ${GREEN}✅ Import completed${NC}"
echo ""
echo -e "${CYAN}📋 Next Steps:${NC}"
echo "1. Update your .env file with:"
echo -e "   ${YELLOW}DATABASE_URL=\"postgresql://$DB_USER:YOUR_PASSWORD@localhost:5432/$DB_NAME\"${NC}"
echo ""
echo "2. Run Prisma migrations:"
echo -e "   ${YELLOW}cd /var/www/helpdesk${NC}"
echo -e "   ${YELLOW}npx prisma generate${NC}"
echo -e "   ${YELLOW}npx prisma migrate deploy${NC}"
echo ""
echo "3. Start your application:"
echo -e "   ${YELLOW}pm2 start npm --name helpdesk -- start${NC}"
echo ""
echo "4. Clean up backup file:"
echo -e "   ${YELLOW}rm $BACKUP_FILE${NC}"
echo ""
echo "============================================================"
echo ""
