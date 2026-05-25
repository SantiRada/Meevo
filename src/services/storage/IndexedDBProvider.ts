import { get, set } from 'idb-keyval';
import type { DraftMetadata, StorageProvider } from './types';

const DRAFTS_KEY = 'meevo_idb_drafts';

export class IndexedDBProvider implements StorageProvider {
  async isReady(): Promise<boolean> {
    return true; // IndexedDB is always ready
  }

  async initialize(): Promise<boolean> {
    return true; // No permission prompt needed for IDB
  }

  async listDrafts(): Promise<DraftMetadata[]> {
    try {
      const drafts = await get<DraftMetadata[]>(DRAFTS_KEY);
      return drafts || [];
    } catch (e) {
      console.error("Error reading drafts from IDB", e);
      return [];
    }
  }

  async createDraft(name: string): Promise<DraftMetadata | null> {
    try {
      const drafts = await this.listDrafts();
      
      if (drafts.some(d => d.name === name)) {
        return null; // Ya existe
      }

      const newDraft: DraftMetadata = {
        name,
        tiles: 40,
        players: 4,
        emptyTiles: 40,
        progress: 0,
        updatedAt: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        components: ['Board']
      };

      drafts.push(newDraft);
      await set(DRAFTS_KEY, drafts);
      
      return newDraft;
    } catch (e) {
      console.error("Error creating draft in IDB", e);
      return null;
    }
  }

  async getDraft(name: string): Promise<DraftMetadata | null> {
    const drafts = await this.listDrafts();
    return drafts.find(d => d.name === name) || null;
  }

  async updateDraft(name: string, updates: Partial<DraftMetadata>): Promise<boolean> {
    const drafts = await this.listDrafts();
    const index = drafts.findIndex(d => d.name === name);
    if (index === -1) return false;
    drafts[index] = { ...drafts[index], ...updates };
    await set(DRAFTS_KEY, drafts);
    return true;
  }

  async deleteDraft(name: string): Promise<boolean> {
    try {
      const drafts = await this.listDrafts();
      const filtered = drafts.filter(d => d.name !== name);
      await set(DRAFTS_KEY, filtered);
      return true;
    } catch (e) {
      console.error("Error deleting draft in IDB", e);
      return false;
    }
  }

  async verifyAndRestoreDraft(name: string): Promise<boolean> {
    // In IndexedDB we just assume the structure is virtual and always intact
    const drafts = await this.listDrafts();
    return drafts.some(d => d.name === name);
  }

  async syncDraftFolders(name: string, activeComponents: string[]): Promise<boolean> {
    // For IDB, we just pretend it succeeds. Real logic could update the metadata inside IDB.
    console.log(`Synced IDB folders for ${name}:`, activeComponents);
    return true;
  }
}
