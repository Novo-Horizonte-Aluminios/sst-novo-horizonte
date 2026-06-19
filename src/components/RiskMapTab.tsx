import React, { useState, useRef } from 'react';
import { 
  Radar, 
  UploadCloud, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  Camera, 
  X,
  Shield,
  RefreshCw,
  AlertTriangle,
  Flame,
  Wrench,
  Activity,
  UserCheck,
  MapPin,
  BookOpen,
  Plus,
  Compass,
  Trash2,
  CheckCircle,
  Layout,
  Layers,
  Map,
  PlusCircle,
  Palette,
  Download,
  Maximize2,
  Printer,
  Sparkles,
  Type
} from 'lucide-react';

interface Risk {
  categoria: string;
  cor_badge: string;
  descricao_perigo: string;
  probabilidade: string;
  impacto: string;
  recomendacao_nr: string;
  x_pct?: number;
  y_pct?: number;
  intensidade?: 'Pequeno' | 'Médio' | 'Elevado';
}

interface RiskMapResult {
  ambiente_detectado: string;
  riscos: Risk[];
}

// Classical Planta Baixa Manual Risk representation
interface ManualRisk {
  id: string;
  categoria: 'Físico' | 'Químico' | 'Biológico' | 'Ergonômico' | 'Mecânico';
  intensidade: 'Pequeno' | 'Médio' | 'Elevado';
  setor: string;
  descricao_perigo: string;
  recomendacao_nr: string;
  x_pct: number;
  y_pct: number;
}

interface CustomWall {
  id: string;
  x_pct: number;
  y_pct: number;
  width_pct: number;
  height_pct: number;
  tipo: 'horizontal' | 'vertical';
  rotation?: number;
  thickness?: number;
}

interface CustomText {
  id: string;
  x_pct: number;
  y_pct: number;
  text: string;
}

export default function RiskMapTab() {
  // Mode selection: 'vision' (AI image processing) or 'blueprint' (Classical Manual Floor Plan)
  const [activeMode, setActiveMode] = useState<'vision' | 'blueprint'>('blueprint');

  // AI Vision states
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<RiskMapResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeRiskIndex, setActiveRiskIndex] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Custom manual blueprint coordinates overlay
  const [customBlueprintImage, setCustomBlueprintImage] = useState<string | null>(null);
  const [blueprintBackgroundType, setBlueprintBackgroundType] = useState<'default' | 'uploaded' | 'scratch'>('default');

  // Canva-drawing additional states
  const [customWalls, setCustomWalls] = useState<CustomWall[]>([]);
  const [customTexts, setCustomTexts] = useState<CustomText[]>([]);
  const [canvaTool, setCanvaTool] = useState<'risk' | 'wall_h' | 'wall_v' | 'text'>('risk');
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [textInputValue, setTextInputValue] = useState('');
  const [selectedWallId, setSelectedWallId] = useState<string | null>(null);
  const [draggedWallId, setDraggedWallId] = useState<string | null>(null);
  const [dragStartCoords, setDragStartCoords] = useState<{ xPct: number; yPct: number; wallStartX: number; wallStartY: number } | null>(null);
  const [snapToWalls, setSnapToWalls] = useState<boolean>(true);

  // Interactive modes for either photo / layout
  const [interactMode, setInteractMode] = useState<'select' | 'adjust' | 'create'>('select');
  
  // AI Vision Manual additions
  const [newRiskCoords, setNewRiskCoords] = useState<{ x: number; y: number } | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newRiskData, setNewRiskData] = useState({
    categoria: 'Físico',
    descricao_perigo: '',
    probabilidade: 'Média',
    impacto: 'Moderado',
    recomendacao_nr: ''
  });

  // Manual Blueprint states
  const [manualRisks, setManualRisks] = useState<ManualRisk[]>([
    {
      id: 'r-1',
      categoria: 'Ergonômico',
      intensidade: 'Elevado',
      setor: 'Diretoria',
      descricao_perigo: 'Mobiliário inadequado e postura inadequada prolongada.',
      recomendacao_nr: 'Adequação ergonômica sob a Diretriz NR-17 de postos administrativos.',
      x_pct: 74,
      y_pct: 26
    },
    {
      id: 'r-2',
      categoria: 'Mecânico',
      intensidade: 'Médio',
      setor: 'Cozinha',
      descricao_perigo: 'Risco de corte com maquinário de manipulação de alimentos.',
      recomendacao_nr: 'Treinamento de manipulação com utensílios e instalação de proteções NR-12.',
      x_pct: 40,
      y_pct: 26
    },
    {
      id: 'r-3',
      categoria: 'Físico',
      intensidade: 'Elevado',
      setor: 'Depósito',
      descricao_perigo: 'Ruído excessivo e calor contínuo de gerador encostado.',
      recomendacao_nr: 'Isolamento acústico e controle ambiental de calor NR-15.',
      x_pct: 25,
      y_pct: 48
    },
    {
      id: 'r-4',
      categoria: 'Químico',
      intensidade: 'Elevado',
      setor: 'Produção',
      descricao_perigo: 'Fumos de soldagem contínuos e vapores orgânicos.',
      recomendacao_nr: 'Exaustor localizado e respirador semifacial sob NR-09 / NR-15.',
      x_pct: 68,
      y_pct: 68
    },
    {
      id: 'r-5',
      categoria: 'Físico',
      intensidade: 'Médio',
      setor: 'Logística',
      descricao_perigo: 'Alto nível de ruído por tráfego de empilhadeira industrial.',
      recomendacao_nr: 'Uso obrigatório de protetor auricular de concha e demarcação de tráfego NR-11.',
      x_pct: 91,
      y_pct: 62
    }
  ]);

  // Active creator tools for Manual blueprint
  const [blueprintToolCategory, setBlueprintToolCategory] = useState<'Físico' | 'Químico' | 'Biológico' | 'Ergonômico' | 'Mecânico'>('Físico');
  const [blueprintToolSize, setBlueprintToolSize] = useState<'Pequeno' | 'Médio' | 'Elevado'>('Elevado');
  const [activeManualRiskIndex, setActiveManualRiskIndex] = useState<number | null>(null);
  
  // Custom Sector tag for the clicked zone
  const [tempSectorName, setTempSectorName] = useState('Produção');
  const [tempDescPerigo, setTempDescPerigo] = useState('');
  const [tempRecomendacao, setTempRecomendacao] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const blueprintFileRef = useRef<HTMLInputElement>(null);

  // High-fidelity pre-configured industry presets to allow immediate testing for AI mode
  const presetEnvironments = [
    {
      id: 'furnace',
      name: 'Área de Cadinhos e Forno de Fusão',
      icon: Flame,
      imagePlaceholder: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80&w=600',
      description: 'Cenário operacional de alta temperatura e fundição de lingotes.'
    },
    {
      id: 'maintenance',
      name: 'Oficina Mecânica e Rebarbação',
      icon: Wrench,
      imagePlaceholder: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=600',
      description: 'Manutenção de prensas hidráulicas e projeção de fagulhas.'
    },
    {
      id: 'warehouse',
      name: 'Logística de Bobinas e Almoxarifado',
      icon: Activity,
      imagePlaceholder: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=600',
      description: 'Movimentação com empilhadeiras e empilhamento de materiais.'
    }
  ];

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Por favor, envie apenas arquivos de imagem válidos.');
        return;
      }
      processFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleBlueprintFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomBlueprintImage(reader.result as string);
        setBlueprintBackgroundType('uploaded');
        showMsg("Planta baixa customizada carregada para a workspace!");
      };
      reader.readAsDataURL(file);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setSelectedImage(base64String);
      analyzeImage(base64String);
    };
    reader.onerror = () => {
      setError('Falha ao ler o arquivo selecionado.');
    };
    reader.readAsDataURL(file);
  };

  const handlePresetSelect = async (presetId: string) => {
    setError(null);
    setAnalyzing(true);
    setResult(null);
    setActiveRiskIndex(null);
    setIsCreatingNew(false);
    setNewRiskCoords(null);
    
    const preset = presetEnvironments.find(p => p.id === presetId);
    if (!preset) return;

    setSelectedImage(preset.imagePlaceholder);

    try {
      const res = await fetch('/api/ai/risk-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: preset.imagePlaceholder })
      });

      if (!res.ok) {
        throw new Error('Erro na comunicação com a API de Mapeamento de Riscos.');
      }

      const data = await res.json();
      setResult(data);
      if (data?.riscos?.length > 0) {
        setActiveRiskIndex(0);
        setInteractMode('select');
      }
      showMsg("Cenário de fábrica simulado com sucesso!");
    } catch (err: any) {
      setError(err.message || 'Falha ao analisar o cenário industrial selecionado.');
    } finally {
      setAnalyzing(false);
    }
  };

  const analyzeImage = async (base64Image: string) => {
    setAnalyzing(true);
    setResult(null);
    setActiveRiskIndex(null);
    setIsCreatingNew(false);
    setNewRiskCoords(null);
    
    try {
      const res = await fetch('/api/ai/risk-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image })
      });

      if (!res.ok) {
        throw new Error('Falha na resposta da análise de IA.');
      }

      const data = await res.json();
      setResult(data);
      if (data?.riscos?.length > 0) {
        setActiveRiskIndex(0);
        setInteractMode('select');
      }
      showMsg("Laudo automatizado gerado com sucesso pelo Gemini!");
    } catch (err: any) {
      setError(err.message || 'Falha ao processar e mapear riscos com a API do Gemini.');
    } finally {
      setAnalyzing(false);
    }
  };

  const [autogeneratingBlueprint, setAutogeneratingBlueprint] = useState(false);
  const roomPhotoInputRef = useRef<HTMLInputElement>(null);

  const handleAutogenerateBlueprintFromPhoto = async (base64Image: string) => {
    setAutogeneratingBlueprint(true);
    showMsg("Iniciando mapeamento espacial e modelagem de planta de riscos...");
    try {
      const res = await fetch('/api/ai/generate-blueprint-from-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image })
      });

      if (!res.ok) {
        throw new Error('Falha na comunicação com o gerador de plantas.`);');
      }

      const data = await res.json();
      
      if (data.paredes) {
        setCustomWalls(data.paredes);
      }
      if (data.textos_sala) {
        setCustomTexts(data.textos_sala);
      }
      if (data.riscos_estimados) {
        const mapped: ManualRisk[] = data.riscos_estimados.map((it: any, index: number) => ({
          id: 'r-ai-' + index + '-' + Date.now(),
          categoria: it.categoria,
          intensidade: it.intensidade || 'Médio',
          setor: it.setor || data.nome_sala || 'Área IA',
          descricao_perigo: it.descricao_perigo,
          recomendacao_nr: it.recomendacao_nr,
          x_pct: it.x_pct,
          y_pct: it.y_pct
        }));
        setManualRisks(mapped);
      }

      setBlueprintBackgroundType('scratch'); // Switch to clean grid background where custom vectors are drawn
      showMsg(`Sucesso! Planta de "${data.nome_sala || 'Setor Detectado'}" autogerada com paredes, textos e riscos!`);
    } catch (err: any) {
      setError(err.message || 'Falha ao converter foto do ambiente em planta baixa esquemática.');
    } finally {
      setAutogeneratingBlueprint(false);
    }
  };

  const handleRoomPhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleAutogenerateBlueprintFromPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Image wrapper click-coordinate interceptor
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (analyzing || !result) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    if (interactMode === 'adjust' && activeRiskIndex !== null) {
      const updatedRiscos = [...result.riscos];
      updatedRiscos[activeRiskIndex] = {
        ...updatedRiscos[activeRiskIndex],
        x_pct: x,
        y_pct: y
      };
      setResult({
        ...result,
        riscos: updatedRiscos
      });
      showMsg(`Marcador #${activeRiskIndex + 1} reposicionado com sucesso para o ponto { X: ${x}%, Y: ${y}% }`);
    } else if (interactMode === 'create') {
      setNewRiskCoords({ x, y });
      setIsCreatingNew(true);
      setNewRiskData({
        categoria: 'Físico',
        descricao_perigo: '',
        probabilidade: 'Média',
        impacto: 'Moderado',
        recomendacao_nr: ''
      });
    }
  };

  const handleWallMouseDown = (e: React.MouseEvent, wallId: string) => {
    e.stopPropagation();
    setSelectedWallId(wallId);
    setDraggedWallId(wallId);
    
    // Find the parent canvas element rect to calculate start percent coordinates
    const canvasEl = e.currentTarget.closest('.relative.w-full.aspect-\\[2\\/1\\]');
    if (canvasEl) {
      const rect = canvasEl.getBoundingClientRect();
      const mouseX_pct = ((e.clientX - rect.left) / rect.width) * 100;
      const mouseY_pct = ((e.clientY - rect.top) / rect.height) * 100;
      const targetWall = customWalls.find(w => w.id === wallId);
      if (targetWall) {
        setDragStartCoords({
          xPct: mouseX_pct,
          yPct: mouseY_pct,
          wallStartX: targetWall.x_pct,
          wallStartY: targetWall.y_pct
        });
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (draggedWallId && dragStartCoords) {
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX_pct = ((e.clientX - rect.left) / rect.width) * 100;
      const mouseY_pct = ((e.clientY - rect.top) / rect.height) * 100;
      
      const deltaX = mouseX_pct - dragStartCoords.xPct;
      const deltaY = mouseY_pct - dragStartCoords.yPct;
      
      setCustomWalls(prev => {
        const targetWall = prev.find(w => w.id === draggedWallId);
        if (!targetWall) return prev;
        
        let proposedX = dragStartCoords.wallStartX + deltaX;
        let proposedY = dragStartCoords.wallStartY + deltaY;
        
        const w_pct = targetWall.width_pct || 2;
        const h_pct = targetWall.height_pct || 2;
        
        proposedX = Math.max(0, Math.min(100 - w_pct, proposedX));
        proposedY = Math.max(0, Math.min(100 - h_pct, proposedY));
        
        if (snapToWalls) {
          const threshold = 1.8; // Snap threshold in %
          let snapFoundX = false;
          let snapFoundY = false;
          
          for (const other of prev) {
            if (other.id === draggedWallId) continue;
            
            const oL = other.x_pct;
            const oR = other.x_pct + other.width_pct;
            const oT = other.y_pct;
            const oB = other.y_pct + other.height_pct;
            
            // 1. Horizontal Ends Snapped together (e.g. current left touches other right, or current right touches other left)
            if (!snapFoundX) {
              if (Math.abs(proposedX - oR) < threshold) {
                proposedX = oR;
                snapFoundX = true;
              } else if (Math.abs((proposedX + w_pct) - oL) < threshold) {
                proposedX = oL - w_pct;
                snapFoundX = true;
              } else if (Math.abs(proposedX - oL) < threshold) {
                // Perfect Corner/Start Alignment
                proposedX = oL;
                snapFoundX = true;
              } else if (Math.abs((proposedX + w_pct) - oR) < threshold) {
                // Perfect End Alignment
                proposedX = oR - w_pct;
                snapFoundX = true;
              }
            }
            
            // 2. Vertical Ends Snapped together (e.g. current top touches other bottom, or current bottom touches other top)
            if (!snapFoundY) {
              if (Math.abs(proposedY - oB) < threshold) {
                proposedY = oB;
                snapFoundY = true;
              } else if (Math.abs((proposedY + h_pct) - oT) < threshold) {
                proposedY = oT - h_pct;
                snapFoundY = true;
              } else if (Math.abs(proposedY - oT) < threshold) {
                // Perfect Alignment
                proposedY = oT;
                snapFoundY = true;
              } else if (Math.abs((proposedY + h_pct) - oB) < threshold) {
                proposedY = oB - h_pct;
                snapFoundY = true;
              }
            }
          }
        }
        
        return prev.map(w => {
          if (w.id === draggedWallId) {
            return {
              ...w,
              x_pct: Math.round(proposedX * 10) / 10,
              y_pct: Math.round(proposedY * 10) / 10
            };
          }
          return w;
        });
      });
    }
  };

  const handleCanvasMouseUp = () => {
    if (draggedWallId) {
      setDraggedWallId(null);
      setDragStartCoords(null);
    }
  };

  // Manual Blueprint Canvas space click interceptor
  const handleBlueprintCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // If clicking target is a wall or floating buttons, don't execute canvas background clicks
    if ((e.target as HTMLElement).closest('.z-20') || (e.target as HTMLElement).closest('.z-50')) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    // If a wall is selected, clicking on background deselects it
    if (selectedWallId && canvaTool === 'risk') {
      setSelectedWallId(null);
      showMsg("Seleção de divisória limpa.");
      return;
    }

    if (canvaTool === 'wall_h') {
      const newWall: CustomWall = {
        id: 'wall-' + Date.now(),
        x_pct: Math.max(0, x - 10),
        y_pct: y,
        width_pct: 20,
        height_pct: 2,
        tipo: 'horizontal'
      };
      setCustomWalls([...customWalls, newWall]);
      showMsg("Parede horizontal adicionada! Use os controles no desenho para ajustar.");
      return;
    }

    if (canvaTool === 'wall_v') {
      const newWall: CustomWall = {
        id: 'wall-' + Date.now(),
        x_pct: x,
        y_pct: Math.max(0, y - 10),
        width_pct: 2,
        height_pct: 20,
        tipo: 'vertical'
      };
      setCustomWalls([...customWalls, newWall]);
      showMsg("Parede vertical adicionada! Use os controles no desenho para ajustar.");
      return;
    }

    if (canvaTool === 'text') {
      const newText: CustomText = {
        id: 'text-' + Date.now(),
        x_pct: x,
        y_pct: y,
        text: 'Novo Setor'
      };
      setCustomTexts([...customTexts, newText]);
      setEditingTextId(newText.id);
      setTextInputValue('Novo Setor');
      showMsg("Rotulador lançado! Digite o nome do setor no painel de edição.");
      return;
    }

    // Auto-detect Sector based on standard preset layout coordinates
    let detectedSector = 'Produção';
    if (blueprintBackgroundType === 'default') {
      if (x < 33 && y > 15 && y < 85) detectedSector = 'Depósito';
      else if (x >= 33 && x < 48 && y < 45) detectedSector = 'Cozinha';
      else if (x >= 48 && x < 56 && y < 45) detectedSector = 'Contab.';
      else if (x >= 56 && x < 62 && y < 45) detectedSector = 'RH';
      else if (x >= 62 && x < 67 && y < 45) detectedSector = 'Sanitários (W.C.)';
      else if (x >= 67 && x < 81 && y < 45) detectedSector = 'Diretoria';
      else if (x >= 81 && x < 88 && y < 40) detectedSector = 'Telemark.';
      else if (x >= 81 && x < 88 && y >= 40 && y < 55) detectedSector = 'T.I.';
      else if (x >= 88 && y < 55) detectedSector = 'Recepção';
      else if (x >= 35 && x < 50 && y >= 80) detectedSector = 'Vestiário & W.C.';
      else if (x >= 50 && x < 81 && y >= 55) detectedSector = 'Produção';
      else if (x >= 81 && x < 87 && y >= 55) detectedSector = 'Controle Qualidade (C.Q)';
      else if (x >= 87 && y >= 55) detectedSector = 'Logística';
    }

    setTempSectorName(detectedSector);
    setNewRiskCoords({ x, y });

    // Suggest realistic danger description and specific NR based on clicked category
    if (blueprintToolCategory === 'Físico') {
      setTempDescPerigo('Ruído contínuo originado por máquinas rotativas ou vibrações.');
      setTempRecomendacao('Enclausurar fonte geradora e exigir uso de protetor de concha (NR-15).');
    } else if (blueprintToolCategory === 'Químico') {
      setTempDescPerigo('Fumos metálicos ou dispersão de poeiras tóxicas.');
      setTempRecomendacao('Instalar ventilação exaustora e fornecer respirador aprovado (NR-15 / NR-09).');
    } else if (blueprintToolCategory === 'Biológico') {
      setTempDescPerigo('Risco de contaminação por microrganismos ou fâneras em área úmida e vestiário.');
      setTempRecomendacao('Manter protocolo rígido de higienização laboral e assepsia periódica (NR-15 / NR-24).');
    } else if (blueprintToolCategory === 'Ergonômico') {
      setTempDescPerigo('Postura sentada prolongada estática sem apoio lombar adequado.');
      setTempRecomendacao('Mudança ergonômica de cadeira ajustável e ginástica laboral integrada (NR-17).');
    } else {
      setTempDescPerigo('Risco de aprisionamento de membros em correias de transmissão sem carenagem.');
      setTempRecomendacao('Instalação de barreiras físicas e chaves de segurança intertravadas (NR-12).');
    }
  };

  // Add the manual risk into our array
  const handleAddManualRisk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRiskCoords) return;

    const newRiskEntry: ManualRisk = {
      id: 'r-' + Date.now(),
      categoria: blueprintToolCategory,
      intensidade: blueprintToolSize,
      setor: tempSectorName,
      descricao_perigo: tempDescPerigo || 'Risco NR-05 identificado fisicamente no setor.',
      recomendacao_nr: tempRecomendacao || 'Adotar medidas imediatas de correção física ou coletiva.',
      x_pct: newRiskCoords.x,
      y_pct: newRiskCoords.y
    };

    setManualRisks([...manualRisks, newRiskEntry]);
    setActiveManualRiskIndex(manualRisks.length);
    setNewRiskCoords(null);
    showMsg(`Risco de grupo ${blueprintToolCategory} inserido com absoluto sucesso na planta baixa!`);
  };

  // Delete manual risk
  const handleDeleteManualRisk = (idToDelete: string) => {
    setManualRisks(manualRisks.filter(r => r.id !== idToDelete));
    setActiveManualRiskIndex(null);
    showMsg("Ponto de risco removido da planta baixa.");
  };

  const handleSaveCustomRisk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!result || !newRiskCoords) return;

    let corBadge = 'verde';
    const cat = newRiskData.categoria.toLowerCase();
    if (cat.includes('fís')) corBadge = 'verde';
    else if (cat.includes('quí')) corBadge = 'vermelho';
    else if (cat.includes('biol')) corBadge = 'marrom';
    else if (cat.includes('erg')) corBadge = 'amarelo';
    else if (cat.includes('mec') || cat.includes('acid')) corBadge = 'azul';

    const cleanNewRisk: Risk = {
      categoria: newRiskData.categoria,
      cor_badge: corBadge,
      descricao_perigo: newRiskData.descricao_perigo || 'Perigo customizado adicionado manualmente.',
      probabilidade: newRiskData.probabilidade,
      impacto: newRiskData.impacto,
      recomendacao_nr: newRiskData.recomendacao_nr || 'Providenciar medidas preventivas imediatas.',
      x_pct: newRiskCoords.x,
      y_pct: newRiskCoords.y
    };

    const updated = [...result.riscos, cleanNewRisk];
    setResult({
      ...result,
      riscos: updated
    });

    setActiveRiskIndex(updated.length - 1);
    setIsCreatingNew(false);
    setNewRiskCoords(null);
    setInteractMode('select');
    showMsg(`Novo ponto de risco #${updated.length} registrado manualmente com sucesso!`);
  };

  const handleDeleteRisk = (indexToDelete: number) => {
    if (!result) return;
    const filtered = result.riscos.filter((_, idx) => idx !== indexToDelete);
    setResult({
      ...result,
      riscos: filtered
    });
    
    if (activeRiskIndex === indexToDelete) {
      setActiveRiskIndex(filtered.length > 0 ? 0 : null);
    } else if (activeRiskIndex !== null && activeRiskIndex > indexToDelete) {
      setActiveRiskIndex(activeRiskIndex - 1);
    }
    showMsg(`Marcador #${indexToDelete + 1} removido do mapa.`);
  };

  const clearSelection = () => {
    setSelectedImage(null);
    setResult(null);
    setError(null);
    setAnalyzing(false);
    setActiveRiskIndex(null);
    setIsCreatingNew(false);
    setNewRiskCoords(null);
    setInteractMode('select');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getManualMarkerBg = (category: string) => {
    const val = category.toLowerCase().trim();
    if (val.includes('fís')) return 'bg-emerald-600 ring-emerald-300 hover:bg-emerald-700 text-white';
    if (val.includes('quí')) return 'bg-rose-600 ring-rose-300 hover:bg-rose-700 text-white';
    if (val.includes('biol')) return 'bg-[#78350f] ring-amber-850 hover:bg-amber-900 text-white';
    if (val.includes('erg')) return 'bg-amber-400 ring-amber-200 hover:bg-amber-500 text-slate-900';
    if (val.includes('mec')) return 'bg-blue-600 ring-blue-300 hover:bg-blue-700 text-white';
    return 'bg-slate-500 text-white';
  };

  const getBadgeColors = (color: string) => {
    const val = color.toLowerCase().trim();
    if (val.includes('verd') || val.includes('fís')) {
      return 'bg-emerald-50 text-emerald-700 border border-emerald-250 font-bold';
    }
    if (val.includes('verm') || val.includes('quí')) {
      return 'bg-rose-50 text-rose-700 border border-rose-250 font-bold';
    }
    if (val.includes('marr') || val.includes('biol')) {
      return 'bg-[#78350f]/10 text-[#78350f] border border-[#78350f]/20 font-bold';
    }
    if (val.includes('amar') || val.includes('erg')) {
      return 'bg-amber-50 text-amber-800 border border-amber-250 font-bold';
    }
    if (val.includes('azul') || val.includes('mec')) {
      return 'bg-blue-50 text-blue-700 border border-blue-250 font-bold';
    }
    return 'bg-slate-100 text-slate-700 border border-slate-200';
  };

  const getMarkerBgColor = (color: string) => {
    const val = color.toLowerCase().trim();
    if (val.includes('verd') || val.includes('fís')) {
      return 'bg-emerald-600 ring-emerald-300 text-white';
    }
    if (val.includes('verm') || val.includes('quí')) {
      return 'bg-rose-600 ring-rose-300 text-white';
    }
    if (val.includes('marr') || val.includes('biol')) {
      return 'bg-[#78350f] ring-amber-700 text-white';
    }
    if (val.includes('amar') || val.includes('erg')) {
      return 'bg-amber-500 ring-amber-300 text-slate-900';
    }
    if (val.includes('azul') || val.includes('mec')) {
      return 'bg-blue-600 ring-blue-300 text-white';
    }
    return 'bg-slate-600 ring-slate-400 text-white';
  };

  const getProbColor = (prob: string) => {
    const v = prob.toLowerCase().trim();
    if (v === 'alta') return 'bg-rose-100 text-rose-800 border border-rose-200';
    if (v === 'média' || v === 'media') return 'bg-amber-100 text-amber-850 border border-amber-200';
    return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
  };

  const getImpactColor = (imp: string) => {
    const v = imp.toLowerCase().trim();
    if (v === 'grave' || v === 'crítico' || v === 'elevado' || v === 'grande') return 'bg-rose-150 text-rose-900 border border-rose-305';
    if (v === 'moderado' || v === 'médio') return 'bg-amber-150 text-amber-900 border border-amber-305';
    return 'bg-emerald-150 text-emerald-900 border border-emerald-305';
  };

  const handlePrintMap = () => {
    window.print();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm font-sans flex-1 flex flex-col min-w-0" id="mapa-riscos-tab">
      
      {/* Upper Navigation Tabs - Toggle Mode */}
      <div className="bg-slate-900 px-4 pt-3 pb-0 flex border-b border-slate-800 justify-between items-center flex-wrap gap-2">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setActiveMode('blueprint')}
            className={`px-4 py-2 text-[11px] font-extrabold uppercase rounded-t tracking-wider flex items-center gap-1.5 transition ${
              activeMode === 'blueprint' 
                ? 'bg-white text-slate-900 border border-b-white font-black' 
                : 'text-slate-350 hover:bg-slate-805 hover:text-white'
            }`}
          >
            <Layout className="w-3.5 h-3.5 text-indigo-500" />
            Criador de Planta Regulamentar (NR-05 Clássico)
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('vision')}
            className={`px-4 py-2 text-[11px] font-extrabold uppercase rounded-t tracking-wider flex items-center gap-1.5 transition ${
              activeMode === 'vision' 
                ? 'bg-white text-slate-900 border border-b-white font-black' 
                : 'text-slate-350 hover:bg-slate-805 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-safety-green" />
            Análise Inteligente por Fotos (IA Gemini)
          </button>
        </div>

        <div className="pb-2 text-[10px] text-slate-400 font-bold font-mono">
          NÍVEL DE ADEQUAÇÃO: <span className="text-safety-green">PORTARIA MTP 6.730 / CIPA / GRO</span>
        </div>
      </div>

      {/* Mode A: Classical Manual Floor Plan (blueprint) */}
      {activeMode === 'blueprint' && (
        <div className="flex-1 flex flex-col">
          
          {/* Internal Title Area */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                <Map className="w-5 h-5 text-indigo-600" />
                Criador Manual de Plantas de Riscos (SST CIPA)
              </h2>
              <p className="text-[11.5px] text-slate-550 mt-0.5 max-w-3xl leading-relaxed">
                Adicione círculos do tamanho e cor exata estipulados pela NR-05 sobre a planta modelo ou carregue o seu próprio blueprint arquitetônico. Registre desvios técnicos, perigos eminentes e imprima o documento final para afixar na fábrica.
              </p>
            </div>

            <div className="flex gap-2 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => roomPhotoInputRef.current?.click()}
                className="px-2.5 py-1.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-[10.5px] text-indigo-700 font-bold uppercase tracking-wider rounded transition flex items-center gap-1.5 cursor-pointer"
                title="Mapear cômodo físico em planta baixa 2D automaticamente"
                disabled={autogeneratingBlueprint}
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                Criar por Foto (IA)
              </button>
              <input
                type="file"
                ref={roomPhotoInputRef}
                onChange={handleRoomPhotoFileChange}
                accept="image/*"
                className="hidden"
              />

              <button
                type="button"
                onClick={() => {
                  setBlueprintBackgroundType('scratch');
                  setCustomWalls([]);
                  setCustomTexts([]);
                  setManualRisks([]);
                  setCanvaTool('wall_h');
                  showMsg("Iniciou uma planta limpa do zero! Escolha uma ferramenta abaixo e clique na folha para desenhar.");
                }}
                className="px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-[10.5px] text-emerald-700 font-bold uppercase tracking-wider rounded transition flex items-center gap-1.5 cursor-pointer font-black"
                title="Criar mapa do zero no Canva modo estruturado"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                Criar do Zero
              </button>

              <button
                type="button"
                onClick={() => blueprintFileRef.current?.click()}
                className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-[10.5px] text-slate-700 font-bold uppercase tracking-wider rounded transition flex items-center gap-1.5 cursor-pointer"
                title="Subir sua própria planta de fábrica ou setor"
              >
                <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
                Carregar Minha Planta
              </button>
              <input
                type="file"
                ref={blueprintFileRef}
                onChange={handleBlueprintFileChange}
                accept="image/*"
                className="hidden"
              />

              <button
                type="button"
                onClick={handlePrintMap}
                className="px-2.5 py-1.5 bg-slate-100 border border-slate-250 hover:bg-slate-200 text-[10.5px] text-slate-800 font-bold uppercase tracking-wider rounded transition flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-650" />
                Imprimir Mapa
              </button>
            </div>
          </div>

          {message && (
            <div className="p-3 text-[11px] bg-emerald-50 border-b border-emerald-150 text-emerald-850 flex items-center gap-2.5 transition animate-fade-in font-sans">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{message.text}</span>
            </div>
          )}

          {/* Main Workspace Workspace layout block */}
          <div className="p-4 xl:p-5 flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
              
              {/* LEFT PART: Standard interactive NR-05 legend framework */}
              <div className="xl:col-span-3 space-y-4">
                
                {/* Legenda Clássica Frame */}
                <div className="bg-white border-2 border-slate-800/80 p-3 rounded shadow-sm bg-stone-50/50">
                  <div className="bg-slate-800 text-white text-center p-1.5 py-1 text-[10.5px] font-black uppercase tracking-wider rounded-sm mb-3">
                    LEGENDA DA NR-05
                  </div>

                  {/* Section: Circle colors / Categories */}
                  <div className="space-y-2 mb-4 border-b border-slate-200 pb-3">
                    <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest block mb-1">
                      Grupo por Cores (SST)
                    </span>
                    
                    <div className="space-y-1 text-[11px] font-semibold text-slate-700">
                      <div className="flex items-center gap-2.5">
                        <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 border border-white shrink-0 shadow-sm" />
                        <span>Risco Físico</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="w-3.5 h-3.5 rounded-full bg-rose-600 border border-white shrink-0 shadow-sm" />
                        <span>Risco Químico</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="w-3.5 h-3.5 rounded-full bg-[#78350f] border border-white shrink-0 shadow-sm" />
                        <span>Risco Biológico</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="w-3.5 h-3.5 rounded-full bg-amber-400 border border-white shrink-0 shadow-sm" />
                        <span>Risco Ergonômico</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="w-3.5 h-3.5 rounded-full bg-blue-600 border border-white shrink-0 shadow-sm" />
                        <span>Risco Mecânico</span>
                      </div>
                    </div>
                  </div>

                  {/* Section: Circle sizes / Intensities */}
                  <div className="space-y-3 pb-1">
                    <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest block mb-1">
                      Dimensões da Intensidade
                    </span>

                    <div className="space-y-2 text-[10.5px] font-semibold text-slate-700">
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full border border-slate-700 bg-white shadow-inner flex items-center justify-center font-bold text-[8px] text-slate-550 shrink-0">
                          P
                        </span>
                        <div>
                          <span className="block font-bold">Risco Pequeno (Leve)</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full border border-slate-700 bg-white shadow-inner flex items-center justify-center font-bold text-[9px] text-slate-550 shrink-0">
                          M
                        </span>
                        <div>
                          <span className="block font-bold">Risco Médio (Moderado)</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="w-12 h-12 rounded-full border border-slate-700 bg-white shadow-inner flex items-center justify-center font-bold text-[10px] text-slate-550 shrink-0">
                          G
                        </span>
                        <div>
                          <span className="block font-bold">Risco Elevado (Grave)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                 {/* Canva Builder Tools Selector */}
                <div className="bg-slate-900 text-white p-3.5 rounded border border-slate-800 shadow-md space-y-2">
                  <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-[#10b981] flex items-center gap-1.5 pb-2 border-b border-slate-800">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    Ferramenta Ativa Do Canva
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setCanvaTool('risk')}
                      className={`p-2 rounded font-extrabold text-[9.5px] uppercase tracking-wider border flex flex-col items-center justify-center gap-1.5 transition ${
                        canvaTool === 'risk'
                          ? 'bg-[#10b981] text-slate-950 border-[#10b981] font-black'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5 text-emerald-350" />
                      Fixar Risco
                    </button>

                    <button
                      type="button"
                      onClick={() => setCanvaTool('text')}
                      className={`p-2 rounded font-extrabold text-[9.5px] uppercase tracking-wider border flex flex-col items-center justify-center gap-1.5 transition ${
                        canvaTool === 'text'
                          ? 'bg-amber-450 text-slate-950 border-amber-400 font-black'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                      }`}
                    >
                      <Type className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                      Rótulo Texto
                    </button>

                    <button
                      type="button"
                      onClick={() => setCanvaTool('wall_h')}
                      className={`p-2 rounded font-extrabold text-[9.5px] uppercase tracking-wider border flex flex-col items-center justify-center gap-1.5 transition ${
                        canvaTool === 'wall_h'
                          ? 'bg-sky-500 text-white border-sky-400 font-black'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                      }`}
                    >
                      <span className="h-1.5 w-6 bg-current rounded-full" />
                      Parede H.
                    </button>

                    <button
                      type="button"
                      onClick={() => setCanvaTool('wall_v')}
                      className={`p-2 rounded font-extrabold text-[9.5px] uppercase tracking-wider border flex flex-col items-center justify-center gap-1.5 transition ${
                        canvaTool === 'wall_v'
                          ? 'bg-sky-500 text-white border-sky-400 font-black'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                      }`}
                    >
                      <span className="h-6 w-1.5 bg-current rounded-full" />
                      Parede V.
                    </button>
                  </div>

                  {/* Option to automatically snap walls / join walls */}
                  <div className="pt-2.5 mt-2 border-t border-slate-800 flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        Junção Automática
                      </span>
                      <span className="text-[9px] text-[#22c55e] font-sans">
                        Funde as paredes ao encostar 📐
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSnapToWalls(!snapToWalls);
                        showMsg(!snapToWalls ? "Junção de divisórias ativada! 🧲" : "Junção de divisórias desativada.");
                      }}
                      className={`px-2.5 py-1 rounded text-[9.5px] font-black uppercase tracking-wider border cursor-pointer transition-all ${
                        snapToWalls
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 hover:bg-emerald-400'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                      }`}
                    >
                      {snapToWalls ? 'ATIVADO (🧲)' : 'DESATIVADO'}
                    </button>
                  </div>
                </div>

                {/* SELECTED WALL CONTROL PANEL */}
                {selectedWallId && (() => {
                  const wall = customWalls.find(w => w.id === selectedWallId);
                  if (!wall) return null;
                  const currentRotation = wall.rotation || 0;
                  const currentThickness = wall.thickness !== undefined ? wall.thickness : 6;
                  const currentLength = wall.tipo === 'horizontal' ? wall.width_pct : wall.height_pct;

                  return (
                    <div className="bg-slate-900 border-2 border-amber-400 text-white p-3.5 rounded shadow-lg space-y-3.5">
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                        <span className="text-[10px] font-black uppercase text-amber-400 font-mono flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-amber-400 animate-pulse" />
                          Ajustes Rápidos da Divisória
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedWallId(null)}
                          className="text-slate-400 hover:text-white text-xs cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Info Notice about dragging */}
                      <div className="p-2 bg-indigo-950/60 border border-indigo-500/30 rounded text-[9px] text-indigo-200 leading-relaxed font-sans flex items-start gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                        <div>
                          <strong>Arraste para Mover:</strong> Clique e segure a divisória diretamente na planta para arrastar livremente!
                        </div>
                      </div>

                      {/* LOCK / FIX WALL BUTTON */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedWallId(null);
                          showMsg("Divisória fixada e salva com sucesso! 📌");
                        }}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] uppercase py-2.5 px-3 rounded transition flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-emerald-500/20 active:scale-[0.98] border border-emerald-300"
                        title="Fixar e bloquear edição da divisória"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Concluir e Fixar Divisória
                      </button>

                      <div className="space-y-3 font-sans">
                        
                        {/* Tipo de parede info */}
                        <div className="flex items-center justify-between text-[11px] text-slate-350 bg-slate-950 p-2 rounded border border-slate-800 font-mono">
                          <span>Esquema: <strong>{wall.tipo === 'horizontal' ? 'Horizontal ▬▬' : 'Vertical ▮▮'}</strong></span>
                          <span>ID: <strong className="text-[9px] text-slate-500">{wall.id.split('-')[1] || wall.id}</strong></span>
                        </div>

                        {/* Adjust length (Tamanho / Comprimento) */}
                        <div className="space-y-1.5 border-t border-slate-850 pt-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-extrabold text-slate-300 uppercase tracking-wider">Ajustar Comprimento</span>
                            <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 text-emerald-400 font-bold rounded font-mono">{currentLength}%</span>
                          </div>
                          
                          <input 
                            type="range"
                            min="2"
                            max="100"
                            step="1"
                            value={currentLength}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              setCustomWalls(customWalls.map(w => w.id === wall.id ? {
                                ...w,
                                width_pct: w.tipo === 'horizontal' ? val : w.width_pct,
                                height_pct: w.tipo === 'vertical' ? val : w.height_pct
                              } : w));
                            }}
                            className="w-full accent-emerald-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
                          />

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setCustomWalls(customWalls.map(w => w.id === wall.id ? {
                                  ...w,
                                  width_pct: w.tipo === 'horizontal' ? Math.min(100, w.width_pct + 2) : w.width_pct,
                                  height_pct: w.tipo === 'vertical' ? Math.min(100, w.height_pct + 2) : w.height_pct
                                } : w));
                              }}
                              className="bg-slate-800 hover:bg-slate-750 text-emerald-400 border border-slate-700 font-black text-[9px] uppercase py-1 rounded transition flex items-center justify-center gap-1 cursor-pointer"
                            >
                              + Esticar (+2%)
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => {
                                setCustomWalls(customWalls.map(w => w.id === wall.id ? {
                                  ...w,
                                  width_pct: w.tipo === 'horizontal' ? Math.max(2, w.width_pct - 2) : w.width_pct,
                                  height_pct: w.tipo === 'vertical' ? Math.max(2, w.height_pct - 2) : w.height_pct
                                } : w));
                              }}
                              className="bg-slate-800 hover:bg-slate-750 text-rose-400 border border-slate-700 font-black text-[9px] uppercase py-1 rounded transition flex items-center justify-center gap-1 cursor-pointer"
                            >
                              - Encolher (-2%)
                            </button>
                          </div>
                        </div>

                        {/* Adjust thickness (Afinar / Engrossar) */}
                        <div className="space-y-1.5 border-t border-slate-850 pt-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-extrabold text-slate-300 uppercase tracking-wider">Ajustar Espessura (Fino/Grosso)</span>
                            <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 text-sky-400 font-bold rounded font-mono">{currentThickness}px</span>
                          </div>

                          <input 
                            type="range"
                            min="2"
                            max="30"
                            step="1"
                            value={currentThickness}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              setCustomWalls(customWalls.map(w => w.id === wall.id ? {
                                ...w,
                                thickness: val
                              } : w));
                            }}
                            className="w-full accent-sky-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
                          />

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setCustomWalls(customWalls.map(w => w.id === wall.id ? {
                                  ...w,
                                  thickness: Math.min(30, currentThickness + 1)
                                } : w));
                              }}
                              className="bg-slate-800 hover:bg-slate-750 text-sky-400 border border-slate-700 font-black text-[9px] uppercase py-1 rounded transition flex items-center justify-center gap-1 cursor-pointer"
                              title="Engrossar"
                            >
                              Engrossar (+)
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => {
                                setCustomWalls(customWalls.map(w => w.id === wall.id ? {
                                  ...w,
                                  thickness: Math.max(1, currentThickness - 1)
                                } : w));
                              }}
                              className="bg-slate-800 hover:bg-slate-750 text-sky-300 border border-slate-700 font-black text-[9px] uppercase py-1 rounded transition flex items-center justify-center gap-1 cursor-pointer"
                              title="Afinar"
                            >
                              Afinar (-)
                            </button>
                          </div>
                        </div>

                        {/* Adjust rotation (Girar) */}
                        <div className="space-y-1.5 border-t border-slate-850 pt-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-extrabold text-slate-300 uppercase tracking-wider block">Girar Rotação (Angulação)</span>
                            <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 text-amber-400 font-bold rounded font-mono">{currentRotation}°</span>
                          </div>

                          <input 
                            type="range"
                            min="0"
                            max="360"
                            step="5"
                            value={currentRotation}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              setCustomWalls(customWalls.map(w => w.id === wall.id ? {
                                ...w,
                                rotation: val
                              } : w));
                            }}
                            className="w-full accent-amber-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
                          />

                          <div className="flex flex-col gap-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomWalls(customWalls.map(w => w.id === wall.id ? {
                                    ...w,
                                    rotation: (currentRotation + 15) % 360
                                  } : w));
                                }}
                                className="bg-slate-800 hover:bg-slate-750 text-amber-300 border border-slate-700 font-black text-[9px] py-1 rounded transition text-center cursor-pointer"
                              >
                                Girar +15°
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomWalls(customWalls.map(w => w.id === wall.id ? {
                                    ...w,
                                    rotation: (currentRotation - 15 + 360) % 360
                                  } : w));
                                }}
                                className="bg-slate-800 hover:bg-slate-750 text-amber-300 border border-slate-700 font-black text-[9px] py-1 rounded transition text-center cursor-pointer"
                              >
                                Girar -15°
                              </button>
                            </div>

                            {/* Preset Buttons */}
                            <div className="grid grid-cols-4 gap-1 text-[8.5px]">
                              {[0, 45, 90, 180].map((presetAngle) => (
                                <button
                                  key={presetAngle}
                                  type="button"
                                  onClick={() => {
                                    setCustomWalls(customWalls.map(w => w.id === wall.id ? {
                                      ...w,
                                      rotation: presetAngle
                                    } : w));
                                  }}
                                  className={`py-0.5 rounded border transition font-mono ${
                                    currentRotation === presetAngle
                                      ? 'bg-amber-400 border-amber-400 text-slate-950 font-extrabold'
                                      : 'bg-slate-850 hover:bg-slate-800 text-slate-350 border-slate-750'
                                  }`}
                                >
                                  {presetAngle}°
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Precision Position offsets (Deslizar Posição) */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-850">
                          <span className="block text-[9px] font-extrabold text-slate-300 uppercase tracking-wider text-center">Teclado Direcional (Ajuste Fino)</span>
                          
                          <div className="flex flex-col items-center gap-1">
                            {/* Up Arrow */}
                            <button
                              type="button"
                              onClick={() => {
                                setCustomWalls(customWalls.map(w => w.id === wall.id ? { ...w, y_pct: Math.max(0, w.y_pct - 1) } : w));
                              }}
                              className="p-1 px-3.5 bg-slate-800 hover:bg-slate-750 border border-slate-750 rounded text-[11px] text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                              title="Subir Divisória (-1% Y)"
                            >
                              ▲ Subir
                            </button>

                            {/* Left and Right Arrows */}
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomWalls(customWalls.map(w => w.id === wall.id ? { ...w, x_pct: Math.max(0, w.x_pct - 1) } : w));
                                }}
                                className="p-1 px-3 bg-slate-800 hover:bg-slate-750 border border-slate-750 rounded text-[11px] text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                                title="Mover para Esquerda (-1% X)"
                              >
                                ◀ Esq.
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomWalls(customWalls.map(w => w.id === wall.id ? { ...w, x_pct: Math.min(100 - (w.width_pct || 2), w.x_pct + 1) } : w));
                                }}
                                className="p-1 px-3 bg-slate-800 hover:bg-slate-750 border border-slate-750 rounded text-[11px] text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                                title="Mover para Direita (+1% X)"
                              >
                                Dir. ▶
                              </button>
                            </div>

                            {/* Down Arrow */}
                            <button
                              type="button"
                              onClick={() => {
                                setCustomWalls(customWalls.map(w => w.id === wall.id ? { ...w, y_pct: Math.min(100 - (w.height_pct || 2), w.y_pct + 1) } : w));
                              }}
                              className="p-1 px-3.5 bg-slate-800 hover:bg-slate-750 border border-slate-750 rounded text-[11px] text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                              title="Descer Divisória (+1% Y)"
                            >
                              ▼ Descer
                            </button>
                          </div>
                        </div>

                        {/* Absolute Delete Button */}
                        <div className="pt-2 border-t border-slate-850">
                          <button
                            type="button"
                            onClick={() => {
                              setCustomWalls(customWalls.filter(w => w.id !== wall.id));
                              setSelectedWallId(null);
                              showMsg("Divisória excluída com sucesso.");
                            }}
                            className="w-full bg-rose-600 hover:bg-rose-500 font-black text-[10px] uppercase py-2.5 rounded transition flex items-center justify-center gap-1.5 cursor-pointer shadow"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-white" />
                            Excluir Divisória
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Inline sector label text editor */}
                {editingTextId && (
                  <div className="bg-slate-900 border-2 border-amber-400/80 text-white p-3.5 rounded shadow">
                    <h4 className="text-[10px] font-black uppercase text-amber-450 mb-2 font-mono flex items-center justify-between">
                      <span>Editar Nome da Divisão / Rótulo</span>
                      <button 
                        type="button" 
                        onClick={() => setEditingTextId(null)}
                        className="text-slate-450 hover:text-white"
                      >
                        ✕
                      </button>
                    </h4>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={textInputValue}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTextInputValue(val);
                          setCustomTexts(customTexts.map(t => t.id === editingTextId ? { ...t, text: val } : t));
                        }}
                        className="w-full bg-slate-800 border-2 border-slate-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-amber-400 font-bold text-amber-400 font-mono"
                        placeholder="Ex: Almoxarifado"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setEditingTextId(null)}
                        className="w-full bg-slate-800 hover:bg-slate-750 text-[10px] uppercase font-bold py-1 rounded cursor-pointer"
                      >
                        Salvar e Fechar
                      </button>
                    </div>
                  </div>
                )}

                {/* Interactive Tool selector toolbox */}
                <div className={`bg-slate-900 text-white p-3.5 rounded border border-slate-800 transition ${canvaTool !== 'risk' ? 'opacity-40 hover:opacity-100' : ''}`}>
                  <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-[#10b981] mb-2.5 flex items-center gap-1">
                    <Palette className="w-4 h-4" />
                    Bandeira de Risco Ativa
                  </h3>

                  <div className="space-y-3 text-xs">
                    {/* Size list picker selection */}
                    <div>
                      <span className="block font-bold text-slate-350 text-[10px] uppercase mb-1">
                        1. Tamanho (Intensidade):
                      </span>
                      <div className="grid grid-cols-3 gap-1">
                        {(['Pequeno', 'Médio', 'Elevado'] as const).map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setBlueprintToolSize(sz)}
                            className={`p-1.5 rounded font-extrabold text-[10px] border transition ${
                              blueprintToolSize === sz 
                                ? 'bg-indigo-600 text-white border-indigo-500' 
                                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                            }`}
                          >
                            {sz === 'Pequeno' ? 'P (Pequeno)' : sz === 'Médio' ? 'M (Médio)' : 'G (Elevado)'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Category color list picker selection */}
                    <div>
                      <span className="block font-bold text-slate-350 text-[10px] uppercase mb-15">
                        2. Categoria (Grupo):
                      </span>
                      <div className="space-y-1">
                        {(['Físico', 'Químico', 'Biológico', 'Ergonômico', 'Mecânico'] as const).map((cat) => {
                          const isSel = blueprintToolCategory === cat;
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setBlueprintToolCategory(cat)}
                              className={`w-full text-left p-1.5 px-2 rounded border font-semibold text-[11px] flex items-center justify-between transition ${
                                isSel 
                                  ? 'bg-slate-805 text-[#10b981] border-slate-700' 
                                  : 'bg-slate-800 text-slate-300 border-slate-750 hover:bg-slate-750'
                              }`}
                            >
                              <span className="flex items-center gap-1.5">
                                <span className={`w-2.5 h-2.5 rounded-full ${
                                  cat === 'Físico' ? 'bg-emerald-500' :
                                  cat === 'Químico' ? 'bg-rose-500' :
                                  cat === 'Biológico' ? 'bg-[#92400e]' :
                                  cat === 'Ergonômico' ? 'bg-amber-400' : 'bg-blue-500'
                                }`} />
                                {cat}
                              </span>
                              {isSel && <CheckCircle className="w-3.5 h-3.5 text-[#10b981]" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="p-2 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-300 space-y-1.5">
                      <strong className="text-white block uppercase tracking-wider text-[9px] text-[#38bdf8]">
                        Instruções de Fixação:
                      </strong>
                      <p className="leading-snug">
                        Selecione as opções desejadas acima e em seguida <strong className="text-[#10b981]">CLIQUE em qualquer parte da planta industrial à direita</strong> para fixar o círculo de risco local!
                      </p>
                    </div>

                    {blueprintBackgroundType === 'uploaded' && (
                      <button
                        type="button"
                        onClick={() => {
                          setBlueprintBackgroundType('default');
                          setCustomBlueprintImage(null);
                          showMsg("Voltou para a planta modelo padrão do sistema.");
                        }}
                        className="w-full py-1.5 bg-slate-800 hover:bg-slate-750 text-[10px] font-bold uppercase tracking-wider rounded border border-slate-700 mt-1 cursor-pointer text-slate-350"
                      >
                        Reiniciar Planta Modelo
                      </button>
                    )}
                  </div>
                </div>

              </div>

              {/* CENTER COMPONENT: Floor Plan Canvas area (where elements are rendered) */}
              <div className="xl:col-span-9 flex flex-col gap-4">

                <div className="bg-slate-100 p-2 border border-slate-205 rounded flex justify-between items-center bg-stone-50">
                  <span className="text-[10.5px] font-mono text-slate-500 font-bold uppercase tracking-wider">
                    Planta Baixa: {blueprintBackgroundType === 'default' ? 'MODELO ESQUEMÁTICO INTEGRADO (NR-05 DE FÁBRICA)' : 'SUA IMAGEM CUSTOMIZADA'}
                  </span>
                  <span className="text-[9px] bg-slate-900 text-white px-2 py-0.5 rounded uppercase font-black tracking-widest font-mono">
                    {manualRisks.length} Círculos Afixados
                  </span>
                </div>

                {/* THE CORE DRAWING SHEET */}
                <div className="bg-slate-200 border-4 border-slate-950 rounded-lg p-1.5 shadow-md overflow-x-auto">
                  <div className="min-w-[700px]">
                    <div 
                      onClick={handleBlueprintCanvasClick}
                      onMouseMove={handleCanvasMouseMove}
                      onMouseUp={handleCanvasMouseUp}
                      onMouseLeave={handleCanvasMouseUp}
                      className="relative w-full aspect-[2/1] bg-white border border-slate-300 select-none overflow-hidden cursor-crosshair rounded"
                    >
                      {autogeneratingBlueprint && (
                        <div className="absolute inset-0 bg-slate-900/95 z-50 flex flex-col items-center justify-center text-white p-6" onClick={(e) => e.stopPropagation()}>
                          <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mb-3.5" />
                          <p className="text-[11px] uppercase font-black tracking-widest text-emerald-400 animate-bounce">
                            IA Desenhadora Ativa (Gemini)
                          </p>
                          <p className="text-[11px] text-slate-300 max-w-md text-center leading-relaxed mt-2 font-mono">
                            Analisando proporções visuais do cômodo pela foto para autogerar as paredes de divisórias 2D, etiquetas identificadoras e riscos de conformidade (NR-05)...
                          </p>
                          <div className="w-48 bg-slate-800 h-1 rounded-full overflow-hidden mt-4">
                            <div className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full animate-pulse" style={{ width: '85%' }} />
                          </div>
                        </div>
                      )}
                      
                      {blueprintBackgroundType === 'uploaded' && customBlueprintImage ? (
                        /* Case: Custom Uploaded Blueprint Image as Workspace */
                        <img 
                          src={customBlueprintImage} 
                          alt="Custom industrial blueprint" 
                          className="w-full h-full object-contain bg-white"
                          referrerPolicy="no-referrer"
                        />
                      ) : blueprintBackgroundType === 'scratch' ? (
                        /* Case: Canva Draft Grid Space from Scratch */
                        <div className="absolute inset-0 bg-[#f8fafc] bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20.5px_20.5px] border-2 border-slate-900 flex flex-col justify-between p-4 font-sans text-slate-800">
                          <div className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider select-none pointer-events-none">
                            Draft Canva Workspace 100x100
                          </div>
                          {customWalls.length === 0 && customTexts.length === 0 && (
                            <div className="m-auto text-center font-mono max-w-sm pointer-events-none select-none bg-white p-4 rounded border border-slate-200 shadow-sm">
                              <p className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center justify-center gap-1">
                                <Sparkles className="w-4 h-4 text-amber-500" />
                                Planta Baixa Do Zero
                              </p>
                              <p className="text-[9px] text-slate-400 mt-1 leading-relaxed">
                                Use o menu lateral esquerdo "Ferramenta Ativa Do Canva" para escolher entre <strong>Paredes H, Paredes V ou Rótulos</strong> e clique na área acima para desenhar!
                              </p>
                            </div>
                          )}
                          <div className="text-[8px] font-mono text-slate-350 select-none pointer-events-none text-right">
                            Eixos de Alinhamento Magnético Estáveis
                          </div>
                        </div>
                      ) : (
                        /* Case: Default Schematic Architectural Floor Plan exactly like the request image! */
                        <div className="absolute inset-0 w-full h-full p-2 grid grid-cols-12 grid-rows-6 gap-0 bg-white font-sans text-slate-900 border-2 border-slate-900">
                          
                          {/* Room: Depósito (Left Tall area) */}
                          <div className="col-span-3 row-span-6 border-r-3 border-slate-900 flex flex-col justify-between p-2.5 bg-stone-50/10">
                            <span className="text-[9px] font-mono uppercase bg-slate-150 p-1 font-bold text-center border border-slate-200 block rounded self-start">
                              S-01
                            </span>
                            <span className="text-[14px] font-black uppercase text-slate-900 text-center tracking-widest font-mono self-center">
                              Depósito
                            </span>
                            <span />
                          </div>

                          {/* Room: Cozinha */}
                          <div className="col-span-2 row-span-3 border-r-3 border-b-3 border-slate-900 flex flex-col justify-between p-2">
                            <span className="text-[14px] font-black uppercase text-slate-900 text-center tracking-widest self-center m-auto font-mono">
                              Cozinha
                            </span>
                          </div>

                          {/* Room: Contabilidade (Cont.) */}
                          <div className="col-span-1 row-span-2 border-r-2 border-b-3 border-slate-900 flex p-1.5 bg-[#fef08a]/5">
                            <span className="text-[11px] font-extrabold uppercase text-slate-900 text-center self-end m-auto font-mono">
                              Cont.
                            </span>
                          </div>

                          {/* Room: Recursos Humanos (RH) */}
                          <div className="col-span-1 row-span-2 border-r-3 border-b-3 border-slate-900 flex p-1.5 justify-center">
                            <span className="text-[11px] font-extrabold uppercase text-slate-900 text-center self-end m-auto font-mono">
                              RH
                            </span>
                          </div>

                          {/* Room: Sanitários Masc / Fem */}
                          <div className="col-span-1 row-span-2 border-r-3 border-b-3 border-slate-950 grid grid-cols-1 sm:grid-cols-2">
                            <div className="border-r border-slate-900 flex items-center justify-center p-1 bg-stone-50">
                              <span className="text-[9px] font-extrabold text-slate-700 font-mono text-center">Masc</span>
                            </div>
                            <div className="flex items-center justify-center p-1 bg-stone-50">
                              <span className="text-[9px] font-extrabold text-slate-700 font-mono text-center">Fem</span>
                            </div>
                          </div>

                          {/* Room: Diretoria */}
                          <div className="col-span-2 row-span-3 border-r-3 border-b-3 border-slate-900 flex p-2">
                            <span className="text-[13px] font-black uppercase text-slate-900 text-center tracking-widest m-auto font-mono">
                              Diretoria
                            </span>
                          </div>

                          {/* Room: Telemarketing (Telemark.) */}
                          <div className="col-span-2 row-span-1.5 border-b-2 border-slate-905 flex p-1 justify-center items-center">
                            <span className="text-[11px] font-extrabold uppercase text-slate-900 text-center font-mono">
                              Telemark.
                            </span>
                          </div>

                          {/* Lower Right: Recepção */}
                          <div className="col-span-1 row-span-3 border-l-3 border-b-3 border-slate-900 flex p-2 bg-stone-50/20">
                            <span className="text-[11px] font-extrabold uppercase text-slate-900 text-center tracking-widest leading-snug m-auto font-mono">
                              Recepção
                            </span>
                          </div>

                          {/* Room: T.I. */}
                          <div className="col-span-2 row-span-1.5 border-b-3 border-slate-900 flex p-1 bg-stone-100 flex-col items-center justify-center">
                            <span className="text-[11px] font-black uppercase text-slate-900 text-center font-mono">
                              T.I.
                            </span>
                          </div>

                          {/* Room: Vestuário / V.C. (Lower layout corridor boundary) */}
                          <div className="col-span-2 row-span-1.5 border-t-3 border-r-3 border-slate-900 flex p-1 items-end justify-center">
                            <span className="text-[10px] font-extrabold uppercase text-slate-900 font-mono">
                              Vestiário & WC
                            </span>
                          </div>

                          {/* Room: Produção (Grande área industrial) */}
                          <div className="col-span-4 row-span-3 border-t-3 border-r-3 border-slate-900 flex items-center justify-center bg-stone-50/5 p-4">
                            <span className="text-[16px] font-black uppercase text-slate-900 tracking-widest font-mono">
                              Produção
                            </span>
                          </div>

                          {/* Room: C.Q (Controle de Qualidade) */}
                          <div className="col-span-1 row-span-1.5 border-t-3 border-r-3 border-slate-900 flex items-center justify-center">
                            <span className="text-[11px] font-bold text-slate-800 text-center uppercase leading-none font-mono">
                              C.Q
                            </span>
                          </div>

                          {/* Room: Logística */}
                          <div className="col-span-1 row-span-1.5 border-t-3 border-b-3 border-slate-900 flex items-center justify-center">
                            <span className="text-[11px] font-bold text-slate-800 text-center uppercase leading-none font-mono">
                              Logística
                            </span>
                          </div>

                          {/* Middle Central Horizontal corridor label placeholder */}
                          <div className="absolute top-[50%] left-[30%] -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Corredor Principal de Tráfego</span>
                          </div>

                        </div>
                      )}

                      {/* PLOTTED DYNAMIC CUSTOM WALLS (Canva Mode) */}
                      {customWalls.map((wall) => {
                        const isSelected = selectedWallId === wall.id;
                        const isDraggingWall = draggedWallId === wall.id;
                        const rotationAngle = wall.rotation || 0;
                        const currentThickness = wall.thickness !== undefined ? wall.thickness : 6;

                        return (
                          <div
                            key={wall.id}
                            style={{
                              left: `${wall.x_pct}%`,
                              top: `${wall.y_pct}%`,
                              width: `${wall.width_pct}%`,
                              height: `${wall.height_pct}%`,
                              minHeight: wall.tipo === 'horizontal' ? '24px' : `${wall.height_pct}%`,
                              minWidth: wall.tipo === 'vertical' ? '24px' : `${wall.width_pct}%`,
                              transform: `rotate(${rotationAngle}deg)`,
                              transformOrigin: 'center center'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedWallId(wall.id);
                              showMsg("Divisória de parede selecionada! Ajuste o comprimento, espessura, rotação ou posição.");
                            }}
                            onMouseDown={(e) => handleWallMouseDown(e, wall.id)}
                            className={`absolute z-20 flex items-center justify-center transition-shadow select-none ${
                              isDraggingWall 
                                ? 'cursor-grabbing bg-indigo-500/10 ring-2 ring-indigo-400 rounded-sm shadow-[0_0_12px_rgba(99,102,241,0.4)]' 
                                : isSelected 
                                  ? 'cursor-grab bg-amber-400/15 ring-2 ring-amber-400 rounded-sm' 
                                  : 'cursor-grab hover:bg-slate-500/10 rounded-sm'
                            }`}
                            title="Arraste para mover, ou clique para selecionar"
                          >
                            {/* The Visible Solid Line */}
                            <div 
                              style={{
                                height: wall.tipo === 'horizontal' ? `${currentThickness}px` : '100%',
                                width: wall.tipo === 'vertical' ? `${currentThickness}px` : '100%',
                              }}
                              className={`rounded transition-all ${
                                isSelected 
                                  ? 'bg-amber-500 shadow-[0_0_10px_#f59e0b]' 
                                  : 'bg-slate-800'
                              }`} 
                            />

                            {/* No floating popup over the wall line to avoid blocking visualization */}
                          </div>
                        );
                      })}

                      {/* PLOTTED DYNAMIC CUSTOM TEXT LABELS (Canva Mode) */}
                      {customTexts.map((txt) => {
                        const isEditing = editingTextId === txt.id;
                        return (
                          <div
                            key={txt.id}
                            style={{
                              left: `${txt.x_pct}%`,
                              top: `${txt.y_pct}%`
                            }}
                            className={`absolute -translate-x-1/2 -translate-y-1/2 z-10 group px-2 py-0.5 rounded border text-[10.5px] font-black uppercase font-mono tracking-tight cursor-pointer shadow-sm transition ${
                              isEditing 
                                ? 'bg-amber-400 border-amber-500 text-slate-950 scale-105' 
                                : 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-white hover:text-amber-950 hover:scale-105'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTextId(txt.id);
                              setTextInputValue(txt.text);
                            }}
                          >
                            <span>{txt.text}</span>
                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:flex bg-slate-900 text-white text-[8px] px-1.5 py-0.5 rounded shadow-lg items-center gap-1.5 z-40 shrink-0 select-none">
                              <span>Clique para Editar</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCustomTexts(customTexts.filter(t => t.id !== txt.id));
                                  if (editingTextId === txt.id) {
                                    setEditingTextId(null);
                                  }
                                  showMsg("Rótulo de texto removido.");
                                }}
                                className="px-1 bg-rose-600 hover:bg-rose-500 rounded font-black cursor-pointer"
                              >
                                Apagar
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {/* PLOTTED CIRCLES (MAPPED RISKS ON THE BLUEPRINT) */}
                      {manualRisks.map((item, idx) => {
                        const isSelected = activeManualRiskIndex === idx;
                        const sizePx = item.intensidade === 'Pequeno' ? 'w-6 h-6 text-[9px]' : item.intensidade === 'Médio' ? 'w-10 h-10 text-[11px]' : 'w-14 h-14 text-[13px]';
                        
                        // Select colors from standard NR-05 mapping
                        let circleBgColor = 'bg-emerald-600';
                        if (item.categoria === 'Químico') circleBgColor = 'bg-rose-600';
                        else if (item.categoria === 'Biológico') circleBgColor = 'bg-[#78350f]';
                        else if (item.categoria === 'Ergonômico') circleBgColor = 'bg-amber-400';
                        else if (item.categoria === 'Mecânico') circleBgColor = 'bg-blue-600';

                        // Calculate visual labels
                        const refAbbrev = item.intensidade === 'Pequeno' ? 'P' : item.intensidade === 'Médio' ? 'M' : 'G';

                        return (
                          <div
                            key={item.id}
                            style={{ left: `${item.x_pct}%`, top: `${item.y_pct}%` }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveManualRiskIndex(idx);
                              setNewRiskCoords(null);
                            }}
                            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-slate-900 shadow-lg flex items-center justify-center font-black cursor-pointer transition-all duration-300 select-none text-white ${sizePx} ${circleBgColor} ${
                              isSelected ? 'scale-115 ring-4 ring-offset-2 ring-slate-900 z-30 font-black' : 'opacity-90 hover:scale-115 z-20 hover:z-30'
                            }`}
                            title={`${item.setor} - Risco ${item.categoria} (${item.intensidade})`}
                          >
                            <span className={item.categoria === 'Ergonômico' ? 'text-slate-900' : 'text-white'}>
                              {refAbbrev}
                            </span>
                          </div>
                        );
                      })}

                      {/* Locator pin indicating click coordinate */}
                      {newRiskCoords && (
                        <div
                          style={{ left: `${newRiskCoords.x}%`, top: `${newRiskCoords.y}%` }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 bg-indigo-650 text-white rounded-full flex items-center justify-center font-extrabold text-xs shadow-xl ring-4 ring-amber-400 z-40 animate-bounce"
                        >
                          +
                        </div>
                      )}

                    </div>
                  </div>
                </div>

                {/* COORDINATES CONFIGURATION OVERLAY FORM (Triggers when clicked on floor-plan) */}
                {newRiskCoords && (
                  <form onSubmit={handleAddManualRisk} className="bg-slate-900 text-white p-4 rounded border border-slate-800 animate-in fade-in slide-in-from-top-4 duration-200">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-3">
                      <div className="flex items-center gap-1.5">
                        <PlusCircle className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-[11.5px] font-black uppercase text-white font-mono">
                          Confirmar Parâmetros do Novo Risco
                        </h4>
                      </div>
                      <span className="bg-slate-800 text-amber-400 px-2.5 py-0.5 border border-slate-700 text-[10px] font-mono font-bold rounded">
                        Coordenadas Fixadas: X: {newRiskCoords.x}%, Y: {newRiskCoords.y}%
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs mb-3">
                      <div>
                        <label className="block text-slate-350 font-bold mb-1 uppercase text-[9px]">Setor / Divisão:</label>
                        <input
                          type="text"
                          required
                          value={tempSectorName}
                          onChange={(e) => setTempSectorName(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-705 rounded px-2.5 py-1 text-[11px] focus:outline-none focus:border-indigo-500 font-bold text-[#38bdf8]"
                          placeholder="Ex: Produção"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-350 font-bold mb-1 uppercase text-[9px]">Grupo de Risco Ativo:</label>
                        <select
                          value={blueprintToolCategory}
                          onChange={(e) => setBlueprintToolCategory(e.target.value as any)}
                          className="w-full bg-slate-800 border border-slate-705 rounded px-2.5 py-1 text-[11px] focus:outline-none focus:border-indigo-500 text-slate-200 font-bold"
                        >
                          <option value="Físico">Físico (Cor: Verde)</option>
                          <option value="Químico">Químico (Cor: Vermelho)</option>
                          <option value="Biológico">Biológico (Cor: Marrom)</option>
                          <option value="Ergonômico">Ergonômico (Cor: Amarelo)</option>
                          <option value="Mecânico">Mecânico / Acidente (Cor: Azul)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-350 font-bold mb-1 uppercase text-[9px]">Intensidade (NR-05):</label>
                        <select
                          value={blueprintToolSize}
                          onChange={(e) => setBlueprintToolSize(e.target.value as any)}
                          className="w-full bg-slate-800 border border-slate-705 rounded px-2.5 py-1 text-[11px] focus:outline-none focus:border-indigo-500 text-slate-200 font-bold"
                        >
                          <option value="Pequeno">Pequeno (Leve)</option>
                          <option value="Médio">Médio (Moderado)</option>
                          <option value="Elevado">Elevado (Grave)</option>
                        </select>
                      </div>

                      <div className="flex items-end justify-end gap-2 pr-1 pt-1.5 md:pt-0">
                        <button
                          type="button"
                          onClick={() => setNewRiskCoords(null)}
                          className="px-3 py-1.5 border border-slate-700 hover:bg-slate-800 text-slate-400 font-semibold text-[10px] uppercase tracking-wider rounded cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-wider rounded flex items-center gap-1 transition shadow cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Afixar</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-350 font-bold mb-1 uppercase text-[9px]">Descrição do Perigo Observado:</label>
                        <textarea
                          required
                          rows={2}
                          value={tempDescPerigo}
                          onChange={(e) => setTempDescPerigo(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-705 rounded px-2.5 py-1 text-[11px] focus:outline-none focus:border-indigo-500 text-slate-200 leading-snug"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-350 font-bold mb-1 uppercase text-[9px]">Medida Corretiva Recomendada (Normas Reguladoras):</label>
                        <textarea
                          required
                          rows={2}
                          value={tempRecomendacao}
                          onChange={(e) => setTempRecomendacao(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-705 rounded px-2.5 py-1 text-[11px] focus:outline-none focus:border-indigo-500 text-slate-200 leading-snug"
                        />
                      </div>
                    </div>
                  </form>
                )}

                {/* DETAILS POPUP FOR THE SELECTED MARKER IN BLUEPRINT */}
                {!newRiskCoords && activeManualRiskIndex !== null && manualRisks[activeManualRiskIndex] && (
                  <div className="bg-slate-900 text-white p-3.5 rounded border border-slate-800 animate-in fade-in duration-200">
                    <div className="flex justify-between items-center bg-slate-950 p-1.5 px-3 rounded mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-3.5 h-3.5 rounded-full ${
                          manualRisks[activeManualRiskIndex].categoria === 'Físico' ? 'bg-emerald-500' :
                          manualRisks[activeManualRiskIndex].categoria === 'Químico' ? 'bg-rose-500' :
                          manualRisks[activeManualRiskIndex].categoria === 'Biológico' ? 'bg-[#92400e]' :
                          manualRisks[activeManualRiskIndex].categoria === 'Ergonômico' ? 'bg-amber-400' : 'bg-blue-500'
                        }`} />
                        <span className="text-[11.5px] font-extrabold uppercase text-slate-250 font-mono">
                          Marcador Selecionado: {manualRisks[activeManualRiskIndex].setor} (#{activeManualRiskIndex + 1})
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-[9.5px] font-mono text-slate-400">
                          Coords: X:{manualRisks[activeManualRiskIndex].x_pct}%, Y:{manualRisks[activeManualRiskIndex].y_pct}%
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteManualRisk(manualRisks[activeManualRiskIndex].id)}
                          className="p-1 hover:bg-slate-800 text-rose-500 rounded transition cursor-pointer"
                          title="Remover este círculo e laudo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Diagnóstico Factual de Risco:
                        </span>
                        <p className="font-extrabold text-[#f1f5f9] leading-relaxed text-[11.5px]">
                          {manualRisks[activeManualRiskIndex].descricao_perigo}
                        </p>
                        <div className="mt-2.5 flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-slate-850 border border-slate-750 text-[10px] font-bold text-slate-200">
                            Grupo: {manualRisks[activeManualRiskIndex].categoria}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getImpactColor(manualRisks[activeManualRiskIndex].intensidade)}`}>
                            Intensidade: {manualRisks[activeManualRiskIndex].intensidade}
                          </span>
                        </div>
                      </div>

                      <div className="border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-4">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5 text-safety-green" />
                          Recomendação Legal (Norma Regulamentar):
                        </span>
                        <p className="text-slate-200 leading-snug font-medium text-[11.5px]">
                          {manualRisks[activeManualRiskIndex].recomendacao_nr}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* CHRONOLOGY TABLE OF CORRECTION ACTIONS AND RISKS BY SECTOR */}
                <div className="bg-white border border-slate-200 rounded-lg p-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1 bg-slate-50 p-1.5 rounded pr-3 border-l-4 border-l-indigo-650">
                    <UserCheck className="w-4 h-4 text-indigo-605" />
                    Cronograma Regulatório e Mapeamentos Registrados (NR-05)
                  </h3>

                  <div className="border border-slate-205 rounded overflow-hidden mt-2">
                    <table className="w-full text-left text-xs divide-y divide-slate-100">
                      <thead className="bg-slate-50 text-[10px] font-bold text-slate-550 uppercase tracking-wider col-header">
                        <tr>
                          <th className="p-2 w-12 text-center">Ref</th>
                          <th className="p-2">Setor da Planta</th>
                          <th className="p-2">Grupo de Risco (NR-05)</th>
                          <th className="p-2 text-center">Intensidade</th>
                          <th className="p-2">Desvio Detetado / Perigo</th>
                          <th className="p-2 text-right">Diretriz Reguladora Corretiva</th>
                          <th className="p-2 text-center">Remover</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 align-top text-slate-650">
                        {manualRisks.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-slate-500 font-bold uppercase text-[10.5px]">
                              Sem riscos afixados na planta regulamentar. Selecione valores e clique em qualquer parte do desenho para registrar um desvio.
                            </td>
                          </tr>
                        ) : (
                          manualRisks.map((item, index) => {
                            const isSelected = activeManualRiskIndex === index;
                            return (
                              <tr
                                key={item.id}
                                onClick={() => { setActiveManualRiskIndex(index); setNewRiskCoords(null); }}
                                className={`cursor-pointer transition duration-150 ${
                                  isSelected 
                                    ? 'bg-amber-50 border-l-4 border-l-amber-500 font-medium' 
                                    : 'hover:bg-slate-50/50'
                                }`}
                              >
                                <td className="p-2 text-center font-bold">
                                  <span className={`inline-flex items-center justify-center w-5.5 h-5.5 rounded-full text-[10px] ${
                                    isSelected ? 'bg-amber-500 text-slate-900' : 'bg-slate-100 text-slate-700'
                                  }`}>
                                    {index + 1}
                                  </span>
                                </td>

                                <td className="p-2 font-bold text-slate-900">
                                  {item.setor}
                                  <span className="block text-[8.5px] text-slate-400 font-mono mt-0.5">X:{item.x_pct}% Y:{item.y_pct}%</span>
                                </td>

                                <td className="p-2">
                                  <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider inline-block ${getBadgeColors(item.categoria)}`}>
                                    {item.categoria}
                                  </span>
                                </td>

                                <td className="p-2 text-center">
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider inline-block ${getImpactColor(item.intensidade)}`}>
                                    {item.intensidade}
                                  </span>
                                </td>

                                <td className="p-2 text-[11px] leading-snug font-semibold text-slate-800 max-w-xs truncate" title={item.descricao_perigo}>
                                  {item.descricao_perigo}
                                </td>

                                <td className="p-2 text-right text-[10.5px] text-slate-600 leading-snug font-medium max-w-sm">
                                  {item.recomendacao_nr}
                                </td>

                                <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteManualRisk(item.id)}
                                    className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-2.5 bg-yellow-50 border border-yellow-250 text-amber-900 rounded text-[10.5px] leading-relaxed flex gap-2 mt-3.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                    <p>
                      <strong>Aviso de Adequação Legal (NR-05 / CIPA / GRO):</strong> Este mapa de riscos interativo simplifica a consolidação visual de perigos realizada pela comissão CIPA. Os marcadores coloridos possuem tamanho regulamentar correspondente à gravidade (Pequeno, Médio e Grande) conforme preconizado pela legislação de segurança do trabalho brasileira. O laudo pode ser impresso e anexado em quadro oficial de avisos de cada setor operacional.
                    </p>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>
      )}

      {/* Mode B: AI Vision multi-modal (Original uploaded photo/presets) */}
      {activeMode === 'vision' && (
        <div className="flex-1 flex flex-col">
          
          {/* Header Vision description Area */}
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 uppercase tracking-tight">
              <Camera className="w-5 h-5 text-safety-green animate-pulse" />
              Verificação IA Multimodal de Fotografias Operacionais
            </h2>
            <p className="text-[11px] text-[#64748b] mt-0.5 leading-relaxed">
              Mapeamento de desvios industriais através de análise visual do Gemini. Carregue uma foto em tempo real do chão de fábrica e a IA indicará coordenadas aproximadas dos maiores riscos químicos, físicos, biológicos, mecânicos e ergonômicos observados.
            </p>
          </div>

          <div className="p-4 flex-1">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              
              {/* Left Column - Image & Interactive Plotting (5 cols) */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <div className="bg-white border border-slate-200 rounded-lg p-3 flex-1 flex flex-col justify-between">
                  <div>
                    
                    {/* Mode Selector Tabs (only visible when result exists) */}
                    {result && (
                      <div className="bg-slate-100/80 p-1 rounded border border-slate-200 flex gap-1 mb-2.5">
                        <button
                          type="button"
                          onClick={() => { setInteractMode('select'); setIsCreatingNew(false); }}
                          className={`flex-1 text-center text-[10px] font-bold py-1.5 uppercase rounded tracking-wider transition ${
                            interactMode === 'select' && !isCreatingNew ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Ver Detalhes
                        </button>
                        <button
                          type="button"
                          onClick={() => { setInteractMode('adjust'); setIsCreatingNew(false); }}
                          className={`flex-1 text-center text-[10px] font-bold py-1.5 uppercase rounded tracking-wider transition ${
                            interactMode === 'adjust' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                          }`}
                          title="Mova marcadores clicando no novo ponto da imagem"
                        >
                          Ajustar Pontos
                        </button>
                        <button
                          type="button"
                          onClick={() => { setInteractMode('create'); }}
                          className={`flex-1 text-center text-[10px] font-bold py-1.5 uppercase rounded tracking-wider transition ${
                            interactMode === 'create' || isCreatingNew ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          + Novo Ponto
                        </button>
                      </div>
                    )}

                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center justify-between border-b border-slate-100 pb-1.5 font-mono">
                      <span className="flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-indigo-505" />
                        {result ? 'MAPA E PLOTS INTERATIVOS' : 'Cenário de Análise'}
                      </span>
                    </h3>

                    {/* Drag and Drop Container or Interactive Image */}
                    {!selectedImage ? (
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[260px] ${
                          isDragging 
                            ? 'border-safety-green bg-emerald-50/30' 
                            : 'border-slate-300 hover:border-slate-450 hover:bg-slate-50/50'
                        }`}
                      >
                        <UploadCloud className="w-10 h-10 text-slate-400 mb-2.5" />
                        <span className="text-xs font-extrabold text-slate-700 block">
                          Arraste imagens ou clique aqui
                        </span>
                        <p className="text-[10.5px] text-slate-500 max-w-xs mt-1.5 leading-relaxed">
                          Faça o upload ou tire uma foto em tempo real da sala, setor ou galpão para mapeamento imediato de riscos.
                        </p>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/*"
                          className="hidden"
                        />
                      </div>
                    ) : (
                      <div className="relative rounded-lg border border-slate-205 overflow-hidden bg-slate-950/20 group">
                        
                        {/* The core interactive image wrapper */}
                        <div 
                          className="relative inline-block w-full cursor-crosshair overflow-hidden"
                          onClick={handleImageClick}
                        >
                          <img 
                            src={selectedImage} 
                            alt="Cenário de análise" 
                            className={`w-full h-auto max-h-[340px] md:max-h-[385px] object-cover mx-auto block transition ${analyzing ? 'opacity-40 blur-[2px]' : ''}`} 
                            referrerPolicy="no-referrer"
                          />

                          {/* Coordinate Markers Overlay */}
                          {!analyzing && result && result.riscos && result.riscos.map((item, idx) => {
                            const x = typeof item.x_pct === 'number' ? item.x_pct : (15 + (idx * 25) % 70);
                            const y = typeof item.y_pct === 'number' ? item.y_pct : (30 + (idx * 20) % 55);
                            
                            const isSelected = activeRiskIndex === idx;
                            const markerColorClass = getMarkerBgColor(item.cor_badge || item.categoria);

                            return (
                              <div
                                key={idx}
                                style={{ left: `${x}%`, top: `${y}%` }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveRiskIndex(idx);
                                  setIsCreatingNew(false);
                                }}
                                className={`absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-lg border border-white cursor-pointer transition-all duration-350 hover:scale-125 ring-4 ${
                                  isSelected 
                                    ? 'scale-115 ring-white z-30 animate-pulse border-2 border-slate-900 shadow-xl' 
                                    : 'opacity-90 hover:opacity-100 ring-slate-950/20 z-20 hover:z-30'
                                } ${markerColorClass}`}
                                title={`Risco #${idx + 1}: ${item.categoria}`}
                              >
                                <MapPin className="w-3 h-3 absolute -top-1 font-bold" />
                                <span className="font-extrabold mt-1 text-[11px]">{idx + 1}</span>
                              </div>
                            );
                          })}

                          {/* Tentative new risk cursor locator pointer */}
                          {newRiskCoords && (
                            <div
                              style={{ left: `${newRiskCoords.x}%`, top: `${newRiskCoords.y}%` }}
                              className="absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-extrabold text-xs shadow-xl ring-4 ring-yellow-400 z-40 animate-bounce"
                            >
                              +
                            </div>
                          )}
                        </div>
                        
                        {!analyzing && (
                          <button
                            onClick={clearSelection}
                            className="absolute top-2 right-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full p-1.5 transition shadow-lg z-40"
                            title="Remover Imagem e Novo Upload"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}

                        {analyzing && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/40 text-white p-4 text-center z-40">
                            <Loader2 className="w-8 h-8 text-safety-green animate-spin mb-2" />
                            <span className="text-xs font-bold font-mono tracking-wider animate-pulse text-white drop-shadow">
                              SST VISION CALCULATING...
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Instruction help banner for custom coordinate creation */}
                    {result && !analyzing && (
                      <div className="mt-2.5 p-2 bg-indigo-50 border border-indigo-100 text-[10px] text-indigo-800 leading-snug rounded flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-indigo-505 shrink-0" />
                        <span>
                          {interactMode === 'select' && "Modo de Leitura: clique sobre qualquer marcador ou linha da tabela para analisar especificações."}
                          {interactMode === 'adjust' && "Modo Ajuste: clique na imagem no ponto correto para reposicionar as coordenadas do marcador de risco ativo."}
                          {interactMode === 'create' && "Modo Criar: clique no ponto de perigo na imagem para fixar as coordenadas e abrir o formulário."}
                        </span>
                      </div>
                    )}

                    {error && (
                      <div className="p-2.5 bg-rose-50 border border-rose-150 text-rose-800 rounded text-[11px] font-medium mt-3 flex items-start gap-1.5">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </div>
                    )}
                  </div>

                  {/* Demo presets picker list */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <span className="text-[9.5px] font-mono text-slate-500 uppercase tracking-wider block mb-1.5 font-bold">
                      Testar com cenários de demonstração da fábrica:
                    </span>
                    <div className="space-y-1.5">
                      {presetEnvironments.map((preset) => {
                        const PresetIcon = preset.icon;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            disabled={analyzing}
                            onClick={() => handlePresetSelect(preset.id)}
                            className="w-full text-left p-2 rounded border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition text-[11px] flex gap-2.5 items-center disabled:opacity-50"
                          >
                            <div className="p-1 px-1.5 bg-slate-100 group-hover:bg-white rounded border border-slate-200 text-slate-600">
                              <PresetIcon className="w-3.5 h-3.5 font-bold" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="font-bold text-slate-700 block truncate">{preset.name}</span>
                              <span className="text-[9px] text-[#64748b] truncate block mt-0.5">{preset.description}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>
              </div>

              {/* Right Column - Results / Creation Form Area (7 cols) */}
              <div className="lg:col-span-7 flex flex-col">
                
                {/* Conditional Manual Creation Form */}
                {isCreatingNew && newRiskCoords ? (
                  <form onSubmit={handleSaveCustomRisk} className="bg-white border border-slate-200 rounded-lg p-4 flex-1 flex flex-col justify-between min-h-[350px]">
                    <div>
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
                        <h3 className="text-xs font-black uppercase text-slate-855 flex items-center gap-1.5 font-mono">
                          <Plus className="w-4 h-4 text-safety-green" />
                          Registrar Ponto Manual de SST
                        </h3>
                        <span className="bg-slate-100 p-1 px-2 border border-slate-200 text-[9.5px] font-mono font-bold rounded">
                          Coordenadas: X:{newRiskCoords.x}%, Y:{newRiskCoords.y}%
                        </span>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div>
                          <label className="block text-slate-650 font-bold mb-1">Categoria Regulada (NR-05)</label>
                          <select
                            value={newRiskData.categoria}
                            onChange={(e) => setNewRiskData({ ...newRiskData, categoria: e.target.value })}
                            className="w-full bg-white border border-slate-250 rounded px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-safety-green font-semibold text-slate-700 font-mono"
                          >
                            <option value="Físico">Físico (Cor: Verde)</option>
                            <option value="Químico">Químico (Cor: Vermelho)</option>
                            <option value="Biológico">Biológico (Cor: Marrom)</option>
                            <option value="Ergonômico">Ergonômico (Cor: Amarelo)</option>
                            <option value="Mecânico / Acidentes">Mecânico / Acidentes (Cor: Azul)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-655 font-bold mb-1">Descrição Detalhada do Perigo Observado</label>
                          <textarea
                            required
                            rows={2}
                            placeholder="Ex: Fiação viva desprotegida exposta na base do misturador sob risco de indução elétrica..."
                            value={newRiskData.descricao_perigo}
                            onChange={(e) => setNewRiskData({ ...newRiskData, descricao_perigo: e.target.value })}
                            className="w-full bg-white border border-slate-250 rounded px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-safety-green text-slate-705 leading-snug"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div>
                            <label className="block text-slate-650 font-bold mb-1">Probabilidade</label>
                            <select
                              value={newRiskData.probabilidade}
                              onChange={(e) => setNewRiskData({ ...newRiskData, probabilidade: e.target.value })}
                              className="w-full bg-white border border-slate-250 rounded px-2.5 py-1 text-[11px] focus:outline-none focus:border-safety-green text-slate-705 font-semibold"
                            >
                              <option value="Baixa">Baixa</option>
                              <option value="Média">Média</option>
                              <option value="Alta">Alta</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-slate-650 font-bold mb-1">Severidade / Impacto</label>
                            <select
                              value={newRiskData.impacto}
                              onChange={(e) => setNewRiskData({ ...newRiskData, impacto: e.target.value })}
                              className="w-full bg-white border border-slate-250 rounded px-2.5 py-1 text-[11px] focus:outline-none focus:border-safety-green text-slate-705 font-semibold"
                            >
                              <option value="Leve">Leve</option>
                              <option value="Moderado">Moderado</option>
                              <option value="Grave">Grave</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-650 font-bold mb-1">Recomendação Legal Corretiva (Medida NR)</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Enclausurar painel, efetuar aterramento elétrico imediato e rotular sob a NR-10..."
                            value={newRiskData.recomendacao_nr}
                            onChange={(e) => setNewRiskData({ ...newRiskData, recomendacao_nr: e.target.value })}
                            className="w-full bg-white border border-slate-250 rounded px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-safety-green text-slate-705"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => { setIsCreatingNew(false); setNewRiskCoords(null); }}
                        className="px-3.5 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-600 rounded font-bold text-[10.5px] uppercase tracking-wider cursor-pointer"
                      >
                        Descartar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-safety-green hover:bg-safety-green-dark text-white rounded font-bold text-[10.5px] uppercase tracking-wider flex items-center gap-1 transition shadow cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Salvar no Mapa</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  // Default view showing the table results
                  <div className="bg-white border border-slate-200 rounded-lg p-3 flex-1 flex flex-col justify-between min-h-[350px]">
                    <div className="flex-1 flex flex-col">
                      
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center justify-between border-b border-slate-100 pb-1.5">
                        <span className="flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-safety-green" />
                          Laudo e Classificação de Riscos NR-05
                        </span>
                        
                        {result && (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider animate-pulse font-mono">
                            Laudo Emitido
                          </span>
                        )}
                      </h3>

                      {/* State: No photo / Not started */}
                      {!selectedImage && !analyzing && (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 rounded-lg border border-dashed border-slate-210">
                          <Radar className="w-10 h-10 text-slate-350 mb-2 animate-pulse" />
                          <h4 className="text-xs font-bold text-slate-700 uppercase">Aguardando Captura Industrial</h4>
                          <p className="text-[10.5px] text-slate-450 max-w-sm mt-1 leading-relaxed">
                            Faça o upload de uma imagem ou escolha um cenário piloto do cadastro à esquerda. O sistema processará o mapeamento identificando coordenadas {`{x,y}`} relativas de riscos e sincronizará os desvios.
                          </p>
                        </div>
                      )}

                      {/* State: Processing */}
                      {analyzing && !result && (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                          <Loader2 className="w-8 h-8 text-safety-green animate-spin mb-2" />
                          <h4 className="text-xs font-bold text-slate-700 uppercase animate-pulse">Analisando Ambiente com IA...</h4>
                          <p className="text-[11px] text-slate-450 max-w-sm mt-1 leading-relaxed font-mono">
                            [Gemini Multi-Modal Vision integrando diretrizes estritas NR-05, NR-06, NR-12 e NHO para determinar as coordenadas x/y relativas e gerar laudo de conformidade preventiva...]
                          </p>
                        </div>
                      )}

                      {/* State: Results loaded */}
                      {result && (
                        <div className="space-y-4 flex-1 font-sans">
                          
                          {/* Header of results */}
                          <div className="bg-slate-900 text-white p-3 rounded flex justify-between items-center shadow-sm">
                            <div>
                              <span className="text-[8px] font-mono text-slate-300 uppercase tracking-widest block font-bold">
                                DETECTOR DE AMBIENTE OPERACIONAL
                              </span>
                              <h4 className="text-xs font-extrabold tracking-tight text-white mt-0.5 font-mono">
                                {result.ambiente_detectado}
                              </h4>
                            </div>
                            <span className="bg-safety-green/20 text-safety-green border border-safety-green/30 text-[9px] font-black font-mono tracking-wider px-2 py-0.5 rounded uppercase">
                              {result.riscos.length} Riscos Identificados
                            </span>
                          </div>

                          {/* Table View */}
                          <div className="border border-slate-205 rounded overflow-hidden">
                            <table className="w-full text-left text-xs divide-y divide-slate-100">
                              <thead className="bg-slate-50 text-[10px] font-bold text-slate-550 uppercase tracking-wider col-header">
                                <tr>
                                  <th className="p-2.5 w-12 text-center font-mono">Ref</th>
                                  <th className="p-2.5 font-mono">Categoria (NR-05)</th>
                                  <th className="p-2.5 font-mono">Perigo Detectado</th>
                                  <th className="p-2.5 text-center font-mono">Incertezas</th>
                                  <th className="p-2.5 text-right font-mono">Ações</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-150 align-top text-slate-650 font-sans">
                                {result.riscos.map((item, index) => {
                                  const isSelected = activeRiskIndex === index;
                                  return (
                                    <tr 
                                      key={index} 
                                      onClick={() => { setActiveRiskIndex(index); setIsCreatingNew(false); }}
                                      className={`cursor-pointer transition duration-150 ${
                                        isSelected 
                                          ? 'bg-amber-50 border-l-4 border-l-amber-500 font-medium' 
                                          : 'hover:bg-slate-50/50'
                                      }`}
                                    >
                                      {/* Ref Pin Counter */}
                                      <td className="p-2.5 text-center font-bold font-mono">
                                        <span className={`inline-flex items-center justify-center w-5.5 h-5.5 rounded-full text-[10px] font-bold border ${
                                          isSelected 
                                            ? 'bg-amber-500 text-slate-900 border-amber-600 animate-pulseScale' 
                                            : 'bg-slate-200 text-slate-700 border-slate-300'
                                        }`}>
                                          {index + 1}
                                        </span>
                                      </td>

                                      {/* Category badge */}
                                      <td className="p-2.5">
                                        <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider inline-block ${getBadgeColors(item.cor_badge || item.categoria)}`}>
                                          {item.categoria}
                                        </span>
                                        {typeof item.x_pct === 'number' && (
                                          <span className="block text-[8.5px] text-[#64748b] font-mono mt-1 font-bold">
                                            X:{item.x_pct}% Y:{item.y_pct}%
                                          </span>
                                        )}
                                      </td>

                                      {/* Description of hazards */}
                                      <td className="p-2.5 text-[11px] leading-relaxed font-semibold text-slate-800">
                                        <p className="line-clamp-2 md:line-clamp-none font-sans" title={item.descricao_perigo}>
                                          {item.descricao_perigo}
                                        </p>
                                        <div className="mt-1 text-[10px] font-medium text-slate-500 md:hidden bg-slate-100 p-1.5 rounded">
                                          <strong className="block text-[8px] text-slate-700 uppercase font-mono">Recomendação:</strong>
                                          {item.recomendacao_nr}
                                        </div>
                                      </td>

                                      {/* Probability and severity */}
                                      <td className="p-2.5">
                                        <div className="flex flex-col gap-1 items-center justify-center shrink-0">
                                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider block text-center ${getProbColor(item.probabilidade)}`}>
                                            P: {item.probabilidade}
                                          </span>
                                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider block text-center ${getImpactColor(item.impacto)}`}>
                                            I: {item.impacto}
                                          </span>
                                        </div>
                                      </td>

                                      {/* Actions column (Delete coordinates or view) */}
                                      <td className="p-2.5 text-right w-16" onClick={(e) => e.stopPropagation()}>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteRisk(index)}
                                          className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                                          title="Remover ponto de risco"
                                        >
                                          <Trash2 className="w-3.5 h-3.5 mx-auto" />
                                        </button>
                                      </td>

                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          {/* Legal Footnote */}
                          <div className="p-2.5 bg-yellow-50 border border-yellow-250 text-amber-900 rounded text-[10.5px] leading-relaxed flex gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                            <p>
                              <strong>Aviso Regulatório:</strong> O mapeamento visual via Inteligência Artificial serve como ferramenta de triagem e inteligência operacional preventiva imediata para a CPA. Esse laudo não substitui a obrigatoriedade da elaboração periódica das vistorias técnicas oficiais e da assinatura formal do Engenheiro de Segurança de Trabalho sob o PGR / GRO oficial (Portaria MTP 6.730).
                            </p>
                          </div>

                        </div>
                      )}
                    </div>

                    {/* Reset analyzer */}
                    {result && (
                      <div className="pt-3 border-t border-slate-100 flex justify-between items-center shrink-0">
                        <span className="text-[10px] text-[#64748b] font-mono leading-none">
                          {interactMode === 'adjust' ? (
                            <strong className="text-indigo-600 animate-pulse block uppercase text-[9px]">
                              ● MODO AJUSTE ATIVO: Clique sobre qualquer ponto na imagem para reposicionar o Marcador #{activeRiskIndex !== null ? activeRiskIndex + 1 : 'Ativo'}
                            </strong>
                          ) : interactMode === 'create' ? (
                            <strong className="text-amber-600 animate-pulse block uppercase text-[9px]">
                              ● MODO CRIAÇÃO ATIVO: Clique sobre qualquer ponto na imagem para fixar uma nova bandeira
                            </strong>
                          ) : (
                            <span>* Arraste ou clique nos marcadores para fazer auditorias interativas.</span>
                          )}
                        </span>
                        
                        <button
                          onClick={clearSelection}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10.5px] font-bold uppercase tracking-wider rounded border border-slate-210 flex items-center gap-1.5 transition cursor-pointer shrink-0"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                          Analisar Novo Cenário
                        </button>
                      </div>
                    )}

                  </div>
                )}
              </div>

            </div>
          </div>
          
        </div>
      )}

    </div>
  );
}

