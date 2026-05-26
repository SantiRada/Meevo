import React from 'react';
import { 
  Cursor20Regular, 
  Square20Regular, 
  Image20Regular, 
  TextFont20Regular, 
  Pen20Regular, 
  DrawShape20Regular 
} from '@fluentui/react-icons';

export type DesignTool = 'Cursor' | 'Shape' | 'Image' | 'Text' | 'Pencil' | 'Brush';

interface DesignToolbarProps {
  activeTool: DesignTool;
  onChangeTool: (tool: DesignTool) => void;
  allowedTools?: DesignTool[];
}

export const DesignToolbar: React.FC<DesignToolbarProps> = ({ activeTool, onChangeTool, allowedTools }) => {
  let tools: { id: DesignTool; icon: JSX.Element; shortcut: string }[] = [
    { id: 'Cursor', icon: <Cursor20Regular />, shortcut: 'V' },
    { id: 'Shape', icon: <Square20Regular />, shortcut: 'R' },
    { id: 'Image', icon: <Image20Regular />, shortcut: 'I' },
    { id: 'Text', icon: <TextFont20Regular />, shortcut: 'T' },
    { id: 'Pencil', icon: <Pen20Regular />, shortcut: 'P' },
    { id: 'Brush', icon: <DrawShape20Regular />, shortcut: 'B' },
  ];

  if (allowedTools) {
    tools = tools.filter(t => allowedTools.includes(t.id));
  }

  return (
    <div className="absolute bottom-6 right-6 flex items-center bg-[#1A1A1D] border border-[#333] rounded-lg p-1 shadow-2xl z-20">
      {tools.map(tool => (
        <button
          key={tool.id}
          onClick={() => onChangeTool(tool.id)}
          title={`${tool.id} (${tool.shortcut})`}
          className={`w-10 h-10 flex items-center justify-center rounded-md transition-colors ${
            activeTool === tool.id ? 'bg-[#333] text-meevo-text-primary' : 'text-meevo-text-tertiary hover:text-meevo-text-primary hover:bg-[#2A2A2D]'
          }`}
        >
          {tool.icon}
        </button>
      ))}
    </div>
  );
};
