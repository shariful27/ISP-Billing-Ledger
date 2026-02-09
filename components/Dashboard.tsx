
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

type FilterStatus = 'all' | 'paid' | 'partial' | 'due';

export const Dashboard: React.FC<DashboardProps> = ({ customers, onSelectCustomer, onAddCustomer, onQuickPay, onDeleteCustomer }) => {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  
  const [paymentSelection, setPaymentSelection] = useState<{ id: string, name: string, amount: number } | null>(null);
  const [bkashData, setBkashData] = useState<{ id: string, name: string, amount: number, monthKey: string } | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const currentMonthKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;

  const sortedAndFiltered = [...customers]
    .filter(c => {
      const connDate = new Date(c.connectionDate);
      return (connDate.getFullYear() < selectedYear) || 
             (connDate.getFullYear() === selectedYear && connDate.getMonth() <= selectedMonth);
    })
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  const filteredCustomers = sortedAndFiltered.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (c.connectionName && c.connectionName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (c.mobile && c.mobile.includes(searchTerm));
    
    const rec = c.records[currentMonthKey];
    const isPaid = rec && rec.due <= 0 && rec.paidAmount > 0;
    const isPartial = rec && rec.paidAmount > 0 && rec.due > 0;
    const isDue = !rec || (rec.paidAmount === 0);

    if (statusFilter === 'paid') return matchesSearch && isPaid;
    if (statusFilter === 'partial') return matchesSearch && isPartial;
    if (statusFilter === 'due') return matchesSearch && isDue;
    return matchesSearch;
  });

  const stats = filteredCustomers.reduce((acc, c) => {
    const rec = c.records[currentMonthKey];
    if (rec) {
      acc.paid += rec.paidAmount;
      acc.due += rec.due;
      if (rec.due <= 0 && rec.paidAmount > 0) acc.paidCount++;
      else if (rec.paidAmount > 0 && rec.due > 0) acc.partialCount++;
      else acc.dueCount++;
    } else {
      acc.due += c.monthlyBill;
      acc.dueCount++;
    }
    return acc;
  }, { paid: 0, due: 0, paidCount: 0, partialCount: 0, dueCount: 0 });

  const handlePaymentInitiation = (e: React.MouseEvent, c: Customer) => {
    e.stopPropagation(); 
    setPaymentSelection({ id: c.id, name: c.name, amount: c.monthlyBill });
  };

  const handleCashPayment = () => {
    if (paymentSelection) {
      onQuickPay(paymentSelection.id, currentMonthKey, 'Cash');
      setPaymentSelection(null);
    }
  };

  const handleFreePayment = () => {
    if (paymentSelection) {
      onQuickPay(paymentSelection.id, currentMonthKey, 'Free');
      setPaymentSelection(null);
    }
  };

  const handleBkashSelection = () => {
    if (paymentSelection) {
      setBkashData({ 
        id: paymentSelection.id, 
        name: paymentSelection.name, 
        amount: paymentSelection.amount, 
        monthKey: currentMonthKey 
      });
      setPaymentSelection(null);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, c: Customer) => {
    e.stopPropagation(); 
    setCustomerToDelete(c);
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto px-1 sm:px-4 py-2 sm:py-4">
      
      {/* 1. Summary Cards - Grid Adjusted for Mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4 no-print">
        <div className="grid grid-cols-1 gap-3 sm:gap-4">
          <div className="bg-white border border-slate-200 border-l-[6px] border-l-blue-600 rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 shadow-sm">
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 sm:mb-2">মোট আদায়</p>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">৳{stats.paid.toLocaleString()}</h3>
          </div>
          <div className="bg-white border border-slate-200 border-l-[6px] border-l-emerald-500 rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 shadow-sm">
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 sm:mb-2">পূর্ণ পরিশোধ</p>
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">{stats.paidCount} জন</h3>
          </div>
          <div className="bg-white border border-slate-200 border-l-[6px] border-l-slate-400 rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 shadow-sm">
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 sm:mb-2">বকেয়া গ্রাহক</p>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">{stats.dueCount} জন</h3>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:gap-4">
          <div className="bg-white border border-slate-200 border-l-[6px] border-l-red-500 rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 shadow-sm">
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 sm:mb-2">মোট বকেয়া</p>
            <h3 className="text-2xl sm:text-3xl font-black text-red-600 tracking-tight">৳{stats.due.toLocaleString()}</h3>
          </div>
          <div className="bg-white border border-slate-200 border-l-[6px] border-l-amber-500 rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 shadow-sm">
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 sm:mb-2">আংশিক জমা</p>
            <h3 className="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight">{stats.partialCount} জন</h3>
          </div>
        </div>
      </div>

      {/* 2. Control Bar - Optimized for Vertical Stacking on Mobile */}
      <div className="no-print bg-white p-3 rounded-2xl border border-slate-200 flex flex-col gap-3 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 flex-1 justify-between sm:justify-start">
            <select className="flex-1 sm:flex-none bg-transparent border-none text-[11px] sm:text-xs font-bold text-slate-700 outline-none px-3 py-2 cursor-pointer" value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
              {MONTHS_BN.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <div className="w-px h-4 bg-slate-300"></div>
            <select className="flex-1 sm:flex-none bg-transparent border-none text-[11px] sm:text-xs font-bold text-slate-700 outline-none px-3 py-2 cursor-pointer" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="relative flex-1 sm:max-w-md">
            <input 
              type="text" 
              placeholder="নাম বা মোবাইল দিয়ে খুঁজুন..." 
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200 w-full sm:w-auto">
            {['all', 'paid', 'partial', 'due'].map((s) => (
              <button 
                key={s}
                onClick={() => setStatusFilter(s as FilterStatus)}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-[9px] sm:text-[10px] font-black transition-all whitespace-nowrap ${statusFilter === s ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {s === 'all' ? 'সব' : s === 'paid' ? 'পেইড' : s === 'partial' ? 'আংশিক' : 'বকেয়া'}
              </button>
            ))}
          </div>
          <div className="flex gap-2 w-full sm:w-auto mt-1 sm:mt-0">
            <button onClick={() => window.print()} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-bold text-xs text-slate-700 hover:bg-slate-50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              প্রিন্ট
            </button>
            <button onClick={onAddCustomer} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-xs hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95 whitespace-nowrap">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
              নতুন
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Report Table - Reduced padding and mobile font sizes */}
      <div className="bg-white rounded-[20px] sm:rounded-[24px] border border-slate-200 overflow-hidden shadow-xl">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left border-collapse min-w-[800px] sm:min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                <th className="px-4 sm:px-6 py-4 sm:py-5">গ্রাহকের নাম ও আইডি</th>
                <th className="px-3 py-4 sm:py-5 text-center">নির্ধারিত</th>
                <th className="px-3 py-4 sm:py-5 text-center">পরিশোধিত</th>
                <th className="px-3 py-4 sm:py-5 text-center">বকেয়া</th>
                <th className="px-3 py-4 sm:py-5 text-center">স্ট্যাটাস</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5 text-right no-print">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr><td colSpan={6} className="py-16 sm:py-24 text-center text-slate-400 font-bold italic">তালিকা খালি</td></tr>
              ) : (
                filteredCustomers.map((c) => {
                  const rec = c.records[currentMonthKey];
                  const isPaid = rec && rec.due <= 0 && rec.paidAmount > 0;
                  const isPartial = rec && rec.paidAmount > 0 && rec.due > 0;
                  const paidVal = rec ? rec.paidAmount : 0;
                  const dueVal = rec ? rec.due : c.monthlyBill;
                  
                  return (
                    <tr key={c.id} onClick={() => onSelectCustomer(c.id)} className="hover:bg-slate-50/50 cursor-pointer group transition-colors">
                      <td className="px-4 sm:px-6 py-4 sm:py-5">
                        <p className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">{c.name}</p>
                        <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">ID: {c.connectionName}  •  {c.mobile}</p>
                      </td>
                      <td className="px-3 py-4 sm:py-5 text-center">
                        <span className="text-[11px] sm:text-sm font-bold text-slate-700 tracking-tight">৳{c.monthlyBill}</span>
                      </td>
                      <td className="px-3 py-4 sm:py-5 text-center">
                        <span className={`text-sm sm:text-base font-black ${paidVal > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>
                          ৳{paidVal}
                        </span>
                      </td>
                      <td className="px-3 py-4 sm:py-5 text-center">
                        <span className={`text-sm sm:text-base font-black ${dueVal > 0 ? 'text-red-500' : 'text-slate-200'}`}>
                          ৳{dueVal}
                        </span>
                      </td>
                      <td className="px-3 py-4 sm:py-5 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <span className={`text-[8px] sm:text-[9px] font-black px-2 sm:px-3 py-0.5 sm:py-1 rounded-md border shadow-sm ${
                            isPaid ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                            isPartial ? 'bg-amber-50 text-amber-700 border-amber-100' : 
                            'bg-red-50 text-red-600 border-red-100'
                          }`}>
                             {isPaid ? 'পরিশোধিত' : isPartial ? 'আংশিক জমা' : 'বকেয়া'}
                          </span>
                          
                          {rec?.paymentMethod && (
                            <div className="flex items-center gap-1">
                              {rec.paymentMethod === 'Cash' && (
                                <span className="flex items-center gap-1 text-[7px] sm:text-[8px] font-black text-blue-700 uppercase bg-blue-100 px-1.5 sm:px-2.5 py-0.5 rounded border border-blue-200 shadow-sm">
                                  ক্যাশ
                                </span>
                              )}
                              {rec.paymentMethod === 'bKash' && (
                                <span className="flex items-center gap-1 text-[7px] sm:text-[8px] font-black text-white uppercase bg-[#e2136e] px-1.5 sm:px-2.5 py-0.5 rounded shadow-md border border-[#c61060]">
                                  বিকাশ
                                </span>
                              )}
                              {rec.paymentMethod === 'Free' && (
                                <span className="flex items-center gap-1 text-[7px] sm:text-[8px] font-black text-indigo-700 uppercase bg-indigo-100 px-1.5 sm:px-2.5 py-0.5 rounded border border-indigo-200">
                                  ফ্রি
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 sm:py-5 text-right no-print">
                        <div className="flex items-center justify-end gap-2 sm:gap-3">
                          {!isPaid && (
                            <button onClick={(e) => handlePaymentInitiation(e, c)} className="px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] sm:text-[10px] font-black shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5 active:scale-95">জমা দিন</button>
                          )}
                          <button onClick={(e) => handleDeleteClick(e, c)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
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

      {/* Payment Selection Modal - Full-width padding on mobile */}
      {paymentSelection && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[210] flex items-center justify-center p-3 sm:p-4 no-print animate-in fade-in duration-300">
          <div className="bg-white rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-100 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
            <div className="text-center mb-6 sm:mb-8 mt-2">
              <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">বিল পরিশোধ</h3>
              <p className="text-slate-400 text-[10px] sm:text-xs mt-1 font-bold italic">{paymentSelection.name}  •  ৳{paymentSelection.amount}</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <button onClick={handleCashPayment} className="py-3.5 sm:py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl sm:rounded-2xl transition-all shadow-lg shadow-emerald-100 active:scale-95 flex items-center justify-center gap-3 text-xs sm:text-sm">
                 নগদ পেমেন্ট (Cash)
              </button>
              <button onClick={handleBkashSelection} className="py-3.5 sm:py-4 bg-[#e2136e] hover:bg-[#c61060] text-white font-black rounded-xl sm:rounded-2xl transition-all shadow-lg shadow-pink-100 active:scale-95 flex items-center justify-center gap-3 text-xs sm:text-sm">
                 বিকাশ পেমেন্ট (bKash)
              </button>
              <button onClick={handleFreePayment} className="py-3.5 sm:py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl sm:rounded-2xl transition-all shadow-lg shadow-indigo-100 active:scale-95 flex items-center justify-center gap-3 text-xs sm:text-sm">
                 ফ্রি বিল (Free)
              </button>
              <button onClick={() => setPaymentSelection(null)} className="w-full py-3 sm:py-4 mt-2 text-slate-400 font-black uppercase tracking-widest text-[9px] sm:text-[10px] hover:text-slate-600">ফিরে যান</button>
            </div>
          </div>
        </div>
      )}

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

      {customerToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[220] flex items-center justify-center p-4 no-print animate-in zoom-in duration-200">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 sm:w-16 h-12 sm:h-16 bg-red-100 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 text-red-600 animate-pulse">
                <svg className="w-6 sm:w-8 h-6 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight">মুছে ফেলবেন?</h3>
              <p className="text-slate-500 text-[10px] sm:text-xs mt-2 mb-6 sm:mb-8 font-medium italic">"{customerToDelete.name}" এর সকল তথ্য চিরতরে মুছে যাবে।</p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setCustomerToDelete(null)} className="flex-1 py-3 bg-slate-100 rounded-xl font-black text-[10px] sm:text-xs text-slate-500 uppercase tracking-widest">না</button>
                <button onClick={() => { onDeleteCustomer(customerToDelete.id); setCustomerToDelete(null); }} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-black text-[10px] sm:text-xs transition-all shadow-lg shadow-red-100 uppercase tracking-widest">মুছুন</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};