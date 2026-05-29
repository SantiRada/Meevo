import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { DraftCard } from '../components/DraftCard';
import { Add16Regular } from '@fluentui/react-icons';
import { storage } from '../services/storage';
import type { DraftMetadata } from '../services/storage/types';
import { NewDraftModal } from '../components/NewDraftModal';
import { ConfirmModal } from '../components/ui/ConfirmModal';

export const Dashboard: React.FC = () => {
  const [drafts, setDrafts] = useState<DraftMetadata[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draftToDelete, setDraftToDelete] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadDrafts = async () => {
    if (await storage.isReady()) {
      setIsReady(true);
      const list = await storage.listDrafts();
      setDrafts(list);
    }
  };

  useEffect(() => {
    loadDrafts();
  }, []);

  const handleNewDraftClick = async () => {
    if (!await storage.isReady()) {
      const initialized = await storage.initialize();
      if (!initialized) return;
      setIsReady(true);
    }
    setIsModalOpen(true);
  };

  const handleCreateDraft = async (name: string) => {
    const newDraft = await storage.createDraft(name);
    if (newDraft) {
      await loadDrafts();
      setIsModalOpen(false);
      navigate(`/draft/${encodeURIComponent(name)}`);
    } else {
      alert("Failed to create draft. Maybe the folder already exists?");
    }
  };

  const handleDeleteDraft = (name: string) => {
    setDraftToDelete(name);
  };

  const confirmDeleteDraft = async () => {
    if (draftToDelete) {
      const success = await storage.deleteDraft(draftToDelete);
      if (success) {
        await loadDrafts();
      } else {
        alert("Failed to delete draft.");
      }
      setDraftToDelete(null);
    }
  };

  const handleOpenDraft = async (name: string) => {
    const success = await storage.verifyAndRestoreDraft(name);
    if (success) {
      navigate(`/draft/${encodeURIComponent(name)}`);
    } else {
      alert("Failed to open or verify draft folders.");
    }
  };

  return (
    <div className="min-h-screen bg-meevo-bg text-meevo-text-primary flex flex-col">
      <Header />
      
      <main className="flex-1 px-8 py-6 max-w-[1200px] w-full mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-medium mb-2">Your Drafts</h1>
            <p className="text-meevo-text-tertiary">
              {isReady 
                ? "Create and manage your board game projects" 
                : "Select a local directory to store your drafts"}
            </p>
          </div>
          
          <button 
            onClick={handleNewDraftClick}
            className="bg-meevo-text-primary text-meevo-text-inverse px-4 py-2 rounded-sm font-medium flex items-center gap-2 hover:bg-meevo-text-secondary transition-colors text-sm"
          >
            <Add16Regular />
            New Draft
          </button>
        </div>

        {!isReady && drafts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-meevo-text-tertiary border border-dashed border-meevo-border rounded-md">
            <p>No storage folder selected.</p>
            <p className="text-sm">Click "New Draft" to select a folder and create your first project.</p>
          </div>
        )}

        {isReady && drafts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-meevo-text-tertiary border border-dashed border-meevo-border rounded-md">
            <p>You don't have any drafts yet.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drafts.map((draft) => (
            <DraftCard 
              key={draft.name}
              title={draft.name}
              tiles={draft.tiles}
              players={draft.players}
              emptyTiles={draft.emptyTiles}
              progress={draft.progress}
              updatedAt={draft.updatedAt}
              onClick={() => handleOpenDraft(draft.name)}
              onDelete={() => handleDeleteDraft(draft.name)}
            />
          ))}
        </div>
      </main>

      <ConfirmModal 
        isOpen={!!draftToDelete}
        onClose={() => setDraftToDelete(null)}
        onConfirm={confirmDeleteDraft}
        title="Delete Draft"
        message={`Are you sure you want to delete ${draftToDelete}? This will remove all files.`}
        confirmText="Delete"
        danger={true}
      />

      <NewDraftModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onCreate={handleCreateDraft} 
      />
    </div>
  );
};


