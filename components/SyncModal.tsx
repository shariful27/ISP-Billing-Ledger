
import React, { useState } from 'react';
import { syncService } from '../services/syncService.ts';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreSuccess: () => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({ isOpen, onClose, onRestoreSuccess }) => {
  const [syncCode, setSyncCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  if (!isOpen) return null;

  const handleGenerate = () => {
    const code = syncService.generateSyncCode();
    setSyncCode(code);
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRestore = () => {
    if (syncService.restoreFromCode(syncCode)) {
      setStatus('success');
      setTimeout(() => {
        onRestoreSuccess();
        onClose();
      }, 1500);
    } else {
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[250] flex items-center justify-center p-4">
      <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg border border-slate-100 overflow-hidden">
        <div className="bg-blue-600 p-8 text-center text-white relative">
          <button onClick={onClose} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
          <div className="bg-white/20 w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4">
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
          </div>
          <h2 className="text-xl font-black">ক্লাউড সিঙ্ক ও ব্যাকআপ</h2>
          <p className="text-blue-100 text-xs mt-1">যেকোনো ডিভাইসে ডাটা ট্রান্সফার করুন</p>
        </div>

        <div className="p-8 space-y-8">
          {/* Export Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">১. সিঙ্ক কোড তৈরি করুন</h3>
               {copied && <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded">কপি হয়েছে!</span>}
            </div>
            <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">আপনার সব গ্রাহকের ডাটা এবং ইউজার একাউন্ট একটি কোডে রূপান্তর করতে নিচের বাটনে ক্লিক করুন। এই কোডটি অন্য ডিভাইসে ব্যবহার করতে পারবেন।</p>
            <button 
              onClick={handleGenerate}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
              কোড জেনারেট ও কপি করুন
            </button>
          </div>

          <div className="relative">
             <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-100"></div>
             </div>
             <div className="relative flex justify-center">
                <span className="bg-white px-4 text-[10px] font-black text-slate-300 uppercase tracking-widest italic">অথবা</span>
             </div>
          </div>

          {/* Import Section */}
          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">২. ডাটা রিস্টোর করুন</h3>
            <textarea 
              className={`w-full bg-slate-50 border-2 rounded-2xl px-5 py-4 text-[10px] font-mono focus:bg-white transition-all outline-none resize-none h-24 ${status === 'error' ? 'border-red-200' : 'border-slate-100 focus:border-blue-500'}`}
              placeholder="এখানে সিঙ্ক কোডটি পেস্ট করুন..."
              value={syncCode}
              onChange={(e) => setSyncCode(e.target.value)}
            />
            {status === 'error' && <p className="text-[10px] text-red-500 font-bold mt-2 ml-1 italic">সঠিক সিঙ্ক কোড প্রদান করুন!</p>}
            
            <button 
              onClick={handleRestore}
              className="w-full mt-4 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 active:scale-95"
            >
              {status === 'success' ? 'সফলভাবে রিস্টোর হয়েছে!' : 'ডাটা ইমপোর্ট করুন'}
            </button>
          </div>
        </div>
        
        <div className="bg-slate-50 py-4 text-center border-t border-slate-100">
           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">ডাটা ব্যাকআপ রাখা অত্যন্ত জরুরি</p>
        </div>
      </div>
    </div>
  );
};
