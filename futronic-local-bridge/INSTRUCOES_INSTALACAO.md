# Instalação do Agente Futronic (Bridge) em Outros Computadores

Para que a leitura da biometria via Futronic FS80H funcione no Sistema Web, este "Agente Local" precisa estar rodando no plano de fundo do computador físico onde o leitor USB está conectado.

## Passo a Passo Simplificado (Usando o Executável)

1. **Copie o Executável:**
   - Pegue o arquivo `FutronicBridge.exe` gerado e coloque em uma pasta segura no novo computador (ex: `C:\SST_Bridge\`).

2. **Como fazer rodar sozinho ao ligar o PC (Início Automático):**
   - No teclado, aperte a tecla **Windows + R**.
   - Na janela "Executar" que vai abrir, digite: `shell:startup` e dê Enter.
   - Uma pasta chamada "Inicializar" vai se abrir.
   - Clique com o botão direito no arquivo `FutronicBridge.exe`, selecione "Copiar".
   - Vá na pasta "Inicializar", clique com o botão direito e selecione **"Colar Atalho"**.

3. **Pronto!**
   - Agora, toda vez que o computador for ligado, o Agente abrirá sozinho em segundo plano.
   - Você pode dar dois cliques no `.exe` agora para iniciar a primeira vez sem precisar reiniciar.
   - Ao abrir o sistema SST e clicar em "Capturar Digital", ele fará a leitura perfeitamente.
