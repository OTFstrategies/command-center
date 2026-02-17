$apiKey = "09409c77adb1c9be12db261807088de923b76516fec08f9626e77965358e981f"
$baseUrl = "http://localhost:3000"
$headers = @{ "x-api-key" = $apiKey }

function Invoke-Test {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [string]$Body = $null
    )
    Write-Output ""
    Write-Output "=== $Name ==="
    Write-Output "  $Method $Url"
    if ($Body) { Write-Output "  Body: $Body" }

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
            $params["Body"] = [System.Text.Encoding]::UTF8.GetBytes($Body)
        }
        $r = Invoke-WebRequest @params
        Write-Output "  Status: $($r.StatusCode)"
        Write-Output "  Body: $($r.Content)"
    } catch {
        $statusCode = 0
        $body = ""
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            try {
                $stream = $_.Exception.Response.GetResponseStream()
                $reader = [System.IO.StreamReader]::new($stream)
                $body = $reader.ReadToEnd()
                $reader.Close()
            } catch {
                $body = "(could not read response body)"
            }
        } else {
            $body = $_.Exception.Message
        }
        Write-Output "  Status: $statusCode"
        Write-Output "  Body: $body"
    }
}

# ==========================================
# Angle C: Project Metadata Tests
# ==========================================

Write-Output "########################################"
Write-Output "# ANGLE C: PROJECT METADATA TESTS"
Write-Output "########################################"

# Test C.1: Read project metadata
Invoke-Test -Name "Test C.1: Read project metadata" `
    -Method "GET" `
    -Url "$baseUrl/api/projects/command-center-v2"

# Test C.2: Update single field (PATCH)
Invoke-Test -Name "Test C.2: Update single field (PATCH)" `
    -Method "PATCH" `
    -Url "$baseUrl/api/projects/command-center-v2" `
    -Body '{"tech_stack":["Next.js 14","Supabase","Tailwind CSS v4","Lucide React","@dnd-kit"]}'

# Test C.3: Update multiple fields (PATCH)
Invoke-Test -Name "Test C.3: Update multiple fields (PATCH)" `
    -Method "PATCH" `
    -Url "$baseUrl/api/projects/command-center-v2" `
    -Body '{"languages":["typescript"],"build_command":"npm run build","dev_command":"npm run dev","live_url":"https://command-center-app-nine.vercel.app"}'

# Test C.4: Rejected fields (PATCH with disallowed fields)
Invoke-Test -Name "Test C.4: Rejected fields (PATCH with disallowed fields)" `
    -Method "PATCH" `
    -Url "$baseUrl/api/projects/command-center-v2" `
    -Body '{"id":"hacked-id","created_at":"1970-01-01"}'

# Test C.5: Type validation - tech_stack as string
Invoke-Test -Name "Test C.5: Type validation - tech_stack as string" `
    -Method "PATCH" `
    -Url "$baseUrl/api/projects/command-center-v2" `
    -Body '{"tech_stack":"not-an-array"}'

# ==========================================
# Angle D: Edge Case Tests
# ==========================================

Write-Output ""
Write-Output "########################################"
Write-Output "# ANGLE D: EDGE CASE TESTS"
Write-Output "########################################"

# Test D.1: POST memory without name
Invoke-Test -Name "Test D.1: POST memory without name" `
    -Method "POST" `
    -Url "$baseUrl/api/projects/command-center-v2/memories" `
    -Body '{"content":"no name"}'

# Test D.2: POST memory without content
Invoke-Test -Name "Test D.2: POST memory without content" `
    -Method "POST" `
    -Url "$baseUrl/api/projects/command-center-v2/memories" `
    -Body '{"name":"empty"}'

# Test D.3: POST memory with empty body
Invoke-Test -Name "Test D.3: POST memory with empty body" `
    -Method "POST" `
    -Url "$baseUrl/api/projects/command-center-v2/memories" `
    -Body '{}'

# Test D.4: POST memory with invalid JSON
Write-Output ""
Write-Output "=== Test D.4: POST memory with invalid JSON ==="
Write-Output "  POST $baseUrl/api/projects/command-center-v2/memories"
Write-Output "  Body: this is not json"
try {
    $params = @{
        Uri = "$baseUrl/api/projects/command-center-v2/memories"
        Method = "POST"
        UseBasicParsing = $true
        Headers = $headers
        TimeoutSec = 10
        ContentType = "application/json"
        Body = [System.Text.Encoding]::UTF8.GetBytes("this is not json")
    }
    $r = Invoke-WebRequest @params
    Write-Output "  Status: $($r.StatusCode)"
    Write-Output "  Body: $($r.Content)"
} catch {
    $statusCode = 0
    $body = ""
    if ($_.Exception.Response) {
        $statusCode = [int]$_.Exception.Response.StatusCode
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = [System.IO.StreamReader]::new($stream)
            $body = $reader.ReadToEnd()
            $reader.Close()
        } catch {
            $body = "(could not read response body)"
        }
    } else {
        $body = $_.Exception.Message
    }
    Write-Output "  Status: $statusCode"
    Write-Output "  Body: $body"
}

# Test D.5: PATCH without valid fields
Invoke-Test -Name "Test D.5: PATCH without valid fields" `
    -Method "PATCH" `
    -Url "$baseUrl/api/projects/command-center-v2" `
    -Body '{"invalid_field":"test"}'

# Test D.6: Memories for non-existent project
Invoke-Test -Name "Test D.6: Memories for non-existent project" `
    -Method "GET" `
    -Url "$baseUrl/api/projects/does-not-exist-project/memories"

# Test D.7: Invalid URL encoding in memory name
Write-Output ""
Write-Output "=== Test D.7: Invalid URL encoding in memory name ==="
Write-Output "  GET $baseUrl/api/projects/command-center-v2/memories/%E0%A4%A"
try {
    $r = Invoke-WebRequest -Uri "$baseUrl/api/projects/command-center-v2/memories/%E0%A4%A" -Method GET -UseBasicParsing -Headers $headers -TimeoutSec 10
    Write-Output "  Status: $($r.StatusCode)"
    Write-Output "  Body: $($r.Content)"
} catch {
    $statusCode = 0
    $body = ""
    if ($_.Exception.Response) {
        $statusCode = [int]$_.Exception.Response.StatusCode
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = [System.IO.StreamReader]::new($stream)
            $body = $reader.ReadToEnd()
            $reader.Close()
        } catch {
            $body = "(could not read response body)"
        }
    } else {
        $body = $_.Exception.Message
    }
    Write-Output "  Status: $statusCode"
    Write-Output "  Body: $body"
}

Write-Output ""
Write-Output "========================================="
Write-Output "ALL TESTS COMPLETED"
Write-Output "========================================="
