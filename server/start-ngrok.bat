@echo off
echo ========================================
echo Iniciando ngrok para WebSocket Server
echo Porta: 8080
echo ========================================
echo.
echo IMPORTANTE: Pare o ngrok atual se estiver rodando na porta 3000
echo.
pause
echo.
echo Iniciando ngrok http 8080...
ngrok http 8080

