@echo off
title Push RIASAT Executive Dashboard to GitHub
cd /d "C:\Users\RAMAIAH ACADEMY\.gemini\antigravity\scratch\riasat_control_tower_app"
set "PATH=C:\Users\RAMAIAH ACADEMY\.mingit\cmd;C:\Users\RAMAIAH ACADEMY\.mingit\mingw64\bin;%PATH%"

echo ======================================================================
echo Pushing RIASAT Executive Dashboard to GitHub:
echo https://github.com/Saroj1965/RIASAT-Control-Tower
echo ======================================================================
echo.
echo If a GitHub sign-in / authorization browser window appears,
echo please click 'Authorize' to complete authentication.
echo.

git remote set-url origin https://github.com/Saroj1965/RIASAT-Control-Tower.git
git push -u origin main --force

echo.
if %ERRORLEVEL% EQU 0 (
    echo ======================================================================
    echo SUCCESS: Complete codebase pushed to GitHub successfully!
    echo Check your repository: https://github.com/Saroj1965/RIASAT-Control-Tower
    echo ======================================================================
) else (
    echo ======================================================================
    echo Git push failed. Please verify your GitHub credentials.
    echo ======================================================================
)
pause
