
import React, { useState } from 'react';
import { Customer, MONTHS_BN, MonthlyRecord } from '../types';

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

  // Sorting record keys by date (latest first)
  const recordKeys = Object.keys(customer.records).sort((a, b) => b.localeCompare(a));

  const formatMonthKey = (key: string) => {
    const [year, month] = key.split('-');
    return `${MONTHS_BN[parseInt(month) - 1]} ${year}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 pb-20 animate-in slide-in-from-bottom-4 duration-500">
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-4 text-rose-600 font-bold text-2xl">!</div>
              <h3 className="text-xl font-black text-slate-800 mb-2">গ্রাহক রিমুভ করুন</h3>
              <p className="text-slate-500 text-sm mb-6">
                আপনি কি নিশ্চিত যে আপনি <span className="font-bold text-rose-600">"{customer.name}"</span> কে তালিকা থেকে রিমুভ করতে চান? এই অ্যাকশনটি আর ফিরিয়ে আনা সম্ভব হবে না।
              </p>
              <div className="flex gap-4 w-full">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 px-4 bg-slate-100 font-bold rounded-2xl">না, থাক</button>
                <button 
                  onClick={() => {
                    onDeleteCustomer();
                    setShowDeleteConfirm(false);
                  }} 
                  className="flex-1 py-3 px-4 bg-rose-500 text-white font-bold rounded-2xl shadow-lg shadow-rose-200"
                >
                  হ্যাঁ, রিমুভ করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header Info */}
      <div className="flex items-center justify-between gap-2 no-print bg-white p-3 md:p-4 rounded-2xl border border-slate-200 shadow-sm sticky top-[81px] z-30">
        <button onClick={onBack} className="flex items-center gap-1.5 text-slate-600 font-bold hover:text-indigo-600 transition-colors text-sm md:text-base">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          <span className="hidden sm:inline">তালিকায় ফিরুন</span>
          <span className="sm:hidden">ব্যাক</span>
        </button>
        <div className="flex gap-2">
          <button onClick={onEditCustomer} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all">এডিট</button>
          <button onClick={() => setShowDeleteConfirm(true)} className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition-all">রিমুভ</button>
          <button onClick={() => window.print()} className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-indigo-700 transition-all flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            প্রিন্ট
          </button>
        </div>
      </div>

      <div className="bg-white p-6 md:p-12 rounded-3xl shadow-xl border border-slate-100 ledger-card relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
        
        <div className="flex flex-col items-center text-center mb-8 md:mb-12">
          <h1 className="text-2xl md:text-3xl font-black text-slate-800">বিলিং লেজার</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] md:text-[10px] mt-1">Transaction History Statement</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-10 md:mb-12">
          <div className="space-y-4">
            <div className="border-l-4 border-indigo-500 pl-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">গ্রাহকের তথ্য</p>
              <p className="text-lg font-black text-slate-800 leading-tight">{customer.name}</p>
              <p className="text-sm font-bold text-indigo-600 mt-0.5">{customer.connectionName}</p>
            </div>
          </div>
          <div className="space-y-4 md:text-right">
             <div className="md:border-r-4 border-emerald-500 md:pr-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">বিল ও যোগাযোগ</p>
                <p className="text-lg font-black text-slate-800">{customer.mobile}</p>
                <div className="flex md:justify-end items-center gap-2 mt-1">
                   <span className="text-xs font-bold text-slate-400">মাসিক বিল:</span>
                   <p className="text-xl font-black text-emerald-600">৳{customer.monthlyBill}</p>
                </div>
             </div>
          </div>
        </div>

        {/* Dynamic Billing History - Table for Desktop, Cards for Mobile */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">বিলিং ইতিহাস</h3>
          
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest">
                  <th className="py-4 px-4">বিলিং মাস</th>
                  <th className="py-4 px-4">বিলের পরিমাণ</th>
                  <th className="py-4 px-4">আদায়</th>
                  <th className="py-4 px-4">বকেয়া</th>
                  <th className="py-4 px-4">তারিখ ও মন্তব্য</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recordKeys.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-slate-400 italic">এখনো কোনো বিলিং রেকর্ড নেই</td>
                  </tr>
                ) : (
                  recordKeys.map(key => {
                    const record = customer.records[key];
                    const isEditing = editingKey === key;
                    
                    return (
                      <tr key={key} className="hover:bg-slate-50 transition-colors group">
                        <td className="p-5 font-black text-slate-700">{formatMonthKey(key)}</td>
                        <td className="p-5 font-bold text-slate-500">৳{record.expectedBill}</td>
                        <td className="p-5">
                          {isEditing ? (
                            <input 
                              type="number"
                              autoFocus
                              className="w-24 border-2 border-indigo-500 rounded-lg p-1 text-center font-bold outline-none"
                              value={record.paidAmount}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                onUpdateRecord(key, { paidAmount: val, due: record.expectedBill - val });
                              }}
                            />
                          ) : (
                            <div 
                              className="cursor-pointer font-black text-slate-800 no-print hover:bg-white px-2 py-1 rounded border border-transparent hover:border-slate-200"
                              onClick={() => setEditingKey(key)}
                            >
                              ৳{record.paidAmount}
                            </div>
                          )}
                          <span className="print-only font-black">৳{record.paidAmount}</span>
                        </td>
                        <td className="p-5">
                          <span className={`px-2 py-1 rounded-lg font-black text-xs ${record.due > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            ৳{record.due}
                          </span>
                        </td>
                        <td className="p-5">
                          <div className="flex flex-col items-center">
                            {isEditing ? (
                              <div className="flex flex-col gap-1 items-center no-print">
                                <input 
                                  type="date" 
                                  className="text-[10px] border rounded p-1 outline-none border-indigo-500"
                                  value={record.paymentDate}
                                  onChange={(e) => onUpdateRecord(key, { paymentDate: e.target.value })}
                                />
                                <input 
                                  type="text" 
                                  placeholder="মন্তব্য..."
                                  className="text-[10px] border rounded p-1 outline-none border-indigo-500 w-24"
                                  value={record.remarks}
                                  onChange={(e) => onUpdateRecord(key, { remarks: e.target.value })}
                                />
                                <button onClick={() => setEditingKey(null)} className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded font-bold">সেভ</button>
                              </div>
                            ) : (
                              <div onClick={() => setEditingKey(key)} className="cursor-pointer no-print text-center">
                                <p className="text-[10px] font-bold text-slate-400">{record.paymentDate || '--/--/----'}</p>
                                <p className="text-[10px] italic text-slate-400 truncate max-w-[100px]">{record.remarks || '...'}</p>
                              </div>
                            )}
                            <div className="print-only text-center">
                              <p className="text-[10px] font-bold text-slate-400">{record.paymentDate || '--/--/----'}</p>
                              <p className="text-[10px] italic text-slate-400">{record.remarks || ''}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {recordKeys.length === 0 ? (
              <div className="py-10 text-center text-slate-400 italic bg-slate-50 rounded-2xl border border-dashed border-slate-200">এখনো কোনো রেকর্ড নেই</div>
            ) : (
              recordKeys.map(key => {
                const record = customer.records[key];
                const isEditing = editingKey === key;
                const isPaid = record.due <= 0 && record.paidAmount > 0;

                return (
                  <div key={key} className={`p-4 rounded-2xl border transition-all ${isEditing ? 'border-indigo-500 ring-2 ring-indigo-50 shadow-lg' : 'border-slate-100 bg-slate-50/50'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">বিলিং মাস</p>
                        <p className="font-black text-slate-800">{formatMonthKey(key)}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-lg font-black text-[10px] uppercase tracking-tighter ${isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {isPaid ? 'পরিশোধিত' : `বকেয়া: ৳${record.due}`}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase">বিলের পরিমাণ</p>
                        <p className="font-bold text-slate-600">৳{record.expectedBill}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase">পেমেন্ট আদায়</p>
                        {isEditing ? (
                          <input 
                            type="number"
                            autoFocus
                            className="w-full border-b-2 border-indigo-500 bg-transparent py-1 font-black text-indigo-600 outline-none"
                            value={record.paidAmount}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              onUpdateRecord(key, { paidAmount: val, due: record.expectedBill - val });
                            }}
                          />
                        ) : (
                          <p onClick={() => setEditingKey(key)} className="font-black text-slate-800 flex items-center gap-1">
                            ৳{record.paidAmount}
                            <svg className="w-3 h-3 text-slate-300" fill="currentColor" viewBox="0 0 20 20"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                          </p>
                        )}
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="space-y-3 pt-3 border-t border-indigo-100">
                        <div className="grid grid-cols-2 gap-3">
                           <div>
                             <label className="text-[9px] font-bold text-slate-400 uppercase">তারিখ</label>
                             <input 
                               type="date" 
                               className="w-full text-xs border rounded-lg p-2 outline-none border-slate-200 focus:border-indigo-500"
                               value={record.paymentDate}
                               onChange={(e) => onUpdateRecord(key, { paymentDate: e.target.value })}
                             />
                           </div>
                           <div>
                             <label className="text-[9px] font-bold text-slate-400 uppercase">মন্তব্য</label>
                             <input 
                               type="text" 
                               className="w-full text-xs border rounded-lg p-2 outline-none border-slate-200 focus:border-indigo-500"
                               value={record.remarks}
                               placeholder="..."
                               onChange={(e) => onUpdateRecord(key, { remarks: e.target.value })}
                             />
                           </div>
                        </div>
                        <button 
                          onClick={() => setEditingKey(null)} 
                          className="w-full bg-indigo-600 text-white py-2 rounded-xl font-bold text-sm shadow-md"
                        >
                          সংরক্ষণ করুন
                        </button>
                      </div>
                    ) : (
                      <div onClick={() => setEditingKey(key)} className="flex justify-between items-center text-[10px] text-slate-400 pt-3 border-t border-slate-100">
                         <p>তারিখ: <span className="font-bold text-slate-500">{record.paymentDate || '--/--/----'}</span></p>
                         <p className="italic">{record.remarks || 'কোনো মন্তব্য নেই'}</p>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="mt-16 text-center text-[10px] text-slate-300 print-only pt-10 border-t border-slate-100">
          রিপোর্ট জেনারেশন ডেট: {new Date().toLocaleDateString('bn-BD')}
        </div>
      </div>
    </div>
  );
};
