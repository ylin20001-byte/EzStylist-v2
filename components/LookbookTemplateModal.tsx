/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { motion } from 'framer-motion';
import { LOOKBOOK_TEMPLATES, LookbookTemplate } from '../types.ts';
import { XIcon } from './icons.tsx';
import { useLanguage } from '../contexts/LanguageContext.tsx';

interface LookbookTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (templatePrompt: string) => void;
  isLoading: boolean;
}

const LookbookTemplateModal: React.FC<LookbookTemplateModalProps> = ({ isOpen, onClose, onGenerate, isLoading }) => {
    const { t } = useLanguage();
    if (!isOpen) return null;

  return (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-lg z-50 flex items-center justify-center p-4"
        onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="relative bg-gray-800/30 backdrop-blur-2xl border border-white/20 p-6 rounded-2xl shadow-2xl max-w-2xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-serif text-center mb-6 text-white">{t('lookbookTemplates.title')}</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(Object.keys(LOOKBOOK_TEMPLATES) as LookbookTemplate[]).map(template => (
                 <button 
                    key={template}
                    onClick={() => onGenerate(LOOKBOOK_TEMPLATES[template])}
                    disabled={isLoading}
                    className="aspect-video bg-white/5 border border-white/20 rounded-lg p-4 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                 >
                    <p className="font-semibold text-white">{t(`lookbookTemplates.templates.${template}`, template)}</p>
                    <p className="text-xs text-gray-400 mt-1">{LOOKBOOK_TEMPLATES[template]}</p>
                 </button>
            ))}
        </div>

        <button 
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/10 hover:bg-white/20"
          aria-label={t('app.lookbook.close')}
        >
          <XIcon className="w-5 h-5 text-white" />
        </button>
      </motion.div>
    </motion.div>
  );
};

export default LookbookTemplateModal;