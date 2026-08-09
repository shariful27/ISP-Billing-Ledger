
import { Customer, SiteSettings, DEFAULT_SETTINGS, Expense } from '../types';
import { authService } from './authService';

export const storageService = {
  getCurrentUsername: (): string => {
    try {
      const stored = localStorage.getItem('isp_auth_user');
      if (!stored) return 'admin';
      let username = '';
      try {
        const parsed = JSON.parse(stored);
        username = typeof parsed === 'string' ? parsed : parsed.username || 'admin';
      } catch {
        username = stored;
      }

      // Check if this user is a staff/child user created by another user
      const users = authService.getUsers();
      const currentUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());
      let masterUname = username;
      if (currentUser && currentUser.createdBy && currentUser.createdBy.toLowerCase() !== 'admin') {
        masterUname = currentUser.createdBy;
      }

      const lowerUname = masterUname.toLowerCase();
      
      // If the master username has mixed case, migrate legacy keys to lowercased keys if they exist
      if (masterUname !== lowerUname) {
        const billingKeyMixed = `isp_billing_data_v2_${masterUname}`;
        const billingKeyLower = `isp_billing_data_v2_${lowerUname}`;
        const bData = localStorage.getItem(billingKeyMixed);
        if (bData && !localStorage.getItem(billingKeyLower)) {
          localStorage.setItem(billingKeyLower, bData);
        }

        const settingsKeyMixed = `isp_site_settings_${masterUname}`;
        const settingsKeyLower = `isp_site_settings_${lowerUname}`;
        const sData = localStorage.getItem(settingsKeyMixed);
        if (sData && !localStorage.getItem(settingsKeyLower)) {
          localStorage.setItem(settingsKeyLower, sData);
        }

        const expensesKeyMixed = `isp_daily_expenses_v1_${masterUname}`;
        const expensesKeyLower = `isp_daily_expenses_v1_${lowerUname}`;
        const eData = localStorage.getItem(expensesKeyMixed);
        if (eData && !localStorage.getItem(expensesKeyLower)) {
          localStorage.setItem(expensesKeyLower, eData);
        }

        const updatedKeyMixed = `isp_last_updated_${masterUname}`;
        const updatedKeyLower = `isp_last_updated_${lowerUname}`;
        const uData = localStorage.getItem(updatedKeyMixed);
        if (uData && !localStorage.getItem(updatedKeyLower)) {
          localStorage.setItem(updatedKeyLower, uData);
        }
      }

      return lowerUname;
    } catch {
      return 'admin';
    }
  },

  getSettings: (): SiteSettings => {
    const uname = storageService.getCurrentUsername();
    try {
      const users = authService.getUsers();
      const currentUser = users.find(u => u.username.toLowerCase() === uname.toLowerCase());
      if (currentUser && (currentUser.siteName || currentUser.logoUrl)) {
        return {
          ...DEFAULT_SETTINGS,
          siteName: currentUser.siteName || DEFAULT_SETTINGS.siteName,
          siteTagline: currentUser.siteTagline || DEFAULT_SETTINGS.siteTagline,
          logoPreset: currentUser.logoPreset || DEFAULT_SETTINGS.logoPreset,
          logoUrl: currentUser.logoUrl || DEFAULT_SETTINGS.logoUrl
        };
      }

      const settingsKey = `isp_site_settings_${uname}`;
      const data = localStorage.getItem(settingsKey);
      if (data) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      }

      if (uname.toLowerCase() === 'admin') {
        const legacy = localStorage.getItem('isp_site_settings_v1');
        if (legacy) return { ...DEFAULT_SETTINGS, ...JSON.parse(legacy) };
      }

      return DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings: (settings: SiteSettings): void => {
    const uname = storageService.getCurrentUsername();
    localStorage.setItem(`isp_site_settings_${uname}`, JSON.stringify(settings));

    const users = authService.getUsers();
    const idx = users.findIndex(u => u.username.toLowerCase() === uname.toLowerCase());
    if (idx !== -1) {
      users[idx].siteName = settings.siteName;
      users[idx].siteTagline = settings.siteTagline;
      users[idx].logoPreset = settings.logoPreset;
      users[idx].logoUrl = settings.logoUrl;
      authService.saveUsers(users);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('isp_sync'));
    }
  },

  getCustomers: (): Customer[] => {
    const uname = storageService.getCurrentUsername();
    const key = `isp_billing_data_v2_${uname}`;
    try {
      const data = localStorage.getItem(key);
      if (data) return JSON.parse(data);
      if (uname.toLowerCase() === 'admin') {
        const legacy = localStorage.getItem('isp_billing_data_v2');
        if (legacy) return JSON.parse(legacy);
      }
      return [];
    } catch (e) {
      console.error("Failed to load customers", e);
      return [];
    }
  },

  saveCustomers: (customers: Customer[]): void => {
    const uname = storageService.getCurrentUsername();
    localStorage.setItem(`isp_billing_data_v2_${uname}`, JSON.stringify(customers));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('isp_sync'));
    }
  },

  addCustomer: (customer: Partial<Customer>): { success: boolean; customer?: Customer; message?: string } => {
    const customers = storageService.getCustomers();
    const connName = (customer.connectionName || '').trim();
    if (!connName) {
      return { success: false, message: 'আইডি/আইপি (ID/IP) প্রদান করা আবশ্যক!' };
    }

    // Duplicate ID/IP check
    const duplicate = customers.find(c => c.connectionName.trim().toLowerCase() === connName.toLowerCase());
    if (duplicate) {
      return { success: false, message: `এই ID/IP (${connName}) দিয়ে ইতোমধ্যে একজন গ্রাহক (${duplicate.name}) নিবন্ধিত রয়েছে!` };
    }

    const maxSr = customers.reduce((max, c) => Math.max(max, Number(c.sr) || 0), 0);
    const nextSr = customer.sr || (maxSr + 1);
    const initialDueVal = Number(customer.initialDue) || 0;
    const billVal = Number(customer.monthlyBill) || 0;

    const newCustomer: Customer = {
      id: crypto.randomUUID(),
      sr: nextSr,
      name: customer.name || '',
      connectionName: connName,
      address: customer.address || '',
      mobile: customer.mobile || '',
      zone: customer.zone || '',
      monthlyBill: billVal,
      initialDue: initialDueVal,
      connectionDate: customer.connectionDate || new Date().toISOString().split('T')[0],
      createdAt: Date.now(),
      records: {},
    };

    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const totalExpected = billVal + initialDueVal;

    newCustomer.records[currentMonthKey] = {
      monthKey: currentMonthKey,
      expectedBill: totalExpected,
      paidAmount: 0,
      due: totalExpected,
      paymentDate: '',
      remarks: initialDueVal > 0 ? `পূর্বের বকেয়া সহ (৳${initialDueVal})` : ''
    };

    customers.push(newCustomer);
    storageService.saveCustomers(customers);
    return { success: true, customer: newCustomer };
  },

  addBulkCustomers: (bulkList: Partial<Customer>[]): { added: Customer[]; skippedCount: number } => {
    const customers = storageService.getCustomers();
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const added: Customer[] = [];
    let skippedCount = 0;

    const existingConnNames = new Set(customers.map(c => c.connectionName.trim().toLowerCase()));

    bulkList.forEach((item) => {
      const connName = (item.connectionName || '').trim();
      if (!connName || existingConnNames.has(connName.toLowerCase())) {
        skippedCount++;
        return; // Skip duplicate or empty ID/IP
      }

      existingConnNames.add(connName.toLowerCase());

      const maxSr = customers.reduce((max, c) => Math.max(max, Number(c.sr) || 0), 0);
      const nextSr = item.sr || (maxSr + added.length + 1);
      const initialDueVal = Number(item.initialDue) || 0;
      const billVal = Number(item.monthlyBill) || 0;

      const newCustomer: Customer = {
        id: crypto.randomUUID(),
        sr: nextSr,
        name: item.name || `গ্রাহক-${customers.length + added.length + 1}`,
        connectionName: connName,
        address: item.address || '',
        mobile: item.mobile || '',
        zone: item.zone || '',
        monthlyBill: billVal,
        initialDue: initialDueVal,
        connectionDate: item.connectionDate || new Date().toISOString().split('T')[0],
        createdAt: Date.now() + added.length,
        records: {}
      };

      const totalExpected = billVal + initialDueVal;
      newCustomer.records[currentMonthKey] = {
        monthKey: currentMonthKey,
        expectedBill: totalExpected,
        paidAmount: 0,
        due: totalExpected,
        paymentDate: '',
        remarks: initialDueVal > 0 ? `পূর্বের বকেয়া সহ (৳${initialDueVal})` : ''
      };

      customers.push(newCustomer);
      added.push(newCustomer);
    });

    storageService.saveCustomers(customers);
    return { added, skippedCount };
  },

  updateCustomer: (id: string, updates: Partial<Customer>): void => {
    const customers = storageService.getCustomers();
    const index = customers.findIndex(c => c.id === id);
    if (index !== -1) {
      customers[index] = { ...customers[index], ...updates };
      storageService.saveCustomers(customers);
    }
  },

  updateMonthlyRecord: (customerId: string, monthKey: string, record: Partial<any>): void => {
    const customers = storageService.getCustomers();
    const index = customers.findIndex(c => c.id === customerId);
    if (index !== -1) {
      const customer = customers[index];
      if (!customer.records) customer.records = {};
      
      const existing = customer.records[monthKey] || {
        monthKey,
        expectedBill: customer.monthlyBill,
        paidAmount: 0,
        due: customer.monthlyBill,
        paymentDate: '',
        remarks: ''
      };
      
      customer.records[monthKey] = { ...existing, ...record };
      storageService.saveCustomers(customers);
    }
  },

  deleteCustomer: (id: string): void => {
    const customers = storageService.getCustomers();
    const filtered = customers.filter(c => c.id !== id);
    storageService.saveCustomers(filtered);
  },

  getExpenses: (): Expense[] => {
    const uname = storageService.getCurrentUsername();
    const key = `isp_daily_expenses_v1_${uname}`;
    try {
      const data = localStorage.getItem(key);
      if (data) return JSON.parse(data);
      if (uname.toLowerCase() === 'admin') {
        const legacy = localStorage.getItem('isp_daily_expenses_v1');
        if (legacy) return JSON.parse(legacy);
      }
      return [];
    } catch (e) {
      console.error("Failed to load expenses", e);
      return [];
    }
  },

  saveExpenses: (expenses: Expense[]): void => {
    const uname = storageService.getCurrentUsername();
    localStorage.setItem(`isp_daily_expenses_v1_${uname}`, JSON.stringify(expenses));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('isp_sync'));
    }
  },

  addExpense: (expense: Partial<Expense>): Expense => {
    const expenses = storageService.getExpenses();
    const newExp: Expense = {
      id: crypto.randomUUID(),
      date: expense.date || new Date().toISOString().split('T')[0],
      title: expense.title || 'অনাকাঙ্ক্ষিত খরচ',
      category: expense.category || 'অন্যান্য খরচ',
      amount: Number(expense.amount) || 0,
      note: expense.note || '',
      createdBy: expense.createdBy || 'অজানা',
      createdAt: Date.now()
    };
    expenses.unshift(newExp);
    storageService.saveExpenses(expenses);
    return newExp;
  },

  updateExpense: (id: string, updates: Partial<Expense>): void => {
    const expenses = storageService.getExpenses();
    const idx = expenses.findIndex(e => e.id === id);
    if (idx !== -1) {
      expenses[idx] = { ...expenses[idx], ...updates };
      storageService.saveExpenses(expenses);
    }
  },

  deleteExpense: (id: string): void => {
    const expenses = storageService.getExpenses();
    const filtered = expenses.filter(e => e.id !== id);
    storageService.saveExpenses(filtered);
  }
};
