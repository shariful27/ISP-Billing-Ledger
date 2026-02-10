
import React, { useState } from 'react';
import { authService } from '../services/authService.ts';

interface AuthProps {
  onLoginSuccess: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-['Hind_Siliguri']">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-100">
          <div className="bg-slate-900 p-10 text-center relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-600"></div>
            <div className="bg-blue-600 w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">ISP লেজার প্রো</h1>
            <p className="text-blue-300 text-[10px] font-bold uppercase tracking-widest mt-1">Smart Billing Management</p>
          </div>

          <div className="p-10">
            <div className="text-center mb-8">
              <h2 className="text-xl font-black text-slate-800">{isLogin ? 'লগইন করুন' : 'নতুন একাউন্ট'}</h2>
              <p className="text-slate-400 text-xs mt-1 font-medium italic">আপনার পোর্টালে প্রবেশ করুন</p>
            </div>

            {error && (
              <div className={`mb-6 p-4 rounded-xl text-center text-xs font-bold ${error.includes('হয়েছে') ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-500 border border-red-100'}`}>
                {error}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">ইউজারনেম</label>
                <input
                  required
                  type="text"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 focus:border-blue-500 focus:bg-white transition-all outline-none placeholder:text-slate-300"
                  placeholder="admin_isp"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">পাসওয়ার্ড</label>
                <input
                  required
                  type="password"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 focus:border-blue-500 focus:bg-white transition-all outline-none placeholder:text-slate-300"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-blue-100 active:scale-95 text-sm"
              >
                {isLogin ? 'প্রবেশ করুন' : 'একাউন্ট তৈরি করুন'}
              </button>
            </form>

            <div className="mt-8 text-center pt-8 border-t border-slate-50">
              <p className="text-slate-400 text-[11px] font-bold">
                {isLogin ? 'একাউন্ট নেই?' : 'ইতিমধ্যে একাউন্ট আছে?'}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="ml-2 text-blue-600 hover:underline font-black"
                >
                  {isLogin ? 'নতুন তৈরি করুন' : 'লগইন করুন'}
                </button>
              </p>
            </div>
          </div>
        </div>
        <p className="text-center mt-8 text-slate-300 font-bold text-[9px] uppercase tracking-widest">&copy; 2025 ISP LEDGER PRO • SECURE NODE</p>
      </div>
    </div>
  );
};
