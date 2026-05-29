import React from 'react';
import type { CardData } from '../../services/storage/types';
import { ColorPickerModal } from '../ui/ColorPickerModal';
import { SizeEditor } from './properties/SizeEditor';
import { FillEditor } from './properties/FillEditor';
import { StrokeEditor } from './properties/StrokeEditor';

interface CardDetailSidebarProps {
  cardData: CardData | undefined;
  onUpdateCard: (data: Partial<CardData>) => void;
}

export const CardDetailSidebar: React.FC<CardDetailSidebarProps> = ({
  cardData,
  onUpdateCard
}) => {
  const [activePicker, setActivePicker] = React.useState<{ field: keyof CardData, x: number, y: number } | null>(null);

  if (!cardData) return null;

  const handleChange = (field: keyof CardData, value: any) => {
    onUpdateCard({ [field]: value });
  };

  const CornerIcon = ({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) => {
    const tr = pos === 'tl' ? '' : pos === 'tr' ? 'scaleX(-1)' : pos === 'bl' ? 'scaleY(-1)' : 'scale(-1, -1)';
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" style={{ transform: tr }}>
        <path d="M 2 12 L 2 5 Q 2 2 5 2 L 12 2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  };

  const rTL = cardData.roundedTL ?? cardData.rounded ?? 0;
  const rTR = cardData.roundedTR ?? cardData.rounded ?? 0;
  const rBL = cardData.roundedBL ?? cardData.rounded ?? 0;
  const rBR = cardData.roundedBR ?? cardData.rounded ?? 0;

  return (
    <div className="w-80 h-full border-l border-meevo-border flex flex-col z-10 relative bg-meevo-surface-1 shrink-0">
      <div className="h-[56px] px-6 border-b border-meevo-border flex items-center shrink-0">
        <h2 className="text-base font-medium text-meevo-text-primary">Card Properties</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <SizeEditor 
          width={cardData.width}
          height={cardData.height}
          allowModes={false}
          onChange={(field, value) => handleChange(field as keyof CardData, value)}
        />

        <hr className="border-meevo-border" />

        {/* Padding */}
        <div>
          <h3 className="text-[10px] font-bold text-meevo-text-secondary tracking-wider mb-2 uppercase">Padding</h3>
          <div className="flex bg-meevo-surface-2 border border-meevo-border rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-meevo-purple h-8">
            <input type="number" min="0" value={cardData.padding || 0} onChange={e => handleChange('padding', Number(e.target.value))} className="w-full bg-transparent text-sm text-meevo-text-primary outline-none px-3" />
          </div>
        </div>

        <hr className="border-meevo-border" />

        {/* Rounded Corners */}
        <div>
          <h3 className="text-[10px] font-bold text-meevo-text-secondary tracking-wider mb-2 uppercase">Rounded Corners</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex bg-meevo-surface-2 border border-meevo-border rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-meevo-purple h-8">
              <div className="w-8 flex items-center justify-center text-[#777]"><CornerIcon pos="tl" /></div>
              <input type="number" min="0" value={rTL} onChange={e => handleChange('roundedTL', Math.max(0, Number(e.target.value)||0))} className="w-full bg-transparent text-sm text-meevo-text-primary outline-none px-1 text-center" />
            </div>
            <div className="flex bg-meevo-surface-2 border border-meevo-border rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-meevo-purple h-8">
              <input type="number" min="0" value={rTR} onChange={e => handleChange('roundedTR', Math.max(0, Number(e.target.value)||0))} className="w-full bg-transparent text-sm text-meevo-text-primary outline-none px-1 text-center" />
              <div className="w-8 flex items-center justify-center text-[#777]"><CornerIcon pos="tr" /></div>
            </div>
            <div className="flex bg-meevo-surface-2 border border-meevo-border rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-meevo-purple h-8">
              <div className="w-8 flex items-center justify-center text-[#777]"><CornerIcon pos="bl" /></div>
              <input type="number" min="0" value={rBL} onChange={e => handleChange('roundedBL', Math.max(0, Number(e.target.value)||0))} className="w-full bg-transparent text-sm text-meevo-text-primary outline-none px-1 text-center" />
            </div>
            <div className="flex bg-meevo-surface-2 border border-meevo-border rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-meevo-purple h-8">
              <input type="number" min="0" value={rBR} onChange={e => handleChange('roundedBR', Math.max(0, Number(e.target.value)||0))} className="w-full bg-transparent text-sm text-meevo-text-primary outline-none px-1 text-center" />
              <div className="w-8 flex items-center justify-center text-[#777]"><CornerIcon pos="br" /></div>
            </div>
          </div>
        </div>

        <hr className="border-meevo-border" />

        <FillEditor 
          fillColor={cardData.fillColor}
          onChange={(field, value) => handleChange(field as keyof CardData, value)}
          onOpenColorPicker={(x, y) => setActivePicker({ field: 'fillColor', x, y })}
        />

        <StrokeEditor 
          strokeWidth={cardData.strokeWidth ?? 0}
          strokeColor={cardData.strokeColor}
          onChange={(field, value) => handleChange(field as keyof CardData, value)}
          onOpenColorPicker={(x, y) => setActivePicker({ field: 'strokeColor', x, y })}
        />

      </div>

      {activePicker && (
        <ColorPickerModal
          x={activePicker.x}
          y={activePicker.y}
          color={(cardData[activePicker.field] as string) || (activePicker.field === 'fillColor' ? '#FFFFFF' : '#000000')}
          onChange={(color) => handleChange(activePicker.field, color)}
          onClose={() => setActivePicker(null)}
        />
      )}
    </div>
  );
};
