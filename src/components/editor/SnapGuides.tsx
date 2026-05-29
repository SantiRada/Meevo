import React from 'react';
import type { SnapLine } from '../../utils/snapLogic';

export interface DistanceLabel {
  id: string;
  x: number;
  y: number;
  value: number;
}

interface SnapGuidesProps {
  lines: SnapLine[];
  distances?: DistanceLabel[];
  scale: number;
  transformObj?: { x: number, y: number, scale: number };
}

export const SnapGuides: React.FC<SnapGuidesProps> = ({ lines, distances = [], scale, transformObj }) => {
  if ((!lines || lines.length === 0) && (!distances || distances.length === 0)) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-visible">
      <div className="absolute inset-0 origin-top-left" style={transformObj ? { transform: `translate(${transformObj.x}px, ${transformObj.y}px) scale(${transformObj.scale})` } : {}}>
      <svg className="absolute inset-0 w-full h-full overflow-visible">
        {lines.map(line => (
          <line
            key={line.id}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="#ff5e00"
            strokeWidth={1 / scale}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      {distances.map(d => (
        <div key={d.id} className="absolute" style={{ left: d.x, top: d.y, transform: 'translate(-50%, -50%) scale(' + (1/scale) + ')' }}>
          <div className="bg-[#ff5e00] text-meevo-text-primary text-[10px] px-1.5 py-0.5 rounded shadow">
            {Math.round(d.value)}
          </div>
        </div>
      ))}
      </div>
    </div>
  );
};
