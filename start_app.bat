@echo off
title RIASAT Executive Control Tower
cd /d "%~dp0"
set "PATH=C:\Users\RAMAIAH ACADEMY\.nodejs22;C:\Users\RAMAIAH ACADEMY\.mingit\cmd;C:\Users\RAMAIAH ACADEMY\AppData\Roaming\npm;%PATH%"
echo Starting RIASAT Executive Control Tower on http://localhost:3000 ...
call npm start
pause
