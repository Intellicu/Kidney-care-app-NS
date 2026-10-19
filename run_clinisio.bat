@echo off
title Launch Clinisio App on Desktop Emulator
echo ============================================================
echo         Clinisio App - Desktop Emulator Launcher
echo ============================================================
echo.

set ADB_EXE=%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe
set EMULATOR_EXE=%LOCALAPPDATA%\Android\Sdk\emulator\emulator.exe
set APK_PATH=%~dp0ClinisioApp-debug.apk
set AVD_NAME=Medium_Phone_API_37.0

if not exist "%ADB_EXE%" (
    echo [ERROR] ADB not found at %ADB_EXE%
    pause
    exit /b 1
)

if not exist "%APK_PATH%" (
    echo [ERROR] APK not found at %APK_PATH%
    pause
    exit /b 1
)

:: Check if a device or emulator is already connected
echo [1/4] Checking for running Android device or emulator...
"%ADB_EXE%" devices | findstr /R "device$" >nul
if %ERRORLEVEL% EQU 0 (
    echo Found running device/emulator.
) else (
    echo No active device found. Launching emulator '%AVD_NAME%'...
    if exist "%EMULATOR_EXE%" (
        start "" "%EMULATOR_EXE%" -avd %AVD_NAME%
        echo Waiting for emulator to start...
        "%ADB_EXE%" wait-for-device
        echo Waiting for device system boot to complete...
        :WAIT_BOOT
        timeout /t 3 /nobreak >nul
        for /f "tokens=*" %%i in ('"%ADB_EXE%" shell getprop sys.boot_completed 2^>nul') do set BOOT=%%i
        if not "%BOOT%"=="1" (
            echo Booting Android system, please wait...
            goto WAIT_BOOT
        )
        echo Emulator is ready!
    ) else (
        echo [ERROR] Emulator not found at %EMULATOR_EXE%
        pause
        exit /b 1
    )
)

echo.
echo [2/4] Installing Clinisio App...
"%ADB_EXE%" install -r "%APK_PATH%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [3/4] Launching Clinisio App on screen...
    "%ADB_EXE%" shell am start -n com.clinisio.app/com.clinisio.app.MainActivity
    echo.
    echo ============================================================
    echo [SUCCESS] Clinisio is now open on your desktop emulator!
    echo ============================================================
) else (
    echo.
    echo [FAILED] Installation failed.
)

echo.
pause
