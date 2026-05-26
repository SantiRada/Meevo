import React from 'react';
import type { BoardTileVariable, TilePropertyType } from '../../services/storage/types';
import { Dismiss20Regular } from '@fluentui/react-icons';

interface PropertyBindingModalProps {
  variables: BoardTileVariable[];
  tileVariableIds: string[];
  filterType?: TilePropertyType;
  onBind: (propertyId: string) => void;
  onClose: () => void;
}

export const PropertyBindingModal: React.FC<PropertyBindingModalProps> = ({ 
  variables, 
  tileVariableIds, 
  filterType,
  onBind, 
  onClose 
}) => {
  // Only consider Type Tiles that are applied to this tile instance
  const appliedVariables = variables.filter(v => tileVariableIds.includes(v.id));

  // Filter properties within those Type Tiles based on the filterType
  const availableProperties = appliedVariables.flatMap(v => {
    const props = v.properties || [];
    const filteredProps = props.filter(p => {
      if (filterType) return p.type === filterType;
      return true;
    });
    
    return filteredProps.map(p => ({
      ...p,
      variableName: v.name,
      variableColor: v.color
    }));
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#0C0C0E] border border-[#CCCCCC]/10 rounded-lg shadow-2xl w-[400px] flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#CCCCCC]/10 shrink-0">
          <h2 className="text-lg font-medium text-meevo-text-primary">Bind Property</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-md border border-[#333333] hover:bg-[#1A1A1D] text-meevo-text-primary transition-colors"
          >
            <Dismiss20Regular />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {availableProperties.length === 0 ? (
            <div className="text-center text-sm text-meevo-text-secondary italic py-8">
              No matching properties found. Make sure this tile has Type Tiles applied with compatible properties.
            </div>
          ) : (
            <div className="space-y-2">
              {availableProperties.map(prop => (
                <button
                  key={prop.id}
                  onClick={() => onBind(prop.id)}
                  className="w-full flex items-center justify-between p-4 rounded-md bg-[#1A1A1D] border border-[#333333] hover:border-meevo-purple hover:bg-[#201A24] transition-colors text-left group"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-meevo-text-primary mb-1">{prop.name}</span>
                    <div className="flex items-center gap-2 text-xs text-meevo-text-secondary">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: prop.variableColor }} />
                      {prop.variableName}
                    </div>
                  </div>
                  <div className="text-xs font-bold text-meevo-text-tertiary tracking-wider uppercase">
                    {prop.type}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
