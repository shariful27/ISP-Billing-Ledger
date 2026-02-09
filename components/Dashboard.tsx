
import React, { useState } from 'react';
import { Customer, MONTHS_BN } from '../types.ts';
import { BkashModal } from './BkashModal.tsx';

interface DashboardProps {
  customers: Customer[];
  onSelectCustomer: (id: string) => void;
  onAddCustomer: () => void;
  onQuickPay: (customerId: string, monthKey: string, amount: number, method?: string, trxId?: string) => void;
  onDeleteCustomer: (id: string) => void;
}

type FilterStatus = 'all' | 'paid' | 'partial' | 'due';

export const Dashboard: React.FC<DashboardProps> = ({ customers, onSelectCustomer, onAddCustomer, onQuickPay, onDeleteCustomer }) => {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  
  // Payment States
  const [paymentSelection, setPaymentSelection] = useState<{ id: string, name: string, fullAmount: number, inputAmount: number } | null>(null);
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
    setPaymentSelection({ id: c.id, name: c.name, fullAmount: c.monthlyBill, inputAmount: c.monthlyBill });
  };

  const handleCashPayment = () => {
    if (paymentSelection) {
      onQuickPay(paymentSelection.id, currentMonthKey, paymentSelection.inputAmount, 'Cash');
      setPaymentSelection(null);
    }
  };

  const handleFreePayment = () => {
    if (paymentSelection) {
      onQuickPay(paymentSelection.id, currentMonthKey, paymentSelection.fullAmount, 'Free');
      setPaymentSelection(null);
    }
  };

  const handleBkashSelection = () => {
    if (paymentSelection) {
      setBkashData({ 
        id: paymentSelection.id, 
        name: paymentSelection.name, 
        amount: paymentSelection.inputAmount, 
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
    <div className="space-y-6 max-w-7xl mx-auto px-1 sm:px-4 py-4 print-container">
      
      {/* 1. PROFESSIONAL PRINT HEADER */}
      <div className="print-only mb-8 border-b-2 border-slate-900 pb-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">ISP LEDGER PRO</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Smart Billing Management System</p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-black text-slate-800">মাসিক রিপোর্ট</h2>
            <p className="text-xs font-bold text-blue-600">{MONTHS_BN[selectedMonth]} {selectedYear}</p>
          </div>
        </div>
      </div>

      {/* 2. PREMIUM SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        {/* Total Collected */}
        <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">মোট আদায়</p>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">৳{stats.paid.toLocaleString()}</h3>
          </div>
        </div>

        {/* Total Due */}
        <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative">
            <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg shadow-red-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">মোট বকেয়া</p>
            <h3 className="text-2xl font-black text-red-600 tracking-tight">৳{stats.due.toLocaleString()}</h3>
          </div>
        </div>

        {/* Fully Paid Count */}
        <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg shadow-emerald-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">পূর্ণ পরিশোধ</p>
            <h3 className="text-2xl font-black text-emerald-600 tracking-tight">{stats.paidCount} জন</h3>
          </div>
        </div>

        {/* Due Count */}
        <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg shadow-amber-100">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">আংশিক / বকেয়া</p>
            <h3 className="text-2xl font-black text-amber-600 tracking-tight">{stats.dueCount + stats.partialCount} জন</h3>
          </div>
        </div>
      </div>

      {/* 3. REFINED CONTROL BAR */}
      <div className="no-print flex flex-col lg:flex-row items-stretch lg:items-center gap-4 bg-white p-4 rounded-[24px] border border-slate-200 shadow-sm">
        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 shrink-0">
          <select 
            className="bg-transparent border-none text-xs font-black text-slate-700 outline-none px-4 py-2 cursor-pointer focus:ring-0"
            value={selectedMonth} 
            onChange={e => setSelectedMonth(Number(e.target.value))}
          >
            {MONTHS_BN.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <div className="w-px h-4 bg-slate-300 self-center"></div>
          <select 
            className="bg-transparent border-none text-xs font-black text-slate-700 outline-none px-4 py-2 cursor-pointer focus:ring-0"
            value={selectedYear} 
            onChange={e => setSelectedYear(Number(e.target.value))}
          >
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div className="relative flex-1">
          <input 
            type="text" 
            placeholder="গ্রাহকের নাম বা আইডি দিয়ে খুঁজুন..." 
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-100 focus:bg-white outline-none transition-all placeholder:text-slate-400"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-1 lg:pb-0 scrollbar-hide">
          <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
            {['all', 'paid', 'partial', 'due'].map((s) => (
              <button 
                key={s}
                onClick={() => setStatusFilter(s as FilterStatus)}
                className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all whitespace-nowrap ${statusFilter === s ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {s === 'all' ? 'সব' : s === 'paid' ? 'পেইড' : s === 'partial' ? 'আংশিক' : 'বকেয়া'}
              </button>
            ))}
          </div>
          
          <button onClick={() => window.print()} className="flex items-center gap-2 bg-white border border-slate-200 px-5 py-3 rounded-xl font-bold text-xs text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            প্রিন্ট
          </button>
          
          <button onClick={onAddCustomer} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-xs hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95 whitespace-nowrap">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
            নতুন গ্রাহক
          </button>
        </div>
      </div>

      {/* 4. MODERN CUSTOMER TABLE */}
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">গ্রাহক বিবরণ</th>
                <th className="px-4 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">নির্ধারিত বিল</th>
                <th className="px-4 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">আদায়কৃত</th>
                <th className="px-4 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">বকেয়া</th>
                <th className="px-4 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">স্ট্যাটাস</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right no-print">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-24 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-200">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                      </div>
                      <p className="text-slate-400 font-bold italic text-sm">কোনো গ্রাহক খুঁজে পাওয়া যায়নি</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const rec = c.records[currentMonthKey];
                  const isPaid = rec && rec.due <= 0 && rec.paidAmount > 0;
                  const isPartial = rec && rec.paidAmount > 0 && rec.due > 0;
                  const paidVal = rec ? rec.paidAmount : 0;
                  const dueVal = rec ? rec.due : c.monthlyBill;
                  
                  return (
                    <tr key={c.id} onClick={() => onSelectCustomer(c.id)} className="hover:bg-blue-50/30 cursor-pointer group transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 font-black text-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                            {c.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">{c.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter flex items-center gap-2">
                              <span className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">ID: {c.connectionName}</span>
                              <span className="text-slate-300">•</span>
                              <span>{c.mobile}</span>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-6 text-center">
                        <span className="text-sm font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">৳{c.monthlyBill}</span>
                      </td>
                      <td className="px-4 py-6 text-center">
                        <span className={`text-base font-black ${paidVal > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>
                          ৳{paidVal}
                        </span>
                      </td>
                      <td className="px-4 py-6 text-center">
                        <span className={`text-base font-black ${dueVal > 0 ? 'text-red-500' : 'text-slate-200'}`}>
                          ৳{dueVal}
                        </span>
                      </td>
                      <td className="px-4 py-6 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <span className={`text-[9px] font-black px-3 py-1 rounded-full border shadow-sm uppercase tracking-tighter ${
                            isPaid ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                            isPartial ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                            'bg-red-50 text-red-600 border-red-200'
                          }`}>
                             {isPaid ? 'পরিশোধিত' : isPartial ? 'আংশিক জমা' : 'বকেয়া'}
                          </span>
                          {rec?.paymentMethod && (
                             <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">{rec.paymentMethod}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right no-print">
                        <div className="flex items-center justify-end gap-3 transition-all">
                          {!isPaid && (
                            <button 
                              onClick={(e) => handlePaymentInitiation(e, c)} 
                              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black shadow-lg shadow-emerald-100 transition-all active:scale-95 whitespace-nowrap"
                            >
                              বিল জমা
                            </button>
                          )}
                          <button onClick={(e) => handleDeleteClick(e, c)} className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
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

      {/* FOOTER (Print only) */}
      <div className="print-only mt-12 grid grid-cols-2 gap-20 px-10">
        <div className="text-center">
          <div className="border-t border-slate-900 pt-2">
            <p className="text-[10px] font-black uppercase">হিসাবরক্ষকের স্বাক্ষর</p>
          </div>
        </div>
        <div className="text-center">
          <div className="border-t border-slate-900 pt-2">
            <p className="text-[10px] font-black uppercase">পরিচালকের স্বাক্ষর</p>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {paymentSelection && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[210] flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-[40px] p-8 sm:p-10 max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
            <div className="text-center mb-8 mt-4">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">বিল কালেকশন</h3>
              <p className="text-slate-400 text-xs mt-1 font-bold italic tracking-wide">{paymentSelection.name} • {MONTHS_BN[selectedMonth]}</p>
            </div>

            <div className="mb-8">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">জমার পরিমাণ (৳)</label>
              <div className="relative">
                 <input 
                   type="number"
                   className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-2xl font-black text-blue-600 focus:border-blue-500 focus:bg-white transition-all outline-none"
                   value={paymentSelection.inputAmount}
                   onChange={(e) => setPaymentSelection({...paymentSelection, inputAmount: Number(e.target.value)})}
                 />
                 <div className="absolute right-4 top-1/2 -translate-y-1/2">
                   <span className="text-slate-300 font-bold text-xs uppercase tracking-widest">BDT</span>
                 </div>
              </div>
              <div className="mt-3 flex justify-between px-1">
                <p className="text-[9px] font-bold text-slate-400">নির্ধারিত বিল: ৳{paymentSelection.fullAmount}</p>
                <p className={`text-[9px] font-bold ${paymentSelection.fullAmount - paymentSelection.inputAmount > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                  {paymentSelection.fullAmount - paymentSelection.inputAmount > 0 
                    ? `বকেয়া থাকবে: ৳${paymentSelection.fullAmount - paymentSelection.inputAmount}` 
                    : 'পুরো বিল পরিশোধিত'}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <button onClick={handleCashPayment} className="group relative py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-[20px] transition-all shadow-xl shadow-emerald-100 active:scale-95 flex items-center justify-center gap-3 overflow-hidden">
                <span className="relative z-10 text-sm">নগদ পেমেন্ট</span>
              </button>
              
              <button onClick={handleBkashSelection} className="group relative py-4 bg-[#e2136e] hover:bg-[#c61060] text-white font-black rounded-[20px] transition-all shadow-xl shadow-pink-100 active:scale-95 flex items-center justify-center gap-3 overflow-hidden">
                <span className="relative z-10 text-sm">বিকাশ পেমেন্ট</span>
              </button>
              
              <button onClick={handleFreePayment} className="group relative py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-[20px] transition-all shadow-xl shadow-indigo-100 active:scale-95 flex items-center justify-center gap-3 overflow-hidden">
                <span className="relative z-10 text-sm">ফ্রি বিল</span>
              </button>
              
              <button onClick={() => setPaymentSelection(null)} className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-500 font-black rounded-[20px] transition-all active:scale-95 text-xs uppercase tracking-widest shadow-sm">
                ফিরে যান
              </button>
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
            onQuickPay(bkashData.id, bkashData.monthKey, bkashData.amount, 'bKash', trxId);
          }
        }}
      />

      {customerToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[220] flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-[40px] p-10 max-w-sm w-full shadow-2xl border text-center">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[30px] flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">মুছে ফেলবেন?</h3>
            <p className="text-slate-500 text-xs mt-3 mb-8 font-medium">"{customerToDelete.name}" এর সকল লেনদেন ও তথ্য চিরতরে মুছে যাবে।</p>
            <div className="flex gap-4">
              <button onClick={() => setCustomerToDelete(null)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-xs text-slate-500 uppercase tracking-widest hover:bg-slate-200 transition-colors">না</button>
              <button onClick={() => { onDeleteCustomer(customerToDelete.id); setCustomerToDelete(null); }} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 shadow-lg shadow-red-100 transition-all">হ্যাঁ, মুছুন</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
