@echo off
title SIRAMA Dev Launcher
echo ===================================================
echo   SISTEM INFORMASI RESERVASI & MANAJEMEN RUANGAN
echo        GSG FT-UNTAD (SIRAMA REBOOT)
echo ===================================================
echo.
echo Menjalankan Backend API (Port 4000)...
start "SIRAMA-Backend-4000" cmd /k "cd /d %~dp0backend && npm start"

timeout /t 2 /nobreak >nul

echo Menjalankan Frontend Web (Port 3000)...
start "SIRAMA-Frontend-3000" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 3 /nobreak >nul

echo Menjalankan Public Tunnel (Ngrok)...
start "SIRAMA-Ngrok-Public" cmd /k "ngrok http 4000"

echo.
echo Layanan SIRAMA berhasil dijalankan:
echo - URL Lokal: http://localhost:3000
echo - URL Jaringan LAN: http://192.168.100.10:3000
echo - API Backend: http://192.168.100.10:4000/api/health
echo - Web Inspect Ngrok: http://localhost:4040
echo.
pause
