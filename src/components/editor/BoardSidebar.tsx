import React, { useState } from 'react';
import type { BoardConfig } from '../../services/storage/types';
import { ChevronDown20Regular, Add20Regular, Save20Regular } from '@fluentui/react-icons';

interface BoardSidebarProps {
  initialConfig?: BoardConfig;
  onSave: (config: BoardConfig) => void;
  onDeleteBoard?: () => void;
}

const PATH_SHAPES: BoardConfig['pathShape'][] = ['Square', 'Circle', 'Pentagon', 'Hexagon', 'Snake', 'Grid', 'Spiral', 'Free Paths'];

const SpiralIcon = ({ dir }: { dir: string }) => {
  let rot = 0, scaleX = 1, scaleY = 1;
  switch (dir) {
    case 'U_R': rot = 0; scaleX = 1; scaleY = 1; break;
    case 'U_L': rot = 0; scaleX = -1; scaleY = 1; break;
    case 'D_R': rot = 0; scaleX = 1; scaleY = -1; break;
    case 'D_L': rot = 0; scaleX = -1; scaleY = -1; break;
    case 'R_D': rot = 90; scaleX = 1; scaleY = 1; break;
    case 'L_U': rot = -90; scaleX = 1; scaleY = 1; break;
    case 'L_D': rot = -90; scaleX = -1; scaleY = 1; break;
    case 'R_U': rot = 90; scaleX = -1; scaleY = 1; break;
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ transform: `rotate(${rot}deg) scaleX(${scaleX}) scaleY(${scaleY})` }}>
      <path d="M8 18V12C8 9.79086 9.79086 8 12 8H18M18 8L14 4M18 8L14 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

export const BoardSidebar: React.FC<BoardSidebarProps> = ({ initialConfig, onSave, onDeleteBoard }) => {
  const [boardType, setBoardType] = useState<BoardConfig['type']>(initialConfig?.type || 'Fixed Path');
  
  const [pathShape, setPathShape] = useState<BoardConfig['pathShape']>(initialConfig?.pathShape || 'Square');
  const [tileCount, setTileCount] = useState<number>(initialConfig?.tileCount || 40);
  const [tileWidth, setTileWidth] = useState<number>(initialConfig?.tileWidth || 350);
  const [tileHeight, setTileHeight] = useState<number>(initialConfig?.tileHeight || 350);
  const [gap, setGap] = useState<number>(initialConfig?.gap || 30);
  const [gridColumns, setGridColumns] = useState<number>(initialConfig?.gridColumns || 8);
  const [gridRows, setGridRows] = useState<number>(initialConfig?.gridRows || 8);
  const [gapLine, setGapLine] = useState<number>(initialConfig?.gapLine || 1);
  const [spiralDirection, setSpiralDirection] = useState<'U_L' | 'U_R' | 'D_L' | 'D_R' | 'L_D' | 'L_U' | 'R_D' | 'R_U'>(initialConfig?.spiralDirection || 'U_R');
  const [spiralRounded, setSpiralRounded] = useState<boolean>(initialConfig?.spiralRounded || false);
  const [connectEnd, setConnectEnd] = useState<boolean>(initialConfig?.connectEnd || false);
  
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
    onSave({ ...initialConfig, type: boardType, pathShape, tileCount, tileWidth, tileHeight, gap, gridColumns, gridRows, gapLine, spiralDirection, spiralRounded, connectEnd } as BoardConfig);
  };

  return (
    <>
      {/* Title */}
      <div className="h-[56px] px-6 border-b border-meevo-border flex items-center shrink-0">
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
                  ? 'bg-[#5BB661]/10 bg-meevo-surface-5 border-[#5BB661]' 
                  : 'bg-meevo-surface-2 border-meevo-border hover:border-meevo-purple'
              }`}
            >
              <span className="text-sm font-medium text-meevo-text-primary mb-1">Fixed Path</span>
              <span className="text-xs text-meevo-text-tertiary text-left leading-snug">Linear path like Monopoly</span>
            </button>

            <button
              onClick={() => setBoardType('Modular')}
              className={`flex-1 flex flex-col items-start p-3 rounded-md border transition-colors ${
                boardType === 'Modular' 
                  ? 'bg-[#5BB661]/10 bg-meevo-surface-5 border-[#5BB661]' 
                  : 'bg-meevo-surface-2 border-meevo-border hover:border-meevo-purple'
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
            className="w-full bg-meevo-surface-2 rounded-md px-3 py-2 min-h-[38px] flex items-center justify-between cursor-pointer focus-within:ring-1 focus-within:ring-meevo-purple"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span className="text-sm text-meevo-text-primary">{pathShape}</span>
            <ChevronDown20Regular className="text-meevo-text-tertiary shrink-0 ml-2" />
          </div>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 w-full mt-1 bg-meevo-surface-2 border border-meevo-border rounded-sm shadow-xl z-20 py-2">
              {PATH_SHAPES.map(shape => (
                <button 
                  key={shape}
                  onClick={() => {
                    setPathShape(shape);
                    setIsDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-meevo-text-primary hover:bg-meevo-surface-2 transition-colors"
                >
                  {shape}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* TILE COUNT or GRID DIMENSIONS */}
        {pathShape === 'Grid' ? (
          <div className="mb-6 flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-meevo-text-secondary mb-2 tracking-wider uppercase">
                Columns
              </label>
              <input 
                type="number" 
                value={gridColumns}
                onChange={(e) => setGridColumns(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-meevo-surface-2 rounded-md px-3 py-2 text-sm text-meevo-text-primary outline-none focus:ring-1 focus:ring-meevo-purple transition-colors"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-meevo-text-secondary mb-2 tracking-wider uppercase">
                Rows
              </label>
              <input 
                type="number" 
                value={gridRows}
                onChange={(e) => setGridRows(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-meevo-surface-2 rounded-md px-3 py-2 text-sm text-meevo-text-primary outline-none focus:ring-1 focus:ring-meevo-purple transition-colors"
              />
            </div>
          </div>
        ) : (
          <div className="mb-6">
            <label className="block text-xs font-medium text-meevo-text-secondary mb-2 tracking-wider uppercase">
              Tile Count
            </label>
            <input 
              type="number" 
              value={tileCount}
              onChange={(e) => setTileCount(parseInt(e.target.value) || 0)}
              placeholder="20, 30, 40..."
              className="w-full bg-meevo-surface-2 rounded-md px-3 py-2 text-sm text-meevo-text-primary outline-none focus:ring-1 focus:ring-meevo-purple transition-colors mb-2"
            />
            {showWarning && (
              <div className="bg-[#2A2100] border border-[#403100] rounded-md p-2 text-xs text-[#F0B100] leading-snug">
                With {tileCount} tiles, the {pathShape} will have uneven sides. Use a multiple of {sides} for perfect symmetry.
              </div>
            )}
          </div>
        )}

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
              className="w-full bg-meevo-surface-2 rounded-md px-3 py-2 text-sm text-meevo-text-primary outline-none focus:ring-1 focus:ring-meevo-purple transition-colors"
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
              className={`w-full bg-meevo-surface-2 rounded-md px-3 py-2 text-sm text-meevo-text-primary outline-none focus:ring-1 transition-colors ${
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
        {pathShape === 'Spiral' ? (
          <>
            <div className="mb-6 flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-meevo-text-secondary mb-2 tracking-wider uppercase">
                  Gap
                </label>
                <input 
                  type="number" 
                  value={gap}
                  onChange={(e) => setGap(parseInt(e.target.value) || 0)}
                  className="w-full bg-meevo-surface-2 rounded-md px-3 py-2 text-sm text-meevo-text-primary outline-none focus:ring-1 focus:ring-meevo-purple transition-colors"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-meevo-text-secondary mb-2 tracking-wider uppercase">
                  Between Lines
                </label>
                <input 
                  type="number" 
                  value={gapLine}
                  min={1}
                  onChange={(e) => setGapLine(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-meevo-surface-2 rounded-md px-3 py-2 text-sm text-meevo-text-primary outline-none focus:ring-1 focus:ring-meevo-purple transition-colors"
                />
              </div>
            </div>
            
            {/* SPIRAL DIRECTION */}
            <div className="mb-6">
              <label className="block text-xs font-medium text-meevo-text-secondary mb-2 tracking-wider uppercase">
                Spiral Direction
              </label>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  {(['U_L', 'U_R', 'D_L', 'D_R'] as const).map(dir => (
                    <button
                      key={dir}
                      onClick={() => setSpiralDirection(dir)}
                      className={`flex-1 flex justify-center items-center h-12 rounded-md border transition-colors ${
                        spiralDirection === dir 
                          ? 'bg-[#141E17] border-[#5BB661] text-meevo-text-primary' 
                          : 'bg-meevo-surface-2 border-meevo-border text-meevo-text-tertiary hover:border-meevo-purple'
                      }`}
                    >
                      <SpiralIcon dir={dir} />
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  {(['L_D', 'L_U', 'R_D', 'R_U'] as const).map(dir => (
                    <button
                      key={dir}
                      onClick={() => setSpiralDirection(dir)}
                      className={`flex-1 flex justify-center items-center h-12 rounded-md border transition-colors ${
                        spiralDirection === dir 
                          ? 'bg-[#141E17] border-[#5BB661] text-meevo-text-primary' 
                          : 'bg-meevo-surface-2 border-meevo-border text-meevo-text-tertiary hover:border-meevo-purple'
                      }`}
                    >
                      <SpiralIcon dir={dir} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* SPIRAL ROUNDED TOGGLE */}
            <div className="mb-6 flex items-center justify-between">
              <label className="text-xs font-medium text-meevo-text-secondary tracking-wider uppercase">
                Rounded Curves
              </label>
              <button
                onClick={() => setSpiralRounded(!spiralRounded)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  spiralRounded ? 'bg-meevo-purple' : 'bg-meevo-surface-2 border border-meevo-border'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    spiralRounded ? 'translate-x-4' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </>
        ) : (
          <>
            {pathShape !== 'Free Paths' && (
              <div className="mb-6">
                <label className="block text-xs font-medium text-meevo-text-secondary mb-2 tracking-wider uppercase">
                  Gap
                </label>
                <input 
                  type="number" 
                  value={gap}
                  onChange={(e) => setGap(parseInt(e.target.value) || 0)}
                  className="w-full bg-meevo-surface-2 rounded-md px-3 py-2 text-sm text-meevo-text-primary outline-none focus:ring-1 focus:ring-meevo-purple transition-colors"
                />
              </div>
            )}
            
            {pathShape === 'Snake' && (
              <div className="mb-6 flex items-center justify-between">
                <label className="text-xs font-medium text-meevo-text-secondary tracking-wider uppercase">
                  Connect end
                </label>
                <button
                  onClick={() => setConnectEnd(!connectEnd)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    connectEnd ? 'bg-meevo-purple' : 'bg-meevo-surface-2 border border-meevo-border'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      connectEnd ? 'translate-x-4' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            )}
          </>
        )}

      </div>

      <div className="p-4 border-t border-meevo-border shrink-0 flex flex-col gap-3">
        <button 
          onClick={handleSave}
          className="w-full py-2 bg-meevo-purple text-white text-sm font-medium rounded-md hover:bg-meevo-purple-active transition-colors flex items-center justify-center gap-2"
        >
          {initialConfig?.type ? <Save20Regular fontSize={16} /> : <Add20Regular fontSize={16} />}
          {initialConfig?.type ? 'Save Board' : 'Create Board'}
        </button>
        {initialConfig?.type && (
          <button 
            onClick={() => onDeleteBoard?.()}
            className="w-full bg-[rgba(0,0,0,0.05)] border border-red-500/30 text-red-500 py-2 rounded-md text-sm font-medium hover:bg-red-500/10 transition-colors"
          >
            Delete Board
          </button>
        )}
      </div>
    </>
  );
};
