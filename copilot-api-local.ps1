#!/usr/bin/env pwsh
$ErrorActionPreference = "Stop"

# Resolve the repo root even if this script is invoked via a symlink or shortcut.
$scriptPath = $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptPath
Set-Location $repoRoot

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..."
    bun install
}

& bun run ./src/main.ts @args
exit $LASTEXITCODE
