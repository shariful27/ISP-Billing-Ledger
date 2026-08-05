import { storageService } from './storageService';
import { authService } from './authService';
import { doc, setDoc } from 'firebase/firestore';
import { db, robustGetDoc } from './firebaseService';

export const syncService = {
  // Package all local ISP ledger data into a single object
  exportAllData: (): string => {
    const backupData: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('isp_') || key === 'isp_auth_user')) {
        const val = localStorage.getItem(key);
        if (val) {
          backupData[key] = val;
        }
      }
    }
    return JSON.stringify(backupData);
  },

  // Import the packaged data back into local storage
  importAllData: (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (!parsed || typeof parsed !== 'object') return false;

      // Clear current app data to prevent mixed states
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('isp_') || key === 'isp_auth_user')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));

      // Load new data
      for (const key in parsed) {
        if (Object.prototype.hasOwnProperty.call(parsed, key)) {
          localStorage.setItem(key, parsed[key]);
        }
      }

      // Dispatch event to refresh UI
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('isp_sync'));
      }
      return true;
    } catch (e) {
      console.error('Failed to import backup data:', e);
      return false;
    }
  },

  // Save data to Firestore and get a 6-digit sync code
  generateShortSyncCode: async (): Promise<string> => {
    try {
      const dataString = syncService.exportAllData();
      
      // Generate a random 6-digit numerical code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days

      await setDoc(doc(db, 'isp_sync_codes', code), {
        code,
        data: dataString,
        createdAt: Date.now(),
        expiresAt,
      });

      return code;
    } catch (e) {
      console.error('Failed to save cloud backup:', e);
      throw new Error('ক্লাউডে ব্যাকআপ কোড জেনারেট করতে ব্যর্থ হয়েছে!');
    }
  },

  // Restore data from Firestore using the 6-digit sync code
  restoreFromSyncCode: async (code: string): Promise<boolean> => {
    const trimmedCode = code.trim();
    if (!trimmedCode) return false;

    try {
      const docSnap = await robustGetDoc(doc(db, 'isp_sync_codes', trimmedCode));
      if (!docSnap.exists()) {
        throw new Error('ভুল কোড অথবা মেয়াদ শেষ হয়ে গেছে!');
      }

      const data = docSnap.data();
      if (data.expiresAt && Date.now() > data.expiresAt) {
        throw new Error('এই কোডটির মেয়াদ শেষ হয়ে গেছে!');
      }

      if (data.data) {
        return syncService.importAllData(data.data);
      }
      return false;
    } catch (e: any) {
      console.error('Failed to restore from cloud backup:', e);
      throw new Error(e.message || 'ভুল কোড অথবা মেয়াদ শেষ হয়ে গেছে!');
    }
  }
};
