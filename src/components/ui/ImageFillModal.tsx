import React, { useRef, useEffect } from 'react';
import { ChevronDown20Regular, Image20Regular } from '@fluentui/react-icons';
import type { LayerData } from '../../services/storage/types';

interface ImageFillModalProps {
  layer: LayerData;
  x: number;
  y: number;
  onChange: (data: Partial<LayerData>) => void;
  onClose: () => void;
}

export const ImageFillModal: React.FC<ImageFillModalProps> = ({ layer, x, y, onChange, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const modes = ['fill', 'fit', 'crop', 'tile'] as const;
  const currentMode = layer.imageMode || 'fill';

  return (
    <div 
      ref={modalRef}
      className="fixed z-50 bg-[#1A1A1D] border border-[#333] rounded-lg shadow-2xl p-4 flex flex-col gap-4"
      style={{ left: x, top: y, width: 240 }}
    >
      <div className="flex items-center gap-2 relative">
        <div 
          className="flex-1 bg-[#0D0D0F] border border-[#333] rounded-md px-3 py-2 flex items-center justify-between cursor-pointer"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <span className="text-sm text-meevo-text-primary capitalize">{currentMode}</span>
          <ChevronDown20Regular fontSize={14} className="text-meevo-text-tertiary" />
        </div>
        
        {dropdownOpen && (
          <div className="absolute top-full left-0 mt-1 w-full bg-[#2A2A2D] border border-[#444] rounded-md shadow-xl z-50 overflow-hidden">
            {modes.map(mode => (
              <div 
                key={mode}
                className="px-3 py-2 text-sm text-meevo-text-primary hover:bg-meevo-purple cursor-pointer capitalize"
                onClick={() => {
                  onChange({ imageMode: mode });
                  setDropdownOpen(false);
                }}
              >
                {mode}
              </div>
            ))}
          </div>
        )}
      </div>

      {currentMode === 'tile' && (
        <div className="flex items-center gap-2 bg-[#0D0D0F] border border-[#333] rounded-md px-3 py-1.5 focus-within:ring-1 focus-within:ring-meevo-purple">
          <span className="text-xs text-meevo-text-tertiary">Size</span>
          <input 
            type="number" 
            min="10"
            value={layer.imageTileSize || 50} 
            onChange={e => onChange({ imageTileSize: Math.max(10, parseInt(e.target.value) || 50) })} 
            className="flex-1 min-w-0 bg-transparent text-sm text-meevo-text-primary outline-none text-right" 
          />
          <span className="text-xs text-meevo-text-tertiary">px</span>
        </div>
      )}

      <div className="w-full aspect-square bg-[#0D0D0F] border border-[#333] rounded-md overflow-hidden relative flex items-center justify-center">
        {!layer.src ? (
          <Image20Regular className="text-[#444] text-4xl" />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            backgroundImage: currentMode === 'tile' ? `url(${layer.src})` : undefined,
            backgroundRepeat: currentMode === 'tile' ? 'repeat' : undefined,
            backgroundSize: currentMode === 'tile' ? `${layer.imageTileSize || 50}px` : undefined,
          }}>
            {currentMode !== 'tile' && (
              <img 
                src={layer.src} 
                alt="Preview" 
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: currentMode === 'fit' ? 'contain' : currentMode === 'crop' ? 'none' : 'cover'
                }} 
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
