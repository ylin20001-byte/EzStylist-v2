/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloudIcon } from './icons.tsx';
import { Compare } from './ui/compare.tsx';
import { generateModelImage } from '../services/geminiService.ts';
import Spinner from './Spinner.tsx';
import { getFriendlyErrorMessage } from '../lib/utils.ts';
import { useLanguage } from '../contexts/LanguageContext.tsx';

interface StartScreenProps {
  onModelFinalized: (modelUrl: string) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onModelFinalized }) => {
  const [userImageUrl, setUserImageUrl] = useState<string | null>(null);
  const [generatedModelUrl, setGeneratedModelUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
        setError(t('start.error.fileType'));
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        setUserImageUrl(dataUrl);
        setIsGenerating(true);
        setGeneratedModelUrl(null);
        setError(null);
        try {
            const result = await generateModelImage(file);
            setGeneratedModelUrl(result);
        } catch (err) {
            setError(getFriendlyErrorMessage(err, t('start.error.createModel')));
        } finally {
            setIsGenerating(false);
        }
    };
    reader.readAsDataURL(file);
  }, [t]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const reset = () => {
    setUserImageUrl(null);
    setGeneratedModelUrl(null);
    setIsGenerating(false);
    setError(null);
  };

  const screenVariants = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  };

  return (
    <AnimatePresence mode="wait">
      {!userImageUrl ? (
        <motion.div
          key="uploader"
          className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12 px-4"
          variants={screenVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          <div className="lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="max-w-lg">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-white leading-tight">
                {t('start.title')}
              </h1>
              <p className="mt-4 text-base sm:text-lg text-gray-300">
                {t('start.subtitle')}
              </p>
              <hr className="my-8 border-white/20" />
              <div className="flex flex-col items-center lg:items-start w-full gap-3">
                <label htmlFor="image-upload-start" className="w-full relative flex items-center justify-center px-8 py-3 text-base font-semibold text-white bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 rounded-md cursor-pointer group transition-colors">
                  <UploadCloudIcon className="w-5 h-5 mr-3" />
                  {t('start.upload')}
                </label>
                <input 
                  id="image-upload-start" 
                  type="file" 
                  className="hidden" 
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg, image/webp, image/avif, image/heic, image/heif" 
                />
                <p className="text-xs text-gray-400">
                  {t('start.tip')}
                </p>
              </div>
            </div>
          </div>
          <div className="lg:w-1/2 w-full max-w-sm lg:max-w-md aspect-[3/4]">
             <Compare 
                firstImage="https://i.ibb.co/FqHTqFMx/stockphoto1.jpg" 
                secondImage="https://i.ibb.co/20BcgyfV/Generated-Image-September-16-2025-2-11-PM.png"
                className="w-full h-full rounded-2xl border border-white/10 shadow-2xl"
                autoplay={true}
                autoplayDuration={3000}
             />
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="generator"
          className="w-full max-w-4xl mx-auto flex flex-col items-center px-4"
          variants={screenVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          <h2 className="text-2xl sm:text-3xl font-serif text-white text-center">{t('start.compare.title')}</h2>
          <p className="mt-2 text-gray-300 text-center max-w-2xl text-sm sm:text-base">
              {t('start.compare.subtitle')}
          </p>

          <div className="mt-8 w-full max-w-xs sm:max-w-sm md:max-w-md aspect-square relative">
              {isGenerating && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-md flex flex-col items-center justify-center z-30 rounded-2xl">
                      <Spinner />
                      <p className="mt-4 text-gray-200 font-serif">{t('start.compare.generating')}</p>
                  </div>
              )}
              {error && (
                  <div className="absolute inset-0 bg-red-900/50 backdrop-blur-md flex flex-col items-center justify-center z-30 rounded-2xl p-4 text-center">
                      <p className="font-bold text-white text-lg">{t('start.compare.failed')}</p>
                      <p className="text-red-200 mt-2">{error}</p>
                      <button onClick={reset} className="mt-4 bg-white/10 text-white font-semibold py-2 px-4 rounded-lg border border-white/20 hover:bg-white/20">
                          {t('start.compare.tryAgain')}
                      </button>
                  </div>
              )}
              {!isGenerating && !error && generatedModelUrl && userImageUrl && (
                  <Compare 
                      firstImage={userImageUrl}
                      secondImage={generatedModelUrl}
                      className="w-full h-full rounded-2xl border border-white/20 shadow-2xl"
                  />
              )}
          </div>
          
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-sm sm:max-w-none">
              <button 
                  onClick={reset}
                  className="w-full sm:w-auto flex items-center justify-center text-center bg-black/20 backdrop-blur-md text-white border border-white/20 hover:bg-white/20 font-semibold py-3 px-6 rounded-lg transition-colors duration-200 ease-in-out active:scale-95 text-base"
              >
                  {t('start.compare.newPhoto')}
              </button>
              <button 
                  onClick={() => onModelFinalized(generatedModelUrl!)}
                  disabled={!generatedModelUrl || isGenerating}
                  className="w-full sm:w-auto flex items-center justify-center text-center bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/20 font-semibold py-3 px-6 rounded-lg transition-colors duration-200 ease-in-out active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  {t('start.compare.continue')}
              </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StartScreen;