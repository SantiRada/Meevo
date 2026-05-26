import React from 'react';
import type { ComponentType } from '../../pages/Editor';
import { ChevronDown20Regular } from '@fluentui/react-icons';
import { useState } from 'react';

interface ComponentsSidebarProps {
  draftName: string;
  activeComponents: ComponentType[];
  onToggleComponent: (comp: ComponentType) => void;
  genders: string[];
  onUpdateGenders: (genders: string[]) => void;
  onSave: () => void;
}

const COMPONENT_COLORS: Record<ComponentType, string> = {
  Board: '#2B7FFF',
  Cards: '#EB2932',
  Dices: '#F0B100',
  Tokens: '#EF8105',
  Rules: '#38414E',
  Manual: '#00C950',
};

const ALL_COMPONENTS: ComponentType[] = ['Board', 'Cards', 'Dices', 'Tokens', 'Rules', 'Manual'];
const GENRES = ['Party', 'Deckbuilding', 'Co-op Survival', 'Strategy', 'Roleplaying', 'Abstract', 'Puzzle'];

export const ComponentsSidebar: React.FC<ComponentsSidebarProps> = ({ draftName, activeComponents, onToggleComponent, genders, onUpdateGenders, onSave }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleGender = (genre: string) => {
    onUpdateGenders(
      genders.includes(genre) ? genders.filter(g => g !== genre) : [...genders, genre]
    );
  };

  return (
    <>
      {/* Title */}
      <div className="py-4 px-6 border-b border-[#CCCCCC]/10 shrink-0">
        <h2 className="text-base font-medium text-meevo-text-primary">Components</h2>
      </div>

      <div className="px-6 py-6 flex-1 overflow-y-auto">
        {/* Name */}
        <div className="mb-6">
          <label className="block text-xs font-medium text-meevo-text-secondary mb-2 tracking-wider uppercase">
            Name
          </label>
          <input 
            type="text" 
            defaultValue={draftName}
            placeholder="My Board Game"
            className="w-full bg-[#1A1A1D] rounded-md px-3 py-2 text-sm text-meevo-text-primary outline-none focus:ring-1 focus:ring-meevo-purple transition-colors"
          />
        </div>

        {/* Gender (Genre) */}
        <div className="mb-6 relative">
          <label className="block text-xs font-medium text-meevo-text-secondary mb-2 tracking-wider uppercase">
            Gender
          </label>
          <div 
            className="w-full bg-[#1A1A1D] rounded-md px-3 py-2 min-h-[38px] flex items-center justify-between cursor-pointer focus-within:ring-1 focus-within:ring-meevo-purple"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <div className="flex flex-wrap gap-2">
              {(!genders || genders.length === 0) && <span className="text-meevo-text-tertiary text-sm">Select genders...</span>}
              {genders?.map(g => (
                <span key={g} className="bg-[#070709] text-meevo-text-primary text-xs px-2 py-1 rounded-sm">
                  {g}
                </span>
              ))}
            </div>
            <ChevronDown20Regular className="text-meevo-text-tertiary shrink-0 ml-2" />
          </div>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 w-full mt-1 bg-[#1A1A1D] border border-[#CCCCCC]/10 rounded-sm shadow-xl z-20 py-2">
              {GENRES.map(genre => (
                <label key={genre} className="flex items-center gap-3 px-3 py-2 hover:bg-[#070709] cursor-pointer text-sm text-meevo-text-primary">
                  <input 
                    type="checkbox" 
                    checked={genders?.includes(genre) || false}
                    onChange={() => toggleGender(genre)}
                    className="accent-meevo-purple bg-[#070709] border-[#CCCCCC]/10 rounded-sm"
                  />
                  {genre}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Estimated Players */}
        <div className="mb-8">
          <label className="block text-xs font-medium text-meevo-text-secondary mb-2 tracking-wider uppercase">
            Estimated Players
          </label>
          <div className="flex gap-3">
            <input 
              type="number" 
              placeholder="Min"
              className="w-full bg-[#1A1A1D] rounded-md px-3 py-2 text-sm text-meevo-text-primary outline-none focus:ring-1 focus:ring-meevo-purple transition-colors"
            />
            <input 
              type="number" 
              placeholder="Max"
              className="w-full bg-[#1A1A1D] rounded-md px-3 py-2 text-sm text-meevo-text-primary outline-none focus:ring-1 focus:ring-meevo-purple transition-colors"
            />
          </div>
        </div>

        {/* Define Components */}
        <div>
          <label className="block text-xs font-medium text-meevo-text-secondary mb-4 tracking-wider uppercase">
            Define Components
          </label>
          <div className="flex flex-col gap-1">
            {ALL_COMPONENTS.map(comp => {
              const isActive = activeComponents.includes(comp);
              return (
                <div 
                  key={comp}
                  onClick={() => onToggleComponent(comp)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors"
                  style={{ backgroundColor: isActive ? '#152717' : 'transparent' }}
                >
                  <div 
                    className="w-3.5 h-3.5 shrink-0" 
                    style={{ backgroundColor: COMPONENT_COLORS[comp], borderRadius: '4px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      // TBD: Open custom color picker
                    }}
                  />
                  <span className={`text-sm ${isActive ? 'text-meevo-text-primary' : 'text-meevo-text-secondary'}`}>
                    {comp}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 flex justify-end bg-meevo-panel shrink-0">
        <button 
          onClick={onSave}
          className="px-5 py-2.5 bg-meevo-text-primary text-meevo-text-inverse rounded-md text-sm font-medium hover:bg-meevo-text-secondary transition-colors"
        >
          Save Components
        </button>
      </div>
    </>
  );
};
