const express = require('express');
const cors = require('cors');
const scanner = require('./scanner');

const app = express();
const PORT = 8080;

// CORS aberto: necessário para o site de produção acessar o localhost
app.use(cors());

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

app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(` FUTRONIC FS80H - LOCAL BRIDGE AGENT v2`);
    console.log(`=========================================`);
    console.log(`Servidor HTTP rodando na porta ${PORT}`);
    console.log(`Mantenha esta janela aberta!`);
});
