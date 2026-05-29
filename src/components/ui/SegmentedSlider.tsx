import React, { useRef } from 'react';

interface SegmentedSliderProps<T extends number | string> {
  options: T[];
  value: T;
  onChange: (val: T) => void;
  handleWidthMultiplier?: number;
}

export function SegmentedSlider<T extends number | string>({ options, value, onChange, handleWidthMultiplier = 1 }: SegmentedSliderProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointer = (e: React.PointerEvent) => {
    // buttons === 1 means primary (left) button is held down
    if (e.buttons !== 1) return;
    e.preventDefault();
    
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let percentage = (e.clientX - rect.left) / rect.width;
    percentage = Math.max(0, Math.min(1, percentage));
    
    const index = Math.min(options.length - 1, Math.floor(percentage * options.length));
    
    if (options[index] !== value) {
      onChange(options[index]);
    }
  };

  const currentIndex = options.indexOf(value) === -1 ? Math.floor(options.length / 2) : options.indexOf(value);
  const segmentWidth = 100 / options.length;

  return (
    <div 
      ref={containerRef}
      className="w-full flex h-6 bg-meevo-surface-0 rounded-full border border-meevo-border relative overflow-hidden cursor-pointer touch-none"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        handlePointer(e);
      }}
      onPointerMove={handlePointer}
      onPointerUp={(e) => {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }}
    >
      {options.map((val) => (
        <div key={String(val)} className="flex-1 flex justify-center items-center z-10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
          <div className="w-[2px] h-2.5 bg-meevo-border rounded-full pointer-events-none" />
        </div>
      ))}
      <div 
        className="absolute top-[2px] bottom-[2px] bg-meevo-purple hover:bg-meevo-purple-active rounded-full pointer-events-none transition-all duration-100 z-20 shadow-sm"
        style={{ 
          width: `calc(${segmentWidth * handleWidthMultiplier}% - 4px)`, 
          left: `calc(${(currentIndex - (handleWidthMultiplier - 1) / 2) * segmentWidth}% + 2px)` 
        }}
      />
    </div>
  );
}
