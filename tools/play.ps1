$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$latest = Join-Path $projectRoot 'Builds/latest.json'
if (-not (Test-Path -LiteralPath $latest)) { throw 'Run npm run build first.' }
$buildInfo = Get-Content -LiteralPath $latest -Encoding UTF8 -Raw | ConvertFrom-Json
if (-not (Test-Path -LiteralPath $buildInfo.executable)) { throw 'Build missing. Run npm run build again.' }
Start-Process -FilePath $buildInfo.executable -WorkingDirectory (Split-Path -Parent $buildInfo.executable)
