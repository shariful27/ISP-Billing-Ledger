
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

  // Filter and Sort: Latest entries always at the top
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
      {/* Detailed Stats Panel */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4 no-print">
        <div className="executive-card p-4 sm:p-5 border-l-4 border-blue-600 bg-white shadow-sm">
          <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">মোট আদায়</p>
          <h3 className="text-xl sm:text-2xl font-black text-slate-800">৳{stats.paid.toLocaleString()}</h3>
        </div>
        <div className="executive-card p-4 sm:p-5 border-l-4 border-red-500 bg-white shadow-sm">
          <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">মোট বকেয়া</p>
          <h3 className="text-xl sm:text-2xl font-black text-red-600">৳{stats.due.toLocaleString()}</h3>
        </div>
        <div className="executive-card p-4 sm:p-5 border-l-4 border-emerald-500 bg-white shadow-sm">
          <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">পূর্ণ পরিশোধ</p>
          <h3 className="text-xl sm:text-2xl font-black text-emerald-600">{stats.paidCount} জন</h3>
        </div>
        <div className="executive-card p-4 sm:p-5 border-l-4 border-amber-500 bg-white shadow-sm">
          <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">আংশিক জমা</p>
          <h3 className="text-xl sm:text-2xl font-black text-amber-600">{stats.partialCount} জন</h3>
        </div>
        <div className="executive-card p-4 sm:p-5 border-l-4 border-slate-400 bg-white shadow-sm">
          <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">বকেয়া গ্রাহক</p>
          <h3 className="text-xl sm:text-2xl font-black text-slate-800">{stats.dueCount} জন</h3>
        </div>
      </div>

      {/* Modern Control Bar */}
      <div className="executive-card p-3 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 no-print shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 w-full sm:w-auto">
            <select className="flex-1 sm:flex-none bg-transparent py-1.5 px-3 text-xs font-bold text-slate-700 outline-none" value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
              {MONTHS_BN.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select className="flex-1 sm:flex-none bg-transparent py-1.5 px-3 text-xs font-bold text-slate-700 outline-none" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="relative w-full sm:w-56">
             <input 
              type="text" 
              placeholder="নাম বা মোবাইল দিয়ে খুঁজুন..." 
              className="pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium w-full focus:ring-2 focus:ring-blue-100 focus:bg-white outline-none transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
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
                className={`px-4 py-1.5 rounded-md text-[11px] font-black transition-all whitespace-nowrap ${statusFilter === s.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <button onClick={() => window.print()} className="flex-shrink-0 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-slate-50 shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            প্রিন্ট
          </button>
          <button onClick={onAddCustomer} className="flex-shrink-0 bg-blue-600 text-white px-5 py-2 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-blue-700 shadow-md whitespace-nowrap transition-transform active:scale-95">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
            নতুন গ্রাহক
          </button>
        </div>
      </div>

      {/* Main Report Table Section */}
      <div className="executive-card overflow-hidden bg-white shadow-xl">
        {/* PREMIUM PRINT HEADER */}
        <div className="hidden print:block p-10 bg-slate-50">
          <div className="flex justify-between items-center border-b-4 border-slate-900 pb-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-slate-900 p-2 rounded-xl">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">ISP লেজার প্রো</h1>
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">অফিশিয়াল গ্রাহক বিলিং রিপোর্ট</p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-slate-800">মাসের নাম: {MONTHS_BN[selectedMonth]} {selectedYear}</h2>
              <p className="text-xs font-bold text-slate-500 mt-1">তারিখ: {new Date().toLocaleDateString('bn-BD')}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-white border-2 border-slate-200 p-4 rounded-2xl text-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">মোট আদায়</p>
              <p className="text-xl font-black text-emerald-600">৳{stats.paid.toLocaleString()}</p>
            </div>
            <div className="bg-white border-2 border-slate-200 p-4 rounded-2xl text-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">মোট বকেয়া</p>
              <p className="text-xl font-black text-red-600">৳{stats.due.toLocaleString()}</p>
            </div>
            <div className="bg-white border-2 border-slate-200 p-4 rounded-2xl text-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">সক্রিয় গ্রাহক</p>
              <p className="text-xl font-black text-slate-800">{filteredCustomers.length} জন</p>
            </div>
            <div className="bg-white border-2 border-slate-200 p-4 rounded-2xl text-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">পেমেন্ট সম্পন্ন</p>
              <p className="text-xl font-black text-blue-600">{stats.paidCount} জন</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left border-collapse min-w-[850px] sm:min-w-full">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-widest print:bg-slate-200 print:text-slate-900">
                <th className="px-6 py-5">গ্রাহকের নাম ও আইডি</th>
                <th className="px-3 py-5 text-center">নির্ধারিত বিল</th>
                <th className="px-3 py-5 text-center bg-emerald-50/30">পরিশোধিত টাকা</th>
                <th className="px-3 py-5 text-center bg-red-50/30">বকেয়া টাকা</th>
                <th className="px-3 py-5 text-center">পেমেন্ট স্ট্যাটাস</th>
                <th className="px-4 py-5 text-right no-print">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr><td colSpan={6} className="py-24 text-center text-slate-400 font-bold italic">তালিকা খালি - কোনো তথ্য পাওয়া যায়নি</td></tr>
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
                      <td className="px-6 py-5 border-l-4 border-transparent hover:border-blue-600 transition-all">
                        <div className="min-w-0">
                          <p className="text-[13px] sm:text-[14px] font-black text-slate-800 group-hover:text-blue-600 transition-colors">{c.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-tighter">ID: {c.connectionName}</span>
                            <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                            <span className="text-[9px] sm:text-[10px] font-bold text-slate-500">{c.mobile}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-5 text-center">
                        <span className="text-xs sm:text-sm font-bold text-slate-500">৳{c.monthlyBill}</span>
                      </td>
                      <td className="px-3 py-5 text-center bg-emerald-50/20">
                        <span className={`text-[14px] sm:text-[16px] font-black ${paidVal > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>
                          ৳{paidVal}
                        </span>
                      </td>
                      <td className="px-3 py-5 text-center bg-red-50/20">
                        <span className={`text-[14px] sm:text-[16px] font-black ${dueVal > 0 ? 'text-red-600' : 'text-slate-300'}`}>
                          ৳{dueVal}
                        </span>
                      </td>
                      <td className="px-3 py-5 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <span className={`status-badge border-2 text-[8px] sm:text-[9px] font-black whitespace-nowrap px-3 py-1 shadow-sm ${
                            isPaid ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                            isPartial ? 'bg-amber-50 text-amber-700 border-amber-100' : 
                            'bg-red-50 text-red-600 border-red-100'
                          }`}>
                             {isPaid ? 'পরিশোধিত' : isPartial ? 'আংশিক জমা' : 'বকেয়া'}
                          </span>
                          
                          {/* STYLED PAYMENT METHOD LABELS WITH ICONS */}
                          {rec?.paymentMethod && (
                            <div className="flex items-center gap-1.5 animate-in slide-in-from-top-1">
                              {rec.paymentMethod === 'Cash' && (
                                <span className="flex items-center gap-1 text-[8px] sm:text-[9px] font-black text-blue-700 uppercase bg-blue-100 px-2 py-0.5 rounded-md border border-blue-200 shadow-sm">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                  ক্যাশ
                                </span>
                              )}
                              {rec.paymentMethod === 'bKash' && (
                                <span className="flex items-center gap-1 text-[8px] sm:text-[9px] font-black text-white uppercase bg-[#e2136e] px-2.5 py-0.5 rounded-md shadow-md border border-[#c61060]">
                                  <span className="italic tracking-tighter">b</span>বিকাশ
                                </span>
                              )}
                              {rec.paymentMethod === 'Free' && (
                                <span className="flex items-center gap-1 text-[8px] sm:text-[9px] font-black text-indigo-700 uppercase bg-indigo-100 px-2 py-0.5 rounded-md border border-indigo-200 shadow-sm">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12V8m0 0V4m0 4h-4m4 0h4m-4 6v4m0 0v4m0-4h-4m4 0h4M4 12V8m0 0V4m0 4h4m-4 0H0m4 6v4m0 0v4m0-4h4m-4 0H0" /></svg>
                                  ফ্রি
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 no-print text-right">
                        <div className="flex items-center justify-end gap-3">
                          {!isPaid && (
                            <button 
                              onClick={(e) => handlePaymentInitiation(e, c)}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black shadow-lg shadow-emerald-600/20 transition-all hover:-translate-y-0.5 active:scale-95"
                            >
                              জমা দিন
                            </button>
                          )}
                          <button 
                            onClick={(e) => handleDeleteClick(e, c)}
                            className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                            title="মুছে ফেলুন"
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

        {/* PRINT ONLY: FOOTER AND SIGNATURES */}
        <div className="hidden print:block p-12 mt-12 border-t-2 border-slate-100">
           <div className="flex justify-between items-end mb-16">
              <div className="text-center">
                 <div className="w-48 h-px bg-slate-900 mb-2"></div>
                 <p className="text-xs font-black text-slate-900 uppercase tracking-widest">কর্তৃপক্ষের স্বাক্ষর ও সিল</p>
              </div>
              <div className="text-center italic text-slate-400 text-[10px]">
                 রিপোর্ট জেনারেটেড বাই ISP লেজার প্রো
              </div>
              <div className="text-center">
                 <div className="w-48 h-px bg-slate-900 mb-2"></div>
                 <p className="text-xs font-black text-slate-900 uppercase tracking-widest">হিসাবরক্ষকের স্বাক্ষর</p>
              </div>
           </div>
           <div className="bg-slate-900 text-white p-6 rounded-2xl flex justify-between items-center">
              <p className="text-[10px] font-bold uppercase tracking-widest">রিপোর্ট আইডি: REP-{currentMonthKey}-{Math.floor(Math.random()*10000)}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest">ISP লেজার প্রো - স্মার্ট ডিজিটাল বিলিং</p>
           </div>
        </div>
      </div>

      {/* Payment Selection Modal */}
      {paymentSelection && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[210] flex items-center justify-center p-4 no-print animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden relative">
             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-pink-600 to-indigo-600"></div>
            
            <div className="text-center mb-8 mt-4">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">বিল পরিশোধের মাধ্যম</h3>
              <div className="mt-3 inline-block px-4 py-1.5 bg-slate-100 rounded-full">
                <p className="text-slate-500 text-xs font-black uppercase tracking-widest">
                  {paymentSelection.name} • <span className="text-blue-600">৳{paymentSelection.amount}</span>
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <button 
                onClick={handleCashPayment} 
                className="group flex items-center justify-between px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-emerald-200"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-2 rounded-xl">
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  </div>
                  <span>নগদ পেমেন্ট (Cash)</span>
                </div>
                <svg className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
              </button>

              <button 
                onClick={handleBkashSelection} 
                className="group flex items-center justify-between px-6 py-4 bg-[#e2136e] hover:bg-[#c61060] text-white font-black rounded-2xl transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-pink-200"
              >
                <div className="flex items-center gap-4">
                   <div className="bg-white/20 p-2 rounded-xl text-xl font-black italic tracking-tighter">b</div>
                   <span>বিকাশ পেমেন্ট (bKash)</span>
                </div>
                <svg className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
              </button>

              <button 
                onClick={handleFreePayment} 
                className="group flex items-center justify-between px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-indigo-200"
              >
                <div className="flex items-center gap-4">
                   <div className="bg-white/20 p-2 rounded-xl">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>
                   </div>
                   <span>ফ্রি বিল (Free)</span>
                </div>
                <svg className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
              </button>
              
              <button onClick={() => setPaymentSelection(null)} className="w-full py-4 mt-2 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-slate-600 transition-colors">ফিরে যান</button>
            </div>
          </div>
        </div>
      )}

      {/* bKash Modal Connection */}
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[220] flex items-center justify-center p-4 no-print animate-in zoom-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6 text-red-600 animate-pulse">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">মুছে ফেলতে চান?</h3>
              <p className="text-slate-500 text-xs mt-3 mb-8 font-medium italic">"{customerToDelete.name}" এর সকল লেনদেন এবং প্রোফাইল চিরতরে মুছে যাবে।</p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setCustomerToDelete(null)} className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-xl font-black text-xs transition-all active:scale-95 uppercase tracking-widest">না, থাক</button>
                <button onClick={() => { onDeleteCustomer(customerToDelete.id); setCustomerToDelete(null); }} className="flex-1 py-3.5 bg-red-600 text-white rounded-xl font-black text-xs transition-all active:scale-95 shadow-lg shadow-red-200 uppercase tracking-widest">হ্যাঁ, মুছুন</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
