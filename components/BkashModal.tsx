
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
    }, 1800);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 z-[200] animate-in">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden border-[6px] border-[#D12053] premium-shadow transform-gpu">
        <div className="bg-[#D12053] px-8 py-10 text-center relative">
          <button onClick={onClose} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
          <div className="bg-white w-24 h-24 rounded-[2rem] mx-auto flex items-center justify-center shadow-2xl mb-6 transform hover:rotate-6 transition-transform">
            <span className="text-[#D12053] font-black text-3xl italic">বিকাশ</span>
          </div>
          <h2 className="text-white text-2xl font-black tracking-tight">পেমেন্ট গেটওয়ে</h2>
          <p className="text-pink-200 text-[10px] font-black uppercase tracking-[0.2em] mt-2 opacity-80">Secure Transaction Engine</p>
        </div>

        {step === 'input' ? (
          <form className="p-10 space-y-8" onSubmit={handleSubmit}>
            <div className="text-center bg-pink-50 py-6 rounded-3xl border border-pink-100">
              <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">নির্ধারিত বিল</p>
              <p className="text-5xl font-black text-[#D12053] tracking-tighter">৳{amount}</p>
              <p className="text-[10px] font-bold text-pink-400 mt-2">{customerName}</p>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Transaction ID (TrxID)</label>
              <input
                autoFocus
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-5 focus:ring-4 focus:ring-pink-100 focus:border-[#D12053] focus:bg-white transition-all outline-none font-mono text-center text-xl font-bold text-[#D12053] placeholder:opacity-20 uppercase"
                value={trxId}
                onChange={e => setTrxId(e.target.value)}
                placeholder="X92H...J7W"
              />
              <p className="text-[10px] text-slate-400 font-bold mt-4 text-center italic">খালি রাখলে সিস্টেম অটো-জেনারেট করবে</p>
            </div>

            <button
              type="submit"
              className="w-full bg-[#D12053] text-white font-black py-5 rounded-2xl hover:bg-[#b01a45] shadow-2xl shadow-pink-600/30 transition-all active:scale-95 flex items-center justify-center gap-4 text-lg"
            >
              পেমেন্ট নিশ্চিত করুন
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
            </button>
          </form>
        ) : (
          <div className="p-16 flex flex-col items-center justify-center space-y-6 text-center">
            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 animate-bounce">
              <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
            </div>
            <div>
              <p className="font-black text-slate-800 text-2xl mb-1 tracking-tight">পেমেন্ট সফল!</p>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Updating Ledger Data...</p>
            </div>
          </div>
        )}
        
        <div className="bg-slate-50 py-5 text-center border-t border-slate-100">
           <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em]">PCI DSS Level 1 Compliant</p>
        </div>
      </div>
    </div>
  );
};
