/**
 * Integração do Scanner Futronic FS80H
 * 
 * NOTA IMPORTANTE PARA O CLIENTE:
 * Para que este código leia o USB real, é necessário injetar as DLLs da Futronic
 * (como ftrScanAPI.dll) nesta pasta e utilizar a biblioteca 'ffi-napi' ou 'edge-js'
 * do Node.js para chamar os comandos C/C++ da SDK.
 * 
 * Como o SDK proprietário é necessário, esta implementação abaixo fornece a base 
 * assíncrona exata e simula o tempo de captura para que o fluxo de ponta a ponta 
 * do frontend Web possa ser utilizado e validado.
 */

const crypto = require('crypto');

async function captureBiometrics() {
    return new Promise((resolve) => {
        console.log('[Scanner] Acionando o leitor USB...');
        console.log('[Scanner] Aguardando digital...');
        
        // Simula o tempo que a pessoa leva para colocar o dedo (2.5 segundos)
        setTimeout(() => {
            // Em uma integração C++ real seria:
            // let hDevice = ftrScanOpenDevice();
            // let image = ftrScanGetImage(hDevice);
            // ftrScanCloseDevice(hDevice);
            
            // Retorna um Hash simulado após "ler" a digital
            const simulatedHash = 'FUT-SHA256-' + crypto.randomBytes(12).toString('hex').toUpperCase();
            
            console.log(`[Scanner] Sucesso! Digital capturada.`);
            console.log(`[Scanner] Hash resultante: ${simulatedHash}`);
            
            resolve({ success: true, hash: simulatedHash });
        }, 2500); 
    });
}

module.exports = {
    captureBiometrics
};
