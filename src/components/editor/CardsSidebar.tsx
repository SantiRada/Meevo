import React, { useState } from 'react';
import type { CardDeckData, CardData, LayerData } from '../../services/storage/types';
import { ConfirmModal } from '../ui/ConfirmModal';
import { 
  ArrowLeft20Regular,
  Add20Regular,
  Delete20Regular,
  Document20Regular,
  Checkmark20Regular,
  Edit20Regular,
  ChevronDown20Regular
} from '@fluentui/react-icons';

const BLANK_SIZES = [
  { id: 'poker', name: 'Poker', width: 300, height: 420 },
  { id: 'bridge', name: 'Bridge', width: 270, height: 420 },
  { id: 'tarot', name: 'Tarot', width: 330, height: 566 },
  { id: 'mini', name: 'Mini', width: 194, height: 300 },
  { id: 'square', name: 'Square', width: 330, height: 330 },
  { id: 'custom', name: 'Custom', width: 300, height: 420 }
];

interface CardsSidebarProps {
  boardDecksData: Record<string, CardDeckData>;
  selectedDeckId: string | null;
  selectedCardId: string | null;
  setSelectedCardId: (id: string | null) => void;
  onUpdateDecks: (decks: Record<string, CardDeckData>) => void;
  setCardsSubTab: (tab: 'Decks' | 'Cards' | 'Layers') => void;
}

export const CardsSidebar: React.FC<CardsSidebarProps> = ({
  boardDecksData,
  selectedDeckId,
  selectedCardId,
  setSelectedCardId,
  onUpdateDecks,
  setCardsSubTab
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Template Modal State
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateType, setTemplateType] = useState<'french' | 'spanish' | 'size'>('size');
  const [templateDropdownOpen, setTemplateDropdownOpen] = useState(false);
  const [selectedBlankSize, setSelectedBlankSize] = useState('poker');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [customWidth, setCustomWidth] = useState(300);
  const [customHeight, setCustomHeight] = useState(420);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);
  const [newCardName, setNewCardName] = useState('');

  if (!selectedDeckId || !boardDecksData[selectedDeckId]) {
    return (
      <div className="p-4 text-meevo-text-secondary">
        <button onClick={() => setCardsSubTab('Decks')} className="flex items-center gap-2 mb-4 hover:text-meevo-text-primary">
          <ArrowLeft20Regular /> Back to Decks
        </button>
        No deck selected.
      </div>
    );
  }

  const deck = boardDecksData[selectedDeckId];

  const handleCreateCard = (config: any) => {
    const id = Date.now().toString();
    const width = config.width || 300;
    const height = config.height || 420;
    
    let layers: LayerData[] = [];
    if (templateType !== 'size') {
      const rank = templateType === 'french' ? 'A' : '1';
      const suit = templateType === 'french' ? '♠' : '⚔';
      layers = [
        {
          id: id + '1', type: 'text', name: 'Top Left Rank',
          x: 15, y: 15, width: 40, height: 40, fillColor: '#000000', text: rank,
          sizingW: 'hug', sizingH: 'hug', typography: { size: 32, weight: 'Bold', alignH: 'center' }
        },
        {
          id: id + '2', type: 'text', name: 'Top Left Suit',
          x: 18, y: 55, width: 30, height: 30, fillColor: '#000000', text: suit,
          sizingW: 'hug', sizingH: 'hug', typography: { size: 24, weight: 'Regular', alignH: 'center' }
        },
        {
          id: id + '3', type: 'text', name: 'Bottom Right Rank',
          x: width - 35, y: height - 50, width: 40, height: 40, fillColor: '#000000', text: rank,
          rotation: 180, sizingW: 'hug', sizingH: 'hug', typography: { size: 32, weight: 'Bold', alignH: 'center' }
        },
        {
          id: id + '4', type: 'text', name: 'Bottom Right Suit',
          x: width - 38, y: height - 85, width: 30, height: 30, fillColor: '#000000', text: suit,
          rotation: 180, sizingW: 'hug', sizingH: 'hug', typography: { size: 24, weight: 'Regular', alignH: 'center' }
        },
        {
          id: id + '5', type: 'rect', name: 'Image',
          x: 40, y: 80, width: width - 80, height: height - 160,
          fillColor: '#1A1A1D', strokeWidth: 1, strokeColor: '#CCCCCC'
        }
      ];
    }

    const newCard: CardData = {
      id,
      deckId: selectedDeckId,
      name: newCardName.trim() || `New Card ${Object.keys(deck.cards).length + 1}`,
      width,
      height,
      rounded: config.rounded || 16,
      templateConfig: {
        type: templateType,
        ...config
      },
      layers
    };

    onUpdateDecks({
      ...boardDecksData,
      [selectedDeckId]: {
        ...deck,
        cards: { ...deck.cards, [id]: newCard }
      }
    });
    setSelectedCardId(id);
    setIsTemplateModalOpen(false);
    setNewCardName('');
  };

  const confirmDeleteCard = () => {
    if (!cardToDelete) return;
    const newCards = { ...deck.cards };
    delete newCards[cardToDelete];
    onUpdateDecks({
      ...boardDecksData,
      [selectedDeckId]: { ...deck, cards: newCards }
    });
    if (selectedCardId === cardToDelete) setSelectedCardId(null);
    setCardToDelete(null);
  };

  const handleRenameSubmit = (id: string) => {
    if (editName.trim()) {
      onUpdateDecks({
        ...boardDecksData,
        [selectedDeckId]: {
          ...deck,
          cards: {
            ...deck.cards,
            [id]: { ...deck.cards[id], name: editName.trim() }
          }
        }
      });
    }
    setEditingId(null);
  };

  return (
    <>
      <div className="h-[56px] px-6 border-b border-meevo-border flex items-center gap-3 shrink-0">
        <button 
          onClick={() => setCardsSubTab('Decks')}
          className="text-meevo-text-tertiary hover:text-meevo-text-primary transition-colors"
        >
          <ArrowLeft20Regular />
        </button>
        <h2 className="text-base font-medium text-meevo-text-primary truncate flex-1">{deck.name} Cards</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {Object.values(deck.cards).map((card) => (
          <div 
            key={card.id}
            onClick={() => setSelectedCardId(card.id)}
            className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors border ${
              selectedCardId === card.id 
                ? 'bg-meevo-surface-2 border-meevo-purple' 
                : 'bg-meevo-surface-2/50 border-transparent hover:bg-meevo-surface-2 hover:border-[#CCCCCC]/20'
            }`}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded bg-meevo-surface-2 flex items-center justify-center shrink-0 border border-meevo-border">
                <Document20Regular className="text-meevo-purple" />
              </div>
              {editingId === card.id ? (
                <div className="flex items-center gap-2 w-full">
                  <input
                    type="text"
                    value={editName}
                    autoFocus
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameSubmit(card.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    onBlur={() => handleRenameSubmit(card.id)}
                    className="bg-[#0A0A0C] border border-[#CCCCCC]/20 rounded px-2 py-1 text-sm text-meevo-text-primary outline-none w-full"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button onClick={(e) => { e.stopPropagation(); handleRenameSubmit(card.id); }} className="text-meevo-purple shrink-0">
                    <Checkmark20Regular />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-medium text-meevo-text-primary truncate">{card.name}</span>
                  <span className="text-xs text-meevo-text-tertiary capitalize">{card.templateConfig.type} Template</span>
                </div>
              )}
            </div>
            {editingId !== card.id && (
              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditName(card.name);
                    setEditingId(card.id);
                  }}
                  className="w-8 h-8 flex items-center justify-center p-0 text-meevo-text-secondary hover:text-meevo-text-primary hover:bg-meevo-surface-0 rounded-md transition-colors"
                >
                  <Edit20Regular fontSize={14} />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setCardToDelete(card.id);
                  }}
                  className="w-8 h-8 flex items-center justify-center p-0 text-meevo-text-secondary hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                >
                  <Delete20Regular fontSize={14} />
                </button>
              </div>
            )}
          </div>
        ))}
        {Object.keys(deck.cards).length === 0 && (
          <div className="text-center py-8">
            <Document20Regular className="mx-auto text-[#CCCCCC]/20 mb-3" fontSize={32} />
            <p className="text-sm text-meevo-text-secondary font-medium">No cards yet</p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-meevo-border shrink-0">
        <button
          onClick={() => {
            setNewCardName(`New Card ${Object.keys(deck.cards).length + 1}`);
            setIsTemplateModalOpen(true);
          }}
          className="w-full py-2 bg-meevo-purple text-white text-sm font-medium rounded-md hover:bg-meevo-purple-active transition-colors flex items-center justify-center gap-2"
        >
          <Add20Regular fontSize={16} />
          Create Card
        </button>
      </div>

      {isTemplateModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsTemplateModalOpen(false)}>
          <div className="bg-meevo-surface-2 border border-meevo-border rounded-xl p-6 w-[400px] shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-meevo-text-primary mb-4">Create New Card</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-meevo-text-secondary mb-2">Card Name</label>
              <input 
                type="text" 
                value={newCardName}
                onChange={e => setNewCardName(e.target.value)}
                autoFocus
                className="w-full bg-meevo-surface-0 border border-[#CCCCCC]/20 rounded-md px-3 py-2 text-sm text-meevo-text-primary outline-none focus:border-meevo-purple focus:ring-1 focus:ring-meevo-purple"
                placeholder="E.g., King of Spades"
              />
            </div>

            <div className="mb-6 relative">
              <label className="block text-sm font-medium text-meevo-text-secondary mb-2">Template</label>
              <div 
                className="w-full bg-meevo-surface-0 border border-[#CCCCCC]/20 rounded-md px-3 py-2 text-sm text-meevo-text-primary flex justify-between items-center cursor-pointer hover:border-[#CCCCCC]/40"
                onClick={() => setTemplateDropdownOpen(!templateDropdownOpen)}
              >
                <span>{templateType === 'size' ? 'Blank / Custom Size' : templateType === 'french' ? 'French (Poker)' : 'Spanish'}</span>
                <ChevronDown20Regular fontSize={16} className="text-meevo-text-tertiary" />
              </div>
              {templateDropdownOpen && (
                <div className="absolute top-[100%] mt-1 left-0 w-full bg-meevo-surface-2 border border-meevo-border rounded-md shadow-lg z-10 overflow-hidden">
                  <div className="px-3 py-2 text-sm hover:bg-meevo-border cursor-pointer text-meevo-text-primary" onClick={() => { setTemplateType('size'); setTemplateDropdownOpen(false); }}>Blank / Custom Size</div>
                  <div className="px-3 py-2 text-sm hover:bg-meevo-border cursor-pointer text-meevo-text-primary" onClick={() => { setTemplateType('french'); setTemplateDropdownOpen(false); }}>French (Poker)</div>
                  <div className="px-3 py-2 text-sm hover:bg-meevo-border cursor-pointer text-meevo-text-primary" onClick={() => { setTemplateType('spanish'); setTemplateDropdownOpen(false); }}>Spanish</div>
                </div>
              )}
            </div>

            {templateType === 'size' && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-meevo-text-secondary">Card Size</label>
                  <div className="flex bg-meevo-surface-0 border border-meevo-border rounded-md p-0.5">
                    <button 
                      onClick={() => setOrientation('portrait')}
                      className={`px-3 py-1 text-xs font-medium rounded transition-colors ${orientation === 'portrait' ? 'bg-meevo-surface-2 text-meevo-text-primary shadow-sm' : 'text-meevo-text-tertiary hover:text-meevo-text-secondary'}`}
                    >
                      Portrait
                    </button>
                    <button 
                      onClick={() => setOrientation('landscape')}
                      className={`px-3 py-1 text-xs font-medium rounded transition-colors ${orientation === 'landscape' ? 'bg-meevo-surface-2 text-meevo-text-primary shadow-sm' : 'text-meevo-text-tertiary hover:text-meevo-text-secondary'}`}
                    >
                      Landscape
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {BLANK_SIZES.map(size => {
                    const isCustom = size.id === 'custom';
                    const baseW = isCustom ? customWidth : size.width;
                    const baseH = isCustom ? customHeight : size.height;
                    const actualW = orientation === 'landscape' ? baseH : baseW;
                    const actualH = orientation === 'landscape' ? baseW : baseH;
                    const scale = Math.min(60 / actualH, 60 / actualW);
                    const previewW = actualW * scale;
                    const previewH = actualH * scale;
                    const isSelected = selectedBlankSize === size.id;
                    return (
                      <div 
                        key={size.id}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer border transition-colors ${
                          isSelected ? 'bg-meevo-surface-2 border-meevo-purple' : 'bg-meevo-surface-0 border-meevo-border hover:border-[#CCCCCC]/30'
                        }`}
                        onClick={() => setSelectedBlankSize(size.id)}
                      >
                        <div className="h-[60px] flex items-center justify-center mb-2 w-full">
                          <div 
                            style={{ width: previewW, height: previewH }} 
                            className={`border ${isSelected ? 'border-meevo-purple' : 'border-meevo-border'} border-dashed transition-all duration-300`}
                          />
                        </div>
                        <span className="text-xs font-medium text-meevo-text-primary text-center">{size.name}</span>
                        <span className="text-[10px] text-meevo-text-tertiary whitespace-nowrap">{actualW} x {actualH} px</span>
                      </div>
                    );
                  })}
                </div>
                {selectedBlankSize === 'custom' && (
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-meevo-text-secondary mb-1">Width (px)</label>
                      <input 
                        type="number" 
                        value={customWidth}
                        onChange={(e) => setCustomWidth(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full bg-meevo-surface-0 border border-[#CCCCCC]/20 rounded-md px-3 py-2 text-sm text-meevo-text-primary outline-none focus:border-meevo-purple focus:ring-1 focus:ring-meevo-purple"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-meevo-text-secondary mb-1">Height (px)</label>
                      <input 
                        type="number" 
                        value={customHeight}
                        onChange={(e) => setCustomHeight(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full bg-meevo-surface-0 border border-[#CCCCCC]/20 rounded-md px-3 py-2 text-sm text-meevo-text-primary outline-none focus:border-meevo-purple focus:ring-1 focus:ring-meevo-purple"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsTemplateModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-meevo-text-secondary hover:text-meevo-text-primary transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (!newCardName.trim()) return;
                  if (templateType === 'size') {
                    const size = BLANK_SIZES.find(s => s.id === selectedBlankSize) || BLANK_SIZES[0];
                    const isCustom = size.id === 'custom';
                    const baseW = isCustom ? customWidth : size.width;
                    const baseH = isCustom ? customHeight : size.height;
                    const actualW = orientation === 'landscape' ? baseH : baseW;
                    const actualH = orientation === 'landscape' ? baseW : baseH;
                    handleCreateCard({ width: actualW, height: actualH, rounded: 16 });
                  } else if (templateType === 'french') {
                    handleCreateCard({ width: 300, height: 420, rounded: 16, rank: 'A', suit: 'spades', textColor: '#000000' });
                  } else {
                    handleCreateCard({ width: 300, height: 420, rounded: 16, rank: '1', suit: 'swords', textColor: '#000000' });
                  }
                }}
                disabled={!newCardName.trim()}
                className="px-4 py-2 bg-meevo-purple text-white text-sm font-bold rounded-md hover:bg-meevo-purple-active transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={!!cardToDelete}
        onClose={() => setCardToDelete(null)}
        onConfirm={confirmDeleteCard}
        title="Delete Card"
        message={`Are you sure you want to delete this card? This action cannot be undone.`}
        confirmText="Delete"
      />
    </>
  );
};
