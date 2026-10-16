@echo off
rem Abre o POKÉPOL no navegador com o visual completo (servidor local na porta 8791).
cd /d "%~dp0"
start "" http://localhost:8791
python -m http.server 8791 --directory web
