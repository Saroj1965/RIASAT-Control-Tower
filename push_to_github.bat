@echo off
title Push RIASAT Executive Dashboard to GitHub
cd /d "%~dp0"

echo ======================================================================
echo Pushing RIASAT Executive Dashboard to GitHub:
echo https://github.com/Saroj1965/RIASAT-Control-Tower.git
echo ======================================================================
echo.

git remote set-url origin https://github.com/Saroj1965/RIASAT-Control-Tower.git
git add .
git commit -m "Update: Supabase database migration, responsive 3s animated loading screen, redesigned white login portal with See Credentials modal, and Ramaiah blue/black/pink/orange brand styling"
git push -u origin main

echo.
if %ERRORLEVEL% EQU 0 (
    echo ======================================================================
    echo SUCCESS: Codebase pushed to GitHub successfully!
    echo https://github.com/Saroj1965/RIASAT-Control-Tower
    echo ======================================================================
) else (
    echo ======================================================================
    echo Git push encountered an issue. Please verify your GitHub access.
    echo ======================================================================
)
pause
