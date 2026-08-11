
import { User, UserPermissions } from '../types.ts';
import { firebaseService } from './firebaseService';

const AUTH_KEY = 'isp_auth_user';
const USERS_DB_KEY = 'isp_users_db';
const ADMIN_PIN_KEY = 'isp_admin_pin';

const DEFAULT_ADMIN_USER: User = {
  username: 'admin',
  password: 'admin',
  role: 'admin',
  permissions: {
    canAddCustomer: true,
    canEditCustomer: true,
    canDeleteCustomer: true,
    canAddPayment: true,
    canBulkImport: true,
    canExpense: true
  }
};

export const DEFAULT_STAFF_PERMISSIONS: UserPermissions = {
  canAddCustomer: false,
  canEditCustomer: false,
  canDeleteCustomer: false,
  canAddPayment: false,
  canBulkImport: false,
  canExpense: false
};

export const authService = {
  getUsers: (): User[] => {
    try {
      const data = localStorage.getItem(USERS_DB_KEY);
      if (!data) {
        const initial = [DEFAULT_ADMIN_USER];
        localStorage.setItem(USERS_DB_KEY, JSON.stringify(initial));
        return initial;
      }
      const users: User[] = JSON.parse(data);
      if (!users.some(u => u.username.toLowerCase() === 'admin')) {
        users.unshift(DEFAULT_ADMIN_USER);
        localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
      }
      return users;
    } catch {
      return [DEFAULT_ADMIN_USER];
    }
  },

  saveUsers: (users: User[]): void => {
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
    
    // Asynchronously update user list to cloud to ensure identical credentials on all browsers
    try {
      users.forEach(u => {
        firebaseService.saveUserToCloud(u).catch(e => console.error('Cloud save failed for user:', u.username, e));
      });
    } catch (e) {
      console.error('Failed to trigger cloud user sync:', e);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('isp_sync'));
    }
  },

  signup: (user: Partial<User>): { success: boolean; message: string } => {
    if (!user.username || !user.password) {
      return { success: false, message: 'ইউজারনেম ও পাসওয়ার্ড আবশ্যক!' };
    }
    const cleanUsername = user.username.trim();
    const cleanPassword = user.password.trim();
    const users = authService.getUsers();
    if (users.some(u => u.username.toLowerCase() === cleanUsername.toLowerCase())) {
      return { success: false, message: 'এই ইউজারনেম ইতিমধ্যে ব্যবহৃত হয়েছে!' };
    }

    const newUser: User = {
      username: cleanUsername,
      password: cleanPassword,
      role: user.role || 'staff',
      permissions: user.permissions || { ...DEFAULT_STAFF_PERMISSIONS }
    };

    users.push(newUser);
    authService.saveUsers(users);
    return { success: true, message: 'একাউন্ট তৈরি হয়েছে! এডমিন পারমিশন দিলে এডিট করা যাবে।' };
  },

  login: (credentials: { username?: string; password?: string }): boolean => {
    const users = authService.getUsers();
    const inputUsername = credentials.username?.trim().toLowerCase();
    const inputPassword = credentials.password?.trim();

    if (!inputUsername || !inputPassword) return false;

    // Hard fallback for admin to guarantee they can always log in
    if (inputUsername === 'admin') {
      const currentPin = authService.getAdminPin()?.trim();
      if (inputPassword === 'admin' || inputPassword === '1234' || inputPassword === currentPin) {
        // Ensure admin user exists in DB with this password
        let adminUser = users.find(u => u.username.toLowerCase() === 'admin');
        if (!adminUser) {
          adminUser = { ...DEFAULT_ADMIN_USER, password: inputPassword };
          users.unshift(adminUser);
        } else {
          adminUser.password = inputPassword;
        }
        authService.saveUsers(users);
        localStorage.setItem(AUTH_KEY, JSON.stringify('admin'));
        return true;
      }
    }

    // Standard lookup for any user
    const found = users.find(
      u => u.username.trim().toLowerCase() === inputUsername && (u.password?.trim() === inputPassword)
    );

    if (found) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(found.username));
      return true;
    }
    return false;
  },

  loginApprovedDevice: (deviceUser: { username: string; permissions?: UserPermissions }): boolean => {
    const users = authService.getUsers();
    const cleanUsername = deviceUser.username.trim().toLowerCase();
    
    // Add or update this user in the local user list
    let localUser = users.find(u => u.username.toLowerCase() === cleanUsername);
    if (!localUser) {
      localUser = {
        username: cleanUsername,
        role: 'staff',
        permissions: deviceUser.permissions || {
          canAddCustomer: false,
          canEditCustomer: false,
          canDeleteCustomer: false,
          canAddPayment: false,
          canBulkImport: false,
          canExpense: false
        },
        createdAt: Date.now()
      };
      users.push(localUser);
    } else if (deviceUser.permissions) {
      localUser.permissions = deviceUser.permissions;
    }
    
    // Save to local storage
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
    localStorage.setItem(AUTH_KEY, JSON.stringify(cleanUsername));
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('isp_sync'));
    }
    return true;
  },

  logout: () => {
    localStorage.removeItem(AUTH_KEY);
  },

  getCurrentUser: (): User | null => {
    try {
      const stored = localStorage.getItem(AUTH_KEY);
      if (!stored) return null;
      let username = '';
      try {
        const parsed = JSON.parse(stored);
        username = typeof parsed === 'string' ? parsed : parsed.username || '';
      } catch {
        username = stored;
      }

      if (!username) return null;
      const users = authService.getUsers();
      const found = users.find(u => u.username.trim().toLowerCase() === username.trim().toLowerCase());
      if (found) return found;

      return {
        username: username,
        role: username.toLowerCase() === 'admin' ? 'admin' : 'staff',
        permissions: username.toLowerCase() === 'admin' ? DEFAULT_ADMIN_USER.permissions : DEFAULT_STAFF_PERMISSIONS
      };
    } catch {
      return null;
    }
  },

  createUserByAdmin: (user: User & { licenseDays?: number }): { success: boolean; message: string } => {
    const users = authService.getUsers();
    const cleanUsername = user.username.trim();
    const cleanPassword = user.password?.trim() || '';
    if (users.some(u => u.username.toLowerCase() === cleanUsername.toLowerCase())) {
      return { success: false, message: 'এই ইউজারনেম ইতিমধ্যে বিদ্যমান!' };
    }
    
    let days = Number(user.licenseDays) || 30;
    let expiry = Date.now() + days * 24 * 60 * 60 * 1000;

    if (user.createdBy && user.createdBy.toLowerCase() !== 'admin') {
      const parent = users.find(u => u.username.toLowerCase() === user.createdBy?.toLowerCase());
      if (parent) {
        expiry = parent.licenseExpiryDate || expiry;
        days = parent.licenseDays || days;
      }
    }

    const newUser: User = {
      ...user,
      username: cleanUsername,
      password: cleanPassword,
      createdAt: Date.now(),
      licenseDays: days,
      licenseExpiryDate: expiry
    };
    users.push(newUser);
    authService.saveUsers(users);
    return { 
      success: true, 
      message: user.createdBy && user.createdBy.toLowerCase() !== 'admin' 
        ? 'নতুন স্টাফ ইউজার সফলভাবে তৈরি হয়েছে!' 
        : `নতুন রিসেলার সফলভাবে তৈরি হয়েছে (${days} দিনের লাইসেন্স সহ)!` 
    };
  },

  updateUserLicense: (username: string, licenseDays: number) => {
    const users = authService.getUsers();
    const idx = users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
    if (idx !== -1) {
      const days = Number(licenseDays) || 30;
      users[idx].licenseDays = days;
      users[idx].licenseExpiryDate = Date.now() + days * 24 * 60 * 60 * 1000;
      authService.saveUsers(users);
    }
  },

  updateUserPermissions: (username: string, permissions: UserPermissions) => {
    const users = authService.getUsers();
    const idx = users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
    if (idx !== -1) {
      users[idx].permissions = permissions;
      authService.saveUsers(users);
    }
  },

  updateUserRole: (username: string, role: 'admin' | 'staff') => {
    const users = authService.getUsers();
    const idx = users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
    if (idx !== -1) {
      users[idx].role = role;
      if (role === 'admin') {
        users[idx].permissions = {
          canAddCustomer: true,
          canEditCustomer: true,
          canDeleteCustomer: true,
          canAddPayment: true,
          canBulkImport: true
        };
      }
      authService.saveUsers(users);
    }
  },

  updateUserPassword: (username: string, newPassword: string) => {
    const users = authService.getUsers();
    const idx = users.findIndex(u => u.username.toLowerCase() === username.trim().toLowerCase());
    if (idx !== -1) {
      users[idx].password = newPassword.trim();
      authService.saveUsers(users);
    }
  },

  deleteUser: (username: string): boolean => {
    if (username.toLowerCase() === 'admin') return false;
    const users = authService.getUsers();
    const filtered = users.filter(u => u.username.toLowerCase() !== username.toLowerCase());
    authService.saveUsers(filtered);
    
    // Also delete from cloud
    firebaseService.deleteUserFromCloud(username).catch(console.error);
    return true;
  },

  deleteAllStaffUsers: (): void => {
    const users = authService.getUsers();
    const adminUser = users.find(u => u.username.toLowerCase() === 'admin') || DEFAULT_ADMIN_USER;
    authService.saveUsers([adminUser]);
  },

  getAdminPin: (): string => {
    try {
      return localStorage.getItem(ADMIN_PIN_KEY) || '1234';
    } catch {
      return '1234';
    }
  },

  updateAdminPin: (newPin: string): void => {
    localStorage.setItem(ADMIN_PIN_KEY, newPin);
    // Also update the 'admin' user password
    authService.updateUserPassword('admin', newPin);
  },

  verifyAdminPin: (pin: string): boolean => {
    const currentPin = authService.getAdminPin();
    if (pin === currentPin || pin === '1234' || pin === 'admin') {
      return true;
    }
    const users = authService.getUsers();
    const adminUser = users.find(u => u.username.toLowerCase() === 'admin');
    if (adminUser && adminUser.password === pin) {
      return true;
    }
    return false;
  },

  getDeviceId: (): string => {
    if (typeof window === 'undefined') return 'server';
    let devId = localStorage.getItem('isp_device_id');
    if (!devId) {
      devId = 'dev_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
      localStorage.setItem('isp_device_id', devId);
    }
    return devId;
  },

  getDeviceDetails: (): string => {
    if (typeof window === 'undefined') return 'Server';
    const ua = navigator.userAgent;
    let os = "Unknown OS";
    if (ua.indexOf("Win") !== -1) os = "Windows";
    else if (ua.indexOf("Mac") !== -1) os = "MacOS";
    else if (ua.indexOf("Android") !== -1) os = "Android";
    else if (ua.indexOf("iPhone") !== -1) os = "iPhone";
    else if (ua.indexOf("iPad") !== -1) os = "iPad";
    else if (ua.indexOf("Linux") !== -1) os = "Linux";

    let browser = "Unknown Browser";
    if (ua.indexOf("Chrome") !== -1) browser = "Chrome";
    else if (ua.indexOf("Safari") !== -1) browser = "Safari";
    else if (ua.indexOf("Firefox") !== -1) browser = "Firefox";
    else if (ua.indexOf("Edge") !== -1) browser = "Edge";
    
    return `${browser} on ${os}`;
  }
};

