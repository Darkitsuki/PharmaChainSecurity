param(
    [string]$EmulatorName = 'PharmaPhone',
    [int]$Port = 55198
)
$ErrorActionPreference = 'Stop'

try {
    $mobileRoot = Split-Path $PSScriptRoot -Parent
    $properties = Join-Path $mobileRoot 'android/local.properties'
    $sdkDirectory = $null
    if (Test-Path -LiteralPath $properties) {
        $sdkLine = Get-Content -LiteralPath $properties | Where-Object { $_ -match '^sdk\.dir=' } | Select-Object -First 1
        if ($sdkLine) { $sdkDirectory = ($sdkLine -replace '^sdk\.dir=', '').Replace('\\', '\').Replace('\:', ':') }
    }
    if (!$sdkDirectory) { $sdkDirectory = $env:ANDROID_SDK_ROOT }
    if (!$sdkDirectory) { $sdkDirectory = $env:ANDROID_HOME }
    if (!$sdkDirectory) { throw 'Android SDK not found. Check mobile/android/local.properties or ANDROID_SDK_ROOT.' }
    $adb = Join-Path $sdkDirectory 'platform-tools/adb.exe'
    if (!(Test-Path -LiteralPath $adb)) { throw "adb.exe not found in the configured Android SDK." }

    # Resolve the actual serial by AVD name; never touch another emulator/device.
    $serials = @(& $adb devices | ForEach-Object {
        if ($_ -match '^(emulator-\d+)\s+device\s*$') { $Matches[1] }
    })
    $targets = @($serials | Where-Object {
        $avdName = @(& $adb -s $_ emu avd name 2>$null)
        $avdName.Trim() -contains $EmulatorName
    })
    if ($targets.Count -ne 1) {
        throw "Expected exactly one running $EmulatorName AVD. Start it with Flutter: Launch Emulator, then retry F5."
    }
    $serial = $targets[0]
    $deadline = (Get-Date).AddSeconds(45)
    do {
        $booted = (& $adb -s $serial shell getprop sys.boot_completed).Trim()
        if ($booted -eq '1') { break }
        Start-Sleep -Seconds 1
    } while ((Get-Date) -lt $deadline)
    if ($booted -ne '1') { throw "$EmulatorName is still booting. Wait for its home screen and retry F5." }

    & $adb -s $serial reverse "tcp:$Port" "tcp:$Port"
    if ($LASTEXITCODE -ne 0) { throw 'adb reverse failed.' }
    $mappings = & $adb -s $serial reverse --list
    if ($LASTEXITCODE -ne 0 -or !(($mappings -join "`n") -match "tcp:$Port\s+tcp:$Port")) {
        throw 'adb reverse mapping could not be verified.'
    }
    Write-Host "$EmulatorName ($serial): localhost:$Port -> Windows localhost:$Port ready. TLS validation unchanged."
} catch {
    Write-Error $_ -ErrorAction Continue
    exit 1
}
