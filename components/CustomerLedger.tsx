
import React, { useState } from 'react';
import { Customer, MONTHS_BN, MonthlyRecord } from '../types.ts';

interface CustomerLedgerProps {
  customer: Customer;
  onBack: () => void;
  onUpdateRecord: (monthKey: string, record: Partial<MonthlyRecord>) => void;
  onEditCustomer: () => void;
  onDeleteCustomer: () => void;
}

export const CustomerLedger: React.FC<CustomerLedgerProps> = ({ 
  customer, onBack, onUpdateRecord, onEditCustomer, onDeleteCustomer 
}) => {
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const recordKeys = Object.keys(customer.records).sort((a, b) => b.localeCompare(a));

  const formatMonthKey = (key: string) => {
    const [year, month] = key.split('-');
    return `${MONTHS_BN[parseInt(month) - 1]} ${year}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-20 px-1 sm:px-0">
      {/* Control Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between no-print gap-3 sm:gap-4 mb-2">
        <button onClick={onBack} className="w-full sm:w-auto flex items-center justify-center gap-2 text-slate-500 font-bold hover:text-blue-600 transition-all text-xs py-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          ফিরে যান
        </button>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button onClick={onEditCustomer} className="flex-1 sm:flex-none px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-[10px] sm:text-[11px] font-bold hover:bg-slate-50 transition-all">তথ্য পরিবর্তন</button>
          <button onClick={() => window.print()} className="flex-1 sm:flex-none bg-blue-600 text-white px-4 py-2 rounded-lg text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-2 hover:bg-blue-700 shadow-sm transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            প্রিন্ট
          </button>
        </div>
      </div>

      {/* Official Ledger Container */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        {/* Document Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-8 py-6 sm:py-10">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
            <div className="w-full">
               <p className="text-[9px] sm:text-[10px] font-bold text-blue-600 uppercase tracking-[0.1em] sm:tracking-[0.2em] mb-1">হিসাব বিবরণী</p>
               <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 leading-tight">{customer.name}</h2>
               <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
                 <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-tighter">ID: {customer.connectionName}</span>
                 <span className="hidden sm:inline w-1 h-1 rounded-full bg-slate-300"></span>
                 <span className="text-[10px] sm:text-xs font-bold text-slate-500">{customer.mobile}</span>
               </div>
               <p className="text-[10px] sm:text-[11px] text-slate-400 mt-2 font-medium italic">{customer.address || 'ঠিকানা পাওয়া যায়নি'}</p>
            </div>
            <div className="w-full sm:w-auto bg-white border border-slate-200 rounded-xl p-4 sm:p-6 text-center shadow-sm lg:min-w-[160px]">
               <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">মাসিক বিল</p>
               <p className="text-2xl sm:text-4xl font-bold text-slate-800 tracking-tight">৳{customer.monthlyBill}</p>
            </div>
          </div>
        </div>

        {/* Transaction Table */}
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-center border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest border-b border-slate-200">
                <th className="py-3 sm:py-4 px-4 sm:px-6 text-left">বিলিং মাস</th>
                <th className="py-3 sm:py-4 px-2 sm:px-4">নির্ধারিত</th>
                <th className="py-3 sm:py-4 px-2 sm:px-4">জমা (Paid)</th>
                <th className="py-3 sm:py-4 px-2 sm:px-4">বকেয়া (Due)</th>
                <th className="py-3 sm:py-4 px-4 sm:px-6 text-right">নোট</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recordKeys.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 sm:py-24 text-slate-300 font-medium italic text-sm">কোনো লেনদেন রেকর্ড করা হয়নি</td>
                </tr>
              ) : (
                recordKeys.map(key => {
                  const record = customer.records[key];
                  const isEditing = editingKey === key;
                  
                  return (
                    <tr key={key} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 sm:py-5 px-4 sm:px-6 text-left">
                        <p className="font-bold text-slate-700 text-xs sm:text-sm">{formatMonthKey(key)}</p>
                      </td>
                      <td className="py-4 sm:py-5 px-2 sm:px-4 text-slate-500 text-[11px] sm:text-sm">৳{record.expectedBill}</td>
                      <td className="py-4 sm:py-5 px-2 sm:px-4">
                        {isEditing ? (
                          <input 
                            type="number"
                            className="w-20 sm:w-24 bg-white border-2 border-blue-500 rounded-md p-1.5 text-center font-bold text-slate-800 outline-none shadow-sm text-sm"
                            value={record.paidAmount}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              onUpdateRecord(key, { paidAmount: val, due: record.expectedBill - val });
                            }}
                            autoFocus
                          />
                        ) : (
                          <div 
                            className="cursor-pointer font-bold text-slate-800 text-base sm:text-lg hover:text-blue-600 transition-colors underline decoration-slate-200 decoration-dotted underline-offset-4"
                            onClick={() => setEditingKey(key)}
                          >
                            ৳{record.paidAmount}
                          </div>
                        )}
                      </td>
                      <td className="py-4 sm:py-5 px-2 sm:px-4">
                        <span className={`status-badge text-[9px] sm:text-[10px] ${record.due > 0 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                          ৳{record.due}
                        </span>
                      </td>
                      <td className="py-4 sm:py-5 px-4 sm:px-6 text-right">
                         {isEditing ? (
                            <button onClick={() => setEditingKey(null)} className="text-[9px] sm:text-[10px] bg-blue-600 text-white px-3 sm:px-4 py-1.5 rounded-md font-bold hover:bg-blue-700 transition-colors">সেভ</button>
                         ) : (
                           <div className="cursor-pointer group" onClick={() => setEditingKey(key)}>
                              <p className="text-[9px] font-bold text-slate-400 group-hover:text-blue-500 transition-colors">{record.paymentDate || 'তারিখ?'}</p>
                              <p className="text-[9px] font-medium text-slate-400 truncate max-w-[100px] sm:max-w-[140px] ml-auto mt-0.5 italic">{record.remarks || '-'}</p>
                           </div>
                         )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Signature Block (Print only) */}
        <div className="mt-20 px-8 sm:px-12 pb-12 hidden print:flex justify-between items-end text-[9px] text-slate-500 font-bold uppercase tracking-widest">
           <div className="text-center">
              <div className="w-24 sm:w-32 h-px bg-slate-300 mb-2 mx-auto"></div>
              <span>পরিচালকের স্বাক্ষর</span>
           </div>
           <div className="text-center opacity-30 italic text-[7px] sm:text-[9px]">
              ISP LEDGER PROFESSIONAL MANAGEMENT SYSTEM
           </div>
           <div className="text-center">
              <div className="w-24 sm:w-32 h-px bg-slate-300 mb-2 mx-auto"></div>
              <span>গ্রাহকের স্বাক্ষর</span>
           </div>
        </div>
      </div>
    </div>
  );
};
