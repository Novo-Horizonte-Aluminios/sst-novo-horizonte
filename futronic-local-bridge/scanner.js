const koffi = require('koffi');
const crypto = require('crypto');
const path = require('path');

let lib;
let ftrScanOpenDevice;
let ftrScanCloseDevice;
let ftrScanGetImageSize;
let ftrScanGetImage;

// Tenta carregar a DLL e mapear as assinaturas C++
try {
    console.log('[Scanner] Inicializando ponte FFI para ftrScanAPI.dll...');
    const dllPath = path.join(__dirname, 'ftrScanAPI.dll');
    lib = koffi.load(dllPath);

    // Assinaturas das funções do SDK da Futronic mapeadas usando tipos nativos do C (void*, int)
    ftrScanOpenDevice = lib.func('void* ftrScanOpenDevice()');
    ftrScanCloseDevice = lib.func('void ftrScanCloseDevice(void*)');
    ftrScanGetImageSize = lib.func('int ftrScanGetImageSize(void*, _Out_ int*, _Out_ int*)');
    ftrScanGetImage = lib.func('int ftrScanGetImage(void*, int, _Out_ uint8_t*)');
    
    console.log('[Scanner] Funções C++ mapeadas com sucesso!');
} catch (error) {
    console.error('[Scanner] ERRO CRÍTICO AO CARREGAR DLL:', error.message);
    console.log('Isso costuma ocorrer se o seu Node.js for 64-bits e a DLL for 32-bits (ou vice-versa).');
}

async function captureBiometrics() {
    return new Promise((resolve) => {
        if (!lib) {
            return resolve({ success: false, error: 'A DLL não pôde ser carregada pelo Node.js.' });
        }

        try {
            console.log('\n----------------------------------------');
            console.log('[Scanner] Tentando abrir o leitor físico...');
            const handle = ftrScanOpenDevice();
            
            // FTRHANDLE nulo significa erro ou leitor não conectado
            if (!handle || handle === 0n || handle === 0) {
                console.error('[Scanner] Falha: Leitor não encontrado, sem permissão ou desconectado.');
                return resolve({ success: false, error: 'Leitor Futronic não encontrado no USB.' });
            }
            
            console.log('[Scanner] Leitor conectado e LIGADO (LED aceso)!');

            // 1. Pegar o tamanho da imagem da digital
            let width = [0];
            let height = [0];
            ftrScanGetImageSize(handle, width, height);
            
            // O FS80H tem dimensões fixas de 320x480. Se o driver retornar 0, nós forçamos.
            let w = width[0] || 320;
            let h = height[0] || 480;
            if (h === 0) h = 480;
            
            console.log(`[Scanner] Dimensões do sensor resolvidas: ${w}x${h} pixels.`);
            
            // 2. Alocar a memória segura no Node para receber a imagem
            const bufferSize = w * h;
            const imageBuffer = Buffer.alloc(bufferSize);
            
            console.log('[Scanner] Aguardando o usuário posicionar o dedo na luz verde...');
            
            // O parâmetro nDose=4 é a dosagem de iluminação recomendada pela Futronic.
            // Usamos a versão .async() do Koffi para não travar a thread inteira do Node enquanto espera o dedo.
            ftrScanGetImage.async(handle, 4, imageBuffer, (err, imageOk) => {
                // 3. Fechar o dispositivo assim que a chamada terminar
                ftrScanCloseDevice(handle);
                console.log('[Scanner] Dispositivo fechado com segurança.');

                if (err || !imageOk) {
                    console.error('[Scanner] Falha no driver ao capturar:', err);
                    return resolve({ success: false, error: 'O sensor falhou ao capturar a imagem do dedo.' });
                }

                // Checar se a imagem não está em branco
                let sum = 0;
                for (let i = 0; i < Math.min(1000, bufferSize); i++) {
                    sum += imageBuffer[i];
                }
                
                if (sum < 1000) {
                    console.error('[Scanner] Imagem capturada, mas parece estar vazia (dedo não pressionado).');
                    return resolve({ success: false, error: 'Nenhum dedo detectado no sensor. Pressione com firmeza.' });
                }

                console.log('[Scanner] SUCESSO! Dedo detectado e lido da porta USB.');
                
                // 4. Gerar o HASH final para ser enviado ao React
                const hash = crypto.createHash('sha256').update(imageBuffer).digest('hex').toUpperCase();
                console.log(`[Scanner] Hash final: FUT-${hash.substring(0, 15)}...`);
                
                resolve({ success: true, hash: `FUT-${hash}` });
            });
        } catch (e) {
            console.error('[Scanner] Exceção C++ capturada pelo Node:', e);
            resolve({ success: false, error: 'Falha de comunicação de memória com a DLL.' });
        }
    });
}

module.exports = {
    captureBiometrics
};
