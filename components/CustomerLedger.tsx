
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

  // Calculate overall totals for the print summary
  const totalSummary = recordKeys.reduce((acc, key) => {
    const rec = customer.records[key];
    acc.expected += rec.expectedBill;
    acc.paid += rec.paidAmount;
    acc.due += rec.due;
    return acc;
  }, { expected: 0, paid: 0, due: 0 });

  const formatMonthKey = (key: string) => {
    const [year, month] = key.split('-');
    return `${MONTHS_BN[parseInt(month) - 1]} ${year}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-20 px-1 sm:px-0 print-container">
      {/* Control Header - No Print */}
      <div className="flex flex-col sm:flex-row items-center justify-between no-print gap-3 sm:gap-4 mb-2">
        <button onClick={onBack} className="w-full sm:w-auto flex items-center justify-center gap-2 text-slate-500 font-bold hover:text-blue-600 transition-all text-[11px] sm:text-xs py-2 bg-white sm:bg-transparent rounded-lg border sm:border-none shadow-sm sm:shadow-none">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          ফিরে যান
        </button>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button onClick={onEditCustomer} className="flex-1 sm:flex-none px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-[10px] sm:text-[11px] font-bold hover:bg-slate-50 transition-all">তথ্য পরিবর্তন</button>
          <button onClick={() => window.print()} className="flex-1 sm:flex-none bg-blue-600 text-white px-4 py-2.5 rounded-lg text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-2 hover:bg-blue-700 shadow-md transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            প্রিন্ট করুন
          </button>
        </div>
      </div>

      {/* Official Ledger Container */}
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-slate-200 overflow-hidden print:shadow-none print:border-slate-300">
        
        {/* Print Header Logo/Name */}
        <div className="print-only p-8 border-b-2 border-slate-800 flex justify-between items-center">
           <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tighter">ISP LEDGER PRO</h1>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">Smart Billing Management Solution</p>
           </div>
           <div className="text-right">
              <p className="text-xs font-bold text-slate-800">রিপোর্ট জেনারেট তারিখ:</p>
              <p className="text-xs font-black text-blue-600">{new Date().toLocaleDateString('bn-BD')}</p>
           </div>
        </div>

        {/* Document Header (Customer Info) */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-8 py-6 sm:py-8 print:bg-white print:px-0">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-4 sm:gap-6 print:flex-row print:items-end">
            <div className="w-full">
               <p className="text-[9px] sm:text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">গ্রাহকের হিসাব বিবরণী</p>
               <h2 className="text-xl sm:text-3xl font-black text-slate-800 leading-tight print:text-2xl">{customer.name}</h2>
               <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 sm:mt-2">
                 <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-tighter bg-slate-100 print:bg-slate-50 px-2 py-0.5 rounded">আইডি: {customer.connectionName}</span>
                 <span className="hidden sm:inline w-1 h-1 rounded-full bg-slate-300"></span>
                 <span className="text-[10px] sm:text-xs font-bold text-slate-500">মোবাইল: {customer.mobile}</span>
               </div>
               <p className="text-[10px] sm:text-[11px] text-slate-400 mt-2 font-medium italic print:text-slate-600">{customer.address || 'ঠিকানা: উল্লেখ নেই'}</p>
            </div>
            <div className="w-full sm:w-auto bg-white border border-slate-200 rounded-xl p-4 sm:p-5 text-center shadow-sm lg:min-w-[160px] print:border-slate-300">
               <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">মাসিক নির্ধারিত বিল</p>
               <p className="text-xl sm:text-3xl font-black text-slate-800 tracking-tight">৳{customer.monthlyBill}</p>
            </div>
          </div>
        </div>

        {/* Print Only: Detailed Summary Table */}
        <div className="print-only px-8 pt-6">
           <div className="grid grid-cols-3 gap-4 border-2 border-slate-100 rounded-xl p-4 bg-slate-50/50">
              <div className="text-center">
                 <p className="text-[9px] font-black text-slate-400 uppercase">মোট পাওনা</p>
                 <p className="text-lg font-black text-slate-800">৳{totalSummary.expected}</p>
              </div>
              <div className="text-center border-x border-slate-200">
                 <p className="text-[9px] font-black text-slate-400 uppercase">মোট আদায়</p>
                 <p className="text-lg font-black text-emerald-600">৳{totalSummary.paid}</p>
              </div>
              <div className="text-center">
                 <p className="text-[9px] font-black text-slate-400 uppercase">বর্তমান বকেয়া</p>
                 <p className="text-lg font-black text-red-500">৳{totalSummary.due}</p>
              </div>
           </div>
        </div>

        {/* Transaction Table */}
        <div className="overflow-x-auto scrollbar-hide px-0 sm:px-4 py-4">
          <table className="w-full text-center border-collapse min-w-[500px] print:min-w-full">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[9px] sm:text-[10px] font-black uppercase tracking-widest border-b border-slate-200 print:bg-slate-100 print:text-slate-900">
                <th className="py-4 px-4 sm:px-6 text-left border-r border-slate-100 print:border-slate-300">বিলিং মাস</th>
                <th className="py-4 px-2 sm:px-4 border-r border-slate-100 print:border-slate-300">নির্ধারিত</th>
                <th className="py-4 px-2 sm:px-4 border-r border-slate-100 print:border-slate-300">আদায়কৃত</th>
                <th className="py-4 px-2 sm:px-4 border-r border-slate-100 print:border-slate-300">বকেয়া</th>
                <th className="py-4 px-4 sm:px-6 text-right">নোট / তারিখ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 print:divide-slate-300">
              {recordKeys.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 sm:py-24 text-slate-300 font-medium italic text-xs sm:text-sm px-4">কোনো লেনদেন রেকর্ড করা হয়নি</td>
                </tr>
              ) : (
                recordKeys.map(key => {
                  const record = customer.records[key];
                  const isEditing = editingKey === key;
                  
                  return (
                    <tr key={key} className="hover:bg-slate-50/50 transition-colors print:hover:bg-transparent">
                      <td className="py-4 px-4 sm:px-6 text-left border-r border-slate-100 print:border-slate-200">
                        <p className="font-bold text-slate-700 text-xs sm:text-sm">{formatMonthKey(key)}</p>
                      </td>
                      <td className="py-4 px-2 sm:px-4 text-slate-500 text-[10px] sm:text-sm border-r border-slate-100 print:border-slate-200">৳{record.expectedBill}</td>
                      <td className="py-4 px-2 sm:px-4 border-r border-slate-100 print:border-slate-200">
                        {isEditing ? (
                          <input 
                            type="number"
                            className="w-16 sm:w-24 bg-white border-2 border-blue-500 rounded-md p-1.5 text-center font-bold text-slate-800 outline-none shadow-sm text-xs sm:text-sm no-print"
                            value={record.paidAmount}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              onUpdateRecord(key, { paidAmount: val, due: record.expectedBill - val });
                            }}
                            autoFocus
                          />
                        ) : (
                          <div 
                            className={`font-black text-sm sm:text-base transition-colors ${record.paidAmount > 0 ? 'text-slate-800' : 'text-slate-300'} no-print cursor-pointer hover:text-blue-600`}
                            onClick={() => setEditingKey(key)}
                          >
                            ৳{record.paidAmount}
                          </div>
                        )}
                        <span className="hidden print:inline font-bold text-sm">৳{record.paidAmount}</span>
                      </td>
                      <td className="py-4 px-2 sm:px-4 border-r border-slate-100 print:border-slate-200">
                        <span className={`px-2 py-0.5 rounded-md text-[8px] sm:text-[10px] font-black border ${record.due > 0 ? 'bg-red-50 text-red-600 border-red-100 print:text-red-600' : 'bg-emerald-50 text-emerald-600 border-emerald-100 print:text-emerald-700'}`}>
                          ৳{record.due}
                        </span>
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-right">
                         {isEditing ? (
                            <button onClick={() => setEditingKey(null)} className="no-print text-[9px] sm:text-[10px] bg-blue-600 text-white px-3 sm:px-4 py-1.5 rounded-md font-bold hover:bg-blue-700 transition-colors shadow-sm">সেভ</button>
                         ) : (
                           <div className="cursor-pointer group no-print" onClick={() => setEditingKey(key)}>
                              <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 group-hover:text-blue-500 transition-colors">{record.paymentDate || 'তারিখ?'}</p>
                              <p className="text-[8px] sm:text-[9px] font-medium text-slate-400 truncate max-w-[80px] sm:max-w-[140px] ml-auto mt-0.5 italic">{record.remarks || '-'}</p>
                           </div>
                         )}
                         {/* Detailed Note for Print */}
                         <div className="hidden print:block text-right">
                            <p className="text-[9px] font-bold text-slate-800">{record.paymentDate || '-'}</p>
                            <p className="text-[8px] text-slate-500 italic mt-0.5">{record.remarks || record.paymentMethod || '-'}</p>
                         </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
            {/* Table Footer Summary for Print */}
            <tfoot className="hidden print:table-footer-group">
               <tr className="bg-slate-50 border-t-2 border-slate-800 font-black text-slate-900">
                  <td className="py-3 px-4 text-left text-xs uppercase">সর্বমোট (Total)</td>
                  <td className="py-3 px-2 text-xs">৳{totalSummary.expected}</td>
                  <td className="py-3 px-2 text-xs text-emerald-700">৳{totalSummary.paid}</td>
                  <td className="py-3 px-2 text-xs text-red-600">৳{totalSummary.due}</td>
                  <td className="py-3 px-4 text-right text-[10px] uppercase">বর্তমান ব্যালেন্স</td>
               </tr>
            </tfoot>
          </table>
        </div>

        {/* Official Terms & Conditions for Print */}
        <div className="hidden print:block px-8 py-6 border-t border-slate-100 text-[8px] text-slate-400 leading-relaxed italic">
           * এই স্টেটমেন্টটি ISP LEDGER PRO দ্বারা ডিজিটালভাবে তৈরি। কোনো অসঙ্গতি পাওয়া গেলে আমাদের অফিসিয়াল সাপোর্ট নম্বরে যোগাযোগ করুন। নিয়মিত বিল পরিশোধ করে নিরবচ্ছিন্ন সেবা নিশ্চিত করুন।
        </div>

        {/* Footer Signature Block (Print only) */}
        <div className="mt-16 px-12 pb-16 hidden print:flex justify-between items-end text-[10px] text-slate-800 font-black uppercase tracking-widest">
           <div className="text-center w-48">
              <div className="h-px bg-slate-900 mb-2 w-full"></div>
              <span>পরিচালকের স্বাক্ষর</span>
           </div>
           <div className="text-center opacity-20 italic text-[8px]">
              DIGITAL ISP MANAGEMENT SYSTEM 2024
           </div>
           <div className="text-center w-48">
              <div className="h-px bg-slate-900 mb-2 w-full"></div>
              <span>গ্রাহকের স্বাক্ষর</span>
           </div>
        </div>
      </div>
    </div>
  );
};
