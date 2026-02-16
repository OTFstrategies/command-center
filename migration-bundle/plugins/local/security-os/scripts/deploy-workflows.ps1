# Deploy security workflow to all repos
# Run: powershell -ExecutionPolicy Bypass -File deploy-workflows.ps1

$owner = "OTFstrategies"
$workflowPath = Join-Path $PSScriptRoot "..\templates\github-actions-security.yml"
$content = Get-Content $workflowPath -Raw
$base64Content = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($content))

$repos = gh repo list $owner --limit 50 --json name --jq '.[].name' | ForEach-Object { $_.Trim() }

foreach ($repo in $repos) {
    if ([string]::IsNullOrWhiteSpace($repo)) { continue }
    Write-Host "Deploying to $repo..." -NoNewline
    try {
        gh api "repos/$owner/$repo/contents/.github/workflows/security.yml" -X PUT `
            -f "message=ci: add security scanning workflow" `
            -f "content=$base64Content" 2>&1 | Out-Null
        Write-Host " [OK]" -ForegroundColor Green
    } catch {
        Write-Host " [FAILED: $_]" -ForegroundColor Red
    }
}
