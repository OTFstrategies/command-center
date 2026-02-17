$apiKey = "09409c77adb1c9be12db261807088de923b76516fec08f9626e77965358e981f"
$baseUrl = "http://localhost:3000/api/projects/command-center-v2/memories"
$headers = @{ "x-api-key" = $apiKey }

$results = @()

function Test-Api {
    param(
        [string]$TestName,
        [string]$Method,
        [string]$Url,
        [string]$Body,
        [string]$Expected
    )

    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "TEST: $TestName" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "$Method $Url"
    if ($Body) { Write-Host "Body: $Body" }
    Write-Host "Expected: $Expected"
    Write-Host "---"

    try {
        $params = @{
            Uri = $Url
            Method = $Method
            UseBasicParsing = $true
            Headers = $headers
            TimeoutSec = 10
        }

        if ($Body) {
            $params["ContentType"] = "application/json"
            $params["Body"] = $Body
        }

        $r = Invoke-WebRequest @params
        $status = $r.StatusCode
        $content = $r.Content
        Write-Host "Status: $status" -ForegroundColor Green
        Write-Host "Body: $content"
        return @{ Status = $status; Body = $content; Error = $false }
    }
    catch {
        $status = $null
        $content = ""
        if ($_.Exception.Response) {
            $status = [int]$_.Exception.Response.StatusCode
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $content = $reader.ReadToEnd()
            $reader.Close()
            $stream.Close()
        } else {
            $content = $_.Exception.Message
        }
        Write-Host "Status: $status" -ForegroundColor Yellow
        Write-Host "Body: $content"
        return @{ Status = $status; Body = $content; Error = $true }
    }
}

# ============================
# Test B.1: Create a test memory
# ============================
$r1 = Test-Api -TestName "B.1: Create test memory (POST)" -Method "POST" -Url $baseUrl `
    -Body '{"name":"test-quality-check","content":"# Test Memory\nDit is een test memory aangemaakt door het QA-plan."}' `
    -Expected "200 with success:true"

$b1pass = ($r1.Status -eq 200) -and ($r1.Body -match '"success"\s*:\s*true')
$results += @{ Test = "B.1 Create"; Expected = "200, success:true"; Actual = "Status $($r1.Status)"; Pass = $b1pass }

# ============================
# Test B.2: List all memories (GET)
# ============================
$r2 = Test-Api -TestName "B.2: List all memories (GET)" -Method "GET" -Url $baseUrl `
    -Expected "Array containing test-quality-check"

$b2pass = ($r2.Status -eq 200) -and ($r2.Body -match 'test-quality-check')
$results += @{ Test = "B.2 List"; Expected = "200, contains test-quality-check"; Actual = "Status $($r2.Status)"; Pass = $b2pass }

# ============================
# Test B.3: Read specific memory (GET single)
# ============================
$r3 = Test-Api -TestName "B.3: Read specific memory (GET)" -Method "GET" -Url "$baseUrl/test-quality-check" `
    -Expected "memory with name test-quality-check"

$b3pass = ($r3.Status -eq 200) -and ($r3.Body -match 'test-quality-check')
$results += @{ Test = "B.3 Read"; Expected = "200, memory object"; Actual = "Status $($r3.Status)"; Pass = $b3pass }

# ============================
# Test B.4: Update existing memory (POST upsert)
# ============================
$r4 = Test-Api -TestName "B.4: Update memory (POST upsert)" -Method "POST" -Url $baseUrl `
    -Body '{"name":"test-quality-check","content":"# Updated Test Memory\nContent is bijgewerkt."}' `
    -Expected "200 with success:true"

$b4pass = ($r4.Status -eq 200) -and ($r4.Body -match '"success"\s*:\s*true')
$results += @{ Test = "B.4 Update"; Expected = "200, success:true"; Actual = "Status $($r4.Status)"; Pass = $b4pass }

# ============================
# Test B.5: Verify update (GET single)
# ============================
$r5 = Test-Api -TestName "B.5: Verify update (GET)" -Method "GET" -Url "$baseUrl/test-quality-check" `
    -Expected "Content contains 'Updated Test Memory'"

$b5pass = ($r5.Status -eq 200) -and ($r5.Body -match 'Updated Test Memory')
$results += @{ Test = "B.5 Verify Update"; Expected = "200, Updated Test Memory"; Actual = "Status $($r5.Status)"; Pass = $b5pass }

# ============================
# Test B.6: Delete memory (DELETE)
# ============================
$r6 = Test-Api -TestName "B.6: Delete memory (DELETE)" -Method "DELETE" -Url "$baseUrl/test-quality-check" `
    -Expected "200 with success:true"

$b6pass = ($r6.Status -eq 200) -and ($r6.Body -match '"success"\s*:\s*true')
$results += @{ Test = "B.6 Delete"; Expected = "200, success:true"; Actual = "Status $($r6.Status)"; Pass = $b6pass }

# ============================
# Test B.7: Verify deletion (GET single - should 404)
# ============================
$r7 = Test-Api -TestName "B.7: Verify deletion (GET)" -Method "GET" -Url "$baseUrl/test-quality-check" `
    -Expected "404 with Memory not found"

$b7pass = ($r7.Status -eq 404) -and ($r7.Body -match 'not found')
$results += @{ Test = "B.7 Verify Delete"; Expected = "404, Memory not found"; Actual = "Status $($r7.Status)"; Pass = $b7pass }

# ============================
# Test B.8: Non-existent memory (GET)
# ============================
$r8 = Test-Api -TestName "B.8: Non-existent memory (GET)" -Method "GET" -Url "$baseUrl/does-not-exist" `
    -Expected "404 with Memory not found"

$b8pass = ($r8.Status -eq 404) -and ($r8.Body -match 'not found')
$results += @{ Test = "B.8 Non-existent"; Expected = "404, Memory not found"; Actual = "Status $($r8.Status)"; Pass = $b8pass }

# ============================
# Summary Table
# ============================
Write-Host "`n`n========================================" -ForegroundColor Magenta
Write-Host "         SUMMARY TABLE" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta

Write-Host ("{0,-25} {1,-35} {2,-20} {3}" -f "Test", "Expected", "Actual", "Result")
Write-Host ("{0,-25} {1,-35} {2,-20} {3}" -f "----", "--------", "------", "------")

$passCount = 0
$failCount = 0

foreach ($r in $results) {
    $passText = if ($r.Pass) { "PASS" } else { "FAIL" }
    $color = if ($r.Pass) { "Green" } else { "Red" }
    if ($r.Pass) { $passCount++ } else { $failCount++ }
    Write-Host ("{0,-25} {1,-35} {2,-20} {3}" -f $r.Test, $r.Expected, $r.Actual, $passText) -ForegroundColor $color
}

Write-Host "`nTotal: $passCount PASS, $failCount FAIL out of $($results.Count) tests" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Yellow" })
