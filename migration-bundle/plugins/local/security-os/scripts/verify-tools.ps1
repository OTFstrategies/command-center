# Security OS - Tool Verification Script
# Run: powershell -ExecutionPolicy Bypass -File verify-tools.ps1

Write-Host "=== Security OS - Tool Verification ===" -ForegroundColor Cyan
Write-Host ""

$tools = @("gitleaks", "ggshield", "snyk", "semgrep", "trivy", "gh")
$allOk = $true

foreach ($tool in $tools) {
    Write-Host "Checking $tool..." -NoNewline
    $found = Get-Command $tool -ErrorAction SilentlyContinue
    if ($found) {
        $version = & $tool --version 2>&1 | Select-Object -First 1
        Write-Host " [OK] $version" -ForegroundColor Green
    } else {
        Write-Host " [NOT FOUND]" -ForegroundColor Red
        $allOk = $false
    }
}

Write-Host ""
if ($allOk) {
    Write-Host "All tools verified successfully!" -ForegroundColor Green
} else {
    Write-Host "Some tools are missing. Run install-tools.ps1 first." -ForegroundColor Yellow
}
