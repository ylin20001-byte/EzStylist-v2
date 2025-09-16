/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useMemo } from 'react';
import type { WardrobeItem } from '../types.ts';
import { UploadCloudIcon, CheckCircleIcon } from './icons.tsx';
import { useLanguage } from '../contexts/LanguageContext.tsx';

interface WardrobePanelProps {
  onGarmentSelect: (garmentFile: File, garmentInfo: WardrobeItem) => void;
  activeGarmentIds: string[];
  isLoading: boolean;
  wardrobe: WardrobeItem[];
}

type Category = 'top' | 'accessory';

const urlToFile = (url: string, filename: string): Promise<File> => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.setAttribute('crossOrigin', 'anonymous');

        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context.'));
            }
            ctx.drawImage(image, 0, 0);

            canvas.toBlob((blob) => {
                if (!blob) {
                    return reject(new Error('Canvas toBlob failed.'));
                }
                const mimeType = blob.type || 'image/png';
                const file = new File([blob], filename, { type: mimeType });
                resolve(file);
            }, 'image/png');
        };

        image.onerror = (error) => {
            reject(new Error(`Could not load image from URL for canvas conversion. Error: ${error}`));
        };

        image.src = url;
    });
};

const WardrobePanel: React.FC<WardrobePanelProps> = ({ onGarmentSelect, activeGarmentIds, isLoading, wardrobe }) => {
    const [error, setError] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<Category>('top');
    const { t } = useLanguage();

    const filteredWardrobe = useMemo(() => 
        wardrobe.filter(item => item.category === activeCategory),
        [wardrobe, activeCategory]
    );

    const handleGarmentClick = async (item: WardrobeItem) => {
        if (isLoading || activeGarmentIds.includes(item.id)) return;
        setError(null);
        try {
            const file = await urlToFile(item.url, item.name);
            onGarmentSelect(file, item);
        } catch (err) {
            const detailedError = t('wardrobe.error.load');
            setError(detailedError);
            console.error(`[CORS Check] Failed to load and convert wardrobe item from URL: ${item.url}. The browser's console should have a specific CORS error message if that's the issue.`, err);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!file.type.startsWith('image/')) {
                setError(t('start.error.fileType'));
                return;
            }
            const customGarmentInfo: WardrobeItem = {
                id: `custom-${Date.now()}`,
                name: file.name,
                url: URL.createObjectURL(file),
                category: activeCategory
            };
            onGarmentSelect(file, customGarmentInfo);
        }
    };

  return (
    <div className="pt-6 border-t border-white/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
             <div className="flex items-center gap-3">
                <h2 className="text-xl font-serif tracking-wider text-white">{t('wardrobe.title')}</h2>
            </div>
            <div className="flex-shrink-0 flex items-center gap-1 bg-black/20 backdrop-blur-md border border-white/20 rounded-full p-1">
                <button 
                    onClick={() => setActiveCategory('top')}
                    className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${activeCategory === 'top' ? 'bg-white/20 text-white' : 'text-gray-300 hover:bg-white/10'}`}
                >{t('wardrobe.tops')}</button>
                 <button 
                    onClick={() => setActiveCategory('accessory')}
                    className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${activeCategory === 'accessory' ? 'bg-white/20 text-white' : 'text-gray-300 hover:bg-white/10'}`}
                >{t('wardrobe.accessories')}</button>
            </div>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-3 gap-2 sm:gap-3">
            {filteredWardrobe.map((item) => {
            const isActive = activeGarmentIds.includes(item.id);
            return (
                <button
                key={item.id}
                onClick={() => handleGarmentClick(item)}
                disabled={isLoading || isActive}
                className={`relative aspect-square border rounded-lg overflow-hidden transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/50 focus:ring-white/50 group disabled:opacity-50 disabled:cursor-not-allowed border-white/20`}
                aria-label={`${t('wardrobe.select')} ${item.name}`}
                >
                <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs font-bold text-center p-1">{item.name}</p>
                </div>
                {isActive && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
                        <CheckCircleIcon className="w-8 h-8 text-white" />
                    </div>
                )}
                </button>
            );
            })}
            <label htmlFor="custom-garment-upload" className={`relative aspect-square border-2 border-dashed border-white/30 rounded-lg flex flex-col items-center justify-center text-gray-300 transition-colors ${isLoading ? 'cursor-not-allowed bg-white/5' : 'hover:border-white/50 hover:text-white cursor-pointer'}`}>
                <UploadCloudIcon className="w-6 h-6 mb-1"/>
                <span className="text-xs text-center">{t('wardrobe.upload')}</span>
                <input id="custom-garment-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp, image/avif, image/heic, image/heif" onChange={handleFileChange} disabled={isLoading}/>
            </label>
        </div>
        {wardrobe.length === 0 && (
             <p className="text-center text-sm text-gray-400 mt-4">{t('wardrobe.empty')}</p>
        )}
        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
    </div>
  );
};

export default WardrobePanel;