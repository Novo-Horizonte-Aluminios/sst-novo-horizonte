const koffi = require('koffi');
const crypto = require('crypto');
const path = require('path');

let lib;
let ftrScanOpenDevice;
let ftrScanCloseDevice;
let ftrScanGetImageSize;
let ftrScanGetImage;
let ftrScanIsFingerPresent;

// Carrega a DLL e mapeia todas as funções necessárias do SDK Futronic
try {
    console.log('[Scanner] Inicializando ponte FFI para ftrScanAPI.dll...');
    const dllPath = path.join(__dirname, 'ftrScanAPI.dll');
    lib = koffi.load(dllPath);

    ftrScanOpenDevice        = lib.func('void* ftrScanOpenDevice()');
    ftrScanCloseDevice       = lib.func('void ftrScanCloseDevice(void*)');
    ftrScanGetImageSize      = lib.func('int ftrScanGetImageSize(void*, _Out_ int*, _Out_ int*)');
    ftrScanGetImage          = lib.func('int ftrScanGetImage(void*, int, _Out_ uint8_t*)');
    // Verifica se tem dedo no sensor SEM capturar
    ftrScanIsFingerPresent   = lib.func('int ftrScanIsFingerPresent(void*, _Out_ int*)');

    console.log('[Scanner] Funções C++ mapeadas com sucesso! (com detecção de presença de dedo)');
} catch (error) {
    console.error('[Scanner] ERRO CRÍTICO AO CARREGAR DLL:', error.message);
}

// Aguarda até 30 segundos por um dedo no sensor usando polling assíncrono
function waitForFinger(handle, timeoutMs = 30000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const interval = setInterval(() => {
            // Verifica timeout
            if (Date.now() - startTime > timeoutMs) {
                clearInterval(interval);
                return reject(new Error('Tempo esgotado (30s). Nenhum dedo detectado no sensor.'));
            }

            try {
                const isPresent = [0];
                const result = ftrScanIsFingerPresent(handle, isPresent);

                if (result && isPresent[0] !== 0) {
                    clearInterval(interval);
                    console.log('[Scanner] ✅ Dedo detectado no sensor! Capturando imagem...');
                    resolve(true);
                }
                // Se isPresent[0] === 0, continua aguardando...
            } catch (e) {
                clearInterval(interval);
                reject(e);
            }
        }, 200); // Verifica a cada 200ms
    });
}

// Calcula o desvio padrão dos pixels para validar se é uma digital real
function hasRealFingerprint(buffer, size) {
    // Calcula a média
    let sum = 0;
    for (let i = 0; i < size; i++) sum += buffer[i];
    const mean = sum / size;

    // Calcula a variância
    let variance = 0;
    for (let i = 0; i < size; i++) {
        const diff = buffer[i] - mean;
        variance += diff * diff;
    }
    variance /= size;
    const stdDev = Math.sqrt(variance);

    console.log(`[Scanner] Estatísticas da imagem — Média: ${mean.toFixed(1)}, Desvio Padrão: ${stdDev.toFixed(1)}`);

    // Um sensor vazio tem desvio padrão baixo (< 10).
    // Uma digital real tem alto contraste — desvio padrão geralmente > 20.
    return stdDev > 15;
}

async function captureBiometrics() {
    return new Promise(async (resolve) => {
        if (!lib) {
            return resolve({ success: false, error: 'A DLL do Futronic não pôde ser carregada.' });
        }

        let handle = null;
        try {
            console.log('\n----------------------------------------');
            console.log('[Scanner] Abrindo o leitor físico...');
            handle = ftrScanOpenDevice();

            if (!handle || handle === 0n || handle === 0) {
                console.error('[Scanner] Leitor não encontrado ou desconectado.');
                return resolve({ success: false, error: 'Leitor Futronic não encontrado no USB. Verifique a conexão.' });
            }

            console.log('[Scanner] ✅ Leitor CONECTADO — LED aceso!');
            console.log('[Scanner] Aguardando o funcionário posicionar o dedo no sensor...');

            // PASSO 1: Aguarda detectar o dedo (até 30 segundos)
            try {
                await waitForFinger(handle, 30000);
            } catch (timeoutError) {
                ftrScanCloseDevice(handle);
                console.error('[Scanner]', timeoutError.message);
                return resolve({ success: false, error: timeoutError.message });
            }

            // PASSO 2: Obtém as dimensões do sensor
            let width = [0];
            let height = [0];
            ftrScanGetImageSize(handle, width, height);
            const w = width[0] || 320;
            const h = height[0] || 480;
            const bufferSize = w * h;
            const imageBuffer = Buffer.alloc(bufferSize);

            // PASSO 3: Captura a imagem da digital
            ftrScanGetImage.async(handle, 4, imageBuffer, (err, imageOk) => {
                ftrScanCloseDevice(handle);
                console.log('[Scanner] Dispositivo fechado. LED desligado.');

                if (err || !imageOk) {
                    console.error('[Scanner] Falha ao capturar imagem:', err);
                    return resolve({ success: false, error: 'Falha ao capturar imagem do sensor.' });
                }

                // PASSO 4: Valida estatisticamente se é uma digital real
                if (!hasRealFingerprint(imageBuffer, bufferSize)) {
                    console.error('[Scanner] Imagem sem contraste suficiente — dedo não pressionado corretamente.');
                    return resolve({ success: false, error: 'Pressione o dedo com firmeza no centro do sensor.' });
                }

                // PASSO 5: Gera o hash único da digital para armazenar no banco
                const hash = crypto.createHash('sha256').update(imageBuffer).digest('hex').toUpperCase();
                console.log(`[Scanner] ✅ DIGITAL VÁLIDA CAPTURADA! Hash: FUT-${hash.substring(0, 15)}...`);

                resolve({ success: true, hash: `FUT-${hash}` });
            });

        } catch (e) {
            if (handle) try { ftrScanCloseDevice(handle); } catch (_) {}
            console.error('[Scanner] Exceção capturada:', e);
            resolve({ success: false, error: 'Erro interno na comunicação com o leitor.' });
        }
    });
}

module.exports = { captureBiometrics };
