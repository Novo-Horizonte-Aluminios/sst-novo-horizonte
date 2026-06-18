# Instalação do Agente Futronic (Bridge) em Outros Computadores

Para que a leitura da biometria via Futronic FS80H funcione no Sistema Web, este "Agente Local" precisa estar rodando no plano de fundo do computador físico onde o leitor USB está conectado.

## Passo a Passo para Computadores Novos

1. **Instale o Node.js:**
   - Baixe e instale a versão "LTS" (Long Term Support) do [Node.js](https://nodejs.org/pt-br/).

2. **Copie esta pasta:**
   - Copie a pasta inteira `futronic-local-bridge` para o novo computador (ex: salve na pasta Documentos ou C:\).

3. **Inicie o Agente:**
   - Abra a pasta copiada.
   - Abra o **Terminal** ou **Prompt de Comando (CMD)** dentro desta pasta.
   - Digite o comando: `npm install` (isso baixará as dependências, só precisa ser feito uma vez).
   - Digite o comando: `node server.js`
   
4. **Pronto!**
   - Uma tela preta ficará aberta informando: *"FUTRONIC FS80H - LOCAL BRIDGE AGENT | Servidor rodando na porta 8080"*.
   - Basta minimizar esta tela e abrir o site do SST no Google Chrome normalmente.
   - Quando você clicar em "Capturar Digital" no site, ele se comunicará invisivelmente com essa tela preta para ler o USB.

> **DICA AVANÇADA:** Para evitar ter que abrir essa tela preta toda vez que o Windows iniciar, no futuro podemos compilar este código com ferramentas como o `pkg` ou `pm2` para rodar como um **Serviço do Windows** invisível.
