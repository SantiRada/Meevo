import React, { useState } from 'react';
import type { BoardTileVariable, TileProperty, TilePropertyType } from '../../services/storage/types';
import { Dismiss20Regular, ChevronDown20Regular } from '@fluentui/react-icons';
import { ColorPickerModal } from '../ui/ColorPickerModal';

interface NewPropertyModalProps {
  variable: BoardTileVariable;
  editProperty?: TileProperty;
  onClose: () => void;
  onSave: (property: TileProperty) => void;
}

export const NewPropertyModal: React.FC<NewPropertyModalProps> = ({ variable, editProperty, onClose, onSave }) => {
  const [name, setName] = useState(editProperty?.name || '');
  const [type, setType] = useState<TilePropertyType>(editProperty?.type || 'Number');
  const [prefix, setPrefix] = useState(editProperty?.prefix || '');
  const [defaultValue, setDefaultValue] = useState(editProperty?.defaultValue || '');
  const [listOptions, setListOptions] = useState(editProperty?.listOptions?.join(', ') || '');
  
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [activeColorPicker, setActiveColorPicker] = useState<{x: number, y: number} | null>(null);
  const types: TilePropertyType[] = ['Number', 'Text', 'List', 'Color'];

  const [error, setError] = useState('');
  
  const handleSave = () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    
    const newProp: TileProperty = {
      id: editProperty ? editProperty.id : Date.now().toString(),
      name: name.trim(),
      type,
    };
    
    if (type === 'Number') {
      newProp.prefix = prefix;
      newProp.defaultValue = defaultValue;
    } else if (type === 'Text' || type === 'Color') {
      newProp.defaultValue = defaultValue;
    } else if (type === 'List') {
      newProp.listOptions = listOptions.split(',').map(s => s.trim()).filter(Boolean);
    }
    
    onSave(newProp);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-meevo-surface-6 border border-meevo-border rounded-lg shadow-2xl w-[400px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-meevo-border rounded-t-lg">
          <h2 className="text-lg font-medium text-meevo-text-primary">
            {editProperty ? 'Edit Property' : 'New Property'}
          </h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-md border border-meevo-border hover:bg-meevo-surface-2 text-meevo-text-primary transition-colors"
          >
            <Dismiss20Regular />
          </button>
        </div>

        {/* Content */}
        {error && <div className="mx-6 mt-6 p-3 bg-red-500/20 text-red-500 text-sm rounded-md border border-red-500/50">{error}</div>}
        <div className="p-6">
          <div className="flex items-center gap-3 bg-meevo-selector-green rounded-md px-4 py-3 mb-6">
            <div 
              className="w-4 h-4 rounded-md shrink-0" 
              style={{ backgroundColor: variable.color }}
            />
            <span className="text-sm font-medium text-meevo-text-primary">{variable.name}</span>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold text-meevo-text-secondary tracking-wider mb-2 uppercase">
              Name
            </label>
            <input 
              type="text" 
              placeholder="Text example"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-meevo-surface-4 rounded-md px-3 py-2 text-sm text-meevo-text-primary outline-none focus:ring-1 focus:ring-meevo-purple border border-meevo-border"
            />
          </div>

          <div className="mb-6 relative">
            <label className="block text-xs font-bold text-meevo-text-secondary tracking-wider mb-2 uppercase">
              Type
            </label>
            <div 
              className="w-full bg-meevo-surface-4 rounded-md px-3 py-2 min-h-[38px] flex items-center justify-between cursor-pointer border border-meevo-border"
              onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
            >
              <span className="text-sm text-meevo-text-primary">{type}</span>
              <ChevronDown20Regular className="text-meevo-text-tertiary shrink-0 ml-2" />
            </div>

            {isTypeDropdownOpen && (
              <div className="absolute top-[60px] left-0 w-full bg-meevo-surface-2 border border-meevo-border rounded-sm shadow-xl z-20 py-2">
                {types.map(t => (
                  <button 
                    key={t}
                    onClick={() => {
                      setType(t);
                      setIsTypeDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-meevo-text-primary hover:bg-meevo-surface-2 transition-colors"
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>

          {type === 'Number' && (
            <div className="mb-6 grid grid-cols-4 gap-4">
              <div className="col-span-1">
                <label className="block text-xs font-bold text-meevo-text-secondary tracking-wider mb-2 uppercase">
                  Prefix
                </label>
                <input 
                  type="text"
                  placeholder="$"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  className="w-full bg-meevo-surface-4 rounded-md px-3 py-2 text-sm text-meevo-text-primary outline-none focus:ring-1 focus:ring-meevo-purple border border-meevo-border text-center"
                />
              </div>
              <div className="col-span-3">
                <label className="block text-xs font-bold text-meevo-text-secondary tracking-wider mb-2 uppercase">
                  Default value
                </label>
                <input 
                  type="text"
                  placeholder="123"
                  value={defaultValue}
                  onChange={(e) => setDefaultValue(e.target.value)}
                  className="w-full bg-meevo-surface-4 rounded-md px-3 py-2 text-sm text-meevo-text-primary outline-none focus:ring-1 focus:ring-meevo-purple border border-meevo-border"
                />
              </div>
            </div>
          )}

          {type === 'Text' && (
            <div className="mb-6">
              <label className="block text-xs font-bold text-meevo-text-secondary tracking-wider mb-2 uppercase">
                Default value
              </label>
              <input 
                type="text"
                placeholder="Value..."
                value={defaultValue}
                onChange={(e) => setDefaultValue(e.target.value)}
                className="w-full bg-meevo-surface-4 rounded-md px-3 py-2 text-sm text-meevo-text-primary outline-none focus:ring-1 focus:ring-meevo-purple border border-meevo-border"
              />
            </div>
          )}

          {type === 'Color' && (
            <div className="mb-6">
              <label className="block text-xs font-bold text-meevo-text-secondary tracking-wider mb-2 uppercase">
                Default Color
              </label>
              <div className="flex items-center gap-3 bg-meevo-surface-2 rounded-md px-2 py-1.5 focus-within:ring-1 focus-within:ring-meevo-purple border border-meevo-border">
                <div 
                  className="w-5 h-5 rounded-sm border border-[#555] shrink-0 cursor-pointer" 
                  style={{ backgroundColor: defaultValue || '#ffffff' }}
                  onClick={(e) => {
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    setActiveColorPicker({ x: rect.right + 10, y: rect.top });
                  }}
                />
                <input 
                  type="text"
                  placeholder="#ffffff"
                  value={defaultValue}
                  onChange={(e) => setDefaultValue(e.target.value)}
                  className="w-full bg-transparent text-sm text-meevo-text-primary outline-none uppercase"
                />
              </div>
            </div>
          )}

          {activeColorPicker && (
            <ColorPickerModal
              color={defaultValue || '#ffffff'}
              onChange={setDefaultValue}
              onClose={() => setActiveColorPicker(null)}
              x={activeColorPicker.x}
              y={activeColorPicker.y}
            />
          )}

          {type === 'List' && (
            <div className="mb-6">
              <label className="block text-xs font-bold text-meevo-text-secondary tracking-wider mb-2 uppercase">
                Options (comma separated)
              </label>
              <input 
                type="text"
                placeholder="Option 1, Option 2, Option 3"
                value={listOptions}
                onChange={(e) => setListOptions(e.target.value)}
                className="w-full bg-meevo-surface-4 rounded-md px-3 py-2 text-sm text-meevo-text-primary outline-none focus:ring-1 focus:ring-meevo-purple border border-meevo-border"
              />
            </div>
          )}
          
          <div className="flex justify-end mt-4">
            <button 
              onClick={handleSave}
              className="bg-meevo-text-primary text-meevo-surface-0 font-medium py-2 px-4 rounded-md hover:opacity-90 transition-colors"
            >
              {editProperty ? 'Save Changes' : 'Create Property'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
