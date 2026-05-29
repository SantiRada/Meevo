import React from 'react';
import { Dismiss20Regular } from '@fluentui/react-icons';

interface StrokeEditorProps {
  strokeWidth: number;
  strokeColor: string | undefined;
  strokeOpacity?: number;
  binding?: string;
  bindingName?: string;
  onChange: (field: string, value: any) => void;
  onRemoveBinding?: () => void;
  onOpenBindingModal?: () => void;
  onOpenColorPicker: (x: number, y: number) => void;
  isCardMode?: boolean;
}

export const StrokeEditor: React.FC<StrokeEditorProps> = ({
  strokeWidth,
  strokeColor,
  strokeOpacity = 100,
  binding,
  bindingName,
  onChange,
  onRemoveBinding,
  onOpenBindingModal,
  onOpenColorPicker,
  isCardMode = false
}) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-[10px] font-bold text-meevo-text-secondary tracking-wider uppercase">Stroke</label>
        {onOpenBindingModal && (
          <button
            onClick={onOpenBindingModal}
            className="text-[10px] font-bold text-meevo-purple tracking-wider uppercase hover:text-meevo-text-primary transition-colors"
          >
            {isCardMode ? 'Styles' : 'Prop.'}
          </button>
        )}
      </div>
      {binding ? (
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
          <span className="text-xs text-meevo-text-tertiary flex items-center shrink-0">≡</span>
          <input 
            type="number" 
            value={strokeWidth ?? 0} 
            onChange={e => onChange('strokeWidth', Math.max(0, parseInt(e.target.value)||0))} 
            className="w-8 shrink-0 bg-transparent text-sm text-meevo-text-primary outline-none text-right" 
          />
          
          <div 
            className="w-4 h-4 rounded overflow-hidden shrink-0 border border-meevo-border ml-2 cursor-pointer"
            style={{ backgroundColor: strokeColor || '#FFFFFF' }}
            onClick={(e) => onOpenColorPicker(e.clientX, e.clientY)}
          />
          <input 
            type="text" 
            value={strokeColor || '#FFFFFF'} 
            onChange={e => onChange('strokeColor', e.target.value)} 
            className="flex-1 min-w-0 bg-transparent text-sm text-meevo-text-primary outline-none uppercase" 
          />
          <input 
            type="number" 
            value={strokeOpacity ?? 100} 
            onChange={e => onChange('strokeOpacity', Math.max(0, Math.min(100, parseInt(e.target.value)||0)))} 
            className="w-10 shrink-0 bg-transparent text-sm text-meevo-text-primary outline-none text-right" 
          />
          <span className="text-xs text-meevo-text-tertiary shrink-0">%</span>
        </div>
      )}
    </div>
  );
};
