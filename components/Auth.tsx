
import React, { useState } from 'react';
import { authService } from '../services/authService.ts';
import { SyncModal } from './SyncModal.tsx';

interface AuthProps {
  onLoginSuccess: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      if (authService.login({ username, password })) {
        onLoginSuccess();
      } else {
        setError('ইউজারনেম বা পাসওয়ার্ড সঠিক নয়!');
      }
    } else {
      if (authService.signup({ username, password })) {
        setIsLogin(true);
        setError('একাউন্ট তৈরি হয়েছে! এখন লগইন করুন।');
      } else {
        setError('এই ইউজারনেম ইতিমধ্যে ব্যবহৃত হয়েছে!');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] relative overflow-hidden font-['Hind_Siliguri'] p-4">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-[120px]"></div>

      <div className="max-w-[440px] w-full relative z-10">
        <div className="bg-white rounded-[48px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-white overflow-hidden">
          
          {/* Header Section */}
          <div className="bg-slate-900 pt-14 pb-12 px-10 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
            
            {/* Logo Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-[28px] shadow-[0_12px_24px_-8px_rgba(37,99,235,0.5)] mb-6 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            
            <h1 className="text-3xl font-black text-white tracking-tight">ISP লেজার প্রো</h1>
            <p className="text-blue-400/80 text-[11px] font-bold uppercase tracking-[0.3em] mt-2">Enterprise Cloud Billing</p>
          </div>

          {/* Form Section */}
          <div className="px-10 py-12">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                {isLogin ? 'স্বাগতম!' : 'রেজিস্ট্রেশন'}
              </h2>
              <p className="text-slate-400 text-xs mt-2 font-medium">
                {isLogin ? 'আপনার অ্যাকাউন্টে লগইন করুন' : 'নতুন একটি অ্যাকাউন্ট তৈরি করুন'}
              </p>
            </div>

            {error && (
              <div className={`mb-8 p-4 rounded-2xl text-center text-[11px] font-bold animate-in fade-in slide-in-from-top-2 duration-300 ${
                error.includes('হয়েছে') 
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                : 'bg-red-50 text-red-500 border border-red-100'
              }`}>
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="group">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2.5 ml-1 group-focus-within:text-blue-600 transition-colors">
                  ইউজারনেম
                </label>
                <div className="relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    required
                    type="text"
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl pl-14 pr-6 py-4.5 text-[15px] font-bold text-slate-800 placeholder:text-slate-300 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                    placeholder="আপনার ইউজারনেম"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2.5 ml-1 group-focus-within:text-blue-600 transition-colors">
                  পাসওয়ার্ড
                </label>
                <div className="relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    required
                    type="password"
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl pl-14 pr-6 py-4.5 text-[15px] font-bold text-slate-800 placeholder:text-slate-300 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-[20px] transition-all shadow-[0_12px_24px_-8px_rgba(37,99,235,0.4)] hover:shadow-[0_20px_32px_-10px_rgba(37,99,235,0.5)] active:scale-[0.98] text-sm tracking-wide mt-4"
              >
                {isLogin ? 'লগইন করুন' : 'রেজিস্ট্রেশন করুন'}
              </button>
            </form>

            {/* Bottom Actions */}
            <div className="mt-10 pt-10 border-t border-slate-50 space-y-6">
              <p className="text-slate-400 text-xs font-bold text-center">
                {isLogin ? 'আপনার কি কোনো একাউন্ট নেই?' : 'ইতিমধ্যে একাউন্ট আছে?'}
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                  }}
                  className="ml-2 text-blue-600 hover:text-indigo-600 font-black transition-colors"
                >
                  {isLogin ? 'নতুন তৈরি করুন' : 'এখনই লগইন করুন'}
                </button>
              </p>
              
              <div className="flex justify-center">
                <button 
                  onClick={() => setIsSyncModalOpen(true)}
                  className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-100 hover:text-slate-900 transition-all border border-transparent hover:border-slate-200"
                >
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  ডাটা ব্যাকআপ ও রিস্টোর
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer Attribution */}
        <p className="text-center mt-10 text-slate-400 font-bold text-[10px] uppercase tracking-[0.25em]">
          &copy; 2025 <span className="text-slate-600">ISP LEDGER PRO</span> • SECURED ACCESS
        </p>
      </div>

      <SyncModal 
        isOpen={isSyncModalOpen} 
        onClose={() => setIsSyncModalOpen(false)} 
        onRestoreSuccess={() => {
          setError('ডাটা সফলভাবে রিস্টোর হয়েছে! এখন লগইন করুন।');
        }}
      />
      
      {/* Small UI detail for spacing when keyboard is open on mobile */}
      <div className="h-4 sm:hidden"></div>
    </div>
  );
};
