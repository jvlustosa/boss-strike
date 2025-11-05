Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Iniciando ngrok para WebSocket Server" -ForegroundColor Cyan
Write-Host "Porta: 8080" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANTE: Pare o ngrok atual se estiver rodando na porta 3000" -ForegroundColor Red
Write-Host ""
Read-Host "Pressione Enter para continuar"
Write-Host ""
Write-Host "Iniciando ngrok http 8080..." -ForegroundColor Green
ngrok http 8080

