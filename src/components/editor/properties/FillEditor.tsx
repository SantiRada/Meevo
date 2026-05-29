import React from 'react';
import { Dismiss20Regular } from '@fluentui/react-icons';

interface FillEditorProps {
  fillColor: string | undefined;
  binding?: string;
  bindingName?: string;
  isImage?: boolean;
  imageSrc?: string;
  imageOpacity?: number;
  onChange: (field: string, value: any) => void;
  onRemoveBinding?: () => void;
  onOpenBindingModal?: () => void;
  onOpenColorPicker: (x: number, y: number) => void;
  onOpenImagePicker?: (x: number, y: number) => void;
  isCardMode?: boolean;
}

export const FillEditor: React.FC<FillEditorProps> = ({
  fillColor,
  binding,
  bindingName,
  isImage = false,
  imageSrc,
  imageOpacity = 100,
  onChange,
  onRemoveBinding,
  onOpenBindingModal,
  onOpenColorPicker,
  onOpenImagePicker,
  isCardMode = false
}) => {
  return (
    <div className="mb-6 pb-6 border-b border-meevo-border">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-[10px] font-bold text-meevo-text-secondary tracking-wider uppercase">Fill</label>
        {!isImage && onOpenBindingModal && (
          <button
            onClick={onOpenBindingModal}
            className="text-[10px] font-bold text-meevo-purple tracking-wider uppercase hover:text-meevo-text-primary transition-colors"
          >
            {isCardMode ? 'Styles' : 'Prop.'}
          </button>
        )}
      </div>
      
      {isImage ? (
        <div className="flex gap-2 items-center bg-meevo-surface-2 rounded-md focus-within:ring-1 focus-within:ring-meevo-purple overflow-hidden border border-meevo-border">
          <div 
            className="flex-1 flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-[#2A2A2D]"
            onClick={(e) => onOpenImagePicker && onOpenImagePicker(e.clientX, e.clientY)}
          >
            <div className="w-4 h-4 rounded-sm border border-meevo-border shrink-0 bg-cover bg-center" style={{ backgroundImage: `url(${imageSrc || ''})`, backgroundColor: '#333' }}>
              {!imageSrc && <div className="w-full h-full bg-white rounded-sm" style={{ clipPath: 'polygon(0 100%, 100% 100%, 100% 50%, 70% 20%, 30% 60%, 0 30%)' }} />}
            </div>
            <span className="text-sm text-meevo-text-primary">Image</span>
          </div>
          <div className="flex items-center gap-1 px-2 border-l border-meevo-border">
            <input type="number" value={imageOpacity} onChange={e => onChange('opacity', Math.max(0, Math.min(100, parseInt(e.target.value)||0)))} className="w-10 bg-transparent text-sm text-meevo-text-primary outline-none text-right" />
            <span className="text-xs text-meevo-text-tertiary">%</span>
          </div>
        </div>
      ) : binding ? (
        <div className="flex items-center justify-between bg-meevo-purple hover:bg-meevo-purple-active/20 border border-meevo-purple/50 rounded-md px-3 py-1.5">
          <span className="text-sm text-meevo-purple font-medium">Property: {bindingName || binding}</span>
          {onRemoveBinding && (
            <button onClick={onRemoveBinding} className="text-meevo-purple hover:text-meevo-text-primary transition-colors">
              <Dismiss20Regular fontSize={16} />
            </button>
          )}
        </div>
      ) : (
        <div className="flex gap-2 items-center bg-meevo-surface-2 rounded-md px-2 py-1.5 focus-within:ring-1 focus-within:ring-meevo-purple">
          <div 
            className="w-4 h-4 rounded overflow-hidden shrink-0 border border-meevo-border cursor-pointer"
            style={{ backgroundColor: fillColor && fillColor !== 'transparent' ? fillColor : '#000000' }}
            onClick={(e) => onOpenColorPicker(e.clientX, e.clientY)}
          />
          <input type="text" value={fillColor || '#000000'} onChange={e => onChange('fillColor', e.target.value)} className="flex-1 min-w-0 bg-transparent text-sm text-meevo-text-primary outline-none uppercase" />
        </div>
      )}
    </div>
  );
};
