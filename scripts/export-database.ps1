# Database Export Script for Windows
# This script exports your local PostgreSQL database

Write-Host "`n🔄 Database Export Script" -ForegroundColor Cyan
Write-Host "=" * 60

# Configuration
$DB_NAME = "rbac_system"
$DB_USER = "postgres"
$DB_PASSWORD = "cimcon123"
$BACKUP_DIR = "D:\odoo_help\backups"
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_FILE = "$BACKUP_DIR\${DB_NAME}_${TIMESTAMP}.dump"
$BACKUP_SQL = "$BACKUP_DIR\${DB_NAME}_${TIMESTAMP}.sql"

# Find PostgreSQL installation
$PG_PATHS = @(
    "C:\Program Files\PostgreSQL\16\bin",
    "C:\Program Files\PostgreSQL\15\bin",
    "C:\Program Files\PostgreSQL\14\bin",
    "C:\Program Files (x86)\PostgreSQL\16\bin",
    "C:\Program Files (x86)\PostgreSQL\15\bin"
)

$PG_BIN = $null
foreach ($path in $PG_PATHS) {
    if (Test-Path "$path\pg_dump.exe") {
        $PG_BIN = $path
        break
    }
}

if (-not $PG_BIN) {
    Write-Host "❌ ERROR: PostgreSQL not found!" -ForegroundColor Red
    Write-Host "Please install PostgreSQL or update the PG_PATHS in this script." -ForegroundColor Yellow
    exit 1
}

Write-Host "`n✅ Found PostgreSQL at: $PG_BIN" -ForegroundColor Green

# Create backup directory
if (-not (Test-Path $BACKUP_DIR)) {
    Write-Host "`n📁 Creating backup directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
}

# Set password environment variable
$env:PGPASSWORD = $DB_PASSWORD

Write-Host "`n📤 Exporting database..." -ForegroundColor Yellow
Write-Host "Database: $DB_NAME" -ForegroundColor Cyan
Write-Host "Format: Custom (compressed)" -ForegroundColor Cyan
Write-Host "Output: $BACKUP_FILE" -ForegroundColor Cyan

# Export database (custom format - compressed)
try {
    & "$PG_BIN\pg_dump.exe" -U $DB_USER -d $DB_NAME -F c -b -v -f $BACKUP_FILE 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Custom format export successful!" -ForegroundColor Green
        
        # Get file size
        $fileSize = (Get-Item $BACKUP_FILE).Length
        $fileSizeMB = [math]::Round($fileSize / 1MB, 2)
        Write-Host "File size: $fileSizeMB MB" -ForegroundColor Cyan
    } else {
        throw "pg_dump failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Host "`n❌ ERROR: Custom format export failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# Also export as plain SQL (easier to inspect)
Write-Host "`n📤 Exporting as plain SQL..." -ForegroundColor Yellow
Write-Host "Output: $BACKUP_SQL" -ForegroundColor Cyan

try {
    & "$PG_BIN\pg_dump.exe" -U $DB_USER -d $DB_NAME -f $BACKUP_SQL 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Plain SQL export successful!" -ForegroundColor Green
        
        # Get file size
        $fileSize = (Get-Item $BACKUP_SQL).Length
        $fileSizeMB = [math]::Round($fileSize / 1MB, 2)
        Write-Host "File size: $fileSizeMB MB" -ForegroundColor Cyan
    } else {
        throw "pg_dump failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Host "`n❌ ERROR: Plain SQL export failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# Clear password
$env:PGPASSWORD = $null

# Summary
Write-Host "`n" + "=" * 60
Write-Host "📊 Export Summary:" -ForegroundColor Cyan
Write-Host "Custom format: $BACKUP_FILE"
Write-Host "Plain SQL: $BACKUP_SQL"

# Get database statistics
Write-Host "`n📈 Database Statistics:" -ForegroundColor Cyan
$env:PGPASSWORD = $DB_PASSWORD

try {
    $stats = & "$PG_BIN\psql.exe" -U $DB_USER -d $DB_NAME -t -c "SELECT 'Users: ' || COUNT(*) FROM users UNION ALL SELECT 'Tickets: ' || COUNT(*) FROM tickets UNION ALL SELECT 'Teams: ' || COUNT(*) FROM teams UNION ALL SELECT 'Roles: ' || COUNT(*) FROM roles;" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        $stats | ForEach-Object { Write-Host $_.Trim() -ForegroundColor Green }
    }
} catch {
    Write-Host "Could not retrieve statistics" -ForegroundColor Yellow
}

$env:PGPASSWORD = $null

Write-Host "`n✅ Export completed successfully!" -ForegroundColor Green
Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Transfer the .dump file to your production server:"
Write-Host "   scp `"$BACKUP_FILE`" username@server-ip:/tmp/" -ForegroundColor Yellow
Write-Host "`n2. Follow the DATABASE_MIGRATION_GUIDE.md for import instructions"
Write-Host "`n" + "=" * 60 + "`n"
