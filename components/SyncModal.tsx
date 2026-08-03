import React, { useState } from 'react';
import { syncService } from '../services/syncService.ts';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreSuccess: () => void;
}

const copyTextToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn("Clipboard API failed, trying legacy fallback:", err);
  }

  // Fallback
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error("Fallback copy failed:", err);
    return false;
  }
};

export const SyncModal: React.FC<SyncModalProps> = ({ isOpen, onClose, onRestoreSuccess }) => {
  const [syncCode, setSyncCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError('');
    setSuccess('');
    try {
      const code = await syncService.generateShortSyncCode();
      setGeneratedCode(code);
      const ok = await copyTextToClipboard(code);
      if (ok) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err: any) {
      setError(err.message || 'কোড জেনারেট করতে সমস্যা হয়েছে!');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!syncCode.trim()) return;

    setIsRestoring(true);
    setError('');
    setSuccess('');

    try {
      const ok = await syncService.restoreFromSyncCode(syncCode);
      if (ok) {
        setSuccess('ডাটা সফলভাবে রিস্টোর করা হয়েছে!');
        setSyncCode('');
        setTimeout(() => {
          onRestoreSuccess();
          onClose();
        }, 1500);
      } else {
        setError('ডাটা রিস্টোর করতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।');
      }
    } catch (err: any) {
      setError(err.message || 'ভুল কোড অথবা মেয়াদ শেষ হয়ে গেছে!');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col font-['Hind_Siliguri'] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v8" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800">ক্লাউড ব্যাকআপ ও রিস্টোর</h3>
              <p className="text-[10px] text-slate-400 font-bold">অন্যান্য ব্রাউজার বা ডিভাইসে ডাটা ট্রান্সফার করুন</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 text-xs font-bold">
              {success}
            </div>
          )}

          {/* Option 1: Backup / Generate Code */}
          <div className="space-y-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">১. ব্যাকআপ করুন (ডেটা ক্লাউডে সেভ করুন)</span>
            
            {generatedCode ? (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 mb-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">আপনার সংক্ষিপ্ত সিঙ্ক কোড</span>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-black text-blue-600 tracking-wider font-mono">{generatedCode}</span>
                  <button 
                    onClick={async () => {
                      const ok = await copyTextToClipboard(generatedCode);
                      if (ok) {
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }
                    }}
                    className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-all"
                    title="কোড কপি করুন"
                  >
                    {copied ? (
                      <span className="text-[10px] font-bold text-emerald-600">কপিড!</span>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    )}
                  </button>
                </div>
                <span className="text-[9px] text-slate-400 font-bold">মেয়াদ: ৩০ দিন (যেকোনো ডিভাইসে রিস্টোর করতে পারবেন)</span>
              </div>
            ) : (
              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:bg-blue-400"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    কোড তৈরি হচ্ছে...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    ব্যাকআপ কোড তৈরি করুন
                  </>
                )}
              </button>
            )}
          </div>

          <div className="border-t border-slate-100 my-4"></div>

          {/* Option 2: Restore from code */}
          <form onSubmit={handleRestore} className="space-y-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">২. রিস্টোর করুন (পূর্বের ডাটা ফিরে পান)</span>
            <div className="flex gap-2">
              <input 
                type="text" 
                required
                maxLength={10}
                placeholder="৬-সংখ্যার কোডটি লিখুন"
                value={syncCode}
                onChange={(e) => setSyncCode(e.target.value.replace(/\D/g, ''))}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none font-bold text-center text-slate-800 text-sm tracking-wider"
              />
              <button 
                type="submit"
                disabled={isRestoring || !syncCode.trim()}
                className="px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 disabled:bg-slate-300"
              >
                {isRestoring ? (
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    রিস্টোর
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
