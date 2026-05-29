import React, { useState } from 'react';
import type { DiceData } from '../../services/storage/types';
import { ColorPickerModal } from '../ui/ColorPickerModal';

interface DiceDetailSidebarProps {
  dice: DiceData;
  onUpdateDice: (id: string, updates: Partial<DiceData>) => void;
  editMode?: 'Global' | 'Individual';
  setEditMode?: (mode: 'Global' | 'Individual') => void;
  selectedFace?: number;
  setSelectedFace?: (face: number) => void;
}

export const DiceDetailSidebar: React.FC<DiceDetailSidebarProps> = ({ 
  dice, 
  onUpdateDice,
  editMode: externalEditMode,
  setEditMode: externalSetEditMode,
  selectedFace: externalSelectedFace,
  setSelectedFace: externalSetSelectedFace
}) => {
  const [internalEditMode, setInternalEditMode] = useState<'Global' | 'Individual'>('Global');
  const [internalSelectedFace, setInternalSelectedFace] = useState<number>(1);
  
  const editMode = externalEditMode ?? internalEditMode;
  const setEditMode = externalSetEditMode ?? setInternalEditMode;
  
  const selectedFace = externalSelectedFace ?? internalSelectedFace;
  const setSelectedFace = externalSetSelectedFace ?? setInternalSelectedFace;

  const [pickerState, setPickerState] = useState<{isOpen: boolean, field: string, x: number, y: number, color: string}>({ isOpen: false, field: '', x: 0, y: 0, color: '' });

  const openColorPicker = (e: React.MouseEvent, field: string, color: string) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPickerState({ isOpen: true, field, x: rect.left - 260, y: rect.top, color });
  };

  const handleColorChange = (color: string) => {
    const isDefault = color.toUpperCase() === 'DEFAULT';
    
    if (pickerState.field === 'baseColor') onUpdateDice(dice.id, { baseColor: color });
    else if (pickerState.field === 'pipColor') onUpdateDice(dice.id, { pipColor: color });
    else if (pickerState.field === 'edgeColor') onUpdateDice(dice.id, { edgeColor: color });
    else if (pickerState.field === 'faceBg') {
      const newFaces = { ...dice.faces };
      if (!newFaces[selectedFace]) newFaces[selectedFace] = {};
      if (isDefault) delete newFaces[selectedFace].backgroundColor;
      else newFaces[selectedFace].backgroundColor = color;
      onUpdateDice(dice.id, { faces: newFaces });
    }
    else if (pickerState.field === 'faceContent') {
      const newFaces = { ...dice.faces };
      if (!newFaces[selectedFace]) newFaces[selectedFace] = {};
      if (isDefault) delete newFaces[selectedFace].contentColor;
      else newFaces[selectedFace].contentColor = color;
      onUpdateDice(dice.id, { faces: newFaces });
    }
    setPickerState(prev => ({ ...prev, color }));
  };

  return (
    <div className="flex flex-col h-full bg-meevo-surface-1">
      <div className="h-[56px] px-6 border-b border-meevo-border flex items-center shrink-0">
        <h2 className="text-base font-medium text-meevo-text-primary">Dice Properties</h2>
      </div>

      <div className="flex border-b border-meevo-border p-2 gap-1">
        <button
          onClick={() => setEditMode('Global')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${editMode === 'Global' ? 'bg-meevo-surface-2 text-meevo-text-primary' : 'text-meevo-text-secondary hover:text-meevo-text-primary'}`}
        >
          Global
        </button>
        <button
          onClick={() => setEditMode('Individual')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${editMode === 'Individual' ? 'bg-meevo-surface-2 text-meevo-text-primary' : 'text-meevo-text-secondary hover:text-meevo-text-primary'}`}
        >
          Individual Faces
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        {editMode === 'Global' ? (
          <>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-meevo-text-secondary">Name</label>
              <input 
                type="text"
                value={dice.name}
                onChange={e => onUpdateDice(dice.id, { name: e.target.value })}
                className="w-full bg-meevo-surface-2 border border-meevo-border rounded-md px-3 py-2 text-sm text-meevo-text-primary focus:outline-none focus:border-meevo-purple"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-meevo-text-secondary">Base Color</label>
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded cursor-pointer border border-meevo-border" 
                  style={{ backgroundColor: dice.baseColor }}
                  onClick={(e) => openColorPicker(e, 'baseColor', dice.baseColor)}
                />
                <span className="text-xs text-meevo-text-primary uppercase">{dice.baseColor}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-meevo-text-secondary flex justify-between">
                <span>Corner Rounding</span>
                <span>{dice.rounded}px</span>
              </label>
              <input 
                type="range" 
                min={0} max={20} 
                value={dice.rounded}
                onChange={e => onUpdateDice(dice.id, { rounded: parseInt(e.target.value) })}
                className="w-full accent-meevo-purple"
              />
            </div>

            <hr className="border-meevo-border my-1" />

            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-meevo-text-secondary">Edge Color</label>
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded cursor-pointer border border-meevo-border" 
                  style={{ backgroundColor: dice.edgeColor || '#000000' }}
                  onClick={(e) => openColorPicker(e, 'edgeColor', dice.edgeColor || '#000000')}
                />
                <span className="text-xs text-meevo-text-primary uppercase">{dice.edgeColor || '#000000'}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-meevo-text-secondary flex justify-between">
                <span>Edge Size</span>
                <span>{dice.edgeSize || 0}</span>
              </label>
              <input 
                type="range" 
                min={0} max={20} 
                value={dice.edgeSize || 0}
                onChange={e => onUpdateDice(dice.id, { edgeSize: parseInt(e.target.value) })}
                className="w-full accent-meevo-purple"
              />
            </div>

            <hr className="border-meevo-border my-1" />

            {dice.template === 'Numbers' && (
              <>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-meevo-text-secondary">Font Family</label>
                  <select 
                    value={dice.fontFamily || 'Inter'}
                    onChange={e => onUpdateDice(dice.id, { fontFamily: e.target.value })}
                    className="w-full bg-meevo-surface-2 border border-meevo-border rounded-md px-3 py-2 text-sm text-meevo-text-primary focus:outline-none focus:border-meevo-purple"
                  >
                    <option value="Inter">Inter</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Arial">Arial</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Georgia">Georgia</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-meevo-text-secondary flex justify-between">
                    <span>Font Size</span>
                    <span>{dice.fontSize || 24}px</span>
                  </label>
                  <input 
                    type="range" 
                    min={12} max={100} 
                    value={dice.fontSize || 24}
                    onChange={e => onUpdateDice(dice.id, { fontSize: parseInt(e.target.value) })}
                    className="w-full accent-meevo-purple"
                  />
                  {(dice.fontSize || 24) > 40 && (
                    <div className="text-[10px] text-amber-500 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                      ⚠️ Large font sizes may clip or become unreadable on certain shapes.
                    </div>
                  )}
                </div>
              </>
            )}

            {(dice.template === 'Numbers' || dice.template === 'Dots') && (
              <>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-meevo-text-secondary">{dice.template === 'Dots' ? 'Dots Color' : 'Numbers Color'}</label>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded cursor-pointer border border-meevo-border" 
                      style={{ backgroundColor: dice.pipColor }}
                      onClick={(e) => openColorPicker(e, 'pipColor', dice.pipColor)}
                    />
                    <span className="text-xs text-meevo-text-primary uppercase">{dice.pipColor}</span>
                  </div>
                </div>
                <hr className="border-meevo-border my-1" />
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-meevo-text-secondary">Start Number</label>
                  <input 
                    type="number"
                    value={dice.startNumber}
                    onChange={e => onUpdateDice(dice.id, { startNumber: parseInt(e.target.value) || 0 })}
                    className="w-full bg-meevo-surface-2 border border-meevo-border rounded-md px-3 py-2 text-sm text-meevo-text-primary focus:outline-none focus:border-meevo-purple"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-meevo-text-secondary">Step Distance</label>
                  <input 
                    type="number"
                    value={dice.stepDistance}
                    onChange={e => onUpdateDice(dice.id, { stepDistance: parseInt(e.target.value) || 1 })}
                    className="w-full bg-meevo-surface-2 border border-meevo-border rounded-md px-3 py-2 text-sm text-meevo-text-primary focus:outline-none focus:border-meevo-purple"
                  />
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-meevo-text-secondary">Select Face</label>
              <select 
                value={selectedFace}
                onChange={e => setSelectedFace(parseInt(e.target.value))}
                className="w-full bg-meevo-surface-2 border border-meevo-border rounded-md px-3 py-2 text-sm text-meevo-text-primary focus:outline-none focus:border-meevo-purple"
              >
                {Array.from({ length: dice.sides }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>Face {i + 1}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-meevo-text-secondary">Face Background Color</label>
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded cursor-pointer border border-meevo-border" 
                  style={{ backgroundColor: dice.faces[selectedFace]?.backgroundColor || dice.baseColor }}
                  onClick={(e) => openColorPicker(e, 'faceBg', dice.faces[selectedFace]?.backgroundColor || dice.baseColor)}
                />
                <span className="text-xs text-meevo-text-primary uppercase">{dice.faces[selectedFace]?.backgroundColor || 'Default'}</span>
              </div>
            </div>

            <hr className="border-meevo-border my-0" />

            {(dice.template === 'Numbers' || dice.template === 'Dots') && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-meevo-text-secondary">Face Content Color</label>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded cursor-pointer border border-meevo-border" 
                    style={{ backgroundColor: dice.faces[selectedFace]?.contentColor || dice.pipColor }}
                    onClick={(e) => openColorPicker(e, 'faceContent', dice.faces[selectedFace]?.contentColor || dice.pipColor)}
                  />
                  <span className="text-xs text-meevo-text-primary uppercase">{dice.faces[selectedFace]?.contentColor || 'Default'}</span>
                </div>
              </div>
            )}
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-meevo-text-secondary">Custom Text (Overrides Template)</label>
              <input 
                type="text"
                placeholder={`Default: ${dice.startNumber + (selectedFace - 1) * dice.stepDistance}`}
                value={dice.faces[selectedFace]?.text || ''}
                onChange={e => {
                  const val = e.target.value;
                  const newFaces = { ...dice.faces };
                  if (!newFaces[selectedFace]) newFaces[selectedFace] = {};
                  if (val === '') delete newFaces[selectedFace].text;
                  else newFaces[selectedFace].text = val;
                  onUpdateDice(dice.id, { faces: newFaces });
                }}
                className="w-full bg-meevo-surface-2 border border-meevo-border rounded-md px-3 py-2 text-sm text-meevo-text-primary focus:outline-none focus:border-meevo-purple"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-meevo-text-secondary">Custom Image (Overrides Template)</label>
              <div className="flex gap-2">
                {dice.faces[selectedFace]?.imageSrc ? (
                  <div className="flex flex-col gap-2 w-full">
                    <div className="relative w-full aspect-square bg-meevo-surface-2 rounded-md border border-meevo-border overflow-hidden group">
                      <img src={dice.faces[selectedFace].imageSrc} alt="" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => {
                          const newFaces = { ...dice.faces };
                          if (newFaces[selectedFace]) {
                            delete newFaces[selectedFace].imageSrc;
                            delete newFaces[selectedFace].imageScale;
                          }
                          onUpdateDice(dice.id, { faces: newFaces });
                        }}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-sm font-medium transition-opacity"
                      >
                        Remove
                      </button>
                    </div>
                    <label className="text-xs font-medium text-meevo-text-secondary flex justify-between mt-2">
                      <span>Image Scale</span>
                      <span>{(dice.faces[selectedFace]?.imageScale ?? 1).toFixed(2)}x</span>
                    </label>
                    <input 
                      type="range" 
                      min={0.1} max={3} step={0.1}
                      value={dice.faces[selectedFace]?.imageScale ?? 1}
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        const newFaces = { ...dice.faces };
                        if (!newFaces[selectedFace]) newFaces[selectedFace] = {};
                        newFaces[selectedFace].imageScale = val;
                        onUpdateDice(dice.id, { faces: newFaces });
                      }}
                      className="w-full accent-meevo-purple"
                    />
                  </div>
                ) : (
                  <label className="flex items-center justify-center w-full aspect-square bg-meevo-surface-2 rounded-md border border-meevo-border border-dashed cursor-pointer hover:border-meevo-purple transition-colors">
                    <span className="text-sm text-meevo-text-tertiary">Upload Image</span>
                    <input 
                      type="file" 
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const newFaces = { ...dice.faces };
                            if (!newFaces[selectedFace]) newFaces[selectedFace] = {};
                            newFaces[selectedFace].imageSrc = ev.target?.result as string;
                            onUpdateDice(dice.id, { faces: newFaces });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

          </div>
        )}
      </div>

      {pickerState.isOpen && (
        <ColorPickerModal
          color={pickerState.color}
          onChange={handleColorChange}
          onClose={() => setPickerState(prev => ({ ...prev, isOpen: false }))}
          x={pickerState.x}
          y={pickerState.y}
        />
      )}
    </div>
  );
};
