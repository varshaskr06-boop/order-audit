# ============================================================================
# Sri Meenakshi Agro ERP - Database Backup Script (PowerShell)
# ============================================================================
Write-Host "Triggering ERP Database Backup..." -ForegroundColor Cyan
node "$PSScriptRoot/backup.js"
if ($LASTEXITCODE -eq 0) {
    Write-Host "Backup completed successfully!" -ForegroundColor Green
} else {
    Write-Host "Backup encountered an error." -ForegroundColor Red
}
