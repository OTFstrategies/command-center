# Setup Windows Task Scheduler for daily security scan
# Run: powershell -ExecutionPolicy Bypass -File setup-scheduler.ps1

$taskName = "SecurityOS-DailyScan"
$scriptPath = Join-Path $PSScriptRoot "scheduled-scan.bat"

$action = New-ScheduledTaskAction -Execute $scriptPath
$trigger = New-ScheduledTaskTrigger -Daily -At "07:00"
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable

try {
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description "Security OS dagelijkse scan" -Force
    Write-Host "Task '$taskName' aangemaakt: dagelijks om 07:00" -ForegroundColor Green
} catch {
    Write-Host "Fout bij aanmaken task: $_" -ForegroundColor Red
}
