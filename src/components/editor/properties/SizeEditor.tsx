import React, { useState } from 'react';

interface SizeEditorProps {
  width: number;
  height: number;
  sizingW?: 'fixed' | 'hug' | 'fill' | string;
  sizingH?: 'fixed' | 'hug' | 'fill' | string;
  onChange: (field: string, value: any) => void;
  allowModes?: boolean;
  isText?: boolean;
}

export const SizeEditor: React.FC<SizeEditorProps> = ({
  width,
  height,
  sizingW = 'fixed',
  sizingH = 'fixed',
  onChange,
  allowModes = true,
  isText = false
}) => {
  const [dropdownOpen, setDropdownOpen] = useState<'width' | 'height' | null>(null);

  return (
    <div className="mb-6">
      <label className="block text-[10px] font-bold text-meevo-text-secondary tracking-wider mb-2 uppercase">Size</label>
      <div className="flex gap-2">
        <div className="flex-1 flex items-center bg-meevo-surface-2 rounded-md pl-2 pr-1 py-1.5 focus-within:ring-1 focus-within:ring-meevo-purple relative">
          <span className="text-xs text-meevo-text-tertiary w-4">W</span>
          {allowModes && sizingW !== 'fixed' ? (
            <div 
              className="w-full text-center text-sm text-[#777777] uppercase cursor-text select-none font-bold pr-4"
              onClick={() => onChange('sizingW', 'fixed')}
            >
              {sizingW}
            </div>
          ) : (
            <input 
              type="number" 
              min="0" 
              step="0.001"
              value={width || 0} 
              onChange={e => {
                if (allowModes) onChange('sizingW', 'fixed');
                onChange('width', Math.max(0, Math.round(Number(e.target.value) * 1000) / 1000 || 0));
              }} 
              className="w-full bg-transparent text-sm text-meevo-text-primary outline-none text-center" 
            />
          )}
          {allowModes && (
            <>
              <div 
                className="absolute right-0 top-0 bottom-0 w-6 flex items-center justify-center cursor-pointer text-meevo-text-tertiary hover:text-meevo-text-primary"
                onClick={() => setDropdownOpen(dropdownOpen === 'width' ? null : 'width')}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
              {dropdownOpen === 'width' && (
                <div className="absolute right-0 top-full mt-1 w-24 bg-meevo-surface-2 border border-meevo-border rounded-md shadow-lg z-50 overflow-hidden">
                  {['fixed', isText ? 'hug' : null, 'fill'].filter(Boolean).map(mode => (
                    <div 
                      key={mode as string} 
                      className="px-3 py-1.5 text-xs text-meevo-text-primary hover:bg-meevo-purple cursor-pointer uppercase"
                      onClick={() => { onChange('sizingW', mode); setDropdownOpen(null); }}
                    >
                      {mode as string}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="flex-1 flex items-center bg-meevo-surface-2 rounded-md pl-2 pr-1 py-1.5 focus-within:ring-1 focus-within:ring-meevo-purple relative">
          <span className="text-xs text-meevo-text-tertiary w-4">H</span>
          {allowModes && sizingH !== 'fixed' ? (
            <div 
              className="w-full text-center text-sm text-[#777777] uppercase cursor-text select-none font-bold pr-4"
              onClick={() => onChange('sizingH', 'fixed')}
            >
              {sizingH}
            </div>
          ) : (
            <input 
              type="number" 
              min="0" 
              step="0.001"
              value={height || 0} 
              onChange={e => {
                if (allowModes) onChange('sizingH', 'fixed');
                onChange('height', Math.max(0, Math.round(Number(e.target.value) * 1000) / 1000 || 0));
              }} 
              className="w-full bg-transparent text-sm text-meevo-text-primary outline-none text-center" 
            />
          )}
          {allowModes && (
            <>
              <div 
                className="absolute right-0 top-0 bottom-0 w-6 flex items-center justify-center cursor-pointer text-meevo-text-tertiary hover:text-meevo-text-primary"
                onClick={() => setDropdownOpen(dropdownOpen === 'height' ? null : 'height')}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
              {dropdownOpen === 'height' && (
                <div className="absolute right-0 top-full mt-1 w-24 bg-meevo-surface-2 border border-meevo-border rounded-md shadow-lg z-50 overflow-hidden">
                  {['fixed', isText ? 'hug' : null, 'fill'].filter(Boolean).map(mode => (
                    <div 
                      key={mode as string} 
                      className="px-3 py-1.5 text-xs text-meevo-text-primary hover:bg-meevo-purple cursor-pointer uppercase"
                      onClick={() => { onChange('sizingH', mode); setDropdownOpen(null); }}
                    >
                      {mode as string}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
