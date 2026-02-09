
import { Customer } from '../types';

const STORAGE_KEY = 'isp_billing_data_v2';

export const storageService = {
  getCustomers: (): Customer[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Failed to load customers", e);
      return [];
    }
  },

  saveCustomers: (customers: Customer[]): void => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
  },

  addCustomer: (customer: Partial<Customer>): Customer => {
    const customers = storageService.getCustomers();
    const newCustomer: Customer = {
      id: crypto.randomUUID(),
      name: customer.name || '',
      connectionName: customer.connectionName || '',
      address: customer.address || '',
      mobile: customer.mobile || '',
      monthlyBill: customer.monthlyBill || 0,
      connectionDate: customer.connectionDate || new Date().toISOString().split('T')[0],
      records: {},
    };
    customers.push(newCustomer);
    storageService.saveCustomers(customers);
    return newCustomer;
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
  }
};
