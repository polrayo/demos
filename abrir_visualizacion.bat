@echo off
setlocal

REM Ir a la carpeta donde está este .bat
cd /d "%~dp0"

echo =========================
echo 1) Building project...
echo =========================
call npm run build

IF ERRORLEVEL 1 (
    echo.
    echo ERROR: El build ha fallado.
    pause
    exit /b 1
)

echo.
echo =========================
echo 2) Starting preview server...
echo =========================

REM Lanza el preview en otra ventana y deja el servidor vivo
start "Vite Preview" cmd /k "cd /d ""%~dp0"" && npm run preview -- --host 127.0.0.1 --port 4173"

REM Espera unos segundos para dar tiempo a que arranque
timeout /t 3 /nobreak >nul

echo.
echo =========================
echo 3) Opening browser...
echo =========================
start "" "http://localhost:4173/"

exit /b 0
``