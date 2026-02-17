try {
    $r = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -UseBasicParsing -TimeoutSec 5
    Write-Output "Server is running - Status: $($r.StatusCode)"
} catch {
    Write-Output "Not ready - $($_.Exception.Message)"
}
