@echo off
title Khoi dong PharmaChainSecurity (1-Click)
cls

echo =====================================================================
echo    HE THONG QUAN LY CHUOI NHA THUOC PHARMACHAINSECURITY (1-CLICK)
echo =====================================================================
echo.

set "ROOT_DIR=%~dp0"
set "NGROK_EXE=ngrok"

where ngrok >nul 2>&1
if errorlevel 1 (
    if exist "%LOCALAPPDATA%\Microsoft\WinGet\Packages\Ngrok.Ngrok_Microsoft.Winget.Source_8wekyb3d8bbwe\ngrok.exe" (
        set "NGROK_EXE=%LOCALAPPDATA%\Microsoft\WinGet\Packages\Ngrok.Ngrok_Microsoft.Winget.Source_8wekyb3d8bbwe\ngrok.exe"
    )
)

echo [1/4] Dang khoi dong Oracle Database (Docker)...
docker start oracle-db >nul 2>&1
timeout /t 3 /nobreak >nul
echo       - Oracle Database: DA BAT!
echo.

echo [2/4] Dang khoi dong Backend ASP.NET Core (.NET 8)...
start "PharmaSecure Backend API" /D "%ROOT_DIR%backend\PharmaSecure.WebApi" cmd /k dotnet run
timeout /t 5 /nobreak >nul
echo       - Backend WebApi: DA BAT (Port 55198 / 55199)!
echo.

echo [3/4] Dang ket noi Ngrok Tunnel co dinh len Internet...
start "Ngrok Cloud Tunnel" cmd /k ""%NGROK_EXE%" http --domain=circulate-share-unfilled.ngrok-free.dev 55199"
timeout /t 3 /nobreak >nul
echo       - Link Backend co dinh: https://circulate-share-unfilled.ngrok-free.dev
echo.

echo [4/4] Dang mo Website Netlify tren trinh duyet...
start https://pharmasecure-web.netlify.app
echo       - Website Netlify: https://pharmasecure-web.netlify.app
echo.

echo =====================================================================
echo   TOAN BO HE THONG DA SAN SANG!
echo   - Ten dang nhap : chunhathuoc
echo   - Mat khau      : Pharma@Owner2026
echo.
echo   (Khi nao muon tat he thong, hay chay file stop-project.bat)
echo =====================================================================
timeout /t 8
exit
