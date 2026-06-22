const koffi = require('koffi');
const path = require('path');

try {
    const dllPath = path.join(__dirname, 'FTRAPI.dll');
    console.log('Loading FTRAPI.dll from:', dllPath);
    const lib = koffi.load(dllPath);

    const FTRInitialize = lib.func('int FTRInitialize()');
    const FTRTerminate = lib.func('int FTRTerminate()');

    console.log('Calling FTRInitialize...');
    const initRes = FTRInitialize();
    console.log('FTRInitialize result:', initRes);

    console.log('Calling FTRTerminate...');
    const termRes = FTRTerminate();
    console.log('FTRTerminate result:', termRes);

} catch (err) {
    console.error('Error:', err);
}
