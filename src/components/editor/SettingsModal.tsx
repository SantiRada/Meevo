import { SegmentedSlider } from '../ui/SegmentedSlider';
import React, { useState, useEffect } from 'react';
import { Dismiss24Regular } from '@fluentui/react-icons';
import { ColorPickerModal } from '../ui/ColorPickerModal';
import { DEFAULT_THEME_COLORS, applyThemeColors, getCustomThemeColors, saveCustomThemeColors, type ThemeMode } from '../../utils/themeColors';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Any extra props needed for settings state
  boardConfig?: any; // For project settings if available
  onUpdateBoardConfig?: (config: any) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, boardConfig, onUpdateBoardConfig }) => {
  const [activeTab, setActiveTab] = useState<'General' | 'Project Settings' | 'Keyboard Shortcuts' | 'Personalization'>('General');
  
  // States for General
  const [language, setLanguage] = useState('English');
  const [uiScale, setUiScale] = useState(100);

  // Theme & Personalization
  const [theme, setTheme] = useState<ThemeMode>(() => (localStorage.getItem('meevo-theme') as ThemeMode) || 'Dark');
  const [customColors, setCustomColors] = useState(() => getCustomThemeColors());
  const [activeColorPicker, setActiveColorPicker] = useState<{ key: string, x: number, y: number } | null>(null);

  useEffect(() => {
    localStorage.setItem('meevo-theme', theme);
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: theme }));
      try {
        const savedSettings = localStorage.getItem('meevo_canvas_settings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          if (parsed.fill) {
            parsed.fill = '';
            localStorage.setItem('meevo_canvas_settings', JSON.stringify(parsed));
          }
        }
      } catch(e) {}
    applyThemeColors(theme, customColors[theme]);
  }, [theme, customColors]);

  const handleColorChange = (key: string, value: string) => {
    const newColors = {
      ...customColors,
      [theme]: {
        ...customColors[theme],
        [key]: value
      }
    };
    setCustomColors(newColors);
    saveCustomThemeColors(newColors);
  };

  const handleResetSingleColor = (key: string) => {
    const newColors = {
      ...customColors,
      [theme]: {
        ...customColors[theme]
      }
    };
    delete newColors[theme][key];
    setCustomColors(newColors);
    saveCustomThemeColors(newColors);
    
    // We also need to instantly re-apply the native theme color to the root element 
    // because applyThemeColors will just skip deleted keys or rely on the defaults being re-applied
    const root = document.documentElement;
    root.style.setProperty(key, DEFAULT_THEME_COLORS[theme][key as keyof typeof DEFAULT_THEME_COLORS['Dark']]);
  };

  const handleResetColors = () => {
    if (window.confirm(`Are you sure you want to reset all custom colors for ${theme} mode to their default values?`)) {
      const newColors = {
        ...customColors,
        [theme]: {}
      };
      setCustomColors(newColors);
      saveCustomThemeColors(newColors);
    }
  };

  const colorGroups = [
    { title: 'Accent Colors', keys: ['--color-purple', '--color-purple-active', '--color-selector-green'] },
    { title: 'Surfaces', keys: ['--color-surface-0', '--color-surface-1', '--color-surface-2', '--color-surface-3', '--color-surface-4', '--color-surface-5', '--color-surface-6'] },
    { title: 'Text', keys: ['--color-text-primary', '--color-text-secondary', '--color-text-tertiary', '--color-text-inverse'] },
    { title: 'Misc', keys: ['--color-canvas-bg', '--color-grid', '--color-border'] }
  ];

  // States for Project Settings
  const [gameName, setGameName] = useState(boardConfig?.name || 'Untitled Game');
  const [author, setAuthor] = useState(boardConfig?.author || '');
  const [description, setDescription] = useState(boardConfig?.description || '');
  const [minPlayers, setMinPlayers] = useState(boardConfig?.minPlayers || 1);
  const [maxPlayers, setMaxPlayers] = useState(boardConfig?.maxPlayers || 4);
  const [playtime, setPlaytime] = useState(boardConfig?.playtime || '');
  const [genres, setGenres] = useState(boardConfig?.genres || '');
  const [ageRange, setAgeRange] = useState(boardConfig?.ageRange || '');

  useEffect(() => {
    if (boardConfig) {
      setGameName(boardConfig.name || 'Untitled Game');
      setAuthor(boardConfig.author || '');
      setDescription(boardConfig.description || '');
      setMinPlayers(boardConfig.minPlayers || 1);
      setMaxPlayers(boardConfig.maxPlayers || 4);
      setPlaytime(boardConfig.playtime || '');
      setGenres(boardConfig.genres || '');
      setAgeRange(boardConfig.ageRange || '');
    }
  }, [boardConfig]);

  const handleSaveProjectSettings = () => {
    if (onUpdateBoardConfig && boardConfig) {
      onUpdateBoardConfig({
        ...boardConfig,
        name: gameName,
        author,
        description,
        minPlayers,
        maxPlayers,
        playtime,
        genres,
        ageRange
      });
    }
  };

  useEffect(() => {
    // Add global listener for Backquote
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '`' || e.key === 'Dead' || e.code === 'Backquote') {
        // Some keyboards map ` to Dead or Backquote
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // handled outside? We need the outside to toggle it too.
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-meevo-surface-2 border border-meevo-border shadow-2xl rounded-xl w-[900px] h-[600px] flex overflow-hidden">
        
        {/* Sidebar */}
        <div className="w-64 bg-meevo-surface-1 border-r border-meevo-border flex flex-col p-4">
          <h2 className="text-meevo-text-primary font-semibold text-lg mb-6">Settings</h2>
          <div className="flex flex-col gap-1">
            {['General', 'Personalization', 'Project Settings', 'Keyboard Shortcuts'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? 'bg-meevo-purple text-white' : 'text-meevo-text-secondary hover:text-meevo-text-primary hover:bg-white/5'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col relative bg-meevo-surface-2">
          <button onClick={onClose} className="absolute top-4 right-4 text-meevo-text-secondary hover:text-meevo-text-primary transition-colors">
            <Dismiss24Regular />
          </button>
          
          <div className="flex-1 p-8 overflow-y-auto min-h-0">
            <h3 className="text-2xl font-bold text-meevo-text-primary mb-8">{activeTab}</h3>
            
            {activeTab === 'General' && (
              <div className="space-y-8 max-w-md">
                {/* Language */}
                <div>
                  <label className="block text-sm font-medium text-meevo-text-secondary mb-2">Language</label>
                  <select 
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-meevo-surface-4 border border-meevo-border rounded-lg px-4 py-2 text-meevo-text-primary outline-none focus:border-meevo-purple"
                  >
                    <option value="Espa�ol">Espa�ol</option>
                    <option value="English">English</option>
                  </select>
                </div>



                {/* UI Scale Slider */}
                <div className="flex flex-col gap-2 mt-2 max-w-xs">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-sm font-medium text-meevo-text-secondary">UI Scale</span>
                    <span className="text-sm font-mono text-meevo-text-primary">{uiScale}%</span>
                  </div>
                  <SegmentedSlider 
                    options={[90, 100, 110]} 
                    value={uiScale} 
                    onChange={setUiScale} 
                  />
                </div>
              </div>
            )}

            {activeTab === 'Personalization' && (
              <div className="space-y-8 max-w-2xl pb-16">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-meevo-text-primary mb-1">Visual Theme Mode</h4>
                    <p className="text-xs text-meevo-text-secondary">Select the active theme and edit its color palette below.</p>
                  </div>
                  <div className="flex bg-meevo-surface-1 rounded-lg p-1 w-fit border border-meevo-border">
                      <button
                        className={`px-6 py-1.5 rounded-md text-sm font-medium transition-colors ${theme === 'Light' ? 'bg-meevo-surface-4 text-meevo-text-primary shadow-sm' : 'text-meevo-text-tertiary hover:text-meevo-text-primary'}`}
                        onClick={() => setTheme('Light')}
                      >
                        Light
                      </button>
                      <button
                        className={`px-6 py-1.5 rounded-md text-sm font-medium transition-colors ${theme === 'Dark' ? 'bg-meevo-surface-4 text-meevo-text-primary shadow-sm' : 'text-meevo-text-tertiary hover:text-meevo-text-primary'}`}
                        onClick={() => setTheme('Dark')}
                      >
                        Dark
                      </button>
                  </div>
                </div>
                
                <div className="border-t border-meevo-border pt-6">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-sm font-medium text-meevo-text-primary">Color Palette ({theme} Mode)</h4>
                    <button 
                      onClick={handleResetColors}
                      className="px-4 py-1.5 bg-meevo-surface-4 hover:bg-red-500/20 text-meevo-text-secondary hover:text-red-400 text-xs font-medium rounded-md transition-colors border border-meevo-border hover:border-red-500/50"
                    >
                      Reset to Default
                    </button>
                  </div>

                  {colorGroups.map(group => (
                    <div key={group.title} className="mb-6">
                      <h5 className="text-meevo-text-secondary font-bold text-[10px] uppercase tracking-wider mb-3">{group.title}</h5>
                      <div className="grid grid-cols-2 gap-4">
                        {group.keys.map(key => {
                          const defaultVal = DEFAULT_THEME_COLORS[theme][key as keyof typeof DEFAULT_THEME_COLORS['Dark']];
                          const customVal = customColors[theme]?.[key];
                          const val = customVal || defaultVal;
                          return (
                            <div key={key} className="flex items-center justify-between bg-meevo-surface-1 border border-meevo-border rounded-lg p-3">
                              <div className="flex flex-col items-start">
                                <span className="text-sm text-meevo-text-primary font-mono truncate">{key.replace('--color-', '')}</span>
                                {customVal && (
                                  <button 
                                    onClick={() => handleResetSingleColor(key)}
                                    className="text-[10px] text-red-400 hover:text-red-300 font-medium mt-0.5 hover:underline decoration-red-400/50"
                                  >
                                    Reset
                                  </button>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-meevo-text-tertiary font-mono uppercase">{val}</span>
                                <div 
                                  className="w-6 h-6 rounded border border-white/20 cursor-pointer shadow-sm hover:scale-110 transition-transform" 
                                  style={{ backgroundColor: val }}
                                  onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    // Make sure modal fits on screen
                                    const xPos = rect.right + 260 > window.innerWidth ? rect.left - 270 : rect.right + 10;
                                    setActiveColorPicker({ key, x: xPos, y: rect.top - 100 });
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'Project Settings' && (
              <div className="space-y-6 max-w-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-meevo-text-secondary tracking-wider uppercase mb-2">Game Name</label>
                    <input type="text" value={gameName} onChange={e => setGameName(e.target.value)} onBlur={handleSaveProjectSettings} className="w-full bg-meevo-surface-4 border border-meevo-border rounded-lg px-4 py-2 text-meevo-text-primary outline-none focus:border-meevo-purple" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-meevo-text-secondary tracking-wider uppercase mb-2">Author</label>
                    <input type="text" value={author} onChange={e => setAuthor(e.target.value)} onBlur={handleSaveProjectSettings} className="w-full bg-meevo-surface-4 border border-meevo-border rounded-lg px-4 py-2 text-meevo-text-primary outline-none focus:border-meevo-purple" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-meevo-text-secondary tracking-wider uppercase mb-2">Brief Description</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} onBlur={handleSaveProjectSettings} className="w-full h-24 resize-none bg-meevo-surface-4 border border-meevo-border rounded-lg px-4 py-2 text-meevo-text-primary outline-none focus:border-meevo-purple" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-meevo-text-secondary tracking-wider uppercase mb-2">Min Players</label>
                    <input type="number" value={minPlayers} onChange={e => setMinPlayers(parseInt(e.target.value) || 1)} onBlur={handleSaveProjectSettings} className="w-full bg-meevo-surface-4 border border-meevo-border rounded-lg px-4 py-2 text-meevo-text-primary outline-none focus:border-meevo-purple" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-meevo-text-secondary tracking-wider uppercase mb-2">Max Players</label>
                    <input type="number" value={maxPlayers} onChange={e => setMaxPlayers(parseInt(e.target.value) || 1)} onBlur={handleSaveProjectSettings} className="w-full bg-meevo-surface-4 border border-meevo-border rounded-lg px-4 py-2 text-meevo-text-primary outline-none focus:border-meevo-purple" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-meevo-text-secondary tracking-wider uppercase mb-2">Estimated Playtime</label>
                    <input type="text" placeholder="e.g. 30-45 mins" value={playtime} onChange={e => setPlaytime(e.target.value)} onBlur={handleSaveProjectSettings} className="w-full bg-meevo-surface-4 border border-meevo-border rounded-lg px-4 py-2 text-meevo-text-primary outline-none focus:border-meevo-purple" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-meevo-text-secondary tracking-wider uppercase mb-2">Recommended Age</label>
                    <input type="text" placeholder="e.g. 10+" value={ageRange} onChange={e => setAgeRange(e.target.value)} onBlur={handleSaveProjectSettings} className="w-full bg-meevo-surface-4 border border-meevo-border rounded-lg px-4 py-2 text-meevo-text-primary outline-none focus:border-meevo-purple" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-meevo-text-secondary tracking-wider uppercase mb-2">Game Genres</label>
                    <input type="text" placeholder="e.g. Strategy, Card Game" value={genres} onChange={e => setGenres(e.target.value)} onBlur={handleSaveProjectSettings} className="w-full bg-meevo-surface-4 border border-meevo-border rounded-lg px-4 py-2 text-meevo-text-primary outline-none focus:border-meevo-purple" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Keyboard Shortcuts' && (
              <div className="space-y-8 pr-4 text-sm text-meevo-text-primary">
                
                <div>
                  <h4 className="text-meevo-purple font-bold mb-4 uppercase tracking-wider text-xs border-b border-meevo-border pb-2">View</h4>
                  <div className="flex flex-col gap-y-3">
                    <div className="flex justify-between w-full border-b border-white/5 pb-2"><span>Pan Canvas</span><kbd className="bg-meevo-surface-2 px-2 py-0.5 rounded border border-meevo-border">Middle Clic</kbd></div>
                    <div className="flex justify-between w-full border-b border-white/5 pb-2"><span>Zoom In/Out</span><kbd className="bg-meevo-surface-2 px-2 py-0.5 rounded border border-meevo-border">Ctrl + Scroll</kbd></div>
                    <div className="flex justify-between w-full border-b border-white/5 pb-2"><span>Copy</span><kbd className="bg-meevo-surface-2 px-2 py-0.5 rounded border border-meevo-border">Ctrl + C</kbd></div>
                    <div className="flex justify-between w-full border-b border-white/5 pb-2"><span>Paste</span><kbd className="bg-meevo-surface-2 px-2 py-0.5 rounded border border-meevo-border">Ctrl + V</kbd></div>
                    <div className="flex justify-between w-full border-b border-white/5 pb-2"><span>Duplicate</span><kbd className="bg-meevo-surface-2 px-2 py-0.5 rounded border border-meevo-border">Ctrl + D</kbd></div>
                    <div className="flex justify-between w-full border-b border-white/5 pb-2"><span>Undo</span><kbd className="bg-meevo-surface-2 px-2 py-0.5 rounded border border-meevo-border">Ctrl + Z</kbd></div>
                    <div className="flex justify-between w-full border-b border-white/5 pb-2"><span>Redo</span><kbd className="bg-meevo-surface-2 px-2 py-0.5 rounded border border-meevo-border">Ctrl + Shift + Z</kbd></div>
                  </div>
                </div>

                <div>
                  <h4 className="text-meevo-purple font-bold mb-4 uppercase tracking-wider text-xs border-b border-meevo-border pb-2">Board</h4>
                  <div className="flex flex-col gap-y-3">
                    <div className="flex justify-between w-full border-b border-white/5 pb-2"><span>Switch Sub-tabs</span><kbd className="bg-meevo-surface-2 px-2 py-0.5 rounded border border-meevo-border">Shift + [1-3]</kbd></div>
                    <div className="flex justify-between w-full border-b border-white/5 pb-2"><span>Clear Tile Types</span><kbd className="bg-meevo-surface-2 px-2 py-0.5 rounded border border-meevo-border">C</kbd></div>
                    <div className="flex justify-between w-full border-b border-white/5 pb-2"><span>Reset Tile Content</span><kbd className="bg-meevo-surface-2 px-2 py-0.5 rounded border border-meevo-border">R</kbd></div>
                    <div className="flex justify-between w-full border-b border-white/5 pb-2"><span>Delete Tile</span><kbd className="bg-meevo-surface-2 px-2 py-0.5 rounded border border-meevo-border">Del / Backspace</kbd></div>
                    <div className="flex justify-between w-full border-b border-white/5 pb-2"><span>Group Tiles</span><kbd className="bg-meevo-surface-2 px-2 py-0.5 rounded border border-meevo-border">Ctrl + G</kbd></div>
                    <div className="flex justify-between w-full border-b border-white/5 pb-2"><span>Ungroup Tiles</span><kbd className="bg-meevo-surface-2 px-2 py-0.5 rounded border border-meevo-border">Ctrl + X</kbd></div>
                  </div>
                </div>

                <div>
                  <h4 className="text-meevo-purple font-bold mb-4 uppercase tracking-wider text-xs border-b border-meevo-border pb-2">Cards</h4>
                  <div className="flex flex-col gap-y-3">
                    <div className="flex justify-between w-full border-b border-white/5 pb-2"><span>Next Card</span><kbd className="bg-meevo-surface-2 px-2 py-0.5 rounded border border-meevo-border">Arrow Right</kbd></div>
                    <div className="flex justify-between w-full border-b border-white/5 pb-2"><span>Previous Card</span><kbd className="bg-meevo-surface-2 px-2 py-0.5 rounded border border-meevo-border">Arrow Left</kbd></div>
                  </div>
                </div>

                <div>
                  <h4 className="text-meevo-purple font-bold mb-4 uppercase tracking-wider text-xs border-b border-meevo-border pb-2">Dices</h4>
                  <div className="flex flex-col gap-y-3">
                    <div className="flex justify-between w-full border-b border-white/5 pb-2"><span>Set 2D View</span><kbd className="bg-meevo-surface-2 px-2 py-0.5 rounded border border-meevo-border">Shift + 1</kbd></div>
                    <div className="flex justify-between w-full border-b border-white/5 pb-2"><span>Set 3D View</span><kbd className="bg-meevo-surface-2 px-2 py-0.5 rounded border border-meevo-border">Shift + 2</kbd></div>
                  </div>
                </div>

                <div>
                  <h4 className="text-meevo-purple font-bold mb-4 uppercase tracking-wider text-xs border-b border-meevo-border pb-2">Design</h4>
                  <div className="flex flex-col gap-y-3">
                    <div className="flex justify-between w-full border-b border-white/5 pb-2"><span>Cursor Tool</span><kbd className="bg-meevo-surface-2 px-2 py-0.5 rounded border border-meevo-border">V</kbd></div>
                    <div className="flex justify-between w-full border-b border-white/5 pb-2"><span>Text Tool</span><kbd className="bg-meevo-surface-2 px-2 py-0.5 rounded border border-meevo-border">T</kbd></div>
                    <div className="flex justify-between w-full border-b border-white/5 pb-2"><span>Shape Tool</span><kbd className="bg-meevo-surface-2 px-2 py-0.5 rounded border border-meevo-border">R</kbd></div>
                    <div className="flex justify-between w-full border-b border-white/5 pb-2"><span>Image Tool</span><kbd className="bg-meevo-surface-2 px-2 py-0.5 rounded border border-meevo-border">I</kbd></div>
                    <div className="flex justify-between w-full border-b border-white/5 pb-2"><span>Rename Layer</span><kbd className="bg-meevo-surface-2 px-2 py-0.5 rounded border border-meevo-border">Ctrl + R</kbd></div>
                    <div className="flex justify-between w-full border-b border-white/5 pb-2"><span>Duplicate Layer</span><kbd className="bg-meevo-surface-2 px-2 py-0.5 rounded border border-meevo-border">Alt + Drag</kbd></div>
                    <div className="flex justify-between w-full border-b border-white/5 pb-2"><span>Measure Distance</span><kbd className="bg-meevo-surface-2 px-2 py-0.5 rounded border border-meevo-border">Alt + Hover</kbd></div>
                    <div className="flex justify-between w-full border-b border-white/5 pb-2"><span>Move 1px</span><kbd className="bg-meevo-surface-2 px-2 py-0.5 rounded border border-meevo-border">Arrows</kbd></div>
                    <div className="flex justify-between w-full border-b border-white/5 pb-2"><span>Move 10px</span><kbd className="bg-meevo-surface-2 px-2 py-0.5 rounded border border-meevo-border">Shift + Arrows</kbd></div>
                    <div className="flex justify-between w-full border-b border-white/5 pb-2"><span>Move 100px</span><kbd className="bg-meevo-surface-2 px-2 py-0.5 rounded border border-meevo-border">Shift+Alt+Arrows</kbd></div>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
      {activeColorPicker && (
        <ColorPickerModal
          color={customColors[theme]?.[activeColorPicker.key] || DEFAULT_THEME_COLORS[theme][activeColorPicker.key as keyof typeof DEFAULT_THEME_COLORS['Dark']]}
          x={activeColorPicker.x}
          y={activeColorPicker.y}
          onChange={(color) => handleColorChange(activeColorPicker.key, color)}
          onClose={() => setActiveColorPicker(null)}
        />
      )}
    </div>
  );
};

