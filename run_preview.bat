@echo off
title KidneyCare AI Web Preview (React + Vite)
echo ============================================================
echo   KidneyCare AI - Web Preview Server
echo   Department of Pediatrics, AIIMS Patna
echo ============================================================
echo.
cd /d "%~dp0kidneycare-react\kidneycare-main"
set PATH=C:\Program Files\nodejs;%PATH%

echo Starting local preview server...
echo Open your browser at: http://localhost:4173
echo.
npm run preview -- --port 4173 --host 0.0.0.0
pause
