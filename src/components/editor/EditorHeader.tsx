import React from 'react';
import { 
  ArrowLeft24Regular, 
  AppsList24Regular, 
  Board24Regular, 
  DocumentMultiple24Regular,
  Cube24Regular,
  Circle24Regular,
  TextBulletListSquare24Regular,
  Book24Regular,
  Play24Regular
} from '@fluentui/react-icons';
import type { ComponentType } from '../../pages/Editor';
import clsx from 'clsx';

interface EditorHeaderProps {
  draftName: string;
  onBack: () => void;
  activeComponents: ComponentType[];
  activeTab: string;
  onSelectTab: (tab: string) => void;
  autoSaveStatus: 'waiting' | 'loading' | 'saved';
  onOpenSettings?: () => void;
}

const getIconForComponent = (comp: ComponentType) => {
  switch (comp) {
    case 'Board': return <Board24Regular fontSize={16} />;
    case 'Cards': return <DocumentMultiple24Regular fontSize={16} />;
    case 'Dices': return <Cube24Regular fontSize={16} />;
    case 'Tokens': return <Circle24Regular fontSize={16} />;
    case 'Rules': return <TextBulletListSquare24Regular fontSize={16} />;
    case 'Manual': return <Book24Regular fontSize={16} />;
  }
};

import { Settings24Regular } from '@fluentui/react-icons';
export const EditorHeader: React.FC<EditorHeaderProps> = ({ draftName, onBack, activeComponents, activeTab, onSelectTab, autoSaveStatus, onOpenSettings }) => {
  const sortedComponents = [...activeComponents].sort();

  return (
    <header className="py-5 border-b border-meevo-border grid grid-cols-3 items-center px-8 bg-meevo-surface-1 shrink-0">
      {/* Left Area: Back & Title */}
      <div className="flex items-center gap-4 justify-self-start">
        <button 
          onClick={onBack}
          className="text-meevo-text-secondary hover:text-meevo-text-primary transition-colors"
        >
          <ArrowLeft24Regular />
        </button>
        <div className="flex flex-col">
          <h1 className="font-medium text-meevo-text-primary leading-tight text-lg">{draftName}</h1>
          <span className="text-xs text-meevo-text-tertiary mt-0.5">
            {activeComponents.length} tiles • square
          </span>
        </div>
      </div>

      {/* Center Area: Tabs */}
      <div className="flex items-center gap-2 justify-self-center">
        <div className="flex items-center gap-1 overflow-x-auto bg-meevo-surface-0 border border-meevo-border rounded-lg p-1.5">
        <button 
          onClick={() => onSelectTab('Components')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'Components' 
              ? 'bg-meevo-surface-2 text-meevo-text-primary' 
              : 'text-meevo-text-secondary hover:text-meevo-text-primary hover:bg-meevo-surface-2/50'
          }`}
        >
          <AppsList24Regular fontSize={14} />
          Components
        </button>
        
        {sortedComponents.map(comp => (
          <button 
            key={comp}
            onClick={() => onSelectTab(comp)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === comp 
                ? 'bg-meevo-surface-2 text-meevo-text-primary' 
                : 'text-meevo-text-secondary hover:text-meevo-text-primary hover:bg-meevo-surface-2/50'
            }`}
          >
            {getIconForComponent(comp)}
            {comp}
          </button>
        ))}
        </div>
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onOpenSettings) onOpenSettings();
          }}
          className="flex items-center justify-center p-[12px] bg-meevo-surface-0 border border-meevo-border rounded-lg text-meevo-text-primary hover:bg-meevo-surface-2/50 transition-colors"
        >
          <Settings24Regular fontSize={20} />
        </button>
      </div>

      {/* Right Area: Playtest */}
      <div className="justify-self-end flex items-center gap-4">
        <span className="text-[10px] uppercase font-medium tracking-wide text-meevo-text-tertiary">
          {autoSaveStatus === 'loading' && 'Loading...'}
          {autoSaveStatus === 'waiting' && 'Waiting...'}
          {autoSaveStatus === 'saved' && '✔ Auto-Save'}
        </span>
        <button className="flex items-center gap-2 px-5 py-2 rounded-md text-sm font-medium bg-meevo-text-primary text-meevo-text-inverse hover:bg-meevo-text-secondary transition-colors">
          <Play24Regular fontSize={16} />
          Playtest
        </button>
      </div>
    </header>
  );
};






