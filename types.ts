
export interface MonthlyRecord {
  monthKey: string; // Format: YYYY-MM
  expectedBill: number;
  paidAmount: number;
  due: number;
  paymentDate: string;
  remarks: string;
  paymentMethod?: 'Cash' | 'bKash' | 'Other';
  trxId?: string;
}

export interface Customer {
  id: string;
  name: string;
  connectionName: string; // Renamed from connectionId
  address: string;
  mobile: string;
  monthlyBill: number;
  connectionDate: string; 
  records: Record<string, MonthlyRecord>;
}

export const MONTHS_BN = [
  "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
  "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
];
