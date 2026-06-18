const express = require('express');
const cors = require('cors');
const https = require('https');
const selfsigned = require('selfsigned');
const scanner = require('./scanner');

const app = express();
const HTTP_PORT = 8080;   // Mantido para testes locais (http)
const HTTPS_PORT = 8443;  // Porta segura para o site em produção (https)

// Gera um certificado autoassinado válido para localhost
const attrs = [{ name: 'commonName', value: 'localhost' }];
const pems = selfsigned.generate(attrs, { days: 3650 });

// CORS: permite chamadas do nosso site de produção E de localhost
app.use(cors({
    origin: ['https://sst.novohorizonte.com', 'http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET']
}));

// Rota de verificação de saúde
app.get('/', (req, res) => {
    res.json({ status: 'Futronic Local Bridge is running', version: '2.0.0', https: true });
});

// Rota de captura biométrica
app.get('/scan', async (req, res) => {
    try {
        const result = await scanner.captureBiometrics();
        if (result.success) {
            res.json({ success: true, hash: result.hash });
        } else {
            res.status(500).json({ success: false, error: result.error });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Falha interna no agente local.' });
    }
});

// Servidor HTTPS (para o site de produção em https://)
const httpsServer = https.createServer({ key: pems.private, cert: pems.cert }, app);
httpsServer.listen(HTTPS_PORT, () => {
    console.log(`=========================================`);
    console.log(` FUTRONIC FS80H - LOCAL BRIDGE AGENT v2`);
    console.log(`=========================================`);
    console.log(`Servidor HTTPS rodando na porta ${HTTPS_PORT}`);
    console.log(`Servidor HTTP   rodando na porta ${HTTP_PORT}`);
    console.log(`Mantenha esta janela aberta!`);
});

// Servidor HTTP (para testes locais)
app.listen(HTTP_PORT);
