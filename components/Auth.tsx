
import React, { useState } from 'react';
import { authService } from '../services/authService.ts';
import { SiteLogo } from './SiteLogo.tsx';
import { SiteSettings } from '../types.ts';
import { SyncModal } from './SyncModal.tsx';
import { firebaseService } from '../services/firebaseService';

interface AuthProps {
  onLoginSuccess: () => void;
  settings?: SiteSettings;
}

export const Auth: React.FC<AuthProps> = ({ onLoginSuccess, settings }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (isLogin) {
      try {
        // 1. Try to fetch user credentials directly from Firebase Firestore first
        const cloudUser = await firebaseService.fetchUserFromCloud(username);
        
        if (cloudUser) {
          if (cloudUser.password === password) {
            // Save/sync this user to the local users list
            const localUsers = authService.getUsers();
            const existsIdx = localUsers.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
            if (existsIdx !== -1) {
              localUsers[existsIdx] = cloudUser;
            } else {
              localUsers.push(cloudUser);
            }
            authService.saveUsers(localUsers);

            // Determine master account username to load correct data
            let masterUname = username;
            if (cloudUser.role === 'staff' && cloudUser.createdBy) {
              masterUname = cloudUser.createdBy;
            }

            // 2. Fetch the latest business data backup from Cloud for this master account
            await firebaseService.downloadBackupFromCloud(masterUname);
          }
        }
      } catch (err) {
        console.warn('Could not sync data from cloud during login, continuing with local cache:', err);
      }

      // 3. Complete login via local authService (which now has synced credentials and data)
      if (authService.login({ username, password })) {
        setIsLoading(false);
        onLoginSuccess();
      } else {
        setIsLoading(false);
        setError('ইউজারনেম বা পাসওয়ার্ড সঠিক নয়!');
      }
    } else {
      const result = authService.signup({ username, password });
      setIsLoading(false);
      if (result.success) {
        setIsLogin(true);
        setError(result.message);
      } else {
        setError(result.message);
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
          <div className="bg-slate-900 pt-10 pb-10 px-8 text-center relative overflow-hidden flex flex-col items-center">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
            
            {/* Logo Icon / Custom Logo */}
            {settings ? (
              <SiteLogo settings={settings} size="lg" lightMode={false} />
            ) : (
              <>
                <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-[28px] shadow-[0_12px_24px_-8px_rgba(37,99,235,0.5)] mb-4 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-black text-white tracking-tight">ISP লেজার প্রো</h1>
                <p className="text-blue-400/80 text-[11px] font-bold uppercase tracking-[0.3em] mt-2">Enterprise Cloud Billing</p>
              </>
            )}
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
                disabled={isLoading}
                className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-[20px] transition-all shadow-[0_12px_24px_-8px_rgba(37,99,235,0.4)] hover:shadow-[0_20px_32px_-10px_rgba(37,99,235,0.5)] active:scale-[0.98] text-sm tracking-wide mt-4 flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    মেঘের সাথে সিঙ্ক হচ্ছে...
                  </>
                ) : (
                  isLogin ? 'লগইন করুন' : 'রেজিস্ট্রেশন করুন'
                )}
              </button>
            </form>

            <div className="border-t border-slate-100 my-6"></div>

            <button
              onClick={() => setIsSyncModalOpen(true)}
              className="w-full py-3.5 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-[16px] border border-dashed border-slate-200 hover:border-blue-200 transition-all font-black text-xs flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v8" />
              </svg>
              অন্য ব্রাউজারের ব্যাকআপ রিস্টোর করুন
            </button>
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
        onRestoreSuccess={onLoginSuccess} 
      />

      {/* Small UI detail for spacing when keyboard is open on mobile */}
      <div className="h-4 sm:hidden"></div>
    </div>
  );
};
