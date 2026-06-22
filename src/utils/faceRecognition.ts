import * as faceapi from 'face-api.js';

let modelsLoaded = false;

export const loadModels = async () => {
  if (modelsLoaded) return;
  const MODEL_URL = '/models'; // expects /public/models
  
  try {
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    modelsLoaded = true;
    console.log("Face API models loaded successfully");
  } catch (e) {
    console.error("Failed to load face API models", e);
    throw e;
  }
};

export const compareFaces = async (baseImgSrc: string, captureImgSrc: string): Promise<{ match: boolean; score: number }> => {
  await loadModels();

  try {
    const baseImg = await faceapi.fetchImage(baseImgSrc);
    const captureImg = await faceapi.fetchImage(captureImgSrc);

    const detection1 = await faceapi.detectSingleFace(baseImg).withFaceLandmarks().withFaceDescriptor();
    const detection2 = await faceapi.detectSingleFace(captureImg).withFaceLandmarks().withFaceDescriptor();

    if (!detection1) {
      throw new Error('Não foi possível encontrar um rosto na foto de perfil cadastrada do colaborador.');
    }
    
    if (!detection2) {
      throw new Error('Não foi possível encontrar um rosto na foto capturada pela câmera.');
    }

    const distance = faceapi.euclideanDistance(detection1.descriptor, detection2.descriptor);
    
    // Threshold de 0.55 é recomendado (distâncias menores que 0.55 = mesma pessoa)
    const threshold = 0.55; 
    
    return {
      match: distance < threshold,
      score: 1 - distance
    };
  } catch(e) {
    console.error("Face comparison error:", e);
    throw e;
  }
};

export const getBaseDescriptor = async (baseImgSrc: string): Promise<Float32Array | null> => {
  await loadModels();
  try {
    const baseImg = await faceapi.fetchImage(baseImgSrc);
    const detection = await faceapi.detectSingleFace(baseImg).withFaceLandmarks().withFaceDescriptor();
    return detection ? detection.descriptor : null;
  } catch (e) {
    console.error("Failed to extract base face descriptor:", e);
    return null;
  }
};

export const compareVideoFace = async (videoEl: HTMLVideoElement, baseDescriptor: Float32Array): Promise<{ match: boolean; score: number; box?: any } | null> => {
  try {
    const detection = await faceapi.detectSingleFace(videoEl).withFaceLandmarks().withFaceDescriptor();
    if (!detection) return null;

    const distance = faceapi.euclideanDistance(baseDescriptor, detection.descriptor);
    const threshold = 0.55; 
    
    return {
      match: distance < threshold,
      score: 1 - distance,
      box: detection.detection.box
    };
  } catch(e) {
    return null;
  }
};
