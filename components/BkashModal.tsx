
import React, { useState } from 'react';

interface BkashModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (trxId: string) => void;
  customerName: string;
  amount: number;
}

export const BkashModal: React.FC<BkashModalProps> = ({ isOpen, onClose, onConfirm, customerName, amount }) => {
  const [trxId, setTrxId] = useState('');
  const [step, setStep] = useState<'input' | 'success'>('input');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('success');
    setTimeout(() => {
      onConfirm(trxId || `BK${Math.random().toString(36).substring(2, 10).toUpperCase()}`);
      setTrxId('');
      setStep('input');
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-[200]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200">
        <div className="bg-[#e2136e] px-6 py-8 text-center relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
          <div className="bg-white w-16 h-16 rounded-xl mx-auto flex items-center justify-center shadow-lg mb-4">
            <span className="text-[#e2136e] font-black text-xl italic tracking-tighter">bKash</span>
          </div>
          <h2 className="text-white text-lg font-bold">পেমেন্ট গেটওয়ে</h2>
        </div>

        {step === 'input' ? (
          <form className="p-8 space-y-6" onSubmit={handleSubmit}>
            <div className="text-center py-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">প্রদেয় বিল</p>
              <p className="text-3xl font-bold text-slate-800 tracking-tight">৳{amount}</p>
              <p className="text-[11px] font-medium text-[#e2136e] mt-1">{customerName}</p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Transaction ID (ঐচ্ছিক)</label>
              <input
                autoFocus
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-pink-100 focus:border-[#e2136e] outline-none font-mono text-center text-lg font-bold text-slate-700 placeholder:text-slate-300 transition-all"
                value={trxId}
                onChange={e => setTrxId(e.target.value)}
                placeholder="X92H...J7W"
              />
              <p className="text-[9px] text-slate-400 font-medium mt-3 text-center italic">খালি রাখলে সিস্টেম অটো-জেনারেট করবে</p>
            </div>

            <button
              type="submit"
              className="w-full bg-[#e2136e] text-white font-bold py-3.5 rounded-lg hover:bg-[#c61060] transition-all active:scale-[0.98] shadow-md shadow-pink-900/10 flex items-center justify-center gap-2"
            >
              পেমেন্ট কনফার্ম করুন
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
            </button>
          </form>
        ) : (
          <div className="p-12 flex flex-col items-center justify-center space-y-4 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
            </div>
            <div>
              <p className="font-bold text-slate-800 text-lg">পেমেন্ট সম্পন্ন হয়েছে</p>
              <p className="text-slate-400 text-xs font-medium">লেজার ডাটা হালনাগাদ করা হচ্ছে...</p>
            </div>
          </div>
        )}
        
        <div className="bg-slate-50 py-3 text-center border-t border-slate-100">
           <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">Secure Cloud Billing Node 2.0</p>
        </div>
      </div>
    </div>
  );
};
