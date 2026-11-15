@echo off
title Dung he thong PharmaChainSecurity
cls

echo =====================================================================
echo    DANG DUNG HE THONG PHARMACHAINSECURITY AN TOAN...
echo =====================================================================
echo.

echo [1/3] Dang tat Ngrok Tunnel...
taskkill /F /IM ngrok.exe >nul 2>&1
echo       - Da tat Ngrok.
echo.

echo [2/3] Dang tat Backend ASP.NET Core...
taskkill /F /IM PharmaSecure.WebApi.exe >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq PharmaSecure Backend API*" >nul 2>&1
echo       - Da tat Backend.
echo.

echo [3/3] Dang dung Oracle Database Container...
docker stop oracle-db >nul 2>&1
echo       - Da dung Oracle Database an toan.
echo.

echo =====================================================================
echo    TOAN BO HE THONG DA DUOC DUNG VA GIAI PHONG HOAN TOAN!
echo =====================================================================
timeout /t 5
exit
