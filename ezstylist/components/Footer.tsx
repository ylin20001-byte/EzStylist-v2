/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface FooterProps {
  isOnDressingScreen?: boolean;
  isPanelDocked?: boolean;
}

const Footer: React.FC<FooterProps> = ({ isOnDressingScreen = false }) => {
  const { t } = useLanguage();
  return (
    <footer className={`fixed bottom-0 left-0 right-0 bg-black/20 backdrop-blur-lg p-3 z-50 ${isOnDressingScreen ? 'hidden' : ''}`}>
      <div className="mx-auto flex items-center justify-center text-xs text-gray-300 max-w-7xl px-4">
        <p>
          {t('footer.poweredBy')}{' '}
          <span 
            className="font-semibold text-white"
          >
            EzAi
          </span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;