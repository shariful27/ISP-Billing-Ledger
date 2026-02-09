
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
    const bill = c.monthlyBill;
    
    acc.totalExpected += bill;

    if (rec) {
      acc.paid += rec.paidAmount;
      acc.due += rec.due;
      if (rec.paymentMethod === 'Cash') acc.cashReceived += rec.paidAmount;
      if (rec.paymentMethod === 'bKash') acc.bkashReceived += rec.paidAmount;
      
      if (rec.due <= 0 && rec.paidAmount > 0) acc.paidCount++;
      else if (rec.paidAmount > 0 && rec.due > 0) acc.partialCount++;
      else acc.dueCount++;
    } else {
      acc.due += bill;
      acc.dueCount++;
    }
    return acc;
  }, { 
    paid: 0, 
    due: 0, 
    totalExpected: 0, 
    cashReceived: 0, 
    bkashReceived: 0, 
    paidCount: 0, 
    partialCount: 0, 
    dueCount: 0 
  });

  const handlePaymentInitiation = (e: React.MouseEvent, c: Customer) => {
    e.stopPropagation(); 
    setPaymentSelection({ id: c.id, name: c.name, fullAmount: c.monthlyBill, inputAmount: c.monthlyBill });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-1 sm:px-4 py-4 print:p-0">
      
      {/* 1. PROFESSIONAL PRINT HEADER (Hidden on Screen) */}
      <div className="hidden print:block mb-6">
        <div className="flex justify-between items-start border-b-4 border-slate-900 pb-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">ISP LEDGER PRO</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-1">Advanced ISP Billing Management</p>
            <div className="mt-4 space-y-1">
              <p className="text-xs font-bold text-slate-800">রিপোর্ট টাইপ: <span className="font-black">মাসিক হিসাব বিবরণী</span></p>
              <p className="text-xs font-bold text-slate-800">সময়কাল: <span className="text-blue-600">{MONTHS_BN[selectedMonth]} {selectedYear}</span></p>
            </div>
          </div>
          <div className="text-right">
             <div className="bg-slate-900 text-white px-4 py-2 rounded-lg inline-block mb-2">
                <p className="text-[10px] font-bold uppercase tracking-widest">মোট আদায়কৃত টাকা</p>
                <p className="text-2xl font-black">৳{stats.paid.toLocaleString()}</p>
             </div>
             <p className="text-[10px] font-bold text-slate-400">তৈরির সময়: {new Date().toLocaleString('bn-BD')}</p>
          </div>
        </div>

        {/* Financial Breakdown Grid for Print */}
        <div className="grid grid-cols-4 gap-4 mt-6">
           <div className="border-2 border-slate-100 p-3 rounded-xl bg-slate-50">
              <p className="text-[9px] font-black text-slate-400 uppercase">মোট পাওনা</p>
              <p className="text-lg font-black text-slate-800">৳{stats.totalExpected.toLocaleString()}</p>
           </div>
           <div className="border-2 border-emerald-100 p-3 rounded-xl bg-emerald-50">
              <p className="text-[9px] font-black text-emerald-600 uppercase">নগদ (Cash)</p>
              <p className="text-lg font-black text-emerald-700">৳{stats.cashReceived.toLocaleString()}</p>
           </div>
           <div className="border-2 border-pink-100 p-3 rounded-xl bg-pink-50">
              <p className="text-[9px] font-black text-pink-600 uppercase">বিকাশ (bKash)</p>
              <p className="text-lg font-black text-pink-700">৳{stats.bkashReceived.toLocaleString()}</p>
           </div>
           <div className="border-2 border-red-100 p-3 rounded-xl bg-red-50">
              <p className="text-[9px] font-black text-red-500 uppercase">অবশিষ্ট বকেয়া</p>
              <p className="text-lg font-black text-red-600">৳{stats.due.toLocaleString()}</p>
           </div>
        </div>
      </div>

      {/* 2. SUMMARY CARDS (Screen) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="relative">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">মোট আদায়</p>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">৳{stats.paid.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="relative">
            <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg shadow-red-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">মোট বকেয়া</p>
            <h3 className="text-2xl font-black text-red-600 tracking-tight">৳{stats.due.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="relative">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg shadow-emerald-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">পূর্ণ পরিশোধ</p>
            <h3 className="text-2xl font-black text-emerald-600 tracking-tight">{stats.paidCount} জন</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="relative">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg shadow-amber-100">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">আংশিক / বকেয়া</p>
            <h3 className="text-2xl font-black text-amber-600 tracking-tight">{stats.dueCount + stats.partialCount} জন</h3>
          </div>
        </div>
      </div>

      {/* 3. CONTROLS (Screen) */}
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
            রিপোর্ট প্রিন্ট
          </button>
          
          <button onClick={onAddCustomer} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-xs hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95 whitespace-nowrap">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
            নতুন গ্রাহক
          </button>
        </div>
      </div>

      {/* 4. MAIN DATA TABLE */}
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl overflow-hidden print:border-slate-300 print:rounded-none">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left border-collapse min-w-[900px] print:min-w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 print:bg-slate-100">
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest print:px-4 print:text-slate-900">গ্রাহক ও আইডি</th>
                <th className="px-4 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center print:text-slate-900">নির্ধারিত</th>
                <th className="px-4 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center print:text-slate-900">আদায়কৃত</th>
                <th className="px-4 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center print:text-slate-900">বকেয়া</th>
                <th className="px-4 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center print:text-slate-900">পেমেন্ট মেথড</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right no-print">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 print:divide-slate-300">
              {filteredCustomers.map((c, index) => {
                const rec = c.records[currentMonthKey];
                const isPaid = rec && rec.due <= 0 && rec.paidAmount > 0;
                const isPartial = rec && rec.paidAmount > 0 && rec.due > 0;
                const paidVal = rec ? rec.paidAmount : 0;
                const dueVal = rec ? rec.due : c.monthlyBill;
                
                return (
                  <tr key={c.id} onClick={() => !window.matchMedia('print').matches && onSelectCustomer(c.id)} className="hover:bg-blue-50/30 transition-colors print:hover:bg-transparent">
                    <td className="px-8 py-6 print:px-4 print:py-3">
                      <div className="flex items-center gap-4">
                        <div className="no-print w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 font-black text-sm">
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 print:text-xs">{c.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter print:text-[8px]">ID: {c.connectionName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-6 text-center print:py-3">
                      <span className="text-sm font-bold text-slate-600 print:text-xs">৳{c.monthlyBill}</span>
                    </td>
                    <td className="px-4 py-6 text-center print:py-3">
                      <span className={`text-base font-black print:text-xs ${paidVal > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>
                        ৳{paidVal}
                      </span>
                    </td>
                    <td className="px-4 py-6 text-center print:py-3">
                      <span className={`text-base font-black print:text-xs ${dueVal > 0 ? 'text-red-500' : 'text-slate-200'}`}>
                        ৳{dueVal}
                      </span>
                    </td>
                    <td className="px-4 py-6 text-center print:py-3">
                       <span className={`text-[9px] font-black px-3 py-1 rounded-full border shadow-sm print:border-slate-300 print:shadow-none ${
                          isPaid ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                          isPartial ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                          'bg-red-50 text-red-600 border-red-200'
                       }`}>
                          {isPaid ? 'পরিশোধিত' : isPartial ? 'আংশিক' : 'বকেয়া'}
                       </span>
                       {rec?.paymentMethod && (
                          <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase print:text-slate-600">{rec.paymentMethod}</p>
                       )}
                    </td>
                    <td className="px-8 py-6 text-right no-print">
                      <div className="flex items-center justify-end gap-3">
                        {!isPaid && (
                          <button 
                            onClick={(e) => handlePaymentInitiation(e, c)} 
                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black shadow-lg shadow-emerald-100 transition-all active:scale-95 whitespace-nowrap"
                          >
                            বিল জমা
                          </button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); onDeleteCustomer(c.id); }} className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="hidden print:table-footer-group">
               <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-900">
                  <td className="px-4 py-4 text-xs">সর্বমোট হিসাব:</td>
                  <td className="text-center text-xs">৳{stats.totalExpected.toLocaleString()}</td>
                  <td className="text-center text-xs text-emerald-700">৳{stats.paid.toLocaleString()}</td>
                  <td className="text-center text-xs text-red-600">৳{stats.due.toLocaleString()}</td>
                  <td colSpan={2} className="px-4 text-right text-[10px] uppercase"> ISP LEDGER PRO OFFICIAL REPORT</td>
               </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 5. PRINT FOOTER SIGNATURES */}
      <div className="hidden print:grid grid-cols-2 gap-20 px-10 mt-20">
        <div className="text-center">
          <div className="border-t-2 border-slate-900 pt-2">
            <p className="text-[10px] font-black uppercase tracking-widest">হিসাবরক্ষকের স্বাক্ষর</p>
          </div>
        </div>
        <div className="text-center">
          <div className="border-t-2 border-slate-900 pt-2">
            <p className="text-[10px] font-black uppercase tracking-widest">পরিচালকের স্বাক্ষর</p>
          </div>
        </div>
      </div>

      {/* MODALS (Unchanged Payment Logic) */}
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
              <button onClick={() => { onQuickPay(paymentSelection.id, currentMonthKey, paymentSelection.inputAmount, 'Cash'); setPaymentSelection(null); }} className="py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-[20px] transition-all shadow-xl shadow-emerald-100 active:scale-95">
                নগদ পেমেন্ট
              </button>
              <button onClick={() => { setBkashData({ id: paymentSelection.id, name: paymentSelection.name, amount: paymentSelection.inputAmount, monthKey: currentMonthKey }); setPaymentSelection(null); }} className="py-4 bg-[#e2136e] hover:bg-[#c61060] text-white font-black rounded-[20px] transition-all shadow-xl shadow-pink-100 active:scale-95">
                বিকাশ পেমেন্ট
              </button>
              <button onClick={() => { onQuickPay(paymentSelection.id, currentMonthKey, paymentSelection.fullAmount, 'Free'); setPaymentSelection(null); }} className="py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-[20px] transition-all shadow-xl shadow-indigo-100 active:scale-95">
                ফ্রি বিল
              </button>
              <button onClick={() => setPaymentSelection(null)} className="py-4 bg-slate-100 text-slate-500 font-black rounded-[20px] text-xs tracking-widest">
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
    </div>
  );
};
