
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const recordKeys = Object.keys(customer.records).sort((a, b) => b.localeCompare(a));

  const formatMonthKey = (key: string) => {
    const [year, month] = key.split('-');
    return `${MONTHS_BN[parseInt(month) - 1]} ${year}`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-32 animate-in">
      {/* Modern Control Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 no-print glass-card p-6 rounded-[2rem] sticky top-[110px] z-30 border-white/10 shadow-2xl">
        <button onClick={onBack} className="group flex items-center gap-3 text-indigo-400 font-black hover:text-indigo-300 transition-all px-6 py-3 bg-indigo-500/10 rounded-2xl">
          <svg className="w-6 h-6 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          তালিকায় ফিরে যান
        </button>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button onClick={onEditCustomer} className="flex-1 sm:flex-none px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-xs font-black transition-all border border-white/5">তথ্য পরিবর্তন</button>
          <button onClick={() => window.print()} className="flex-1 sm:flex-none px-8 py-3 premium-btn text-white rounded-2xl text-xs font-black shadow-2xl shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            বিবরণী প্রিন্ট
          </button>
        </div>
      </div>

      {/* Main Ledger Content */}
      <div className="glass-card p-10 md:p-20 rounded-[3rem] relative overflow-hidden border-white/5 shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-3 premium-btn opacity-80"></div>
        
        <div className="flex flex-col items-center text-center mb-24">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-glow">হিসাব বিবরণী (লেজার)</h1>
          <p className="text-slate-500 font-black uppercase tracking-[0.5em] text-[10px] opacity-60">Customer Billing Statement</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-24 border-b border-white/5 pb-16">
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">গ্রাহকের পূর্ণাঙ্গ তথ্য</p>
              <h2 className="text-4xl font-black text-white mb-2">{customer.name}</h2>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 rounded-full text-indigo-300 text-[10px] font-black uppercase tracking-widest">
                কানেকশন নাম: {customer.connectionName}
              </div>
              <p className="text-sm text-slate-500 mt-4 leading-relaxed font-bold italic">{customer.address || 'ঠিকানা দেওয়া নেই'}</p>
            </div>
          </div>
          
          <div className="space-y-6 md:text-right">
             <div className="inline-block">
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-4">যোগাযোগ ও মাসিক বিল</p>
                <p className="text-3xl font-black text-white mb-4">{customer.mobile}</p>
                <div className="bg-emerald-500/5 p-6 rounded-3xl border border-emerald-500/10 inline-flex flex-col items-end">
                   <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">নির্ধারিত মাসিক বিল</span>
                   <p className="text-5xl font-black text-emerald-400 tracking-tighter">৳{customer.monthlyBill}</p>
                </div>
             </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="flex items-center gap-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap">লেনদেনের বিস্তারিত ইতিহাস</h3>
            <div className="h-px bg-white/5 flex-1"></div>
          </div>
          
          <div className="overflow-hidden rounded-[2rem] border border-white/5 bg-white/[0.01]">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="bg-white/5 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                  <th className="py-7 px-8 text-left">বিলের মাস</th>
                  <th className="py-7 px-4">মোট বিল</th>
                  <th className="py-7 px-4">জমা (Paid)</th>
                  <th className="py-7 px-4">বকেয়া (Due)</th>
                  <th className="py-7 px-8 text-right">তারিখ ও নোট</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recordKeys.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-40 text-slate-700 font-bold italic text-lg opacity-40">এখনো কোনো লেনদেন রেকর্ড করা হয়নি</td>
                  </tr>
                ) : (
                  recordKeys.map(key => {
                    const record = customer.records[key];
                    const isEditing = editingKey === key;
                    
                    return (
                      <tr key={key} className="hover:bg-white/[0.02] transition-all group">
                        <td className="py-8 px-8 text-left">
                          <p className="font-black text-white text-lg">{formatMonthKey(key)}</p>
                          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-1">বিল ইস্যু করা হয়েছে</p>
                        </td>
                        <td className="py-8 px-4 font-bold text-slate-500">৳{record.expectedBill}</td>
                        <td className="py-8 px-4">
                          {isEditing ? (
                            <input 
                              type="number"
                              autoFocus
                              className="w-28 bg-indigo-500/20 border-2 border-indigo-500 rounded-2xl p-3 text-center font-black text-white outline-none"
                              value={record.paidAmount}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                onUpdateRecord(key, { paidAmount: val, due: record.expectedBill - val });
                              }}
                            />
                          ) : (
                            <div 
                              className="cursor-pointer font-black text-white text-xl hover:bg-white/5 px-6 py-3 rounded-2xl transition-all inline-block group-hover:scale-110"
                              onClick={() => setEditingKey(key)}
                            >
                              ৳{record.paidAmount}
                            </div>
                          )}
                        </td>
                        <td className="py-8 px-4">
                          <span className={`px-5 py-2 rounded-full font-black text-[10px] uppercase tracking-widest border transition-colors ${record.due > 0 ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                            ৳{record.due}
                          </span>
                        </td>
                        <td className="py-8 px-8 text-right">
                           {isEditing ? (
                              <div className="flex flex-col gap-3 items-end">
                                <input type="date" className="text-[10px] bg-white/5 border border-white/10 rounded-xl p-2.5 text-indigo-300 outline-none" value={record.paymentDate} onChange={(e) => onUpdateRecord(key, { paymentDate: e.target.value })} />
                                <button onClick={() => setEditingKey(null)} className="text-[10px] premium-btn text-white px-6 py-2 rounded-xl font-black shadow-xl shadow-indigo-600/20">সংরক্ষণ</button>
                              </div>
                           ) : (
                             <div className="cursor-pointer group/note" onClick={() => setEditingKey(key)}>
                                <p className="text-[10px] font-black text-slate-400 group-hover/note:text-indigo-400 transition-colors uppercase tracking-widest">{record.paymentDate || 'তারিখ নেই'}</p>
                                <p className="text-[10px] font-bold text-slate-600 italic truncate max-w-[150px] ml-auto mt-1 opacity-60">{record.remarks || 'নোট যোগ করুন'}</p>
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
        </div>

        <div className="mt-32 flex flex-col md:flex-row justify-between items-center gap-10 text-[10px] text-slate-600 font-black uppercase tracking-[0.4em] print-only border-t border-white/5 pt-16 opacity-40">
           <div className="flex flex-col items-center gap-3">
              <div className="w-24 h-px bg-slate-400 mb-2"></div>
              <span>কর্তৃপক্ষের স্বাক্ষর</span>
           </div>
           <div className="text-center">
              <span>ইস্যুড বাই: ISP লেজার প্রো ক্লাউড</span>
           </div>
           <div className="flex flex-col items-center gap-3">
              <div className="w-24 h-px bg-slate-400 mb-2"></div>
              <span>গ্রাহকের স্বাক্ষর</span>
           </div>
        </div>
      </div>
    </div>
  );
};
