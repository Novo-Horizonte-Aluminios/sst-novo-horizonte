const express = require('express');
const cors = require('cors');
const scanner = require('./scanner');

const app = express();
const PORT = 8080;

// Permite conexões do sistema web hospedado
app.use(cors());

// Rota de verificação
app.get('/', (req, res) => {
    res.json({ status: 'Futronic Local Bridge is running', version: '1.0.0' });
});

// Rota acionada pelo site quando o botão "Capturar Digital" é clicado
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
    console.log(` FUTRONIC FS80H - LOCAL BRIDGE AGENT`);
    console.log(`=========================================`);
    console.log(`Servidor rodando e ouvindo a porta ${PORT}`);
    console.log(`Mantenha esta janela aberta para que o site possa acessar o leitor.`);
});
