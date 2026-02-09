
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
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden border-4 border-[#D12053] animate-in zoom-in-95 duration-300">
        <div className="bg-[#D12053] px-6 py-8 text-center relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
          <div className="bg-white w-20 h-20 rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-4">
            <span className="text-[#D12053] font-black text-2xl italic">বিকাশ</span>
          </div>
          <h2 className="text-white text-xl font-black">বিকাশ পেমেন্ট</h2>
          <p className="text-pink-100 text-xs mt-1">গ্রাহক: {customerName}</p>
        </div>

        {step === 'input' ? (
          <form className="p-8 space-y-6" onSubmit={handleSubmit}>
            <div className="text-center">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">পেমেন্ট অ্যামাউন্ট</p>
              <p className="text-4xl font-black text-slate-800">৳{amount}</p>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Transaction ID (TrxID)</label>
              <input
                autoFocus
                className="w-full bg-pink-50 border-2 border-pink-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-pink-100 focus:border-[#D12053] focus:bg-white transition-all outline-none font-mono text-center text-lg font-bold text-[#D12053]"
                value={trxId}
                onChange={e => setTrxId(e.target.value.toUpperCase())}
                placeholder="TRX12345678"
              />
              <p className="text-[9px] text-pink-400 font-bold mt-2 text-center">খালি রাখলে অটো-জেনারেট হবে</p>
            </div>

            <button
              type="submit"
              className="w-full bg-[#D12053] text-white font-black py-5 rounded-2xl hover:bg-[#b01a45] shadow-xl shadow-pink-200 transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              নিশ্চিত করুন
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
            </button>
          </form>
        ) : (
          <div className="p-12 flex flex-col items-center justify-center space-y-4 animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="font-black text-slate-800 text-xl text-center">সফলভাবে সম্পন্ন হয়েছে!</p>
            <p className="text-slate-400 text-sm">লেজার অটোমেটিক আপডেট হচ্ছে...</p>
          </div>
        )}
        
        <div className="bg-slate-50 py-3 text-center border-t border-slate-100">
           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Digital Payment Gateway v1.0</p>
        </div>
      </div>
    </div>
  );
};
