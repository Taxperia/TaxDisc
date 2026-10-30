$ErrorActionPreference = 'Stop'
if ($env:GITHUB_ACTIONS -ne 'true' -or -not $env:RUNNER_TEMP) {
  throw 'Installer integration checks run only on a disposable GitHub Actions Windows runner.'
}

$projectRoot = Split-Path -Parent $PSScriptRoot
$version = (Get-Content -LiteralPath (Join-Path $projectRoot 'package.json') -Raw | ConvertFrom-Json).version
$installer = Join-Path $projectRoot "release/TaxDisc-$version-x64-setup.exe"
$temporaryRoot = [System.IO.Path]::GetFullPath($env:RUNNER_TEMP)
$installRoot = [System.IO.Path]::GetFullPath((Join-Path $temporaryRoot ('taxdisc-install-' + [Guid]::NewGuid().ToString('N'))))
if (-not $installRoot.StartsWith($temporaryRoot.TrimEnd('\') + '\', [StringComparison]::OrdinalIgnoreCase)) {
  throw 'Install target is outside the disposable runner directory.'
}
$existing = Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*', 'HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*' -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -eq 'TaxDisc' }
if ($existing) { throw 'A pre-existing TaxDisc installation was found; refusing to modify it.' }
$oldExecutable = $env:TAXDISC_EXECUTABLE
try {
  $install = Start-Process -FilePath $installer -ArgumentList @('/S', '/currentuser', "/D=$installRoot") -WindowStyle Hidden -PassThru -Wait
  if ($install.ExitCode -ne 0) { throw "Silent installation failed: $($install.ExitCode)" }
  $executable = Join-Path $installRoot 'TaxDisc.exe'
  if (-not (Test-Path -LiteralPath $executable)) { throw 'The installed application is missing.' }
  $env:TAXDISC_EXECUTABLE = $executable
  node (Join-Path $projectRoot 'test/electron-smoke.cjs')
  if ($LASTEXITCODE -ne 0) { throw 'Installed application smoke checks failed.' }
  $uninstaller = @(Get-ChildItem -LiteralPath $installRoot -Filter 'Uninstall*.exe' -File)
  if ($uninstaller.Count -ne 1) { throw 'Expected exactly one generated uninstaller.' }
  $uninstall = Start-Process -FilePath $uninstaller[0].FullName -ArgumentList '/S' -WindowStyle Hidden -PassThru -Wait
  if ($uninstall.ExitCode -ne 0) { throw "Silent uninstall failed: $($uninstall.ExitCode)" }
  $deadline = [DateTime]::UtcNow.AddSeconds(30)
  while ((Test-Path -LiteralPath $executable) -and [DateTime]::UtcNow -lt $deadline) { Start-Sleep -Milliseconds 250 }
  if (Test-Path -LiteralPath $executable) { throw 'The uninstaller left the application executable behind.' }
  Write-Output 'Disposable-runner installation, installed-app smoke, and uninstallation checks passed.'
} finally {
  $env:TAXDISC_EXECUTABLE = $oldExecutable
  # The named, newly generated fixture is the only recursively removed directory.
  $resolvedTarget = [System.IO.Path]::GetFullPath($installRoot)
  if (-not $resolvedTarget.StartsWith($temporaryRoot.TrimEnd('\') + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Unsafe cleanup target.' }
  if (Test-Path -LiteralPath $resolvedTarget) { Remove-Item -LiteralPath $resolvedTarget -Recurse -Force }
}
