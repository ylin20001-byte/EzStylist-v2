/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StartScreen from './components/StartScreen';
import Canvas from './components/Canvas';
import WardrobePanel from './components/WardrobeModal';
import OutfitStack from './components/OutfitStack';
import { generateVirtualTryOnImage, generatePoseVariation, changeGarmentColor, changeBackground, generateLookbook, changeLighting, magicWandEdit } from './services/geminiService';
import { OutfitLayer, WardrobeItem, POSE_INSTRUCTIONS, BACKGROUND_OPTIONS, PoseInstruction, LIGHTING_OPTIONS } from './types';
import { ChevronDownIcon, ChevronUpIcon, XIcon } from './components/icons';
import { defaultWardrobe } from './wardrobe';
import Footer from './components/Footer';
import { getFriendlyErrorMessage } from './lib/utils';
import Spinner from './components/Spinner';
import LanguageSwitcher from './components/LanguageSwitcher';
import { useLanguage } from './contexts/LanguageContext';
import LookbookTemplateModal from './components/LookbookTemplateModal';
import { cn } from './lib/utils';
import CropModal from './components/CropModal';


type AppStateSnapshot = {
  outfitHistory: OutfitLayer[];
  currentOutfitIndex: number;
  currentPoseIndex: number;
  activeBackground: string;
  activeLighting: string;
};

const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);

    mediaQueryList.addEventListener('change', listener);
    
    // Initial check in case state is stale
    if (mediaQueryList.matches !== matches) {
      setMatches(mediaQueryList.matches);
    }

    return () => {
      mediaQueryList.removeEventListener('change', listener);
    };
  }, [query, matches]);

  return matches;
};


const App: React.FC = () => {
  const [modelImageUrl, setModelImageUrl] = useState<string | null>(null);
  const [outfitHistory, setOutfitHistory] = useState<OutfitLayer[]>([]);
  const [currentOutfitIndex, setCurrentOutfitIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [isSheetCollapsed, setIsSheetCollapsed] = useState(true);
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>(defaultWardrobe);
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isMobileLandscape = useMediaQuery('(max-width: 1023px) and (orientation: landscape)');

  // FIX: Ensure `isPanelDocked` is explicitly a boolean by using `!!` to convert `modelImageUrl` (string | null) to a boolean.
  const isPanelDocked = isMobileLandscape && !!modelImageUrl;

  const [isLookbookModalOpen, setIsLookbookModalOpen] = useState(false);
  const [lookbookUrl, setLookbookUrl] = useState<string | null>(null);
  const [activeBackground, setActiveBackground] = useState<string>('Default');
  const [activeLighting, setActiveLighting] = useState<string>('Default');
  const [undoStack, setUndoStack] = useState<AppStateSnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<AppStateSnapshot[]>([]);
  const [isLookbookTemplateModalOpen, setIsLookbookTemplateModalOpen] = useState(false);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const { t } = useLanguage();

  const activeOutfitLayers = useMemo(() => 
    outfitHistory.slice(0, currentOutfitIndex + 1), 
    [outfitHistory, currentOutfitIndex]
  );
  
  const activeGarmentIds = useMemo(() => 
    activeOutfitLayers.map(layer => layer.garment?.id).filter(Boolean) as string[], 
    [activeOutfitLayers]
  );
  
  const displayImageUrl = useMemo(() => {
    if (outfitHistory.length === 0) return modelImageUrl;
    const currentLayer = outfitHistory[currentOutfitIndex];
    if (!currentLayer) return modelImageUrl;

    const poseInstruction = POSE_INSTRUCTIONS[currentPoseIndex];
    
    if (activeLighting !== 'Default' && currentLayer.lightingModifiedImages?.[poseInstruction]) {
        return currentLayer.lightingModifiedImages[poseInstruction];
    }
    if (activeBackground !== 'Default' && currentLayer.backgroundModifiedImages?.[poseInstruction]) {
        return currentLayer.backgroundModifiedImages[poseInstruction];
    }
    
    return currentLayer.poseImages[poseInstruction] ?? Object.values(currentLayer.poseImages)[0];
  }, [outfitHistory, currentOutfitIndex, currentPoseIndex, modelImageUrl, activeBackground, activeLighting]);

  const availablePoseKeys = useMemo(() => {
    if (outfitHistory.length === 0) return [];
    const currentLayer = outfitHistory[currentOutfitIndex];
    return currentLayer ? Object.keys(currentLayer.poseImages) as PoseInstruction[] : [];
  }, [outfitHistory, currentOutfitIndex]);

  const getCurrentStateSnapshot = useCallback((): AppStateSnapshot => ({
    outfitHistory,
    currentOutfitIndex,
    currentPoseIndex,
    activeBackground,
    activeLighting,
  }), [outfitHistory, currentOutfitIndex, currentPoseIndex, activeBackground, activeLighting]);

  const applyStateSnapshot = (snapshot: AppStateSnapshot) => {
    setOutfitHistory(snapshot.outfitHistory);
    setCurrentOutfitIndex(snapshot.currentOutfitIndex);
    setCurrentPoseIndex(snapshot.currentPoseIndex);
    setActiveBackground(snapshot.activeBackground);
    setActiveLighting(snapshot.activeLighting);
  };
  
  const updateStateWithHistory = (updater: (prevState: AppStateSnapshot) => AppStateSnapshot) => {
    const currentState = getCurrentStateSnapshot();
    const nextState = updater(currentState);
    
    setUndoStack(prev => [...prev, currentState]);
    setRedoStack([]); // Clear redo stack on new action
    
    applyStateSnapshot(nextState);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    
    const currentState = getCurrentStateSnapshot();
    const lastState = undoStack[undoStack.length - 1];
    
    setRedoStack(prev => [...prev, currentState]);
    setUndoStack(prev => prev.slice(0, -1));
    
    applyStateSnapshot(lastState);
  };
  
  const handleRedo = () => {
    if (redoStack.length === 0) return;

    const currentState = getCurrentStateSnapshot();
    const nextState = redoStack[redoStack.length - 1];

    setUndoStack(prev => [...prev, currentState]);
    setRedoStack(prev => prev.slice(0, -1));

    applyStateSnapshot(nextState);
  };

  const handleModelFinalized = (url: string) => {
    setModelImageUrl(url);
    setOutfitHistory([{
      garment: null,
      poseImages: { [POSE_INSTRUCTIONS[0]]: url },
      backgroundModifiedImages: {},
      lightingModifiedImages: {}
    }]);
    setCurrentOutfitIndex(0);
    setUndoStack([]);
    setRedoStack([]);
  };

  const handleStartOver = () => {
    setModelImageUrl(null);
    setOutfitHistory([]);
    setCurrentOutfitIndex(0);
    setIsLoading(false);
    setLoadingMessage('');
    setError(null);
    setCurrentPoseIndex(0);
    setIsSheetCollapsed(true);
    setWardrobe(defaultWardrobe);
    setIsLookbookModalOpen(false);
    setLookbookUrl(null);
    setActiveBackground('Default');
    setActiveLighting('Default');
    setUndoStack([]);
    setRedoStack([]);
    setIsLookbookTemplateModalOpen(false);
  };

  const handleGarmentSelect = useCallback(async (garmentFile: File, garmentInfo: WardrobeItem) => {
    if (!displayImageUrl || isLoading) return;

    const nextLayer = outfitHistory[currentOutfitIndex + 1];
    if (nextLayer && nextLayer.garment?.id === garmentInfo.id) {
        updateStateWithHistory(prevState => ({
          ...prevState,
          currentOutfitIndex: prevState.currentOutfitIndex + 1,
          currentPoseIndex: 0,
          activeBackground: 'Default',
          activeLighting: 'Default',
        }));
        return;
    }

    setError(null);
    setIsLoading(true);
    setLoadingMessage(`${t('app.loading.adding')} ${garmentInfo.name}...`);
    
    try {
      const newImageUrl = await generateVirtualTryOnImage(displayImageUrl, garmentFile, garmentInfo);
      
      updateStateWithHistory(prevState => {
        const newLayer: OutfitLayer = { 
          garment: garmentInfo, 
          poseImages: { [POSE_INSTRUCTIONS[0]]: newImageUrl },
          backgroundModifiedImages: {},
          lightingModifiedImages: {}
        };
        const newHistory = prevState.outfitHistory.slice(0, prevState.currentOutfitIndex + 1);
        return {
          outfitHistory: [...newHistory, newLayer],
          currentOutfitIndex: newHistory.length,
          currentPoseIndex: 0,
          activeBackground: 'Default',
          activeLighting: 'Default',
        };
      });
      
      setWardrobe(prev => {
        if (prev.find(item => item.id === garmentInfo.id)) return prev;
        return [...prev, garmentInfo];
      });
    } catch (err) {
      setError(getFriendlyErrorMessage(err, t('app.error.applyGarment')));
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [displayImageUrl, isLoading, outfitHistory, currentOutfitIndex, t, getCurrentStateSnapshot]);

  const handleRevertToLayer = useCallback((index: number) => {
    updateStateWithHistory(prevState => {
        const newHistory = prevState.outfitHistory.slice(0, index);
        return {
            ...prevState,
            outfitHistory: newHistory,
            currentOutfitIndex: index - 1,
            currentPoseIndex: 0,
            activeBackground: 'Default',
            activeLighting: 'Default',
        };
    });
  }, [getCurrentStateSnapshot]);
  
  const handlePoseSelect = useCallback(async (newIndex: number) => {
    if (isLoading || outfitHistory.length === 0 || newIndex === currentPoseIndex) return;
    
    const poseInstruction = POSE_INSTRUCTIONS[newIndex];
    const currentLayer = outfitHistory[currentOutfitIndex];

    if (currentLayer.poseImages[poseInstruction]) {
      updateStateWithHistory(prevState => ({
        ...prevState,
        currentPoseIndex: newIndex,
        activeBackground: 'Default',
        activeLighting: 'Default',
      }));
      return;
    }

    const baseImageForPoseChange = Object.values(currentLayer.poseImages)[0];
    if (!baseImageForPoseChange) return;

    setError(null);
    setIsLoading(true);
    setLoadingMessage(t('app.loading.posing'));
    
    const prevPoseIndex = currentPoseIndex;
    setCurrentPoseIndex(newIndex);

    try {
      const newImageUrl = await generatePoseVariation(baseImageForPoseChange, poseInstruction);
      updateStateWithHistory(prevState => {
        const newHistory = [...prevState.outfitHistory];
        const updatedLayer = { ...newHistory[prevState.currentOutfitIndex] };
        updatedLayer.poseImages[poseInstruction] = newImageUrl;
        newHistory[prevState.currentOutfitIndex] = updatedLayer;
        return {
            ...prevState,
            outfitHistory: newHistory,
            currentPoseIndex: newIndex,
            activeBackground: 'Default',
            activeLighting: 'Default',
        };
      });
    } catch (err) {
      setError(getFriendlyErrorMessage(err, t('app.error.changePose')));
      setCurrentPoseIndex(prevPoseIndex);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [currentPoseIndex, outfitHistory, isLoading, currentOutfitIndex, t, getCurrentStateSnapshot]);

  const handleColorChangeAtIndex = useCallback(async (index: number, newColor: string) => {
    const layerToEdit = outfitHistory[index];
    const baseImage = layerToEdit?.poseImages?.[POSE_INSTRUCTIONS[0]] ?? Object.values(layerToEdit.poseImages)[0];
    if (!baseImage || isLoading) return;
    
    setError(null);
    setIsLoading(true);
    setLoadingMessage(`${t('app.loading.coloring')} ${newColor}...`);

    try {
        const newImageUrl = await changeGarmentColor(baseImage, newColor);
        updateStateWithHistory(prevState => {
            const historyBeforeEdit = prevState.outfitHistory.slice(0, index);
            const editedLayer: OutfitLayer = { 
                ...prevState.outfitHistory[index],
                poseImages: { [POSE_INSTRUCTIONS[0]]: newImageUrl },
                backgroundModifiedImages: {}, 
                lightingModifiedImages: {} 
            };
            return {
              ...prevState,
              outfitHistory: [...historyBeforeEdit, editedLayer],
              currentOutfitIndex: index,
              currentPoseIndex: 0,
              activeBackground: 'Default',
              activeLighting: 'Default',
            };
        });
    } catch (err) {
        setError(getFriendlyErrorMessage(err, t('app.error.changeColor')));
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  }, [outfitHistory, isLoading, t, getCurrentStateSnapshot]);
  
  const handleBackgroundChange = useCallback(async (backgroundPrompt: string) => {
    if (isLoading) return;

    if (backgroundPrompt === 'Default') {
        updateStateWithHistory(prevState => ({ ...prevState, activeBackground: 'Default' }));
        return;
    }

    const currentLayer = outfitHistory[currentOutfitIndex];
    const currentPoseKey = POSE_INSTRUCTIONS[currentPoseIndex];
    const baseImageForModification = currentLayer?.poseImages?.[currentPoseKey];

    if (!baseImageForModification) {
        setError(getFriendlyErrorMessage('Base image for pose not found.', t('app.error.changeBackground')));
        return;
    }
    
    const promptForAPI = backgroundPrompt === 'Studio Background' 
        ? 'a clean, neutral studio backdrop (light gray, #f0f0f0)' 
        : backgroundPrompt;

    setError(null);
    setIsLoading(true);
    setLoadingMessage(t('app.loading.background'));

    try {
        const newImageUrl = await changeBackground(baseImageForModification, promptForAPI);
        updateStateWithHistory(prevState => {
          const newHistory = [...prevState.outfitHistory];
          const layerToUpdate = { ...newHistory[prevState.currentOutfitIndex] };
          if (!layerToUpdate.backgroundModifiedImages) layerToUpdate.backgroundModifiedImages = {};
          layerToUpdate.backgroundModifiedImages[currentPoseKey] = newImageUrl;
          newHistory[prevState.currentOutfitIndex] = layerToUpdate;
          return {
            ...prevState,
            outfitHistory: newHistory,
            activeBackground: backgroundPrompt,
            activeLighting: 'Default',
          };
        });
    } catch (err) {
        setError(getFriendlyErrorMessage(err, t('app.error.changeBackground')));
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  }, [isLoading, currentOutfitIndex, currentPoseIndex, t, outfitHistory, getCurrentStateSnapshot]);

  const handleLightingChange = useCallback(async (lightingPrompt: string) => {
    if (isLoading) return;

    if (lightingPrompt === 'Default') {
        updateStateWithHistory(prevState => ({ ...prevState, activeLighting: 'Default' }));
        return;
    }

    const currentLayer = outfitHistory[currentOutfitIndex];
    const currentPoseKey = POSE_INSTRUCTIONS[currentPoseIndex];
    const baseImageForModification = currentLayer?.poseImages?.[currentPoseKey];

    if (!baseImageForModification) {
        setError(getFriendlyErrorMessage('Base image for pose not found.', t('app.error.changeLighting')));
        return;
    }

    setError(null);
    setIsLoading(true);
    setLoadingMessage(t('app.loading.lighting'));

    try {
        const newImageUrl = await changeLighting(baseImageForModification, lightingPrompt);
        updateStateWithHistory(prevState => {
          const newHistory = [...prevState.outfitHistory];
          const layerToUpdate = { ...newHistory[prevState.currentOutfitIndex] };
          if (!layerToUpdate.lightingModifiedImages) layerToUpdate.lightingModifiedImages = {};
          layerToUpdate.lightingModifiedImages[currentPoseKey] = newImageUrl;
          newHistory[prevState.currentOutfitIndex] = layerToUpdate;
          return {
            ...prevState,
            outfitHistory: newHistory,
            activeLighting: lightingPrompt,
            activeBackground: 'Default',
          };
        });
    } catch (err) {
        setError(getFriendlyErrorMessage(err, t('app.error.changeLighting')));
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  }, [isLoading, currentOutfitIndex, currentPoseIndex, t, outfitHistory, getCurrentStateSnapshot]);

  const handleMagicWandEditAtIndex = useCallback(async (index: number, instruction: string) => {
    const layerToEdit = outfitHistory[index];
    const baseImage = layerToEdit?.poseImages?.[POSE_INSTRUCTIONS[0]] ?? Object.values(layerToEdit.poseImages)[0];
    if (!baseImage || isLoading) return;

    setError(null);
    setIsLoading(true);
    setLoadingMessage(t('magicWand.label'));

    try {
        const newImageUrl = await magicWandEdit(baseImage, instruction);
        updateStateWithHistory(prevState => {
            const historyBeforeEdit = prevState.outfitHistory.slice(0, index);
            const editedLayer: OutfitLayer = { 
                ...prevState.outfitHistory[index],
                poseImages: { [POSE_INSTRUCTIONS[0]]: newImageUrl },
                backgroundModifiedImages: {}, 
                lightingModifiedImages: {} 
            };
            return {
              ...prevState,
              outfitHistory: [...historyBeforeEdit, editedLayer],
              currentOutfitIndex: index,
              currentPoseIndex: 0,
              activeBackground: 'Default',
              activeLighting: 'Default',
            };
        });
    } catch (err) {
        setError(getFriendlyErrorMessage(err, t('magicWand.error')));
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  }, [outfitHistory, isLoading, t, getCurrentStateSnapshot]);
  
  const handleGenerateLookbook = useCallback(async (templatePrompt: string) => {
    setIsLookbookTemplateModalOpen(false);
    if (isLoading || activeOutfitLayers.length <= 1) {
        setError(t('app.error.lookbook.addGarment'));
        return;
    }
    setError(null);
    setIsLoading(true);
    setLoadingMessage(t('app.loading.lookbook'));

    try {
        const imageUrls = activeOutfitLayers
            .map(layer => Object.values(layer.poseImages)[0])
            .filter((url): url is string => !!url);

        if (imageUrls.length > 1) {
            const resultUrl = await generateLookbook(imageUrls, templatePrompt);
            setLookbookUrl(resultUrl);
            setIsLookbookModalOpen(true);
        } else {
            setError(t('app.error.lookbook.notEnough'));
        }
    } catch (err) {
        setError(getFriendlyErrorMessage(err, t('app.error.lookbook.generate')));
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  }, [isLoading, activeOutfitLayers, t]);

  const handleOpenLookbookTemplates = () => setIsLookbookTemplateModalOpen(true);

  const handleOpenCropModal = () => {
    if (displayImageUrl) {
      setIsCropModalOpen(true);
    }
  };

  const handleImageCrop = useCallback((croppedImageUrl: string) => {
    setIsCropModalOpen(false);
    if (!croppedImageUrl) return;

    updateStateWithHistory(prevState => {
      const indexToEdit = prevState.currentOutfitIndex;
      const historyBeforeEdit = prevState.outfitHistory.slice(0, indexToEdit);

      const originalLayer = prevState.outfitHistory[indexToEdit];
      
      const croppedLayer: OutfitLayer = { 
        ...originalLayer,
        poseImages: { [POSE_INSTRUCTIONS[prevState.currentPoseIndex]]: croppedImageUrl },
        backgroundModifiedImages: {}, 
        lightingModifiedImages: {} 
      };

      return {
        ...prevState,
        outfitHistory: [...historyBeforeEdit, croppedLayer],
        currentOutfitIndex: indexToEdit,
        currentPoseIndex: prevState.currentPoseIndex,
        activeBackground: 'Default',
        activeLighting: 'Default',
      };
    });
  }, [getCurrentStateSnapshot]);


  const viewVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -15 },
  };

  const isPanelOpenOnMobile = !isSheetCollapsed && isMobile && !isPanelDocked;

  return (
    <div className="font-sans text-white">
      <LanguageSwitcher />
      <AnimatePresence mode="wait">
        {!modelImageUrl ? (
          <motion.div
            key="start-screen"
            className="w-screen min-h-screen flex items-start sm:items-center justify-center bg-transparent p-4 pb-20"
            variants={viewVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <StartScreen onModelFinalized={handleModelFinalized} />
          </motion.div>
        ) : (
          <motion.div
            key="main-app"
            className="relative flex flex-col h-screen bg-transparent overflow-hidden"
            variants={viewVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <main className={`flex-grow relative flex ${isPanelDocked ? 'flex-row' : 'flex-col'} md:flex-row overflow-hidden`}>
              <div className={cn("w-full h-full flex-grow flex items-center justify-center bg-transparent relative",
                isPanelDocked ? 'pr-[40%]' : 'pb-16 md:pb-0'
              )}>
                <Canvas 
                  displayImageUrl={displayImageUrl}
                  onStartOver={handleStartOver}
                  isLoading={isLoading}
                  loadingMessage={loadingMessage}
                  onSelectPose={handlePoseSelect}
                  poseInstructions={POSE_INSTRUCTIONS}
                  currentPoseIndex={currentPoseIndex}
                  availablePoseKeys={availablePoseKeys}
                  onBackgroundChange={handleBackgroundChange}
                  backgroundOptions={BACKGROUND_OPTIONS}
                  onOpenLookbookTemplates={handleOpenLookbookTemplates}
                  activeBackground={activeBackground}
                  onLightingChange={handleLightingChange}
                  lightingOptions={LIGHTING_OPTIONS}
                  activeLighting={activeLighting}
                  onUndo={handleUndo}
                  onRedo={handleRedo}
                  canUndo={undoStack.length > 0}
                  canRedo={redoStack.length > 0}
                  isPanelOpenOnMobile={isPanelOpenOnMobile}
                  onOpenCropModal={handleOpenCropModal}
                />
              </div>

              <aside 
                className={cn(
                  "backdrop-blur-xl flex flex-col transition-transform duration-500 ease-in-out border-white/10 bg-black/20",
                  isPanelDocked 
                    ? "fixed top-0 right-0 h-full w-[40%] max-w-sm border-l" 
                    : `absolute md:relative bottom-0 right-0 h-auto md:h-full w-full md:w-1/3 md:max-w-sm md:border-l`,
                  isPanelDocked
                    ? "translate-x-0"
                    : cn(isSheetCollapsed && !isPanelDocked ? 'translate-y-[calc(100%-2rem)]' : 'translate-y-0', 'md:translate-y-0')
                )}
                style={{ transitionProperty: 'transform' }}
              >
                  <button 
                    onClick={() => setIsSheetCollapsed(!isSheetCollapsed)} 
                    className={cn(
                      "w-full h-8 flex-shrink-0 flex items-center justify-center bg-white/5",
                       isPanelDocked ? "hidden" : "md:hidden"
                    )}
                    aria-label={isSheetCollapsed ? t('app.expandPanel') : t('app.collapsePanel')}
                  >
                    {isSheetCollapsed ? <ChevronUpIcon className="w-6 h-6 text-gray-300" /> : <ChevronDownIcon className="w-6 h-6 text-gray-300" />}
                  </button>
                  <div className="p-4 md:p-6 pb-20 md:pb-6 overflow-y-auto flex-grow flex flex-col gap-8">
                    {error && (
                      <div className="bg-red-500/20 backdrop-blur-md text-red-100 border border-red-400/50 p-4 rounded-lg" role="alert">
                        <p className="font-bold text-white">{t('app.error.title')}</p>
                        <p>{error}</p>
                      </div>
                    )}
                    <OutfitStack 
                      outfitHistory={activeOutfitLayers}
                      onRevertToLayer={handleRevertToLayer}
                      onGarmentColorChangeAtIndex={handleColorChangeAtIndex}
                      onMagicWandEditAtIndex={handleMagicWandEditAtIndex}
                      isLoading={isLoading}
                    />
                    <WardrobePanel
                      onGarmentSelect={handleGarmentSelect}
                      activeGarmentIds={activeGarmentIds}
                      isLoading={isLoading}
                      wardrobe={wardrobe}
                    />
                  </div>
              </aside>
            </main>
            <AnimatePresence>
              {isLoading && isMobile && (
                <motion.div
                  className="fixed inset-0 bg-black/50 backdrop-blur-md flex flex-col items-center justify-center z-50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Spinner />
                  {loadingMessage && (
                    <p className="text-lg font-serif text-gray-200 mt-4 text-center px-4">{loadingMessage}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            <LookbookTemplateModal 
              isOpen={isLookbookTemplateModalOpen}
              onClose={() => setIsLookbookTemplateModalOpen(false)}
              onGenerate={handleGenerateLookbook}
              isLoading={isLoading}
            />
             <AnimatePresence>
              {isLookbookModalOpen && lookbookUrl && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/60 backdrop-blur-lg z-50 flex items-center justify-center p-4"
                  onClick={() => setIsLookbookModalOpen(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="relative bg-gray-800/30 backdrop-blur-2xl border border-white/20 p-4 rounded-2xl shadow-2xl max-w-3xl w-full"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h2 className="text-2xl font-serif text-center mb-4 text-white">{t('app.lookbook.title')}</h2>
                    <img src={lookbookUrl} alt="Generated Lookbook" className="w-full h-auto object-contain rounded-lg max-h-[70vh]" />
                    <button 
                      onClick={() => setIsLookbookModalOpen(false)}
                      className="absolute top-2 right-2 p-2 rounded-full bg-white/10 hover:bg-white/20"
                      aria-label={t('app.lookbook.close')}
                    >
                      <XIcon className="w-5 h-5 text-white" />
                    </button>
                     <a 
                      href={lookbookUrl} 
                      download="my-lookbook.png" 
                      className="mt-4 w-full block text-center bg-white/10 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 ease-in-out hover:bg-white/20 active:scale-95 text-base border border-white/20"
                    >
                      {t('app.lookbook.download')}
                    </a>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            <CropModal 
              isOpen={isCropModalOpen}
              onClose={() => setIsCropModalOpen(false)}
              imageUrl={displayImageUrl}
              onCropComplete={handleImageCrop}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <Footer isOnDressingScreen={!!modelImageUrl} isPanelDocked={isPanelDocked} />
    </div>
  );
};

export default App;