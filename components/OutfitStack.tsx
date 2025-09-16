/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { OutfitLayer } from '../types.ts';
import { Trash2Icon, PaletteIcon, WandIcon } from './icons.tsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext.tsx';


interface OutfitStackProps {
  outfitHistory: OutfitLayer[];
  onRevertToLayer: (index: number) => void;
  onGarmentColorChangeAtIndex: (index: number, color: string) => void;
  onMagicWandEditAtIndex: (index: number, instruction: string) => void;
  isLoading: boolean;
}

const COLORS = ["#EF4444", "#3B82F6", "#22C55E", "#A855F7", "#EC4899", "#F97316", "#F5F5F5", "#18181B"];

const OutfitStack: React.FC<OutfitStackProps> = ({ outfitHistory, onRevertToLayer, onGarmentColorChangeAtIndex, onMagicWandEditAtIndex, isLoading }) => {
  const [showColorPickerFor, setShowColorPickerFor] = useState<number | null>(null);
  const [showMagicWandFor, setShowMagicWandFor] = useState<number | null>(null);
  const [magicWandInput, setMagicWandInput] = useState('');
  const { t } = useLanguage();
  
  const handleWandSubmit = (e: React.FormEvent, index: number) => {
      e.preventDefault();
      if (magicWandInput.trim()) {
          onMagicWandEditAtIndex(index, magicWandInput.trim());
          setMagicWandInput('');
          setShowMagicWandFor(null);
      }
  };

  return (
    <div className="flex flex-col">
      <h2 className="text-xl font-serif tracking-wider text-white border-b border-white/20 pb-2 mb-3">{t('outfitStack.title')}</h2>
      <div className="space-y-2">
        {outfitHistory.map((layer, index) => {
           const canEdit = index > 0;
           const garmentId = layer.garment?.id || 'base';

          return (
            <div key={`${garmentId}-${index}`} className="relative">
              <div
                className="flex items-center justify-between bg-white/10 backdrop-blur-md p-2 rounded-lg animate-fade-in border border-white/20"
              >
                <div className="flex items-center overflow-hidden">
                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 mr-3 text-xs font-bold text-gray-200 bg-white/10 rounded-full">
                      {index + 1}
                    </span>
                    {layer.garment && (
                        <img src={layer.garment.url} alt={layer.garment.name} className="flex-shrink-0 w-12 h-12 object-cover rounded-md mr-3" />
                    )}
                    <span className="font-semibold text-gray-100 truncate" title={layer.garment?.name}>
                      {layer.garment ? layer.garment.name : t('outfitStack.baseModel')}
                    </span>
                </div>
                {canEdit && (
                  <div className="flex-shrink-0 flex items-center">
                    <div className="relative">
                      <button
                        onClick={() => {
                          setShowMagicWandFor(showMagicWandFor === index ? null : index);
                          setShowColorPickerFor(null);
                        }}
                        className="text-gray-300 hover:text-white transition-colors p-2 rounded-md hover:bg-white/10"
                        aria-label={t('magicWand.label')}
                      >
                        <WandIcon className="w-5 h-5" />
                      </button>
                      <AnimatePresence>
                        {showMagicWandFor === index && (
                            <motion.form
                                onSubmit={(e) => handleWandSubmit(e, index)}
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute z-10 top-full right-0 mt-2 p-2 bg-black/50 backdrop-blur-xl border border-white/20 rounded-lg shadow-lg flex items-center gap-2 w-max"
                            >
                                <input
                                    type="text"
                                    value={magicWandInput}
                                    onChange={(e) => setMagicWandInput(e.target.value)}
                                    placeholder={t('magicWand.placeholder')}
                                    className="bg-white/10 text-white placeholder-gray-400 text-sm rounded-md px-2 py-1 border-0 focus:ring-2 focus:ring-white/50 focus:outline-none w-48"
                                    autoFocus
                                />
                                <button type="submit" disabled={isLoading} className="text-white text-sm font-semibold hover:bg-white/20 px-3 py-1 rounded-md disabled:opacity-50">{t('magicWand.submit')}</button>
                            </motion.form>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => {
                          setShowColorPickerFor(showColorPickerFor === index ? null : index);
                          setShowMagicWandFor(null);
                        }}
                        className="text-gray-300 hover:text-white transition-colors p-2 rounded-md hover:bg-white/10"
                        aria-label={`${t('outfitStack.changeColor')} ${layer.garment?.name}`}
                      >
                        <PaletteIcon className="w-5 h-5" />
                      </button>
                       <AnimatePresence>
                        {showColorPickerFor === index && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute z-10 top-full right-0 mt-2 p-2 bg-black/50 backdrop-blur-xl border border-white/20 rounded-lg shadow-lg flex gap-2"
                          >
                            {COLORS.map(color => (
                              <button
                                key={color}
                                onClick={() => {
                                  onGarmentColorChangeAtIndex(index, color);
                                  setShowColorPickerFor(null);
                                }}
                                className="w-6 h-6 rounded-full border border-gray-300/50 transition-transform active:scale-90 hover:scale-110"
                                style={{ backgroundColor: color }}
                                aria-label={`${t('outfitStack.changeColorTo')} ${color}`}
                              />
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <button
                      onClick={() => onRevertToLayer(index)}
                      className="text-gray-300 hover:text-red-400 transition-colors p-2 rounded-md hover:bg-red-500/10"
                      aria-label={`${t('outfitStack.remove')} ${layer.garment?.name}`}
                    >
                      <Trash2Icon className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
        {outfitHistory.length === 1 && (
            <p className="text-center text-sm text-gray-400 pt-4">{t('outfitStack.empty')}</p>
        )}
      </div>
    </div>
  );
};

export default OutfitStack;