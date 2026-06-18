@echo off
echo ============================================
echo  CONFIGURANDO CHROME PARA FUTRONIC BRIDGE
echo ============================================
echo.
echo Abrindo configuracao do Chrome...
echo.

REM Abre o Chrome direto na pagina da flag
start chrome "chrome://flags/#unsafely-treat-insecure-origin-as-secure"

echo.
echo O Chrome abriu na pagina de configuracoes.
echo.
echo SIGA ESTES PASSOS:
echo.
echo 1. Na caixa de texto amarela que apareceu, 
echo    digite:  http://localhost:8080
echo.
echo 2. No botao ao lado, mude para "Enabled"
echo.
echo 3. Clique em "Relaunch" para reiniciar o Chrome
echo.
echo Apos reiniciar, o leitor biometrico vai funcionar!
echo.
pause
