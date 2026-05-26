import React, { useState, useEffect, useRef } from 'react';

interface ColorPickerModalProps {
  color: string; // Hex color
  onClose: () => void;
  onChange: (color: string) => void;
  x?: number;
  y?: number;
  variables?: { id: string, name: string, color: string }[];
}

const cssColorToHex = (colorStr: string) => {
  if (!colorStr) return '#000000';
  if (colorStr.startsWith('#')) return colorStr;
  const ctx = document.createElement('canvas').getContext('2d');
  if (ctx) {
    ctx.fillStyle = colorStr;
    if (ctx.fillStyle.startsWith('#')) return ctx.fillStyle.toUpperCase();
  }
  return colorStr;
};

// Helper to convert HSV to Hex
function hsvToHex(h: number, s: number, v: number) {
  let r = 0, g = 0, b = 0;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: r = v, g = t, b = p; break;
    case 1: r = q, g = v, b = p; break;
    case 2: r = p, g = v, b = t; break;
    case 3: r = p, g = q, b = v; break;
    case 4: r = t, g = p, b = v; break;
    case 5: r = v, g = p, b = q; break;
  }
  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

// Helper to convert Hex to HSV
function hexToHsv(rawColor: string) {
  const hex = cssColorToHex(rawColor);
  let r = 0, g = 0, b = 0;
  if (hex.startsWith('#')) {
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16) / 255;
      g = parseInt(hex[2] + hex[2], 16) / 255;
      b = parseInt(hex[3] + hex[3], 16) / 255;
    } else if (hex.length === 7) {
      r = parseInt(hex.substring(1, 3), 16) / 255;
      g = parseInt(hex.substring(3, 5), 16) / 255;
      b = parseInt(hex.substring(5, 7), 16) / 255;
    }
  }
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, v = max;
  const d = max - min;
  s = max === 0 ? 0 : d / max;
  if (max === min) h = 0;
  else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h, s, v };
}

export const ColorPickerModal: React.FC<ColorPickerModalProps> = ({ color, onClose, onChange, x = 0, y = 0, variables }) => {
  const [hsv, setHsv] = useState(() => hexToHsv(color || '#FFFFFF'));
  const [pos, setPos] = useState({ 
    x: Math.min(x, window.innerWidth - 250), 
    y: Math.min(y, window.innerHeight - 300) 
  });
  const svAreaRef = useRef<HTMLDivElement>(null);
  const hueSliderRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setHsv(hexToHsv(color || '#FFFFFF'));
  }, [color]);

  const updateColor = (newHsv: { h: number, s: number, v: number }) => {
    setHsv(newHsv);
    onChange(hsvToHex(newHsv.h, newHsv.s, newHsv.v));
  };

  const handleSvPointerDown = (e: React.PointerEvent) => {
    const handleMove = (ev: PointerEvent) => {
      if (!svAreaRef.current) return;
      const rect = svAreaRef.current.getBoundingClientRect();
      const s = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
      const v = Math.max(0, Math.min(1, 1 - (ev.clientY - rect.top) / rect.height));
      updateColor({ ...hsv, s, v });
    };
    handleMove(e.nativeEvent);
    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  const handleHuePointerDown = (e: React.PointerEvent) => {
    const handleMove = (ev: PointerEvent) => {
      if (!hueSliderRef.current) return;
      const rect = hueSliderRef.current.getBoundingClientRect();
      const h = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
      updateColor({ ...hsv, h });
    };
    handleMove(e.nativeEvent);
    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  const handleDragPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startPos = { ...pos };

    const handleMove = (ev: PointerEvent) => {
      setPos({
        x: startPos.x + (ev.clientX - startX),
        y: startPos.y + (ev.clientY - startY)
      });
    };
    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  const currentHueHex = hsvToHex(hsv.h, 1, 1);

  return (
    <>
      {/* Overlay to close */}
      <div className="fixed inset-0 z-40" onPointerDown={onClose} />
      
      {/* Modal */}
      <div 
        className="fixed z-50 bg-[#1A1A1D] border border-[#333] rounded-xl shadow-2xl p-4 pt-6 w-60 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-100"
        style={{ left: pos.x, top: pos.y }}
        onPointerDown={e => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <div 
          className="absolute top-0 left-0 right-0 h-6 cursor-move flex items-center justify-center hover:bg-[#2A2A2D]/50 rounded-t-xl transition-colors"
          onPointerDown={handleDragPointerDown}
        >
          <div className="w-8 h-1 bg-[#333] rounded-full pointer-events-none" />
        </div>
        {/* SV Area */}
        <div 
          ref={svAreaRef}
          className="w-full h-40 rounded-lg relative cursor-crosshair overflow-hidden"
          style={{ backgroundColor: currentHueHex }}
          onPointerDown={handleSvPointerDown}
        >
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #fff, rgba(255,255,255,0))' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #000, rgba(0,0,0,0))' }} />
          {/* Handle */}
          <div 
            className="absolute w-3 h-3 border-2 border-white rounded-full shadow-md pointer-events-none"
            style={{ 
              left: `${hsv.s * 100}%`, 
              top: `${(1 - hsv.v) * 100}%`,
              transform: 'translate(-50%, -50%)',
              backgroundColor: color
            }}
          />
        </div>

        {/* Hue Slider */}
        <div 
          ref={hueSliderRef}
          className="w-full h-4 rounded-full relative cursor-ew-resize"
          style={{ background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)' }}
          onPointerDown={handleHuePointerDown}
        >
          <div 
            className="absolute top-1/2 w-4 h-4 bg-white rounded-full shadow-md pointer-events-none"
            style={{ 
              left: `${hsv.h * 100}%`,
              transform: 'translate(-50%, -50%)'
            }}
          />
        </div>

        {/* Hex/CSS Input */}
        <div className="flex gap-2">
          <div className="w-8 h-8 rounded-md shrink-0 border border-[#333]" style={{ backgroundColor: color }} />
          <div className="flex-1 flex items-center bg-[#2A2A2D] rounded-md px-2 focus-within:ring-1 focus-within:ring-meevo-purple">
            <input 
              type="text" 
              value={color} 
              onChange={e => {
                let val = e.target.value;
                if (/^[0-9A-Fa-f]{3}$/.test(val) || /^[0-9A-Fa-f]{6}$/.test(val)) {
                  val = '#' + val;
                }
                onChange(val);
              }}
              className="w-full bg-transparent text-sm text-meevo-text-primary outline-none px-1"
              placeholder="#HEX or Color"
            />
          </div>
        </div>

        {/* Variables */}
        {variables && variables.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-[#333]">
            {variables.map(v => (
              <button
                key={v.id}
                title={v.name}
                className="w-6 h-6 rounded-md border border-[#333] hover:scale-110 transition-transform"
                style={{ backgroundColor: v.color }}
                onClick={() => onChange(v.color)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
};
