/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { useLanguage } from '../contexts/LanguageContext';
import { XIcon } from './icons';

interface CropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  onCropComplete: (croppedImageUrl: string) => void;
}

// Function to generate the cropped image data URL
function getCroppedImg(
    image: HTMLImageElement,
    crop: Crop,
): string {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  
  canvas.width = crop.width * scaleX;
  canvas.height = crop.height * scaleY;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No 2d context');
  }

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  return canvas.toDataURL('image/png');
}

const CropModal: React.FC<CropModalProps> = ({ isOpen, onClose, imageUrl, onCropComplete }) => {
  const { t } = useLanguage();
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        width / height,
        width,
        height,
      ),
      width,
      height,
    );
    setCrop(initialCrop);
    setCompletedCrop(initialCrop);
  }

  const handleApplyCrop = () => {
    if (completedCrop?.width && completedCrop?.height && imgRef.current) {
      try {
        const croppedImageUrl = getCroppedImg(imgRef.current, completedCrop);
        onCropComplete(croppedImageUrl);
      } catch (e) {
        console.error("Cropping failed", e);
      }
    }
  };

  if (!isOpen || !imageUrl) return null;

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
        className="relative bg-gray-800/30 backdrop-blur-2xl border border-white/20 p-6 rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-serif text-center mb-4 text-white">{t('cropModal.title')}</h2>
        <div className="flex-grow flex items-center justify-center my-4 overflow-hidden">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
            >
              <img
                ref={imgRef}
                alt="Crop me"
                src={imageUrl}
                onLoad={onImageLoad}
                style={{ maxHeight: '70vh', objectFit: 'contain' }}
              />
            </ReactCrop>
        </div>
        <button 
          onClick={handleApplyCrop}
          className="mt-4 w-full block text-center bg-white/10 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 ease-in-out hover:bg-white/20 active:scale-95 text-base border border-white/20"
        >
          {t('cropModal.apply')}
        </button>
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

export default CropModal;