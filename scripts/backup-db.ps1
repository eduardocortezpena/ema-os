# Backup script for emaos.db
# Creates timestamped backup in backups/ folder and removes backups older than 30 days

$ErrorActionPreference = 'Stop'

# Get project root (script location)
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ProjectRoot  # Go up from scripts/ to project root

$SourceDb = Join-Path $ProjectRoot 'emaos.db'
$BackupDir = Join-Path $ProjectRoot 'backups'

# Create backups directory if it doesn't exist
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

# Generate timestamp and backup filename
$Timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$BackupFile = Join-Path $BackupDir "emaos_$Timestamp.db"

# Copy the database
Copy-Item -Path $SourceDb -Destination $BackupFile -Force
Write-Host "Backup created: $BackupFile"

# Remove backups older than 30 days
$CutoffDate = (Get-Date).AddDays(-30)
$OldBackups = Get-ChildItem -Path $BackupDir -Filter 'emaos_*.db' | Where-Object { $_.CreationTime -lt $CutoffDate }

foreach ($OldBackup in $OldBackups) {
    Remove-Item -Path $OldBackup.FullName -Force
    Write-Host "Removed old backup: $($OldBackup.Name)"
}

$RemovedCount = ($OldBackups | Measure-Object).Count
if ($RemovedCount -gt 0) {
    Write-Host "Removed $RemovedCount backup(s) older than 30 days"
} else {
    Write-Host "No backups older than 30 days found"