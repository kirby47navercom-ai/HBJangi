$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$compiler = if ($env:CXX) { $env:CXX } else { 'C:\msys64\ucrt64\bin\g++.exe' }
if (-not (Test-Path -LiteralPath $compiler)) { throw 'Set CXX to your C++17 g++ path.' }
$env:Path = (Split-Path -Parent $compiler) + ';' + $env:Path
Push-Location -LiteralPath $projectRoot
try {
    & $compiler -std=c++17 -Wall -Wextra -pedantic tests/rules.cpp -o tests/rules.exe
    if ($LASTEXITCODE -ne 0) { throw 'Rules test compilation failed.' }
    & '.\tests\rules.exe'
    if ($LASTEXITCODE -ne 0) { throw 'Rules test failed.' }
} finally { Pop-Location }
