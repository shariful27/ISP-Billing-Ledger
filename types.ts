
export interface UserPermissions {
  canAddCustomer: boolean;
  canEditCustomer: boolean;
  canDeleteCustomer: boolean;
  canAddPayment: boolean;
  canBulkImport: boolean;
  canExpense?: boolean;
}

export interface User {
  username: string;
  password?: string;
  role: 'admin' | 'staff';
  permissions: UserPermissions;
  siteName?: string;
  siteTagline?: string;
  logoPreset?: string;
  logoUrl?: string;
  licenseDays?: number;
  licenseExpiryDate?: number;
  createdBy?: string;
  createdAt?: number;
}

export interface DeviceRequest {
  id: string; // username_deviceId
  username: string;
  deviceId: string;
  deviceName: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
  updatedAt: number;
}

export interface SiteSettings {
  siteName: string;
  siteTagline: string;
  logoPreset?: string;
  logoUrl?: string;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  siteName: 'ISP লেজার প্রো',
  siteTagline: 'Smart Billing & Accounts',
  logoPreset: 'wifi',
  logoUrl: ''
};

export interface MonthlyRecord {
  monthKey: string; // Format: YYYY-MM
  expectedBill: number;
  paidAmount: number;
  due: number;
  paymentDate: string;
  remarks: string;
  paymentMethod?: 'Cash' | 'bKash' | 'Free' | 'Other';
  trxId?: string;
}

export interface Customer {
  id: string;
  sr?: number | string;
  name: string;
  connectionName: string; // ID / IP
  address: string;
  mobile: string;
  zone?: string;
  monthlyBill: number;
  initialDue?: number;
  connectionDate: string; 
  createdAt: number; // For sorting by newest entries
  records: Record<string, MonthlyRecord>;
}

export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  category: string;
  amount: number;
  note?: string;
  createdBy: string;
  createdAt: number;
}

export const EXPENSE_CATEGORIES = [
  "অফিস খরচ",
  "ব্যান্ডউইথ / ইন্টারনেট বিল",
  "মেনটেইন্যান্স / তার ক্রয়",
  "কর্মচারী বেতন / পারিশ্রমিক",
  "বিদ্যুৎ ও ইউটিলিটি বিল",
  "যাতায়াত খরচ",
  "চা / নাস্তা / আপ্যায়ন",
  "অন্যান্য খরচ"
];

export const MONTHS_BN = [
  "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
  "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
];

