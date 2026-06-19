import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Trash2, X, RefreshCw, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';

interface PhotoSelectorProps {
  photoUrl?: string;
  onPhotoSelected: (url: string) => void;
  onPhotoRemoved: () => void;
  employeeName?: string;
}

export default function PhotoSelector({
  photoUrl,
  onPhotoSelected,
  onPhotoRemoved,
  employeeName = "Colaborador"
}: PhotoSelectorProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'webcam' | null>(null);
  
  // Camera variables
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    setCameraLoading(true);
    setCameraError(null);
    setActiveTab('webcam');
    try {
      // First stop any previous stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 320 }, height: { ideal: 320 } },
        audio: false
      });
      
      streamRef.current = stream;
      setIsCameraActive(true);
      
      // Delay slightly to let the instruction mount video tag
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);

    } catch (err: any) {
      console.error("Câmera acessada com erro:", err);
      setCameraError("Não foi possível carregar a câmera externa ou permissão desnegada. Verifique se permitiu acesso à câmera.");
    } finally {
      setCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setActiveTab(null);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      
      // Capture a perfect square from the video stream
      const size = Math.min(video.videoWidth, video.videoHeight) || 300;
      canvas.width = size;
      canvas.height = size;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Mirrored preview requires flipping for a natural photo look
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        
        // Draw the center portion of the video as a square
        const sx = (video.videoWidth - size) / 2;
        const sy = (video.videoHeight - size) / 2;
        
        ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        onPhotoSelected(dataUrl);
        stopCamera();
      }
    }
  };

  // Upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      Swal.fire('Formato Inválido', "Por favor, envie um arquivo de imagem válido (JPG, PNG, WEBP).", 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        onPhotoSelected(dataUrl);
        setActiveTab(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const initialSeed = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(employeeName)}`;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2.5 font-sans">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">
          Foto de Cadastro (eSocial)
        </span>
        {photoUrl && (
          <button
            type="button"
            onClick={onPhotoRemoved}
            className="text-[9px] font-bold text-rose-500 hover:text-rose-600 uppercase flex items-center gap-1 cursor-pointer transition"
          >
            <Trash2 className="w-3 h-3" />
            Remover Foto
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Profile Circular Preview */}
        <div className="relative group">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-slate-300 bg-white flex items-center justify-center shadow-inner shrink-0">
            <img 
              src={photoUrl || initialSeed} 
              alt="Foto do colaborador" 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = initialSeed;
              }}
              referrerPolicy="no-referrer"
            />
          </div>
          {photoUrl && (
            <div className="absolute inset-0 bg-slate-900/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-250 pointer-events-none">
              <Camera className="w-5 h-5 text-white" />
            </div>
          )}
        </div>

        {/* Options Screen (When camera and upload tabs are closed) */}
        {!activeTab && (
          <div className="flex-1 w-full space-y-1.5 text-center sm:text-left">
            <p className="text-[10px] text-slate-500 leading-tight">
              Selecione uma opção para carregar a imagem oficial do crachá e laudos de SST.
            </p>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-1">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-750 font-bold border border-slate-250 hover:border-slate-350 rounded text-[10px] uppercase flex items-center gap-1.5 cursor-pointer shadow-sm transition active:scale-[0.98]"
              >
                <Upload className="w-3.5 h-3.5 text-slate-650" />
                Upload do Computador
              </button>
              <button
                type="button"
                onClick={startCamera}
                className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-750 font-bold border border-indigo-200 hover:border-indigo-300 rounded text-[10px] uppercase flex items-center gap-1.5 cursor-pointer shadow-sm transition active:scale-[0.98]"
              >
                <Camera className="w-3.5 h-3.5 text-indigo-650" />
                Tirar Foto (Webcam)
              </button>
            </div>
          </div>
        )}

        {/* Upload Area Tab */}
        {activeTab === 'upload' && (
          <div className="flex-1 w-full space-y-2">
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition ${
                dragActive 
                  ? 'border-emerald-500 bg-emerald-50/50' 
                  : 'border-slate-300 hover:border-slate-400 bg-white'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden" 
              />
              <Upload className="w-5 h-5 mx-auto text-slate-400 mb-1" />
              <p className="text-[10px] font-bold text-slate-700">Arraste a imagem aqui ou clique para buscar</p>
              <p className="text-[8.5px] text-slate-400 mt-0.5">PNG, JPG, WEBP até 5MB</p>
            </div>
            <div className="flex justify-end">
              <button 
                type="button"
                onClick={() => setActiveTab(null)}
                className="text-[9px] text-slate-500 hover:text-slate-750 font-bold uppercase cursor-pointer"
              >
                Voltar para opções
              </button>
            </div>
          </div>
        )}

        {/* Webcam Capture Tab */}
        {activeTab === 'webcam' && (
          <div className="flex-1 w-full space-y-2">
            {cameraLoading && (
              <div className="flex flex-col items-center justify-center p-3 text-slate-500 gap-1.5">
                <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin" />
                <span className="text-[9.5px]">Ativando dispositivo de vídeo...</span>
              </div>
            )}

            {cameraError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded text-[9.5px] font-medium leading-relaxed space-y-1.5">
                <div className="flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <strong>Falha na Câmera:</strong>
                </div>
                <div>{cameraError}</div>
                <div className="flex justify-end gap-2 pt-1 border-t border-rose-100">
                  <button 
                    type="button"
                    onClick={startCamera}
                    className="px-2 py-0.5 bg-rose-250 text-rose-950 font-black rounded text-[8px] uppercase cursor-pointer hover:bg-rose-300"
                  >
                    Tentar Novamente
                  </button>
                  <button 
                    type="button"
                    onClick={stopCamera}
                    className="px-2 py-0.5 text-slate-500 font-bold text-[8px] uppercase cursor-pointer hover:text-slate-750"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {isCameraActive && (
              <div className="space-y-2">
                <div className="relative aspect-square max-w-[140px] mx-auto rounded-lg overflow-hidden bg-black border border-slate-400 shadow-md">
                  <video 
                    ref={videoRef}
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover scale-x-[-1]" // mirror effect
                  />
                  <div className="absolute top-1 left-1 bg-indigo-600 text-white text-[7.5px] uppercase font-black tracking-widest px-1 py-0.5 rounded shadow">
                    Ao Vivo
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded text-[9px] uppercase tracking-wide cursor-pointer transition active:scale-95 shadow flex items-center gap-1"
                  >
                    <Camera className="w-3" />
                    Capturar Foto
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-755 font-bold rounded text-[9px] uppercase tracking-wide cursor-pointer transition active:scale-95 border border-slate-300"
                  >
                    Encerrar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
