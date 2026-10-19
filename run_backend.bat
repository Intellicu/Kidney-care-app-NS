@echo off
title KidneyCare AI Backend Server - AIIMS Patna
echo ============================================================
echo   KidneyCare AI - Pediatric Nephrology Backend Server
echo   Department of Pediatrics, AIIMS Patna
echo ============================================================
echo.
cd /d "%~dp0"
set PYTHON_EXE=C:\Users\acer\AppData\Local\Programs\Orange\python.exe

if not exist "%PYTHON_EXE%" (
    echo [ERROR] Orange Python not found at %PYTHON_EXE%
    pause
    exit /b 1
)

echo Starting Flask server on 0.0.0.0:5000...
echo Access locally:    http://localhost:5000
echo Access on Android: http://10.0.2.2:5000 (Emulator) or LAN IP (Physical Device)
echo.
"%PYTHON_EXE%" app.py
pause
