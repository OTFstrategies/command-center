# Security OS - Tool Installation Script
# Run: powershell -ExecutionPolicy Bypass -File install-tools.ps1

Write-Host "=== Security OS - Tool Installation ===" -ForegroundColor Cyan
Write-Host ""

$tools = @(
    @{ Name = "gitleaks"; Check = "gitleaks --version"; Install = "scoop install gitleaks" },
    @{ Name = "ggshield"; Check = "ggshield --version"; Install = "pip install ggshield" },
    @{ Name = "snyk"; Check = "snyk --version"; Install = "npm install -g snyk" },
    @{ Name = "semgrep"; Check = "semgrep --version"; Install = "pip install semgrep" },
    @{ Name = "trivy"; Check = "trivy --version"; Install = "scoop install trivy" },
    @{ Name = "gh"; Check = "gh --version"; Install = "winget install GitHub.cli" }
)

$results = @()

foreach ($tool in $tools) {
    Write-Host "Checking $($tool.Name)..." -NoNewline
    try {
        $null = Invoke-Expression $tool.Check 2>&1
        Write-Host " [OK - Already installed]" -ForegroundColor Green
        $results += @{ Name = $tool.Name; Status = "OK" }
    } catch {
        Write-Host " [INSTALLING]" -ForegroundColor Yellow
        try {
            Invoke-Expression $tool.Install
            Write-Host "  -> Installed successfully" -ForegroundColor Green
            $results += @{ Name = $tool.Name; Status = "Installed" }
        } catch {
            Write-Host "  -> FAILED: $($_.Exception.Message)" -ForegroundColor Red
            $results += @{ Name = $tool.Name; Status = "FAILED" }
        }
    }
}

Write-Host ""
Write-Host "=== Installation Summary ===" -ForegroundColor Cyan
Write-Host ""
Write-Host ("{0,-15} {1,-15}" -f "Tool", "Status")
Write-Host ("{0,-15} {1,-15}" -f "----", "------")
foreach ($r in $results) {
    $color = if ($r.Status -eq "FAILED") { "Red" } elseif ($r.Status -eq "Installed") { "Yellow" } else { "Green" }
    Write-Host ("{0,-15} {1,-15}" -f $r.Name, $r.Status) -ForegroundColor $color
}

Write-Host ""
Write-Host "NOTE: ggshield requires GITGUARDIAN_API_KEY environment variable" -ForegroundColor Yellow
Write-Host "NOTE: snyk requires 'snyk auth' to authenticate" -ForegroundColor Yellow
