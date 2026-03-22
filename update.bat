@echo off
chcp 65001 >nul
echo ====================================
echo   Backrooms - Update
echo ====================================
echo.

cd /d "%~dp0"

echo [1/3] Adding files...
git add .

echo [2/3] Creating commit...
git commit -m "update: auto commit"

echo [3/3] Pushing to GitHub...
git push -u origin main

echo.
echo ====================================
echo   Done!
echo ====================================
echo.
pause
