
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
  name: string;
  connectionName: string;
  address: string;
  mobile: string;
  monthlyBill: number;
  connectionDate: string; 
  createdAt: number; // For sorting by newest entries
  records: Record<string, MonthlyRecord>;
}

export const MONTHS_BN = [
  "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
  "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
];
