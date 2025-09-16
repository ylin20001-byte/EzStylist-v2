/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext.tsx';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="absolute top-4 right-4 z-[60] flex items-center gap-1 bg-black/20 backdrop-blur-md border border-white/20 rounded-full p-1">
      <button 
        onClick={() => setLanguage('EN')}
        className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${language === 'EN' ? 'bg-white/20 text-white' : 'text-gray-300 hover:bg-white/10'}`}
        aria-pressed={language === 'EN'}
      >EN</button>
      <button 
        onClick={() => setLanguage('中文')}
        className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${language === '中文' ? 'bg-white/20 text-white' : 'text-gray-300 hover:bg-white/10'}`}
        aria-pressed={language === '中文'}
      >中文</button>
    </div>
  );
};

export default LanguageSwitcher;