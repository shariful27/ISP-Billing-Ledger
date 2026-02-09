
import React, { useState } from 'react';
import { Customer, MONTHS_BN } from '../types';
import { BkashModal } from './BkashModal';

interface DashboardProps {
  customers: Customer[];
  onSelectCustomer: (id: string) => void;
  onAddCustomer: () => void;
  onQuickPay: (customerId: string, monthKey: string, method?: string, trxId?: string) => void;
  onDeleteCustomer: (id: string) => void;
}

type FilterStatus = 'all' | 'paid' | 'due';

export const Dashboard: React.FC<DashboardProps> = ({ customers, onSelectCustomer, onAddCustomer, onQuickPay, onDeleteCustomer }) => {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  
  const [confirmPayData, setConfirmPayData] = useState<{ id: string, name: string, amount: number, monthKey: string } | null>(null);
  const [bkashData, setBkashData] = useState<{ id: string, name: string, amount: number, monthKey: string } | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const currentMonthKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;

  const eligibleCustomers = customers.filter(c => {
    const connDate = new Date(c.connectionDate);
    return (connDate.getFullYear() < selectedYear) || 
           (connDate.getFullYear() === selectedYear && connDate.getMonth() <= selectedMonth);
  });

  const filteredCustomers = eligibleCustomers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (c.connectionName && c.connectionName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const rec = c.records[currentMonthKey];
    const isPaid = rec && rec.due <= 0 && rec.paidAmount > 0;

    if (statusFilter === 'paid') return matchesSearch && isPaid;
    if (statusFilter === 'due') return matchesSearch && !isPaid;
    return matchesSearch;
  });

  const stats = filteredCustomers.reduce((acc, c) => {
    const rec = c.records[currentMonthKey];
    if (rec) {
      acc.paid += rec.paidAmount;
      acc.due += rec.due;
      if (rec.due <= 0 && rec.paidAmount > 0) acc.paidCount++;
      else acc.dueCount++;
    } else {
      acc.due += c.monthlyBill;
      acc.dueCount++;
    }
    return acc;
  }, { paid: 0, due: 0, paidCount: 0, dueCount: 0 });

  return (
    <div className="space-y-6">
      <BkashModal 
        isOpen={!!bkashData} 
        onClose={() => setBkashData(null)} 
        customerName={bkashData?.name || ''}
        amount={bkashData?.amount || 0}
        onConfirm={(trxId) => {
          if (bkashData) {
            onQuickPay(bkashData.id, bkashData.monthKey, 'bKash', trxId);
          }
        }}
      />

      {/* Delete Confirmation Modal */}
      {customerToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-4 text-rose-600 font-bold text-2xl">!</div>
              <h3 className="text-xl font-black text-slate-800 mb-2">গ্রাহক রিমুভ করুন</h3>
              <p className="text-slate-500 text-sm mb-6">
                আপনি কি নিশ্চিত যে আপনি <span className="font-bold text-rose-600">"{customerToDelete.name}"</span> কে তালিকা থেকে রিমুভ করতে চান?
              </p>
              <div className="flex gap-4 w-full">
                <button onClick={() => setCustomerToDelete(null)} className="flex-1 py-3 px-4 bg-slate-100 font-bold rounded-2xl">না, থাক</button>
                <button 
                  onClick={() => {
                    onDeleteCustomer(customerToDelete.id);
                    setCustomerToDelete(null);
                  }} 
                  className="flex-1 py-3 px-4 bg-rose-500 text-white font-bold rounded-2xl shadow-lg shadow-rose-200"
                >
                  হ্যাঁ, রিমুভ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmPayData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full border border-slate-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 text-emerald-600 font-bold text-2xl">✓</div>
              <h3 className="text-xl font-black text-slate-800 mb-2">ক্যাশ পেমেন্ট</h3>
              <p className="text-slate-500 text-sm mb-6">
                "{confirmPayData.name}" এর <span className="font-bold text-indigo-600">৳{confirmPayData.amount}</span> জমা নিশ্চিত করুন।
              </p>
              <div className="flex gap-4 w-full">
                <button onClick={() => setConfirmPayData(null)} className="flex-1 py-3 px-4 bg-slate-100 font-bold rounded-2xl">না</button>
                <button 
                  onClick={() => {
                    onQuickPay(confirmPayData.id, confirmPayData.monthKey, 'Cash');
                    setConfirmPayData(null);
                  }} 
                  className="flex-1 py-3 px-4 bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200"
                >
                  হ্যাঁ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col lg:flex-row gap-4 justify-between items-center no-print">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 p-2 rounded-xl">
             <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">বিলিং ড্যাশবোর্ড</h2>
            <div className="flex gap-2 mt-1">
              <select 
                className="text-[10px] font-black uppercase bg-slate-50 border-none rounded px-1.5 py-0.5 outline-none cursor-pointer hover:bg-slate-100"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
              >
                {MONTHS_BN.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
              <select 
                className="text-[10px] font-black uppercase bg-slate-50 border-none rounded px-1.5 py-0.5 outline-none cursor-pointer hover:bg-slate-100"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative flex-1">
            <input 
              type="text"
              placeholder="নাম বা কানেকশন নাম দিয়ে খুঁজুন..."
              className="pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 w-full outline-none text-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
          <button 
            onClick={onAddCustomer}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            নতুন গ্রাহক
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 no-print">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{MONTHS_BN[selectedMonth]}-এ আদায়</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">৳{stats.paid.toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{MONTHS_BN[selectedMonth]}-এ বকেয়া</p>
          <p className="text-2xl font-black text-rose-600 mt-1">৳{stats.due.toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">পরিশোধ করেছেন</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{stats.paidCount} জন</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">বাকি আছেন</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{stats.dueCount} জন</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden no-print">
        <div className="px-6 py-5 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <h3 className="font-black text-slate-700 tracking-tight">{MONTHS_BN[selectedMonth]} {selectedYear}-এর বিলিং লিস্ট</h3>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              onClick={() => window.print()}
              className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-slate-900 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              লিস্ট প্রিন্ট
            </button>

            <div className="flex bg-slate-200 p-1 rounded-xl flex-1 md:flex-none">
              <button 
                onClick={() => setStatusFilter('all')}
                className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                সব
              </button>
              <button 
                onClick={() => setStatusFilter('paid')}
                className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === 'paid' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                পরিশোধিত
              </button>
              <button 
                onClick={() => setStatusFilter('due')}
                className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === 'due' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                বকেয়া
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4">গ্রাহক তথ্য</th>
                <th className="px-6 py-4">বিলের পরিমাণ</th>
                <th className="px-6 py-4">অবস্থা</th>
                <th className="px-6 py-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-slate-400 italic">কোনো গ্রাহক পাওয়া যায়নি...</td>
                </tr>
              ) : (
                filteredCustomers.map(c => {
                  const rec = c.records[currentMonthKey];
                  const isPaid = rec && rec.due <= 0 && rec.paidAmount > 0;
                  
                  return (
                    <tr key={c.id} className="hover:bg-indigo-50/20 transition-colors group cursor-pointer" onClick={() => onSelectCustomer(c.id)}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-500'}`}>
                            {c.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{c.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold">{c.connectionName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-black text-slate-700">৳{c.monthlyBill}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {isPaid ? 'পরিশোধিত' : 'বকেয়া'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 items-center">
                          {!isPaid && (
                            <>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setBkashData({
                                    id: c.id,
                                    name: c.name,
                                    amount: c.monthlyBill,
                                    monthKey: currentMonthKey
                                  });
                                }}
                                className="px-3 h-10 bg-[#D12053] text-white rounded-xl flex items-center justify-center shadow-sm hover:scale-105 transition-transform"
                                title="বিকাশ পেমেন্ট"
                              >
                                <span className="text-[10px] font-black italic">বিকাশ</span>
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmPayData({
                                    id: c.id,
                                    name: c.name,
                                    amount: c.monthlyBill,
                                    monthKey: currentMonthKey
                                  });
                                }}
                                className="bg-emerald-500 text-white px-3 py-1.5 h-10 rounded-xl text-xs font-bold hover:bg-emerald-600 shadow-sm"
                              >
                                ক্যাশ
                              </button>
                            </>
                          )}
                          {isPaid && (
                            <button className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-slate-200">
                              বিস্তারিত
                            </button>
                          )}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setCustomerToDelete(c);
                            }}
                            className="p-2 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="রিমুভ করুন"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
