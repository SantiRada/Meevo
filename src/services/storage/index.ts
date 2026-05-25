import { ChromiumFSProvider } from './ChromiumFSProvider';
import { IndexedDBProvider } from './IndexedDBProvider';

export const storage = ('showDirectoryPicker' in window)
  ? new ChromiumFSProvider()
  : new IndexedDBProvider();
