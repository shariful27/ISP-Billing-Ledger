
import React, { useState } from 'react';
import { Customer, MONTHS_BN } from '../types.ts';
import { BkashModal } from './BkashModal.tsx';

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
    <div className="space-y-12 animate-in">
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
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[110] flex items-center justify-center p-4 no-print">
          <div className="glass-card rounded-[2rem] p-8 max-w-sm w-full border border-white/10 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 text-red-500">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">গ্রাহক রিমুভ নিশ্চিত করুন</h3>
              <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                আপনি কি নিশ্চিত যে <span className="font-bold text-white">"{customerToDelete.name}"</span> এর সকল রেকর্ড স্থায়ীভাবে মুছে ফেলতে চান?
              </p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setCustomerToDelete(null)} className="flex-1 py-3 px-4 bg-white/5 font-bold rounded-xl text-slate-300 hover:bg-white/10 transition-colors">বাতিল</button>
                <button 
                  onClick={() => {
                    onDeleteCustomer(customerToDelete.id);
                    setCustomerToDelete(null);
                  }} 
                  className="flex-1 py-3 px-4 bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-600/20 hover:bg-red-500 transition-all"
                >
                  মুছে ফেলুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 no-print">
        <div className="glass-card p-6 rounded-3xl border-l-4 border-indigo-500 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">মোট আদায়কৃত</p>
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-bold text-indigo-400">৳</span>
            <p className="text-3xl font-black text-white tracking-tight">{stats.paid.toLocaleString()}</p>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 font-medium">{MONTHS_BN[selectedMonth]} মাসের রিপোর্ট</p>
        </div>

        <div className="glass-card p-6 rounded-3xl border-l-4 border-rose-500 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">মোট বকেয়া</p>
            <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-bold text-rose-400">৳</span>
            <p className="text-3xl font-black text-white tracking-tight">{stats.due.toLocaleString()}</p>
          </div>
          <p className="text-[10px] text-rose-400/80 mt-2 font-bold animate-pulse">দ্রুত আদায় প্রয়োজন</p>
        </div>

        <div className="glass-card p-6 rounded-3xl border-l-4 border-emerald-500 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">পরিশোধকারী গ্রাহক</p>
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-black text-white tracking-tight">{stats.paidCount}</p>
            <span className="text-xs font-bold text-slate-500">জন</span>
          </div>
          <div className="mt-4 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${(stats.paidCount / (stats.paidCount + stats.dueCount || 1)) * 100}%` }}></div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl border-l-4 border-slate-500 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">বকেয়া গ্রাহক</p>
            <div className="p-2 bg-slate-500/10 rounded-lg text-slate-400">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" /></svg>
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-black text-white tracking-tight">{stats.dueCount}</p>
            <span className="text-xs font-bold text-slate-500">জন</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 font-medium">মোট গ্রাহক: {stats.paidCount + stats.dueCount}</p>
        </div>
      </div>

      {/* Tool Bar & Search */}
      <div className="glass-card p-5 rounded-[1.5rem] no-print flex flex-col lg:flex-row gap-5 items-center justify-between shadow-lg">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center bg-slate-900/50 p-1 rounded-xl border border-white/5">
            <select className="bg-transparent px-4 py-2 text-xs font-bold text-indigo-400 outline-none cursor-pointer" value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
              {MONTHS_BN.map((m, i) => <option key={i} value={i} className="bg-slate-900">{m}</option>)}
            </select>
            <div className="w-px h-4 bg-white/10 mx-1"></div>
            <select className="bg-transparent px-4 py-2 text-xs font-bold text-slate-400 outline-none cursor-pointer" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y} className="bg-slate-900">{y}</option>)}
            </select>
          </div>

          <div className="relative flex-1 lg:flex-none">
            <input 
              type="text" 
              placeholder="সার্চ করুন..." 
              className="pl-10 pr-4 py-2.5 bg-slate-900/50 border border-white/5 rounded-xl focus:ring-2 focus:ring-indigo-500/20 w-full lg:w-64 outline-none text-xs font-medium text-white transition-all placeholder:text-slate-600"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <svg className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/5 flex-1 lg:flex-none">
            {['all', 'paid', 'due'].map((s) => (
              <button 
                key={s}
                onClick={() => setStatusFilter(s as FilterStatus)}
                className={`flex-1 lg:flex-none px-5 py-2 rounded-lg text-[11px] font-bold transition-all ${statusFilter === s ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {s === 'all' ? 'সব' : s === 'paid' ? 'পেইড' : 'বকেয়া'}
              </button>
            ))}
          </div>
          <button onClick={onAddCustomer} className="premium-btn text-white px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
            নতুন কাস্টমার
          </button>
        </div>
      </div>

      {/* Customer List Container */}
      <div className="space-y-3">
        {/* Table Header */}
        <div className="px-6 hidden md:flex items-center text-[11px] font-bold text-slate-500 uppercase tracking-widest no-print">
          <span className="flex-1">গ্রাহকের প্রোফাইল ও বিবরণ</span>
          <span className="w-32 text-center">মাসিক বিল</span>
          <span className="w-32 text-center">পেমেন্ট স্ট্যাটাস</span>
          <span className="w-40 text-right">ম্যানেজমেন্ট</span>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="glass-card p-20 rounded-3xl text-center border-dashed border-white/10">
            <p className="text-slate-500 font-bold">কোনো রেকর্ড পাওয়া যায়নি</p>
          </div>
        ) : (
          filteredCustomers.map((c) => {
            const rec = c.records[currentMonthKey];
            const isPaid = rec && rec.due <= 0 && rec.paidAmount > 0;
            
            return (
              <div 
                key={c.id} 
                onClick={() => onSelectCustomer(c.id)}
                className="glass-card px-6 py-4 rounded-2xl flex flex-col md:flex-row items-center gap-4 cursor-pointer relative group overflow-hidden border-white/5"
              >
                <div className="flex-1 flex items-center gap-4 w-full">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg transition-transform group-hover:scale-105 ${isPaid ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    {c.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors truncate">{c.name}</h4>
                    <p className="text-[10px] text-slate-500 font-medium truncate">{c.connectionName} • {c.mobile}</p>
                  </div>
                </div>

                <div className="w-full md:w-32 flex flex-col items-start md:items-center">
                  <span className="text-[9px] font-bold text-slate-600 md:hidden">বিল</span>
                  <p className="text-base font-bold text-slate-200 tracking-tight">৳{c.monthlyBill}</p>
                </div>

                <div className="w-full md:w-32 flex justify-center">
                   <div className={`px-4 py-1.5 rounded-lg text-[10px] font-bold tracking-wide border ${isPaid ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/5 text-rose-400 border-rose-500/20'}`}>
                      {isPaid ? 'সম্পূর্ণ পরিশোধ' : 'বকেয়া আছে'}
                   </div>
                </div>

                <div className="w-full md:w-40 flex items-center justify-end gap-2 sm:opacity-0 group-hover:opacity-100 transition-all">
                  {!isPaid && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setBkashData({ id: c.id, name: c.name, amount: c.monthlyBill, monthKey: currentMonthKey }); }}
                      className="h-9 px-4 bg-[#D12053] hover:bg-[#b01a45] text-white rounded-lg flex items-center gap-1.5 shadow-md shadow-pink-900/20 transition-all text-[10px] font-black italic"
                    >
                      বিকাশ
                    </button>
                  )}
                  <button 
                    onClick={(e) => { e.stopPropagation(); setCustomerToDelete(c); }}
                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    title="মুছে ফেলুন"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                  <button className="p-2 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all" title="বিস্তারিত">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
