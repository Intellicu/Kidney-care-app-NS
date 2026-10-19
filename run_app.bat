@echo off
title AIIMS Patna - Digital Nephrotic Diary
echo ========================================================
echo    AIIMS PATNA - DIVISION OF PEDIATRIC NEPHROLOGY
echo       DIGITAL NEPHROTIC DIARY / नेफ्रोटिक डायरी
echo ========================================================
echo.
cd /d "%~dp0"

set "PYTHON_EXE="
if exist "C:\Users\acer\AppData\Local\Programs\Orange\python.exe" (
    set "PYTHON_EXE=C:\Users\acer\AppData\Local\Programs\Orange\python.exe"
) else (
    where python >nul 2>&1
    if %errorlevel% equ 0 (
        set "PYTHON_EXE=python"
    )
)

if "%PYTHON_EXE%"=="" (
    echo [ERROR] Python not found. Please install Python or Orange to run this application.
    pause
    exit /b 1
)

echo Starting Digital Nephrotic Diary server...
echo Serving at http://127.0.0.1:5000
echo Opening web browser...
start http://127.0.0.1:5000

"%PYTHON_EXE%" app.py
pause
