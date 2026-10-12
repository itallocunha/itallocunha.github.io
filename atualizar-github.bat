@echo off
chcp 65001 >nul
cd /d "%~dp0"
where git >nul 2>nul || (echo Git nao encontrado. Instale em https://git-scm.com/download/win e rode de novo. & pause & exit /b)
if not exist ".git" (
  git init -b main
  git remote add origin https://github.com/itallocunha/portfolio-itallo.git
)
git add -A
set /p MSG=Descreva a alteracao (ou Enter para "Atualizacao do portfolio"): 
if "%MSG%"=="" set MSG=Atualizacao do portfolio
git commit -m "%MSG%"
git push -u origin main
echo.
echo Pronto! Veja em https://github.com/itallocunha/portfolio-itallo
pause
