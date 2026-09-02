# EquiSplit Android Build & USB Deployment Script
# Automatically builds web assets, syncs Capacitor, compiles Debug APK, and deploys via ADB over USB.

param(
    [switch]$SkipBuild,
    [switch]$InstallOnly
)

$ErrorActionPreference = "Stop"

$RootDir = Split-Path -Parent $PSScriptRoot
$AndroidDir = Join-Path $RootDir "android"
$ApkPath = Join-Path $AndroidDir "app\build\outputs\apk\debug\app-debug.apk"
$AdbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " EquiSplit Android Build & Deploy Pipeline" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Configure Java Environment (prevent Java 23/system conflicts)
$PreferredJbr = "C:\Program Files\Android\Android Studio\jbr"
if (Test-Path $PreferredJbr) {
    $env:JAVA_HOME = $PreferredJbr
    Write-Host "[OK] JAVA_HOME set to Android Studio JBR: $PreferredJbr" -ForegroundColor Green
} elseif ($env:JAVA_HOME -and (Test-Path $env:JAVA_HOME)) {
    Write-Host "[INFO] Using existing JAVA_HOME: $env:JAVA_HOME" -ForegroundColor Yellow
} else {
    Write-Host "[WARN] JBR not found, attempting system default Java." -ForegroundColor Yellow
}

# 2. Configure Android SDK Environment
if (-not $env:ANDROID_HOME) {
    $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
}
Write-Host "[OK] ANDROID_HOME: $env:ANDROID_HOME" -ForegroundColor Green

# 3. Web build and Capacitor sync
if (-not $SkipBuild -and -not $InstallOnly) {
    Write-Host "`n[1/4] Building web application (tsc && vite build)..." -ForegroundColor Magenta
    Set-Location $RootDir
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Web build failed." }

    Write-Host "`n[2/4] Syncing Capacitor Android assets..." -ForegroundColor Magenta
    npx cap sync android
    if ($LASTEXITCODE -ne 0) { throw "Capacitor sync failed." }
} else {
    Write-Host "`n[*] Skipping web build and sync." -ForegroundColor Gray
}

# 4. Compile Debug APK with Gradle
if (-not $InstallOnly) {
    Write-Host "`n[3/4] Compiling Android Debug APK with Gradle..." -ForegroundColor Magenta
    Set-Location $AndroidDir

    # Ensure local.properties exists
    $LocalPropsPath = Join-Path $AndroidDir "local.properties"
    $SdkEscaped = $env:ANDROID_HOME.Replace("\", "\\").Replace(":", "\:")
    "sdk.dir=$SdkEscaped" | Out-File -FilePath $LocalPropsPath -Encoding ascii

    cmd.exe /c "gradlew.bat assembleDebug"
    if ($LASTEXITCODE -ne 0) { throw "Gradle assembleDebug failed." }

    if (Test-Path $ApkPath) {
        $ApkItem = Get-Item $ApkPath
        $SizeMb = [math]::Round($ApkItem.Length / 1MB, 2)
        Write-Host "`n[OK] APK BUILT SUCCESSFULLY!" -ForegroundColor Green
        Write-Host "    Location : $ApkPath" -ForegroundColor White
        Write-Host "    Size     : $SizeMb MB" -ForegroundColor White
    } else {
        throw "APK was not found at $ApkPath after build."
    }
}

# 5. USB Debugging & Device Deployment
Write-Host "`n[4/4] Checking connected Android devices via ADB..." -ForegroundColor Magenta

if (Test-Path $AdbPath) {
    $devicesOutput = & $AdbPath devices
    Write-Host $devicesOutput

    $devices = $devicesOutput -split "`r?`n" | Where-Object { $_ -match "\tdevice$" }

    if ($devices.Count -gt 0) {
        Write-Host "[OK] Found $($devices.Count) connected device(s) in USB debugging mode!" -ForegroundColor Green
        Write-Host "[*] Installing $ApkPath onto device..." -ForegroundColor Cyan
        & $AdbPath install -r $ApkPath
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] APK successfully installed!" -ForegroundColor Green
            Write-Host "[*] Launching EquiSplit on device..." -ForegroundColor Cyan
            & $AdbPath shell monkey -p com.equisplit.app -c android.intent.category.LAUNCHER 1
            Write-Host "[OK] App launched successfully on device!" -ForegroundColor Green
        } else {
            Write-Host "[WARN] Failed to install via ADB. Ensure device is unlocked and authorize USB debugging." -ForegroundColor Red
        }
    } else {
        Write-Host "[INFO] No device found in USB debugging mode." -ForegroundColor Yellow
        Write-Host "    To install on your Android phone via USB debugging:" -ForegroundColor White
        Write-Host "    1. On your phone: Settings -> About Phone -> Tap 'Build Number' 7 times." -ForegroundColor White
        Write-Host "    2. Enable 'Developer Options' -> 'USB Debugging'." -ForegroundColor White
        Write-Host "    3. Connect phone via USB, allow 'USB debugging prompt' on screen." -ForegroundColor White
        Write-Host "    4. Re-run: .\scripts\deploy-android.ps1 -InstallOnly" -ForegroundColor White
        Write-Host "`n    Or copy this APK file directly to your phone:" -ForegroundColor White
        Write-Host "    $ApkPath" -ForegroundColor Cyan
    }
} else {
    Write-Host "[WARN] ADB tool not found at $AdbPath. Install Android SDK Platform Tools." -ForegroundColor Yellow
}

Set-Location $RootDir
Write-Host "`nDone!" -ForegroundColor Green
