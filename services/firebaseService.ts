import { initializeApp } from 'firebase/app';
import { initializeFirestore, doc, setDoc, getDoc, getDocFromServer, collection, getDocs, getDocsFromServer, deleteDoc, DocumentReference, DocumentSnapshot, Query, QuerySnapshot, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { User, DeviceRequest } from '../types';

// Initialize Firebase
export const app = initializeApp({
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId,
});

// Support custom database ID if present with offline persistent cache
export const db = firebaseConfig.firestoreDatabaseId
  ? initializeFirestore(app, {
      databaseId: firebaseConfig.firestoreDatabaseId,
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    })
  : initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    });

// Helper to perform robust fetching with server fallback if client reports offline
export const robustGetDoc = async (docRef: DocumentReference): Promise<DocumentSnapshot> => {
  try {
    return await getDoc(docRef);
  } catch (error: any) {
    console.warn('First getDoc attempt failed, checking fallback:', error);
    const errMsg = error?.message?.toLowerCase() || '';
    const errCode = error?.code || '';
    
    // If the browser is explicitly offline, do not attempt to contact server
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new Error('Failed to get document because the client is offline.');
    }

    if (errMsg.includes('offline') || errMsg.includes('network') || errMsg.includes('failed') || errCode === 'unavailable') {
      try {
        return await getDocFromServer(docRef);
      } catch (srvError) {
        console.warn('getDocFromServer fallback also failed:', srvError);
        throw error;
      }
    }
    throw error;
  }
};

export const robustGetDocs = async (query: Query): Promise<QuerySnapshot> => {
  try {
    return await getDocs(query);
  } catch (error: any) {
    console.warn('First getDocs attempt failed, checking fallback:', error);
    const errMsg = error?.message?.toLowerCase() || '';
    const errCode = error?.code || '';

    // If the browser is explicitly offline, do not attempt to contact server
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new Error('Failed to get documents because the client is offline.');
    }

    if (errMsg.includes('offline') || errMsg.includes('network') || errMsg.includes('failed') || errCode === 'unavailable') {
      try {
        return await getDocsFromServer(query);
      } catch (srvError) {
        console.warn('getDocsFromServer fallback also failed:', srvError);
        throw error;
      }
    }
    throw error;
  }
};

export const safeLogError = (context: string, error: any) => {
  const errMsg = error?.message?.toLowerCase() || '';
  if (
    errMsg.includes('offline') || 
    errMsg.includes('network') || 
    errMsg.includes('failed') || 
    errMsg.includes('unavailable') ||
    errMsg.includes('client is offline') ||
    (typeof navigator !== 'undefined' && !navigator.onLine)
  ) {
    console.warn(`[Offline/Network] ${context}:`, errMsg);
  } else {
    console.error(`${context}:`, error);
  }
};

export const firebaseService = {
  // Sync all users from cloud to local storage (so they can log in offline or from any browser)
  syncUsersFromCloud: async (): Promise<void> => {
    try {
      const querySnapshot = await robustGetDocs(collection(db, 'isp_users'));
      const cloudUsers: User[] = [];
      querySnapshot.forEach((doc) => {
        cloudUsers.push(doc.data() as User);
      });

      if (cloudUsers.length > 0) {
        const localData = localStorage.getItem('isp_users_db');
        let mergedUsers: User[] = cloudUsers;

        if (localData) {
          try {
            const localUsers: User[] = JSON.parse(localData);
            const userMap = new Map<string, User>();
            // Add cloud users first (cloud is source of truth)
            cloudUsers.forEach(u => userMap.set(u.username.toLowerCase(), u));
            // Add local users if not in cloud
            localUsers.forEach(u => {
              if (!userMap.has(u.username.toLowerCase())) {
                userMap.set(u.username.toLowerCase(), u);
                // Also upload to cloud so they sync back
                firebaseService.saveUserToCloud(u).catch(console.error);
              }
            });
            mergedUsers = Array.from(userMap.values());
          } catch {
            // Ignore parse errors, use cloudUsers
          }
        }

        localStorage.setItem('isp_users_db', JSON.stringify(mergedUsers));
      }
    } catch (e) {
      safeLogError('Failed to sync users from cloud', e);
    }
  },

  // Save/Update user to cloud
  saveUserToCloud: async (user: User): Promise<void> => {
    try {
      const cleanUsername = user.username.trim().toLowerCase();
      if (!cleanUsername) return;
      await setDoc(doc(db, 'isp_users', cleanUsername), {
        username: user.username,
        password: user.password,
        role: user.role,
        permissions: user.permissions || null,
        createdBy: user.createdBy || null,
        createdAt: user.createdAt || Date.now(),
        licenseDays: user.licenseDays || null,
        licenseExpiryDate: user.licenseExpiryDate || null,
        siteName: user.siteName || null,
        siteTagline: user.siteTagline || null,
        logoPreset: user.logoPreset || null,
        logoUrl: user.logoUrl || null,
      }, { merge: true });
    } catch (e) {
      safeLogError('Failed to save user to cloud', e);
    }
  },

  // Delete user from cloud
  deleteUserFromCloud: async (username: string): Promise<void> => {
    try {
      const cleanUsername = username.trim().toLowerCase();
      if (!cleanUsername) return;
      await deleteDoc(doc(db, 'isp_users', cleanUsername));
    } catch (e) {
      safeLogError('Failed to delete user from cloud', e);
    }
  },

  // Fetch a specific user's credential details directly from cloud
  fetchUserFromCloud: async (username: string): Promise<User | null> => {
    try {
      const cleanUsername = username.trim().toLowerCase();
      if (!cleanUsername) return null;
      const docSnap = await robustGetDoc(doc(db, 'isp_users', cleanUsername));
      if (docSnap.exists()) {
        return docSnap.data() as User;
      }
      return null;
    } catch (e) {
      safeLogError('Failed to fetch user from cloud', e);
      return null;
    }
  },

  // Upload full business backup (customers, settings, expenses) for a master username
  uploadBackupToCloud: async (masterUsername: string): Promise<void> => {
    try {
      const uname = masterUsername.trim().toLowerCase();
      if (!uname) return;

      const billingKey = `isp_billing_data_v2_${uname}`;
      const settingsKey = `isp_site_settings_${uname}`;
      const expensesKey = `isp_daily_expenses_v1_${uname}`;

      const billingDataStr = localStorage.getItem(billingKey) || '[]';
      const settingsDataStr = localStorage.getItem(settingsKey) || '{}';
      const expensesDataStr = localStorage.getItem(expensesKey) || '[]';

      const lastUpdated = Date.now();
      localStorage.setItem(`isp_last_updated_${uname}`, String(lastUpdated));

      await setDoc(doc(db, 'isp_backups', uname), {
        uname: masterUsername,
        customers: billingDataStr,
        settings: settingsDataStr,
        expenses: expensesDataStr,
        lastUpdated,
      }, { merge: true });

      console.log(`Cloud backup completed for ${masterUsername}`);
    } catch (e) {
      safeLogError('Failed to upload backup to cloud', e);
    }
  },

  // Download and restore full business backup for a master username
  downloadBackupFromCloud: async (masterUsername: string, force = false): Promise<boolean> => {
    try {
      const uname = masterUsername.trim().toLowerCase();
      if (!uname) return false;

      const docSnap = await robustGetDoc(doc(db, 'isp_backups', uname));
      if (!docSnap.exists()) {
        console.log(`No cloud backup found for ${masterUsername}`);
        return false;
      }

      const data = docSnap.data();
      const localLastUpdated = Number(localStorage.getItem(`isp_last_updated_${uname}`) || 0);

      // Unless forced (like at login or manual sync), check if cloud has newer data
      if (!force && data.lastUpdated && Number(data.lastUpdated) <= localLastUpdated) {
        console.log(`Local backup is already up-to-date with cloud for ${masterUsername} (${localLastUpdated} >= ${data.lastUpdated})`);
        return true;
      }

      const billingKey = `isp_billing_data_v2_${uname}`;
      const settingsKey = `isp_site_settings_${uname}`;
      const expensesKey = `isp_daily_expenses_v1_${uname}`;

      if (data.customers) localStorage.setItem(billingKey, data.customers);
      if (data.settings) localStorage.setItem(settingsKey, data.settings);
      if (data.expenses) localStorage.setItem(expensesKey, data.expenses);
      if (data.lastUpdated) localStorage.setItem(`isp_last_updated_${uname}`, String(data.lastUpdated));

      // Dispatch events to update UI
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('isp_sync'));
      }

      console.log(`Cloud backup restored for ${masterUsername}`);
      return true;
    } catch (e) {
      safeLogError('Failed to download backup from cloud', e);
      return false;
    }
  },

  // Get a specific device request status
  getDeviceRequest: async (username: string, deviceId: string): Promise<DeviceRequest | null> => {
    try {
      const uId = `${username.trim().toLowerCase()}_${deviceId.trim()}`;
      let docSnap;
      try {
        // Try to get fresh copy directly from server to bypass offline cache issues
        docSnap = await getDocFromServer(doc(db, 'isp_device_permissions', uId));
      } catch (err) {
        console.warn('getDocFromServer failed, falling back to cache:', err);
        docSnap = await robustGetDoc(doc(db, 'isp_device_permissions', uId));
      }
      if (docSnap.exists()) {
        return docSnap.data() as DeviceRequest;
      }
      return null;
    } catch (e) {
      safeLogError('Failed to get device request', e);
      return null;
    }
  },

  // Create or submit a new device request (initially pending)
  createDeviceRequest: async (username: string, deviceId: string, deviceName: string): Promise<DeviceRequest | null> => {
    try {
      const uId = `${username.trim().toLowerCase()}_${deviceId.trim()}`;
      const newRequest: DeviceRequest = {
        id: uId,
        username: username.trim().toLowerCase(),
        deviceId: deviceId.trim(),
        deviceName: deviceName,
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      await setDoc(doc(db, 'isp_device_permissions', uId), newRequest, { merge: true });
      return newRequest;
    } catch (e) {
      safeLogError('Failed to create device request', e);
      return null;
    }
  },

  // Fetch all device requests (useful for admin approval screen)
  getAllDeviceRequests: async (): Promise<DeviceRequest[]> => {
    try {
      let querySnapshot;
      try {
        // Try fresh copy directly from server to bypass offline cache issues
        querySnapshot = await getDocsFromServer(collection(db, 'isp_device_permissions'));
      } catch (err) {
        console.warn('getDocsFromServer failed, falling back to cache:', err);
        querySnapshot = await robustGetDocs(collection(db, 'isp_device_permissions'));
      }
      const requests: DeviceRequest[] = [];
      querySnapshot.forEach((docSnap) => {
        requests.push(docSnap.data() as DeviceRequest);
      });
      return requests;
    } catch (e) {
      safeLogError('Failed to fetch all device requests', e);
      return [];
    }
  },

  // Update status of a device request (approve or reject)
  updateDeviceRequestStatus: async (
    username: string, 
    deviceId: string, 
    status: 'approved' | 'rejected', 
    permissions?: UserPermissions, 
    createdBy?: string
  ): Promise<boolean> => {
    try {
      const uId = `${username.trim().toLowerCase()}_${deviceId.trim()}`;
      const docRef = doc(db, 'isp_device_permissions', uId);
      
      const updateData: any = { status, updatedAt: Date.now() };
      if (permissions) {
        updateData.permissions = permissions;
      }
      // Set the status directly to avoid cache-existence check blocks
      await setDoc(docRef, updateData, { merge: true });

      // Auto-create user in cloud collection when approved!
      if (status === 'approved') {
        const cleanUsername = username.trim().toLowerCase();
        await setDoc(doc(db, 'isp_users', cleanUsername), {
          username: cleanUsername,
          role: 'staff',
          permissions: permissions || {
            canAddCustomer: false,
            canEditCustomer: false,
            canDeleteCustomer: false,
            canAddPayment: false,
            canBulkImport: false,
            canExpense: false
          },
          createdBy: createdBy || 'admin',
          createdAt: Date.now()
        }, { merge: true });
      }
      return true;
    } catch (e) {
      safeLogError('Failed to update device request status', e);
      return false;
    }
  },

  // Delete a device request
  deleteDeviceRequest: async (username: string, deviceId: string): Promise<boolean> => {
    try {
      const uId = `${username.trim().toLowerCase()}_${deviceId.trim()}`;
      await deleteDoc(doc(db, 'isp_device_permissions', uId));
      return true;
    } catch (e) {
      safeLogError('Failed to delete device request', e);
      return false;
    }
  }
};
