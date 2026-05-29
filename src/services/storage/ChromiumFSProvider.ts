import { get, set } from 'idb-keyval';
import type { DraftMetadata, StorageProvider } from './types';

const ROOT_HANDLE_KEY = 'meevo_root_dir_handle';
const DRAFT_STRUCTURE = {
  'assets': ['fonts', 'icons', 'images', 'models'],
  'board': null,
  'cards': null,
  'dice': null,
  'manual': null,
  'rules': null,
  'token': null,
};

export class ChromiumFSProvider implements StorageProvider {
  private rootHandle: FileSystemDirectoryHandle | null = null;

  async isReady(): Promise<boolean> {
    if (this.rootHandle) return true;
    try {
      const handle = await get(ROOT_HANDLE_KEY);
      if (handle) {
        // Check if we still have permission
        const permission = await (handle as any).queryPermission({ mode: 'readwrite' });
        if (permission === 'granted') {
          this.rootHandle = handle as FileSystemDirectoryHandle;
          return true;
        } else if (permission === 'prompt') {
          const req = await (handle as any).requestPermission({ mode: 'readwrite' });
          if (req === 'granted') {
            this.rootHandle = handle as FileSystemDirectoryHandle;
            return true;
          }
        }
      }
    } catch (e) {
      console.warn("Failed to check readiness", e);
    }
    return false;
  }

  async initialize(): Promise<boolean> {
    try {
      if (await this.isReady()) return true;
      
      const handle = await (window as any).showDirectoryPicker({
        mode: 'readwrite',
      });
      await set(ROOT_HANDLE_KEY, handle);
      this.rootHandle = handle;
      return true;
    } catch (e) {
      console.error("Failed to initialize FS provider", e);
      return false;
    }
  }

  private async createStructure(draftHandle: FileSystemDirectoryHandle) {
    for (const [folder, subfolders] of Object.entries(DRAFT_STRUCTURE)) {
      const dirHandle = await draftHandle.getDirectoryHandle(folder, { create: true });
      if (subfolders) {
        for (const sub of subfolders) {
          await dirHandle.getDirectoryHandle(sub, { create: true });
        }
      }
    }
  }

  async listDrafts(): Promise<DraftMetadata[]> {
    if (!this.rootHandle) return [];
    const drafts: DraftMetadata[] = [];
    
    try {
      for await (const entry of (this.rootHandle as any).values()) {
        if (entry.kind === 'directory') {
          const draftHandle = entry as FileSystemDirectoryHandle;
          try {
            const fileHandle = await draftHandle.getFileHandle('meevo.json');
            const file = await fileHandle.getFile();
            const text = await file.text();
            drafts.push(JSON.parse(text) as DraftMetadata);
          } catch (e) {
            // No metadata file, maybe it's not a meevo draft or it's new.
            // We can return a default metadata based on the folder name
            const defaultMeta: DraftMetadata = {
              name: entry.name,
              tiles: 0,
              players: 0,
              emptyTiles: 0,
              progress: 0,
              updatedAt: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
            };
            drafts.push(defaultMeta);
          }
        }
      }
    } catch (e) {
      console.error("Error listing drafts:", e);
    }
    
    return drafts;
  }

  async createDraft(name: string): Promise<DraftMetadata | null> {
    if (!this.rootHandle) return null;
    try {
      const draftHandle = await this.rootHandle.getDirectoryHandle(name, { create: true });
      await this.createStructure(draftHandle);
      
      const newDraft: DraftMetadata = {
        name,
        tiles: 40,
        players: 4,
        emptyTiles: 40,
        progress: 0,
        updatedAt: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        components: ['Board']
      };
      
      const fileHandle = await draftHandle.getFileHandle('meevo.json', { create: true });
      const writable = await (fileHandle as any).createWritable();
      await writable.write(JSON.stringify(newDraft, null, 2));
      await writable.close();
      
      return newDraft;
    } catch (e) {
      console.error("Error creating draft", e);
      return null;
    }
  }

  async deleteDraft(name: string): Promise<boolean> {
    if (!this.rootHandle) return false;
    try {
      await this.rootHandle.removeEntry(name, { recursive: true });
      return true;
    } catch (e) {
      console.error("Error deleting draft", e);
      return false;
    }
  }

  async getDraft(name: string): Promise<DraftMetadata | null> {
    try {
      if (!this.rootHandle) return null;
      const draftHandle = await this.rootHandle.getDirectoryHandle(name);
      const metaFileHandle = await draftHandle.getFileHandle('meevo.json');
      const file = await metaFileHandle.getFile();
      const text = await file.text();
      return JSON.parse(text) as DraftMetadata;
    } catch (e) {
      return null;
    }
  }

  async updateDraft(name: string, updates: Partial<DraftMetadata>): Promise<boolean> {
    try {
      const draft = await this.getDraft(name);
      if (!draft) return false;
      const updated = { ...draft, ...updates };
      
      const draftHandle = await this.rootHandle!.getDirectoryHandle(name);
      const metaFileHandle = await draftHandle.getFileHandle('meevo.json', { create: true });
      const writable = await (metaFileHandle as any).createWritable();
      await writable.write(JSON.stringify(updated, null, 2));
      await writable.close();
      return true;
    } catch (e) {
      return false;
    }
  }

  async verifyAndRestoreDraft(name: string): Promise<boolean> {
    if (!this.rootHandle) return false;
    try {
      const draftHandle = await this.rootHandle.getDirectoryHandle(name, { create: false });
      await this.createStructure(draftHandle); // create: true is inside createStructure so it only adds missing

      return true;
    } catch (e) {
      console.error("Error verifying draft structure", e);
      return false;
    }
  }

  async syncDraftFolders(name: string, activeComponents: string[]): Promise<boolean> {
    try {
      const rootHandle = await get<FileSystemDirectoryHandle>(ROOT_HANDLE_KEY);
      if (!rootHandle) return false;
      const draftHandle = await rootHandle.getDirectoryHandle(name);
      
      const ALL_COMPONENTS = ['Board', 'Cards', 'Dices', 'Tokens', 'Rules', 'Manual'];
      
      for (const comp of ALL_COMPONENTS) {
        const folderName = comp.toLowerCase();
        if (activeComponents.includes(comp)) {
          // Create if it doesn't exist
          await draftHandle.getDirectoryHandle(folderName, { create: true });
        } else {
          // Remove if it exists
          try {
            await draftHandle.removeEntry(folderName, { recursive: true });
          } catch (e) {
            // Ignore error if it doesn't exist
          }
        }
      }
      return true;
    } catch (e) {
      console.error("Error syncing draft folders", e);
      return false;
    }
  }
}

