$ErrorActionPreference = 'Stop'

if (-not $env:PORT) {
    $port = 5000
    while (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) {
        $port++
    }
    $env:PORT = $port
}

Write-Host 'Starting DockTalk server...'
Write-Host ('DockTalk will use port ' + $env:PORT)
node server.js
