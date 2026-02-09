
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
  
  const [paymentSelection, setPaymentSelection] = useState<{ id: string, name: string, amount: number } | null>(null);
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
                         (c.connectionName && c.connectionName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (c.mobile && c.mobile.includes(searchTerm));
    
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
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500 px-1 sm:px-0">
      {/* Payment Selection Modal */}
      {paymentSelection && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[210] flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-200">
            <div className="text-center mb-6 sm:mb-8">
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">পেমেন্ট মাধ্যম নির্বাচন করুন</h3>
              <p className="text-slate-400 text-xs mt-1 font-medium italic">{paymentSelection.name} • ৳{paymentSelection.amount}</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={handleCashPayment}
                className="flex items-center justify-center gap-3 py-3.5 sm:py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md active:scale-95"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                ক্যাশ পেমেন্ট
              </button>
              
              <button 
                onClick={handleBkashSelection}
                className="flex items-center justify-center gap-3 py-3.5 sm:py-4 bg-[#e2136e] hover:bg-[#c61060] text-white font-bold rounded-xl transition-all shadow-md active:scale-95"
              >
                <div className="bg-white px-2 py-0.5 rounded text-[10px] text-[#e2136e] font-black italic tracking-tighter">bKash</div>
                বিকাশ পেমেন্ট
              </button>

              <button 
                onClick={handleFreePayment}
                className="flex items-center justify-center gap-3 py-3 sm:py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md active:scale-95"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>
                ফ্রি বিল
              </button>
              
              <div className="pt-2 sm:pt-3">
                <button 
                  onClick={() => setPaymentSelection(null)}
                  className="w-full py-3 bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700 font-bold rounded-xl transition-all active:scale-95 text-xs flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                  ফিরে যান
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* bKash Modal */}
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

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 no-print">
        <div className="executive-card p-3 sm:p-5 border-l-4 border-blue-600 bg-white">
          <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">মোট আদায়</p>
          <h3 className="text-lg sm:text-2xl font-bold text-slate-800">৳{stats.paid.toLocaleString()}</h3>
        </div>
        <div className="executive-card p-3 sm:p-5 border-l-4 border-red-500 bg-white">
          <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">মোট বকেয়া</p>
          <h3 className="text-lg sm:text-2xl font-bold text-red-600">৳{stats.due.toLocaleString()}</h3>
        </div>
        <div className="executive-card p-3 sm:p-5 border-l-4 border-emerald-500 bg-white">
          <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">আদায় হয়েছে</p>
          <h3 className="text-lg sm:text-2xl font-bold text-slate-800">{stats.paidCount} জন</h3>
        </div>
        <div className="executive-card p-3 sm:p-5 border-l-4 border-slate-400 bg-white">
          <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">বকেয়া গ্রাহক</p>
          <h3 className="text-lg sm:text-2xl font-bold text-slate-800">{stats.dueCount} জন</h3>
        </div>
      </div>

      {/* Control & Filter Bar */}
      <div className="executive-card p-3 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 no-print shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 w-full sm:w-auto">
            <select className="flex-1 sm:flex-none bg-transparent py-1.5 px-2 sm:px-3 text-[10px] sm:text-xs font-bold text-slate-600 outline-none" value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
              {MONTHS_BN.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select className="flex-1 sm:flex-none bg-transparent py-1.5 px-2 sm:px-3 text-[10px] sm:text-xs font-bold text-slate-600 outline-none" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="relative w-full sm:w-44">
             <input 
              type="text" 
              placeholder="নাম বা মোবাইল..." 
              className="pl-8 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium w-full focus:ring-2 focus:ring-blue-100 outline-none"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto sm:overflow-visible pb-1 sm:pb-0">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 flex-shrink-0">
            {['all', 'paid', 'due'].map((s) => (
              <button 
                key={s}
                onClick={() => setStatusFilter(s as FilterStatus)}
                className={`px-3 sm:px-4 py-1.5 rounded-md text-[10px] font-bold transition-all whitespace-nowrap ${statusFilter === s ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
              >
                {s === 'all' ? 'সব' : s === 'paid' ? 'পেইড' : 'বকেয়া'}
              </button>
            ))}
          </div>
          <button onClick={() => window.print()} className="flex-shrink-0 bg-white border border-slate-300 text-slate-700 px-3 sm:px-4 py-2 rounded-lg font-bold text-[10px] sm:text-xs flex items-center gap-2 hover:bg-slate-50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            প্রিন্ট
          </button>
          <button onClick={onAddCustomer} className="flex-shrink-0 bg-blue-600 text-white px-4 sm:px-5 py-2 rounded-lg font-bold text-[10px] sm:text-xs flex items-center gap-2 hover:bg-blue-700 shadow-md whitespace-nowrap">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
            নতুন
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="executive-card overflow-hidden">
        <div className="hidden print:block text-center py-6 border-b">
          <h1 className="text-2xl font-bold uppercase tracking-widest text-slate-800">গ্রাহক বিল রিপোর্ট</h1>
          <p className="text-sm text-slate-500 mt-1">{MONTHS_BN[selectedMonth]} {selectedYear} • তারিখ: {new Date().toLocaleDateString('bn-BD')}</p>
          <div className="flex justify-center gap-8 mt-4">
             <div className="text-xs"><b>মোট গ্রাহক:</b> {filteredCustomers.length} জন</div>
             <div className="text-xs"><b>মোট আদায়:</b> ৳{stats.paid}</div>
             <div className="text-xs"><b>মোট বকেয়া:</b> ৳{stats.due}</div>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left border-collapse min-w-[500px] sm:min-w-full">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-[9px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-4 sm:px-6 py-3 sm:py-4">গ্রাহকের প্রোফাইল</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-center">মাসিক বিল</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-center">অবস্থা</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-right no-print">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredCustomers.length === 0 ? (
                <tr><td colSpan={4} className="py-20 text-center text-slate-400 font-medium">কোনো তথ্য পাওয়া যায়নি</td></tr>
              ) : (
                filteredCustomers.map((c) => {
                  const rec = c.records[currentMonthKey];
                  const isPaid = rec && rec.due <= 0 && rec.paidAmount > 0;
                  
                  return (
                    <tr 
                      key={c.id} 
                      onClick={() => onSelectCustomer(c.id)} 
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-md flex items-center justify-center font-bold text-xs sm:text-base ${isPaid ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                            {c.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] sm:text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">{c.name}</p>
                            <p className="text-[9px] sm:text-[10px] text-slate-500 truncate">{c.mobile}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                        <span className="text-[11px] sm:text-sm font-bold text-slate-700">৳{c.monthlyBill}</span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                        <span className={`status-badge border text-[9px] sm:text-[10px] whitespace-nowrap ${isPaid ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                           {isPaid ? 'পেইড' : 'বকেয়া'}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 no-print text-right">
                        <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                          {!isPaid && (
                            <button 
                              onClick={(e) => handlePaymentInitiation(e, c)}
                              className="px-3 sm:px-5 py-1.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] sm:text-[10px] font-bold shadow-sm transition-all whitespace-nowrap"
                            >
                              বিল
                            </button>
                          )}
                          <button 
                            onClick={(e) => handleDeleteClick(e, c)}
                            className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                            title="মুছে ফেলুন"
                          >
                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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

      {/* Delete Confirmation Modal */}
      {customerToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800">মুছে ফেলবেন?</h3>
              <p className="text-slate-500 text-[11px] sm:text-sm mt-2 mb-6">"{customerToDelete.name}" এর সকল ডাটা মুছে যাবে।</p>
              <div className="flex gap-2 w-full">
                <button onClick={() => setCustomerToDelete(null)} className="flex-1 py-2 bg-slate-100 rounded-lg font-bold text-xs sm:text-sm transition-all active:scale-95">না</button>
                <button onClick={() => { onDeleteCustomer(customerToDelete.id); setCustomerToDelete(null); }} className="flex-1 py-2 bg-red-600 text-white rounded-lg font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95">হ্যাঁ</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
