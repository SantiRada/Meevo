import React, { useState } from 'react';
import type { BoardTileVariable, TileProperty } from '../../services/storage/types';
import { Add20Regular, Edit20Regular, Delete20Regular } from '@fluentui/react-icons';
import { NewPropertyModal } from './NewPropertyModal';

interface PropertiesSidebarProps {
  variable: BoardTileVariable;
  onUpdateVariable: (updated: BoardTileVariable) => void;
}

export const PropertiesSidebar: React.FC<PropertiesSidebarProps> = ({ variable, onUpdateVariable }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<TileProperty | undefined>(undefined);

  const handleSaveProperty = (property: TileProperty) => {
    let updatedProps = variable.properties || [];
    if (editingProperty) {
      updatedProps = updatedProps.map(p => p.id === property.id ? property : p);
    } else {
      updatedProps = [...updatedProps, property];
    }
    onUpdateVariable({ ...variable, properties: updatedProps });
    setIsModalOpen(false);
    setEditingProperty(undefined);
  };

  const handleDeleteProperty = (propertyId: string) => {
    const updatedProps = (variable.properties || []).filter(p => p.id !== propertyId);
    onUpdateVariable({ ...variable, properties: updatedProps });
  };

  const openNewModal = () => {
    setEditingProperty(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (prop: TileProperty) => {
    setEditingProperty(prop);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-meevo-surface-2 border-l border-meevo-border w-[300px]">
      <div className="h-[56px] px-6 border-b border-meevo-border shrink-0 flex items-center justify-between">
        <h2 className="text-base font-medium text-meevo-text-primary">Properties</h2>
        <button 
          onClick={openNewModal}
          className="w-8 h-8 flex items-center justify-center rounded-md border border-[#333333] hover:bg-meevo-surface-2 text-meevo-text-primary transition-colors"
        >
          <Add20Regular />
        </button>
      </div>

      <div className="px-6 py-6 flex-1 overflow-y-auto">
        <div className="flex items-center gap-3 bg-meevo-selector-green rounded-md px-4 py-3 mb-6">
          <div 
            className="w-4 h-4 rounded-md shrink-0" 
            style={{ backgroundColor: variable.color }}
          />
          <span className="text-sm font-medium text-meevo-text-primary">{variable.name}</span>
        </div>

        {variable.properties?.map(prop => (
          <div key={prop.id} className="mb-5 group">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-meevo-text-secondary tracking-wider uppercase">
                {prop.name}
              </label>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => openEditModal(prop)}
                  className="text-meevo-text-secondary hover:text-meevo-text-primary transition-colors"
                >
                  <Edit20Regular fontSize={14} />
                </button>
                <button 
                  onClick={() => handleDeleteProperty(prop.id)}
                  className="text-meevo-text-secondary hover:text-red-500 transition-colors"
                >
                  <Delete20Regular fontSize={14} />
                </button>
              </div>
            </div>
            {prop.type === 'List' ? (
              <div className="relative">
                <select className="w-full bg-meevo-surface-2 rounded-md px-3 py-2 min-h-[38px] text-sm text-meevo-text-primary outline-none border border-transparent appearance-none">
                  {prop.listOptions?.map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-meevo-text-tertiary"><path d="M6 9l6 6 6-6"/></svg>
                </div>
              </div>
            ) : (
              <div className="w-full bg-meevo-surface-2 rounded-md px-3 py-2 min-h-[38px] flex items-center border border-transparent">
                {prop.type === 'Number' && prop.prefix && (
                  <span className="text-sm text-meevo-text-secondary mr-2">{prop.prefix}</span>
                )}
                {prop.type === 'Color' && (
                  <div className="w-4 h-4 rounded-sm border border-[#333333] mr-2" style={{ backgroundColor: prop.defaultValue || '#ffffff' }} />
                )}
                <span className="text-sm text-meevo-text-primary">
                  {prop.defaultValue || ''}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {isModalOpen && (
        <NewPropertyModal 
          variable={variable}
          editProperty={editingProperty}
          onClose={() => {
            setIsModalOpen(false);
            setEditingProperty(undefined);
          }}
          onSave={handleSaveProperty}
        />
      )}
    </div>
  );
};
