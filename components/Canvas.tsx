/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { RotateCcwIcon, ChevronLeftIcon, ChevronRightIcon, BookOpenIcon, SunIcon, DownloadIcon, UndoIcon, RedoIcon, MenuIcon, CropIcon } from './icons.tsx';
import Spinner from './Spinner.tsx';
import { AnimatePresence, motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext.tsx';
import { PoseInstruction, BackgroundOption, LightingOption } from '../types.ts';

interface CanvasProps {
  displayImageUrl: string | null;
  onStartOver: () => void;
  isLoading: boolean;
  loadingMessage: string;
  onSelectPose: (index: number) => void;
  poseInstructions: readonly PoseInstruction[];
  currentPoseIndex: number;
  availablePoseKeys: readonly PoseInstruction[];
  onBackgroundChange: (prompt: string) => void;
  backgroundOptions: readonly BackgroundOption[];
  onOpenLookbookTemplates: () => void;
  activeBackground: string;
  onLightingChange: (prompt: string) => void;
  lightingOptions: readonly LightingOption[];
  activeLighting: string;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isPanelOpenOnMobile?: boolean;
  onOpenCropModal: () => void;
}

const Canvas: React.FC<CanvasProps> = ({ 
  displayImageUrl, 
  onStartOver, 
  isLoading, 
  loadingMessage, 
  onSelectPose, 
  poseInstructions, 
  currentPoseIndex, 
  availablePoseKeys,
  onBackgroundChange,
  backgroundOptions,
  onOpenLookbookTemplates,
  activeBackground,
  onLightingChange,
  lightingOptions,
  activeLighting,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  isPanelOpenOnMobile = false,
  onOpenCropModal
}) => {
  const [isPoseMenuOpen, setIsPoseMenuOpen] = useState(false);
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const { t } = useLanguage();
  
  const handlePreviousPose = () => {
    if (isLoading || availablePoseKeys.length <= 1) return;

    const currentPoseInstruction = poseInstructions[currentPoseIndex];
    const currentIndexInAvailable = availablePoseKeys.indexOf(currentPoseInstruction);
    
    if (currentIndexInAvailable === -1) {
        onSelectPose((currentPoseIndex - 1 + poseInstructions.length) % poseInstructions.length);
        return;
    }

    const prevIndexInAvailable = (currentIndexInAvailable - 1 + availablePoseKeys.length) % availablePoseKeys.length;
    const prevPoseInstruction = availablePoseKeys[prevIndexInAvailable];
    const newGlobalPoseIndex = poseInstructions.indexOf(prevPoseInstruction);
    
    if (newGlobalPoseIndex !== -1) {
        onSelectPose(newGlobalPoseIndex);
    }
  };

  const handleNextPose = () => {
    if (isLoading) return;

    const currentPoseInstruction = poseInstructions[currentPoseIndex];
    const currentIndexInAvailable = availablePoseKeys.indexOf(currentPoseInstruction);

    if (currentIndexInAvailable === -1 || availablePoseKeys.length === 0) {
        onSelectPose((currentPoseIndex + 1) % poseInstructions.length);
        return;
    }
    
    const nextIndexInAvailable = currentIndexInAvailable + 1;
    if (nextIndexInAvailable < availablePoseKeys.length) {
        const nextPoseInstruction = availablePoseKeys[nextIndexInAvailable];
        const newGlobalPoseIndex = poseInstructions.indexOf(nextPoseInstruction);
        if (newGlobalPoseIndex !== -1) {
            onSelectPose(newGlobalPoseIndex);
        }
    } else {
        const newGlobalPoseIndex = (currentPoseIndex + 1) % poseInstructions.length;
        onSelectPose(newGlobalPoseIndex);
    }
  };

  const handleDownload = () => {
    if (!displayImageUrl) return;
    const link = document.createElement('a');
    link.href = displayImageUrl;
    link.download = `virtual-try-on-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="w-full h-full flex items-center justify-center p-4 relative group">
      <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
        <button 
            onClick={onStartOver}
            className="flex items-center justify-center text-center bg-black/20 backdrop-blur-md text-white border border-white/20 hover:bg-white/20 font-semibold py-2 px-3 rounded-full transition-all duration-200 ease-in-out active:scale-95 text-sm"
        >
            <RotateCcwIcon className="w-4 h-4 mr-2" />
            {t('canvas.startOver')}
        </button>
        <div className="flex items-center gap-1 bg-black/20 backdrop-blur-md border border-white/20 rounded-full p-1">
          <button onClick={onUndo} disabled={!canUndo || isLoading} aria-label={t('canvas.undo')} className="p-1.5 rounded-full hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-90">
            <UndoIcon className="w-4 h-4 text-white" />
          </button>
          <button onClick={onRedo} disabled={!canRedo || isLoading} aria-label={t('canvas.redo')} className="p-1.5 rounded-full hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-90">
            <RedoIcon className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      <div className="relative w-full h-full flex items-center justify-center">
        {displayImageUrl ? (
          <img
            key={displayImageUrl}
            src={displayImageUrl}
            alt="Virtual try-on model"
            className="max-w-full max-h-full object-contain transition-opacity duration-500 animate-fade-in rounded-lg"
          />
        ) : (
            <div className="w-[400px] h-[600px] bg-white/5 border border-white/10 rounded-lg flex flex-col items-center justify-center">
              <Spinner />
              <p className="text-md font-serif text-gray-300 mt-4">{t('canvas.loadingModel')}</p>
            </div>
        )}
        
        <AnimatePresence>
          {isLoading && (
              <motion.div
                  className="absolute inset-0 bg-black/50 backdrop-blur-md flex flex-col items-center justify-center z-20 rounded-lg"
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
      </div>

      {displayImageUrl && !isLoading && !isPanelOpenOnMobile && (
        <div 
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 flex items-start gap-2"
        >
          <div
            onMouseEnter={() => setIsOptionsMenuOpen(true)}
            onMouseLeave={() => setIsOptionsMenuOpen(false)}
            className="relative"
          >
            <button 
              onClick={() => setIsOptionsMenuOpen(prev => !prev)}
              className="p-3.5 flex items-center justify-center gap-2 bg-black/20 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 active:scale-90 transition-all"
            >
              <MenuIcon className="w-5 h-5 text-white"/>
            </button>
            <AnimatePresence>
              {isOptionsMenuOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute bottom-full mb-3 w-56 sm:w-64 bg-black/40 backdrop-blur-xl rounded-xl p-2 border border-white/20 flex flex-col gap-1"
                >
                  <div>
                      <p className="text-xs text-gray-400 px-2 pt-1 font-semibold uppercase">Lighting</p>
                      <div className="grid grid-cols-2 gap-1 mt-1">
                          {lightingOptions.map((lt) => (
                              <button
                                  key={lt}
                                  onClick={() => onLightingChange(lt)}
                                  disabled={isLoading || lt === activeLighting}
                                  className="w-full text-left text-sm font-medium text-gray-200 p-2 rounded-md hover:bg-white/10 disabled:opacity-50 disabled:bg-white/10 disabled:font-bold disabled:cursor-not-allowed"
                              >
                                  {t(`lighting.${lt}`, lt)}
                              </button>
                          ))}
                      </div>
                  </div>
                  <hr className="border-white/10 my-1" />
                  <div>
                      <p className="text-xs text-gray-400 px-2 pt-1 font-semibold uppercase">Background</p>
                      <div className="grid grid-cols-2 gap-1 mt-1">
                          {backgroundOptions.map((bg) => (
                              <button
                                  key={bg}
                                  onClick={() => onBackgroundChange(bg)}
                                  disabled={isLoading || bg === activeBackground}
                                  className="w-full text-left text-sm font-medium text-gray-200 p-2 rounded-md hover:bg-white/10 disabled:opacity-50 disabled:bg-white/10 disabled:font-bold disabled:cursor-not-allowed"
                              >
                                  {t(`backgrounds.${bg}`, bg)}
                              </button>
                          ))}
                      </div>
                  </div>
                  <hr className="border-white/10 my-1" />
                  <button 
                    onClick={onOpenCropModal}
                    className="w-full flex items-center gap-3 text-left text-sm font-medium text-gray-200 p-2 rounded-md hover:bg-white/10"
                    aria-label={t('canvas.crop')}
                  >
                    <CropIcon className="w-4 h-4 text-white"/>
                    <span>{t('canvas.crop')}</span>
                  </button>
                  <button 
                    onClick={onOpenLookbookTemplates}
                    className="w-full flex items-center gap-3 text-left text-sm font-medium text-gray-200 p-2 rounded-md hover:bg-white/10"
                    aria-label={t('canvas.lookbook')}
                  >
                    <BookOpenIcon className="w-4 h-4 text-white"/>
                    <span>{t('canvas.lookbook')}</span>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="w-full flex items-center gap-3 text-left text-sm font-medium text-gray-200 p-2 rounded-md hover:bg-white/10"
                    aria-label={t('canvas.download')}
                  >
                    <DownloadIcon className="w-4 h-4 text-white" />
                    <span>{t('canvas.download')}</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div
            onMouseEnter={() => setIsPoseMenuOpen(true)}
            onMouseLeave={() => setIsPoseMenuOpen(false)}
            className="relative"
          >
            <AnimatePresence>
                {isPoseMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute bottom-full mb-3 w-56 sm:w-64 bg-black/40 backdrop-blur-xl rounded-xl p-2 border border-white/20"
                    >
                        <div className="grid grid-cols-2 gap-2">
                            {poseInstructions.map((pose, index) => (
                                <button
                                    key={pose}
                                    onClick={() => onSelectPose(index)}
                                    disabled={isLoading || index === currentPoseIndex}
                                    className="w-full text-left text-sm font-medium text-gray-200 p-2 rounded-md hover:bg-white/10 disabled:opacity-50 disabled:bg-white/10 disabled:font-bold disabled:cursor-not-allowed"
                                >
                                    {t(`poses.${pose}`, pose)}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            <div className="flex items-center justify-center gap-2 bg-black/20 backdrop-blur-md rounded-full p-2 border border-white/20">
              <button 
                onClick={handlePreviousPose}
                aria-label={t('canvas.prevPose')}
                className="p-2 rounded-full hover:bg-white/10 active:scale-90 transition-all disabled:opacity-50"
                disabled={isLoading}
              >
                <ChevronLeftIcon className="w-5 h-5 text-white" />
              </button>
              <span className="text-sm font-semibold text-white w-32 sm:w-48 text-center truncate" title={poseInstructions[currentPoseIndex]}>
                {t(`poses.${poseInstructions[currentPoseIndex]}`, poseInstructions[currentPoseIndex])}
              </span>
              <button 
                onClick={handleNextPose}
                aria-label={t('canvas.nextPose')}
                className="p-2 rounded-full hover:bg-white/10 active:scale-90 transition-all disabled:opacity-50"
                disabled={isLoading}
              >
                <ChevronRightIcon className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Canvas;