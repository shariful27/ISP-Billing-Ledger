
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

  // Filter and Sort: Newly added customers ALWAYS at the top (using createdAt)
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
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500 px-1 sm:px-0">
      {/* Stats Summary Panel */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4 no-print">
        <div className="executive-card p-3 sm:p-5 border-l-4 border-blue-600 bg-white">
          <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">মোট আদায়</p>
          <h3 className="text-lg sm:text-2xl font-bold text-slate-800">৳{stats.paid.toLocaleString()}</h3>
        </div>
        <div className="executive-card p-3 sm:p-5 border-l-4 border-red-500 bg-white">
          <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">মোট বকেয়া</p>
          <h3 className="text-lg sm:text-2xl font-bold text-red-600">৳{stats.due.toLocaleString()}</h3>
        </div>
        <div className="executive-card p-3 sm:p-5 border-l-4 border-emerald-500 bg-white">
          <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">পেইড</p>
          <h3 className="text-lg sm:text-2xl font-bold text-emerald-600">{stats.paidCount} জন</h3>
        </div>
        <div className="executive-card p-3 sm:p-5 border-l-4 border-amber-500 bg-white">
          <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">আংশিক</p>
          <h3 className="text-lg sm:text-2xl font-bold text-amber-600">{stats.partialCount} জন</h3>
        </div>
        <div className="executive-card p-3 sm:p-5 border-l-4 border-slate-400 bg-white">
          <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">বকেয়া</p>
          <h3 className="text-lg sm:text-2xl font-bold text-slate-800">{stats.dueCount} জন</h3>
        </div>
      </div>

      {/* Control Bar */}
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

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            {[
              {id: 'all', label: 'সব'},
              {id: 'paid', label: 'পেইড'},
              {id: 'partial', label: 'আংশিক'},
              {id: 'due', label: 'বকেয়া'}
            ].map((s) => (
              <button 
                key={s.id}
                onClick={() => setStatusFilter(s.id as FilterStatus)}
                className={`px-3 sm:px-4 py-1.5 rounded-md text-[10px] font-bold transition-all whitespace-nowrap ${statusFilter === s.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
              >
                {s.label}
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
      <div className="executive-card overflow-hidden bg-white">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left border-collapse min-w-[750px] sm:min-w-full">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider print:bg-slate-200 print:text-slate-900">
                <th className="px-4 sm:px-6 py-4">গ্রাহকের নাম ও তথ্য</th>
                <th className="px-3 py-4 text-center">নির্ধারিত বিল</th>
                <th className="px-3 py-4 text-center">পরিশোধিত টাকা</th>
                <th className="px-3 py-4 text-center">বকেয়া টাকা</th>
                <th className="px-3 py-4 text-center">অবস্থা ও মাধ্যম</th>
                <th className="px-4 py-4 text-right no-print">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredCustomers.length === 0 ? (
                <tr><td colSpan={6} className="py-20 text-center text-slate-400 font-medium">কোনো তথ্য পাওয়া যায়নি</td></tr>
              ) : (
                filteredCustomers.map((c) => {
                  const rec = c.records[currentMonthKey];
                  const isPaid = rec && rec.due <= 0 && rec.paidAmount > 0;
                  const isPartial = rec && rec.paidAmount > 0 && rec.due > 0;
                  const paidVal = rec ? rec.paidAmount : 0;
                  const dueVal = rec ? rec.due : c.monthlyBill;
                  
                  return (
                    <tr 
                      key={c.id} 
                      onClick={() => onSelectCustomer(c.id)} 
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 sm:px-6 py-4">
                        <div className="min-w-0">
                          <p className="text-[12px] sm:text-sm font-bold text-slate-800 group-hover:text-blue-600 truncate">{c.name}</p>
                          <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium truncate uppercase tracking-tighter">ID: {c.connectionName} • {c.mobile}</p>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-center">
                        <span className="text-[12px] sm:text-sm font-bold text-slate-600">৳{c.monthlyBill}</span>
                      </td>
                      <td className="px-3 py-4 text-center">
                        <span className={`text-[13px] sm:text-[15px] font-black ${paidVal > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>
                          ৳{paidVal}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-center">
                        <span className={`text-[13px] sm:text-[15px] font-black ${dueVal > 0 ? 'text-red-500' : 'text-slate-300'}`}>
                          ৳{dueVal}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <span className={`status-badge border text-[8px] sm:text-[9px] font-black whitespace-nowrap px-2.5 py-1 ${
                            isPaid ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm shadow-emerald-100' : 
                            isPartial ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm shadow-amber-100' : 
                            'bg-red-50 text-red-600 border-red-200 shadow-sm shadow-red-100'
                          }`}>
                             {isPaid ? 'পরিশোধিত' : isPartial ? 'আংশিক জমা' : 'বকেয়া'}
                          </span>
                          
                          {/* STYLED PAYMENT METHOD LABELS */}
                          {rec?.paymentMethod && (
                            <div className="flex items-center gap-1">
                              {rec.paymentMethod === 'Cash' && (
                                <span className="flex items-center gap-1 text-[8px] sm:text-[9px] font-black text-blue-700 uppercase bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200 shadow-inner">
                                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" /><path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" /></svg>
                                  ক্যাশ
                                </span>
                              )}
                              {rec.paymentMethod === 'bKash' && (
                                <span className="flex items-center gap-1 text-[8px] sm:text-[9px] font-black text-white uppercase bg-[#e2136e] px-2 py-0.5 rounded-full shadow-sm">
                                  <span className="italic tracking-tighter">b</span>বিকাশ
                                </span>
                              )}
                              {rec.paymentMethod === 'Free' && (
                                <span className="flex items-center gap-1 text-[8px] sm:text-[9px] font-black text-indigo-700 uppercase bg-indigo-100 px-2 py-0.5 rounded-full border border-indigo-200">
                                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17C5.06 5.687 5 5.35 5 5zm4 1V5a1 1 0 10-1 1h1zm3 0a1 1 0 10-1-1v1h1z" clipRule="evenodd" /><path d="M9 11H3v5a2 2 0 002 2h4v-7zM11 18h4a2 2 0 002-2v-5h-6v7z" /></svg>
                                  ফ্রি
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 no-print text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!isPaid && (
                            <button 
                              onClick={(e) => handlePaymentInitiation(e, c)}
                              className="px-3 sm:px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold shadow-md transition-all active:scale-95"
                            >
                              বিল জমা
                            </button>
                          )}
                          <button 
                            onClick={(e) => handleDeleteClick(e, c)}
                            className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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

      {/* Payment Selection Modal */}
      {paymentSelection && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[210] flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200">
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">পেমেন্ট মাধ্যম নির্বাচন করুন</h3>
              <p className="text-slate-400 text-xs mt-1 font-medium italic">{paymentSelection.name} • ৳{paymentSelection.amount}</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <button onClick={handleCashPayment} className="flex items-center justify-center gap-3 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all active:scale-95 shadow-md">ক্যাশ পেমেন্ট</button>
              <button onClick={handleBkashSelection} className="flex items-center justify-center gap-3 py-4 bg-[#e2136e] hover:bg-[#c61060] text-white font-bold rounded-xl transition-all active:scale-95 shadow-md">বিকাশ পেমেন্ট</button>
              <button onClick={handleFreePayment} className="flex items-center justify-center gap-3 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all active:scale-95 shadow-md">ফ্রি বিল</button>
              <button onClick={() => setPaymentSelection(null)} className="w-full py-3 mt-2 bg-slate-50 border border-slate-200 text-slate-500 font-bold rounded-xl text-xs active:scale-95">ফিরে যান</button>
            </div>
          </div>
        </div>
      )}

      {/* Modals logic remains */}
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl border">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h3 className="text-base font-bold text-slate-800">মুছে ফেলবেন?</h3>
              <p className="text-slate-500 text-[11px] mt-2 mb-6">"{customerToDelete.name}" এর সকল ডাটা মুছে যাবে।</p>
              <div className="flex gap-2 w-full">
                <button onClick={() => setCustomerToDelete(null)} className="flex-1 py-2 bg-slate-100 rounded-lg font-bold text-xs transition-all active:scale-95">না</button>
                <button onClick={() => { onDeleteCustomer(customerToDelete.id); setCustomerToDelete(null); }} className="flex-1 py-2 bg-red-600 text-white rounded-lg font-bold text-xs transition-all active:scale-95 shadow-md">হ্যাঁ</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
