import React, { useState, useEffect } from 'react';
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
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usePasswordLogin, setUsePasswordLogin] = useState(false);
  const [error, setError] = useState('');
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [urlLoginStatus, setUrlLoginStatus] = useState<string | null>(null);
  const [pendingApprovalInfo, setPendingApprovalInfo] = useState<{ username: string; deviceId: string; deviceName: string } | null>(null);
  const [isCheckingApproval, setIsCheckingApproval] = useState(false);

  // 1. Auto-login via URL Magic Link parameters (?user=... or ?reseller=... and ?token=... or ?key=...)
  useEffect(() => {
    const handleUrlLogin = async () => {
      if (typeof window === 'undefined') return;
      const urlParams = new URLSearchParams(window.location.search);
      const userParam = urlParams.get('user') || urlParams.get('reseller') || urlParams.get('login') || urlParams.get('u');
      const tokenParam = urlParams.get('token') || urlParams.get('key') || urlParams.get('pass') || urlParams.get('p');

      if (userParam) {
        const cleanUname = userParam.trim().toLowerCase();
        setIsLoading(true);
        setUrlLoginStatus(`'${userParam}' একাউন্টে স্বয়ংক্রিয় লগইন হচ্ছে...`);

        try {
          // Sync users from cloud to ensure local DB has latest user data
          try {
            await firebaseService.syncUsersFromCloud();
          } catch (e) {
            console.warn(e);
          }

          // Fetch user details from cloud or local
          let targetUser = await firebaseService.getUserFromCloud(cleanUname);
          if (!targetUser) {
            const localUsers = authService.getUsers();
            targetUser = localUsers.find(u => u.username.toLowerCase() === cleanUname) || null;
          }

          let isAuthenticated = false;

          if (targetUser) {
            if (!tokenParam) {
              // Direct login link for registered user
              isAuthenticated = true;
            } else {
              let decodedPass = '';
              try {
                decodedPass = decodeURIComponent(atob(tokenParam));
                if (decodedPass.includes(':')) {
                  decodedPass = decodedPass.split(':')[1] || '';
                }
              } catch {
                decodedPass = tokenParam;
              }

              if (!targetUser.password || targetUser.password === decodedPass || decodedPass === tokenParam) {
                isAuthenticated = true;
              } else {
                // If it doesn't match direct decode, check raw equality
                isAuthenticated = targetUser.password === tokenParam;
              }
            }
          }

          if (isAuthenticated && targetUser) {
            // Auto log in locally
            authService.loginApprovedDevice({
              username: cleanUname,
              permissions: targetUser.permissions
            });

            // Master username for cloud download
            let masterUname = cleanUname;
            if (targetUser.role === 'staff' && targetUser.createdBy) {
              masterUname = targetUser.createdBy;
            }

            try {
              await firebaseService.downloadBackupFromCloud(masterUname, true);
            } catch (err) {
              console.warn(err);
            }

            // Remove params from URL to keep clean address bar
            try {
              const cleanUrl = window.location.origin + window.location.pathname;
              window.history.replaceState({}, document.title, cleanUrl);
            } catch (e) {
              console.warn(e);
            }

            setIsLoading(false);
            setUrlLoginStatus(null);
            onLoginSuccess();
            return;
          } else {
            setError(`'${userParam}' লিঙ্কটি সঠিক নয় অথবা ইউজার পাওয়া যায়নি!`);
          }
        } catch (e) {
          console.error('URL login error:', e);
          setError('লিঙ্ক দিয়ে লগইন করার সময় সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
        } finally {
          setIsLoading(false);
          setUrlLoginStatus(null);
        }
      }
    };

    handleUrlLogin();
  }, [onLoginSuccess]);

  // Auto-check on mount if there's an existing request
  useEffect(() => {
    const checkExistingPending = async () => {
      const pendingUser = localStorage.getItem('isp_pending_username');
      if (pendingUser) {
        const deviceId = authService.getDeviceId();
        setIsLoading(true);
        try {
          const reqDoc = await firebaseService.getDeviceRequest(pendingUser, deviceId);
          if (reqDoc) {
            if (reqDoc.status === 'approved') {
              authService.loginApprovedDevice({ username: pendingUser, permissions: reqDoc.permissions });
              try {
                await firebaseService.downloadBackupFromCloud('admin', true);
              } catch (err) {
                console.warn(err);
              }
              onLoginSuccess();
            } else if (reqDoc.status === 'pending') {
              setPendingApprovalInfo({
                username: pendingUser,
                deviceId,
                deviceName: reqDoc.deviceName || authService.getDeviceDetails()
              });
            } else if (reqDoc.status === 'rejected') {
              setError('আপনার ডিভাইসটির অনুমোদন এডমিন দ্বারা প্রত্যাখ্যান করা হয়েছে!');
            }
          }
        } catch (e) {
          console.error('Error checking existing pending:', e);
        } finally {
          setIsLoading(false);
        }
      }
    };
    checkExistingPending();
  }, [onLoginSuccess]);

  // Auto-poll approval status every 5 seconds when pending screen is visible
  useEffect(() => {
    if (!pendingApprovalInfo) return;

    const intervalId = setInterval(async () => {
      try {
        const reqDoc = await firebaseService.getDeviceRequest(pendingApprovalInfo.username, pendingApprovalInfo.deviceId);
        if (reqDoc && reqDoc.status === 'approved') {
          clearInterval(intervalId);
          setPendingApprovalInfo(null);
          authService.loginApprovedDevice({ 
            username: pendingApprovalInfo.username, 
            permissions: reqDoc.permissions 
          });
          try {
            await firebaseService.downloadBackupFromCloud('admin', true);
          } catch (err) {
            console.warn(err);
          } finally {
            onLoginSuccess();
          }
        } else if (reqDoc && reqDoc.status === 'rejected') {
          clearInterval(intervalId);
          setPendingApprovalInfo(null);
          setError('আপনার এই ডিভাইসটির অনুমোদন এডমিন দ্বারা প্রত্যাখ্যান করা হয়েছে!');
          localStorage.removeItem('isp_pending_username');
        }
      } catch (err) {
        console.warn('Auto checking approval status failed:', err);
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(intervalId);
  }, [pendingApprovalInfo, onLoginSuccess]);

  const checkDeviceApprovalStatus = async (uname: string, devId: string) => {
    setIsCheckingApproval(true);
    setError('');
    try {
      const reqDoc = await firebaseService.getDeviceRequest(uname, devId);
      if (reqDoc) {
        if (reqDoc.status === 'approved') {
          setPendingApprovalInfo(null);
          // Auto log in locally
          authService.loginApprovedDevice({ username: uname, permissions: reqDoc.permissions });
          // Force download cloud data
          try {
            await firebaseService.downloadBackupFromCloud('admin', true);
          } catch (err) {
            console.warn(err);
          } finally {
            onLoginSuccess();
          }
        } else if (reqDoc.status === 'rejected') {
          setPendingApprovalInfo(null);
          setError('আপনার এই ডিভাইসটির অনুমোদন এডমিন দ্বারা প্রত্যাখ্যান করা হয়েছে!');
          localStorage.removeItem('isp_pending_username');
        } else {
          alert('আপনার অনুরোধটি এখনো পেন্ডিং অবস্থায় আছে। অনুগ্রহ করে এডমিনের অনুমোদনের জন্য অপেক্ষা করুন।');
        }
      } else {
        alert('ডিভাইস অনুমোদন তথ্য পাওয়া যায়নি। অনুগ্রহ করে আবার অনুরোধ পাঠান।');
        setPendingApprovalInfo(null);
        localStorage.removeItem('isp_pending_username');
      }
    } catch (err) {
      console.error(err);
      alert('সংযোগ করা যাচ্ছে না, আবার চেষ্টা করুন।');
    } finally {
      setIsCheckingApproval(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      setError('আপনার নাম প্রদান করুন!');
      setIsLoading(false);
      return;
    }

    if (cleanUsername === 'admin') {
      // Admin authentication requires Master PIN
      if (!password.trim()) {
        setError('এডমিন পিন প্রবেশ করুন!');
        setIsLoading(false);
        return;
      }

      if (authService.login({ username: 'admin', password: password.trim() })) {
        try {
          await firebaseService.downloadBackupFromCloud('admin', true);
        } catch (err) {
          console.warn(err);
        } finally {
          setIsLoading(false);
          onLoginSuccess();
        }
      } else {
        setIsLoading(false);
        setError('ভুল এডমিন পিন! আবার চেষ্টা করুন।');
      }
      return;
    }

    // Direct Password Login for Resellers / Staff (Works instantly on ANY device)
    if (usePasswordLogin || password.trim()) {
      const inputPass = password.trim();
      if (!inputPass) {
        setError('পাসওয়ার্ড প্রদান করুন!');
        setIsLoading(false);
        return;
      }

      // Check local user DB first
      if (authService.login({ username: cleanUsername, password: inputPass })) {
        const u = authService.getCurrentUser();
        let masterUname = cleanUsername;
        if (u?.role === 'staff' && u.createdBy) {
          masterUname = u.createdBy;
        }
        try {
          await firebaseService.downloadBackupFromCloud(masterUname, true);
        } catch (err) {
          console.warn(err);
        } finally {
          setIsLoading(false);
          onLoginSuccess();
        }
        return;
      }

      // Check cloud user DB if not in local storage
      try {
        const cloudUser = await firebaseService.getUserFromCloud(cleanUsername);
        if (cloudUser && (cloudUser.password === inputPass || !cloudUser.password)) {
          authService.loginApprovedDevice({
            username: cleanUsername,
            permissions: cloudUser.permissions
          });
          let masterUname = cleanUsername;
          if (cloudUser.role === 'staff' && cloudUser.createdBy) {
            masterUname = cloudUser.createdBy;
          }
          try {
            await firebaseService.downloadBackupFromCloud(masterUname, true);
          } catch (err) {
            console.warn(err);
          } finally {
            setIsLoading(false);
            onLoginSuccess();
          }
          return;
        } else if (cloudUser && cloudUser.password && cloudUser.password !== inputPass) {
          setIsLoading(false);
          setError('ভুল পাসওয়ার্ড! সঠিক পাসওয়ার্ড লিখুন অথবা এডমিনের সাথে যোগাযোগ করুন।');
          return;
        }
      } catch (err) {
        console.warn('Cloud user auth fallback check failed:', err);
      }
    }

    // Standard Staff Device Request (Approval Based)
    const deviceId = authService.getDeviceId();
    const deviceName = authService.getDeviceDetails();

    try {
      let reqDoc = await firebaseService.getDeviceRequest(cleanUsername, deviceId);
      if (!reqDoc) {
        reqDoc = await firebaseService.createDeviceRequest(cleanUsername, deviceId, deviceName);
      }

      if (reqDoc) {
        localStorage.setItem('isp_pending_username', cleanUsername);
        if (reqDoc.status === 'approved') {
          authService.loginApprovedDevice({ username: cleanUsername, permissions: reqDoc.permissions });
          try {
            await firebaseService.downloadBackupFromCloud('admin', true);
          } catch (err) {
            console.warn(err);
          } finally {
            setIsLoading(false);
            onLoginSuccess();
          }
        } else if (reqDoc.status === 'rejected') {
          setIsLoading(false);
          setError('আপনার এই ডিভাইসটির অনুমোদন এডমিন দ্বারা প্রত্যাখ্যান করা হয়েছে!');
          localStorage.removeItem('isp_pending_username');
        } else {
          setIsLoading(false);
          setPendingApprovalInfo({ username: cleanUsername, deviceId, deviceName: reqDoc.deviceName || deviceName });
        }
      }
    } catch (err) {
      console.error(err);
      setError('সংযোগ করা যাচ্ছে না, আবার চেষ্টা করুন।');
      setIsLoading(false);
    }
  };

  const handleResetRequest = () => {
    localStorage.removeItem('isp_pending_username');
    setPendingApprovalInfo(null);
    setUsername('');
    setPassword('');
    setError('');
  };

  if (pendingApprovalInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] relative overflow-hidden font-['Hind_Siliguri'] p-4">
        {/* Background Decorative Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-100/50 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-100/50 rounded-full blur-[120px]"></div>

        <div className="max-w-[440px] w-full relative z-10 animate-in fade-in zoom-in duration-300">
          <div className="bg-white rounded-[48px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-white overflow-hidden">
            
            {/* Header Section */}
            <div className="bg-slate-900 pt-10 pb-10 px-8 text-center relative overflow-hidden flex flex-col items-center">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 to-orange-600"></div>
              
              <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-500 rounded-[28px] shadow-[0_12px_24px_-8px_rgba(245,158,11,0.5)] mb-4 animate-pulse">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">অনুমোদন পেন্ডিং আছে</h1>
              <p className="text-amber-400/80 text-[11px] font-bold uppercase tracking-[0.2em] mt-2">Approval Pending</p>
            </div>

            {/* Content Section */}
            <div className="px-10 py-12">
              <div className="text-center mb-8">
                <p className="text-slate-600 text-sm font-semibold leading-relaxed">
                  আপনার ডিভাইসটি অনুমোদনের জন্য এডমিন প্যানেলে পাঠানো হয়েছে। এডমিন অনুমোদন করলে আপনি সরাসরি ড্যাশবোর্ড দেখতে পাবেন।
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4 mb-8">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold">আবেদনকারীর নাম:</span>
                  <span className="text-slate-700 font-black uppercase">{pendingApprovalInfo.username}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold">ডিভাইস মডেল:</span>
                  <span className="text-slate-700 font-black">{pendingApprovalInfo.deviceName}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold">অনুরোধের স্ট্যাটাস:</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-600 border border-amber-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                    পেন্ডিং (Pending)
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => checkDeviceApprovalStatus(pendingApprovalInfo.username, pendingApprovalInfo.deviceId)}
                  disabled={isCheckingApproval}
                  className="w-full py-4.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl transition-all shadow-[0_12px_24px_-8px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2 disabled:opacity-75"
                >
                  {isCheckingApproval ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      চেক করা হচ্ছে...
                    </>
                  ) : (
                    'অনুমোদন স্ট্যাটাস চেক করুন'
                  )}
                </button>

                <button
                  onClick={handleResetRequest}
                  className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all text-xs"
                >
                  অন্য নামে অনুরোধ পাঠান
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                <p className="text-blue-400/80 text-[11px] font-bold uppercase tracking-[0.3em] mt-2">Smart Cloud Billing</p>
              </>
            )}
          </div>

          {/* Form Section */}
          <div className="px-10 py-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                {urlLoginStatus ? 'স্বয়ংক্রিয় লগইন' : 'ISP লগইন ও অনুমোদন প্যানেল'}
              </h2>
              <p className="text-slate-400 text-xs mt-2 font-medium">
                {urlLoginStatus || 'লিঙ্ক, পাসওয়ার্ড অথবা অনুমোদন অনুরোধের মাধ্যমে যেকোনো ডিভাইস থেকে লগইন করুন'}
              </p>
            </div>

            {urlLoginStatus && (
              <div className="mb-6 p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold text-center flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {urlLoginStatus}
              </div>
            )}

            {error && (
              <div className={`mb-8 p-4 rounded-2xl text-center text-[11px] font-bold animate-in fade-in slide-in-from-top-2 duration-300 bg-red-50 text-red-500 border border-red-100`}>
                {error}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="group">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2.5 ml-1 group-focus-within:text-blue-600 transition-colors">
                  ইউজারনেম / নাম (ইংরেজি অক্ষর)
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
                    placeholder="যেমন: admin বা reseller1"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                  />
                </div>
              </div>

              {/* Password field for Admin OR when direct password login is active */}
              {(username.trim().toLowerCase() === 'admin' || usePasswordLogin) && (
                <div className="group animate-in slide-in-from-top-4 duration-300">
                  <div className="flex items-center justify-between mb-2.5 ml-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] group-focus-within:text-blue-600 transition-colors">
                      {username.trim().toLowerCase() === 'admin' ? 'এডমিন মাস্টার পিন' : 'রিসেলার পাসওয়ার্ড / পিন'}
                    </label>
                  </div>
                  <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      required={username.trim().toLowerCase() === 'admin' || usePasswordLogin}
                      type="password"
                      className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl pl-14 pr-6 py-4.5 text-[15px] font-bold text-slate-800 placeholder:text-slate-300 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Toggle direct password vs request approval */}
              {username.trim().toLowerCase() !== 'admin' && (
                <div className="flex items-center justify-between px-1">
                  <button
                    type="button"
                    onClick={() => {
                      setUsePasswordLogin(!usePasswordLogin);
                      setError('');
                    }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 transition-colors"
                  >
                    <span>{usePasswordLogin ? '📱 ডিভাইসের অনুমোদন অনুরোধ পাঠান' : '🔑 পাসওয়ার্ড দিয়ে যেকোনো ডিভাইস থেকে সরাসরি লগইন'}</span>
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-[20px] transition-all shadow-[0_12px_24px_-8px_rgba(37,99,235,0.4)] hover:shadow-[0_20px_32px_-10px_rgba(37,99,235,0.5)] active:scale-[0.98] text-sm tracking-wide mt-2 flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
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
                  username.trim().toLowerCase() === 'admin' 
                    ? 'এডমিন হিসাবে লগইন করুন' 
                    : (usePasswordLogin ? 'সরাসরি লগইন করুন' : 'অনুমোদনের জন্য আবেদন করুন')
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
          &copy; 2026 <span className="text-slate-600">ISP LEDGER PRO</span> • SECURED ACCESS
        </p>
      </div>
      
      <SyncModal 
        isOpen={isSyncModalOpen} 
        onClose={() => setIsSyncModalOpen(false)} 
        onRestoreSuccess={onLoginSuccess} 
      />

      <div className="h-4 sm:hidden"></div>
    </div>
  );
};
