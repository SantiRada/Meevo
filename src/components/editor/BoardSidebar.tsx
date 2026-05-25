import React, { useState } from 'react';
import type { BoardConfig } from '../../services/storage/types';
import { ChevronDown20Regular } from '@fluentui/react-icons';

interface BoardSidebarProps {
  initialConfig?: BoardConfig;
  onSave: (config: BoardConfig) => void;
}

const PATH_SHAPES: BoardConfig['pathShape'][] = ['Square', 'Circle', 'Pentagon', 'Hexagon', 'Snake'];

export const BoardSidebar: React.FC<BoardSidebarProps> = ({ initialConfig, onSave }) => {
  const [boardType, setBoardType] = useState<BoardConfig['type']>(initialConfig?.type || 'Fixed Path');
  
  const [pathShape, setPathShape] = useState<BoardConfig['pathShape']>(initialConfig?.pathShape || 'Square');
  const [tileCount, setTileCount] = useState<number>(initialConfig?.tileCount || 40);
  const [tileWidth, setTileWidth] = useState<number>(initialConfig?.tileWidth || 60);
  const [tileHeight, setTileHeight] = useState<number>(initialConfig?.tileHeight || 60);
  const [gap, setGap] = useState<number>(initialConfig?.gap || 10);
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const sides = pathShape === 'Pentagon' ? 5 : pathShape === 'Hexagon' ? 6 : 0;
  const showWarning = sides > 0 && (tileCount % sides !== 0);

  let maxHeightWarning = false;
  let recommendedMaxHeight = 0;

  if (sides > 0 && tileCount >= sides) {
    const stepDistance = tileWidth + gap;
    const edgeLength = (tileCount / sides) * stepDistance;
    
    const interiorTotal = tileCount - sides;
    const maxSteps = Math.floor(interiorTotal / sides) + (interiorTotal % sides > 0 ? 1 : 0) + 1;
    const minStepDist = edgeLength / maxSteps;
    
    const D = minStepDist - tileWidth / 2 - gap;
    const alpha = Math.PI / sides;
    const R = 6;
    
    if (D > R) {
      recommendedMaxHeight = Math.floor(2 * (R + (D - R) / Math.tan(alpha)));
      if (tileHeight > recommendedMaxHeight) {
        maxHeightWarning = true;
      }
    } else {
      maxHeightWarning = true;
      recommendedMaxHeight = 0;
    }
  }

  const handleSave = () => {
    onSave({ type: boardType, pathShape, tileCount, tileWidth, tileHeight, gap });
  };

  return (
    <>
      {/* Title */}
      <div className="py-4 px-6 border-b border-[#CCCCCC]/10 shrink-0">
        <h2 className="text-base font-medium text-meevo-text-primary">Board</h2>
      </div>

      <div className="px-6 py-6 flex-1 overflow-y-auto">
        {/* BOARD TYPE */}
        <div className="mb-6">
          <label className="block text-xs font-medium text-meevo-text-secondary mb-3 tracking-wider uppercase">
            Board Type
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => setBoardType('Fixed Path')}
              className={`flex-1 flex flex-col items-start p-3 rounded-md border transition-colors ${
                boardType === 'Fixed Path' 
                  ? 'bg-[#141E17] border-[#5BB661]' 
                  : 'bg-[#1A1A1D] border-[#CCCCCC]/10 hover:border-meevo-purple'
              }`}
            >
              <span className="text-sm font-medium text-meevo-text-primary mb-1">Fixed Path</span>
              <span className="text-xs text-meevo-text-tertiary text-left leading-snug">Linear path like Monopoly</span>
            </button>

            <button
              onClick={() => setBoardType('Modular')}
              className={`flex-1 flex flex-col items-start p-3 rounded-md border transition-colors ${
                boardType === 'Modular' 
                  ? 'bg-[#141E17] border-[#5BB661]' 
                  : 'bg-[#1A1A1D] border-[#CCCCCC]/10 hover:border-meevo-purple'
              }`}
            >
              <span className="text-sm font-medium text-meevo-text-primary mb-1">Modular</span>
              <span className="text-xs text-meevo-text-tertiary text-left leading-snug">Create modules like Catan</span>
            </button>
          </div>
        </div>

        {/* Separator */}
        <div className="h-px w-full bg-[#CCCCCC]/10 mb-6" />

        {/* PATH SHAPE */}
        <div className="mb-6 relative">
          <label className="block text-xs font-medium text-meevo-text-secondary mb-2 tracking-wider uppercase">
            Path Shape
          </label>
          <div 
            className="w-full bg-[#1A1A1D] rounded-md px-3 py-2 min-h-[38px] flex items-center justify-between cursor-pointer focus-within:ring-1 focus-within:ring-meevo-purple"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span className="text-sm text-meevo-text-primary">{pathShape}</span>
            <ChevronDown20Regular className="text-meevo-text-tertiary shrink-0 ml-2" />
          </div>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 w-full mt-1 bg-[#1A1A1D] border border-[#CCCCCC]/10 rounded-sm shadow-xl z-20 py-2">
              {PATH_SHAPES.map(shape => (
                <button 
                  key={shape}
                  onClick={() => {
                    setPathShape(shape);
                    setIsDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-meevo-text-primary hover:bg-[#070709] transition-colors"
                >
                  {shape}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* TILE COUNT */}
        <div className="mb-6">
          <label className="block text-xs font-medium text-meevo-text-secondary mb-2 tracking-wider uppercase">
            Tile Count
          </label>
          <input 
            type="number" 
            value={tileCount}
            onChange={(e) => setTileCount(parseInt(e.target.value) || 0)}
            placeholder="20, 30, 40..."
            className="w-full bg-[#1A1A1D] rounded-md px-3 py-2 text-sm text-meevo-text-primary outline-none focus:ring-1 focus:ring-meevo-purple transition-colors mb-2"
          />
          {showWarning && (
            <div className="bg-[#2A2100] border border-[#403100] rounded-md p-2 text-xs text-[#F0B100] leading-snug">
              With {tileCount} tiles, the {pathShape} will have uneven sides. Use a multiple of {sides} for perfect symmetry.
            </div>
          )}
        </div>

        {/* WIDTH & HEIGHT */}
        <div className="mb-6 flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-meevo-text-secondary mb-2 tracking-wider uppercase">
              Width
            </label>
            <input 
              type="number" 
              value={tileWidth}
              onChange={(e) => setTileWidth(parseInt(e.target.value) || 0)}
              className="w-full bg-[#1A1A1D] rounded-md px-3 py-2 text-sm text-meevo-text-primary outline-none focus:ring-1 focus:ring-meevo-purple transition-colors"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-meevo-text-secondary mb-2 tracking-wider uppercase">
              Height
            </label>
            <input 
              type="number" 
              value={tileHeight}
              onChange={(e) => setTileHeight(parseInt(e.target.value) || 0)}
              className={`w-full bg-[#1A1A1D] rounded-md px-3 py-2 text-sm text-meevo-text-primary outline-none focus:ring-1 transition-colors ${
                maxHeightWarning ? 'border border-[#F0B100] focus:ring-[#F0B100]' : 'focus:ring-meevo-purple'
              }`}
            />
          </div>
        </div>
        {maxHeightWarning && (
          <div className="mb-6 bg-[#2A2100] border border-[#403100] rounded-md p-2 text-xs text-[#F0B100] leading-snug">
            {recommendedMaxHeight > 0 
              ? `Height exceeds geometric limits (Max: ${recommendedMaxHeight}). Inner corners will overlap.`
              : `Tiles are too wide or gap is too small for this count. Inner corners will overlap.`}
          </div>
        )}

        {/* GAP */}
        <div className="mb-6">
          <label className="block text-xs font-medium text-meevo-text-secondary mb-2 tracking-wider uppercase">
            Gap
          </label>
          <input 
            type="number" 
            value={gap}
            onChange={(e) => setGap(parseInt(e.target.value) || 0)}
            className="w-full bg-[#1A1A1D] rounded-md px-3 py-2 text-sm text-meevo-text-primary outline-none focus:ring-1 focus:ring-meevo-purple transition-colors"
          />
        </div>

      </div>

      {/* Footer */}
      <div className="p-6 flex justify-end bg-meevo-panel shrink-0">
        <button 
          onClick={handleSave}
          className="px-5 py-2.5 bg-meevo-text-primary text-meevo-text-inverse rounded-md text-sm font-medium hover:bg-meevo-text-secondary transition-colors"
        >
          Create Board
        </button>
      </div>
    </>
  );
};
