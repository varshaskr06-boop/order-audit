# ============================================================================
# Sri Meenakshi Agro ERP - Database Restore Script (PowerShell)
# ============================================================================
param (
    [string]$BackupFile = ""
)

Write-Host "Triggering ERP Database Restore..." -ForegroundColor Cyan
if ($BackupFile -ne "") {
    node "$PSScriptRoot/restore.js" "$BackupFile"
} else {
    node "$PSScriptRoot/restore.js"
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "Restore completed successfully!" -ForegroundColor Green
} else {
    Write-Host "Restore encountered an error." -ForegroundColor Red
}
