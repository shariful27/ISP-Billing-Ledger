import React, { useState } from 'react';
import { User, UserPermissions, SiteSettings } from '../types.ts';
import { authService, DEFAULT_STAFF_PERMISSIONS } from '../services/authService.ts';
import { storageService } from '../services/storageService.ts';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  settings: SiteSettings;
  onSettingsUpdate: (settings: SiteSettings) => void;
  onUserListUpdate: () => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  settings,
  onSettingsUpdate,
  onUserListUpdate
}) => {
  const isMasterAdmin = currentUser?.username.toLowerCase() === 'admin';
  const isAdminRole = currentUser !== null;
  const [activeTab, setActiveTab] = useState<'users' | 'branding' | 'pin'>('users');

  // Authentication State for Hidden Panel
  const [pinInput, setPinInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [authError, setAuthError] = useState('');

  // Admin PIN Change State
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinMsg, setPinMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sub-user Password Change State
  const [subNewPass, setSubNewPass] = useState('');
  const [subConfirmPass, setSubConfirmPass] = useState('');
  const [subPassMsg, setSubPassMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Branding State
  const [siteName, setSiteName] = useState(settings.siteName || 'ISP লেজার প্রো');
  const [siteTagline, setSiteTagline] = useState(settings.siteTagline || 'Smart Billing & Accounts');
  const [logoPreset, setLogoPreset] = useState(settings.logoPreset || 'wifi');
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || '');

  // User Management State
  const [users, setUsers] = useState<User[]>(() => authService.getUsers());
  const filteredUsers = isMasterAdmin
    ? users.filter(u => !u.createdBy || u.createdBy.toLowerCase() === 'admin' || u.username.toLowerCase() === 'admin')
    : users.filter(u => u.createdBy?.toLowerCase() === currentUser?.username.toLowerCase());
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'staff'>('staff');
  const [newSiteName, setNewSiteName] = useState('ISP লেজার প্রো');
  const [newLogoPreset, setNewLogoPreset] = useState('wifi');
  const [newLicenseDays, setNewLicenseDays] = useState<number>(30);
  const [userMsg, setUserMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password reset modal state inside admin
  const [resetTargetUser, setResetTargetUser] = useState<string | null>(null);
  const [resetNewPass, setResetNewPass] = useState('');

  // License extension modal state
  const [licenseTargetUser, setLicenseTargetUser] = useState<string | null>(null);
  const [extendDaysInput, setExtendDaysInput] = useState<number>(30);

  if (!isOpen) return null;

  const showLockScreen = isMasterAdmin && !isUnlocked;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (authService.verifyAdminPin(pinInput)) {
      setIsUnlocked(true);
      setAuthError('');
    } else {
      setAuthError('ভুল এডমিন সিক্রেট পিন!');
    }
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinMsg(null);

    if (!authService.verifyAdminPin(currentPinInput)) {
      setPinMsg({ type: 'error', text: 'বর্তমান এডমিন পিন ভুল হয়েছে!' });
      return;
    }

    if (newPinInput.trim().length < 4) {
      setPinMsg({ type: 'error', text: 'নতুন পিন অন্তত ৪ সংখ্যার হতে হবে!' });
      return;
    }

    if (newPinInput.trim() !== confirmPinInput.trim()) {
      setPinMsg({ type: 'error', text: 'নতুন পিন ও কনফার্ম পিন মিলেনি!' });
      return;
    }

    authService.updateAdminPin(newPinInput.trim());
    setPinMsg({ type: 'success', text: 'এডমিন সিক্রেট পিন সফলভাবে পরিবর্তন করা হয়েছে!' });
    setCurrentPinInput('');
    setNewPinInput('');
    setConfirmPinInput('');
  };

  const handleSubUserPasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setSubPassMsg(null);
    if (!subNewPass.trim() || subNewPass.trim().length < 4) {
      setSubPassMsg({ type: 'error', text: 'নতুন পাসওয়ার্ড অন্তত ৪ অক্ষরের হতে হবে!' });
      return;
    }
    if (subNewPass.trim() !== subConfirmPass.trim()) {
      setSubPassMsg({ type: 'error', text: 'নতুন পাসওয়ার্ড ও কনফার্ম পাসওয়ার্ড মিলেনি!' });
      return;
    }
    if (currentUser) {
      authService.updateUserPassword(currentUser.username, subNewPass.trim());
      setSubPassMsg({ type: 'success', text: 'আপনার পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!' });
      setSubNewPass('');
      setSubConfirmPass('');
    }
  };

  const handleRefreshUsers = () => {
    const list = authService.getUsers();
    setUsers(list);
    onUserListUpdate();
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setUserMsg(null);

    if (!newUsername.trim() || !newPassword.trim()) {
      setUserMsg({ type: 'error', text: 'ইউজারনেম ও পাসওয়ার্ড পূরণ করুন!' });
      return;
    }

    const roleToCreate = isMasterAdmin ? newRole : 'staff';

    const defaultPerms: UserPermissions = roleToCreate === 'admin' 
      ? { canAddCustomer: true, canEditCustomer: true, canDeleteCustomer: true, canAddPayment: true, canBulkImport: true, canExpense: true }
      : { ...DEFAULT_STAFF_PERMISSIONS };

    const res = authService.createUserByAdmin({
      username: newUsername.trim(),
      password: newPassword.trim(),
      role: roleToCreate,
      permissions: defaultPerms,
      siteName: isMasterAdmin ? (newSiteName.trim() || 'ISP লেজার প্রো') : (currentUser?.siteName || 'ISP লেজার প্রো'),
      logoPreset: isMasterAdmin ? newLogoPreset : (currentUser?.logoPreset || 'wifi'),
      licenseDays: isMasterAdmin ? (Number(newLicenseDays) || 30) : 30,
      createdBy: currentUser?.username
    });

    if (res.success) {
      setUserMsg({ type: 'success', text: res.message });
      setNewUsername('');
      setNewPassword('');
      setNewSiteName(settings.siteName || 'ISP লেজার প্রো');
      setNewLicenseDays(30);
      handleRefreshUsers();
    } else {
      setUserMsg({ type: 'error', text: res.message });
    }
  };

  const handleExtendLicenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseTargetUser) return;
    authService.updateUserLicense(licenseTargetUser, Number(extendDaysInput) || 30);
    alert(`"${licenseTargetUser}" রিসেলারের লাইসেন্স মেয়াদ সফলভাবে ${extendDaysInput} দিন বাড়ানো হয়েছে!`);
    setLicenseTargetUser(null);
    setExtendDaysInput(30);
    handleRefreshUsers();
  };

  const handleTogglePermission = (username: string, key: keyof UserPermissions) => {
    const targetUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!targetUser) return;

    const updatedPermissions = {
      ...targetUser.permissions,
      [key]: !targetUser.permissions?.[key]
    };

    authService.updateUserPermissions(username, updatedPermissions);
    handleRefreshUsers();
  };

  const handleRoleChange = (username: string, role: 'admin' | 'staff') => {
    authService.updateUserRole(username, role);
    handleRefreshUsers();
  };

  const handleDeleteUser = (username: string) => {
    if (username.toLowerCase() === 'admin') {
      setUserMsg({ type: 'error', text: 'প্রধান এডমিন (admin) রিসেলার ডিলিট করা সম্ভব নয়!' });
      return;
    }
    if (window.confirm(`আপনি কি সত্যিই "${username}" রিসেলার ডিলিট করতে চান?`)) {
      authService.deleteUser(username);
      handleRefreshUsers();
      setUserMsg({ type: 'success', text: `"${username}" রিসেলার সফলভাবে ডিলিট করা হয়েছে!` });
    }
  };

  const handleDeleteAllStaffUsers = () => {
    if (window.confirm('আপনি কি নিশ্চিত যে প্রধান "admin" ছাড়া বাকি সকল রিসেলার একলক্ষে ডিলিট করতে চান?')) {
      authService.deleteAllStaffUsers();
      handleRefreshUsers();
      setUserMsg({ type: 'success', text: 'এডমিন ব্যতীত সকল রিসেলার সফলভাবে ডিলিট করা হয়েছে!' });
    }
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser || !resetNewPass) return;
    authService.updateUserPassword(resetTargetUser, resetNewPass);
    alert(`"${resetTargetUser}" রিসেলারের পাসওয়ার্ড পরিবর্তন করা হয়েছে!`);
    setResetTargetUser(null);
    setResetNewPass('');
    handleRefreshUsers();
  };

  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    const newSettings: SiteSettings = {
      ...settings,
      siteName: siteName.trim() || 'ISP লেজার প্রো',
      siteTagline: siteTagline.trim() || 'Smart Billing & Accounts',
      logoPreset,
      logoUrl: logoUrl.trim()
    };
    storageService.saveSettings(newSettings);
    onSettingsUpdate(newSettings);
    alert('সাইটের নাম ও লোগো সেটিংস সফলভাবে আপডেট করা হয়েছে!');
  };

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert('ছবি ১ মেগাবাইটের বেশি হওয়া যাবে না!');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
        setLogoPreset('custom');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-1.5 sm:p-4 z-[250] font-['Hind_Siliguri']">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 flex flex-col h-[95vh] sm:max-h-[92vh]">
        
        {/* Header Bar */}
        <div className="bg-slate-900 text-white px-3.5 sm:px-8 py-3 sm:py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="bg-amber-500 text-slate-950 text-[8px] sm:text-[9px] font-black uppercase px-1.5 sm:px-2 py-0.5 rounded">Secret Admin</span>
                <h2 className="text-sm sm:text-xl font-bold tracking-tight">এডমিন প্যানেল</h2>
              </div>
              <p className="text-slate-400 text-[9px] sm:text-[11px] truncate max-w-[180px] sm:max-w-none">রিসেলার পারমিশন, ব্রান্ডিং ও SMS সেটিং</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('আপনি কি নিশ্চিত যে সিস্টেম থেকে লগআউট করতে চান?')) {
                  authService.logout();
                  onClose();
                  window.location.reload();
                }
              }}
              className="bg-red-500/20 hover:bg-red-600 text-red-300 hover:text-white px-2.5 py-1.5 rounded-xl border border-red-500/30 transition-all flex items-center gap-1 text-[11px] sm:text-xs font-bold"
              title="প্যানেল থেকে লগআউট করুন"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
              <span className="hidden sm:inline">লগআউট</span>
            </button>

            <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 sm:p-2 rounded-xl hover:bg-slate-800 transition-colors">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        {/* Lock Screen if not Admin and not unlocked */}
        {showLockScreen ? (
          <div className="p-6 sm:p-12 text-center max-w-md mx-auto space-y-5 my-auto">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-50 text-red-500 rounded-2xl sm:rounded-3xl mx-auto flex items-center justify-center">
              <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-800">এডমিন প্যানেল আনলক করুন</h3>
              <p className="text-xs text-slate-500 mt-1">গোপন এডমিন পিন বা সিক্রেট কোড (ডিফল্ট: 1234) লিখুন</p>
            </div>

            {authError && (
              <p className="text-xs font-bold text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">{authError}</p>
            )}

            <form onSubmit={handleUnlock} className="space-y-4">
              <input
                type="password"
                required
                autoFocus
                placeholder="এডমিন পিন (যেমন: 1234)"
                className="w-full text-center tracking-widest text-base sm:text-lg font-mono py-3 px-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-amber-500 outline-none"
                value={pinInput}
                onChange={e => setPinInput(e.target.value)}
              />
              <button
                type="submit"
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-2xl shadow-lg transition-all"
              >
                প্যানেল আনলক করুন
              </button>
            </form>
          </div>
        ) : (
          /* Main Admin Content Body */
          <div className="flex flex-col flex-1 overflow-hidden">
            
            {/* Nav Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-2 sm:px-6 shrink-0 overflow-x-auto scrollbar-none whitespace-nowrap">
              <button
                onClick={() => setActiveTab('users')}
                className={`py-3 px-3.5 sm:px-5 text-[11px] sm:text-xs font-black border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'users' 
                    ? 'border-blue-600 text-blue-600 bg-white' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                <span>👥 {isMasterAdmin ? `রিসেলার ও স্টাফ একাউন্ট (${users.length})` : `স্টাফ ম্যানেজমেন্ট (${filteredUsers.length})`}</span>
              </button>

              <button
                onClick={() => setActiveTab('branding')}
                className={`py-3 px-3.5 sm:px-5 text-[11px] sm:text-xs font-black border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'branding' 
                    ? 'border-blue-600 text-blue-600 bg-white' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
                <span>🎨 {isMasterAdmin ? 'নাম ও লোগো' : 'আমার সাইটের নাম ও লোগো'}</span>
              </button>

              <button
                onClick={() => setActiveTab('pin')}
                className={`py-3 px-3.5 sm:px-5 text-[11px] sm:text-xs font-black border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'pin' 
                    ? 'border-blue-600 text-blue-600 bg-white' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                <span>🔑 {isMasterAdmin ? 'এডমিন পিন' : 'পাসওয়ার্ড পরিবর্তন'}</span>
              </button>
            </div>

            <div className="p-3.5 sm:p-8 overflow-y-auto flex-1 space-y-6">
              
              {/* TAB 1: USERS & PERMISSIONS */}
              {activeTab === 'users' && (
                <div className="space-y-8">
                  
                  {/* Create New User Card */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
                    <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                      {isMasterAdmin ? 'নতুন প্যানেল রিসেলার তৈরি করুন' : 'নতুন স্টাফ একাউন্ট তৈরি করুন'}
                    </h3>

                    {userMsg && (
                      <p className={`text-xs font-bold p-3 rounded-xl border ${
                        userMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'
                      }`}>
                        {userMsg.text}
                      </p>
                    )}

                    <form onSubmit={handleCreateUser} className="space-y-4">
                      {isMasterAdmin ? (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">ইউজারনেম</label>
                              <input
                                type="text"
                                required
                                placeholder="যেমন: staff1"
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                                value={newUsername}
                                onChange={e => setNewUsername(e.target.value)}
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">পাসওয়ার্ড</label>
                              <input
                                type="password"
                                required
                                placeholder="••••••••"
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">রোল (Role)</label>
                              <select
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                                value={newRole}
                                onChange={e => setNewRole(e.target.value as any)}
                              >
                                <option value="staff">রিসেলার (Reseller)</option>
                                <option value="admin">এডমিন (Full Admin)</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">এই রিসেলারের নিজস্ব সাইট নাম (Custom Site Title)</label>
                              <input
                                type="text"
                                placeholder="যেমন: আকাশ নেটওয়ার্ক প্রো"
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                                value={newSiteName}
                                onChange={e => setNewSiteName(e.target.value)}
                              />
                            </div>

                            <div className="flex gap-2 items-end">
                              <div className="flex-1">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">লাইসেন্স মেয়াদ (দিন সংখ্যা)</label>
                                <input
                                  type="number"
                                  min={1}
                                  max={3650}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                                  value={newLicenseDays}
                                  onChange={e => setNewLicenseDays(Number(e.target.value))}
                                />
                              </div>

                              <button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs py-2.5 px-6 rounded-xl shadow-md transition-all whitespace-nowrap h-[38px]"
                              >
                                + রিসেলার তৈরি করুন
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">স্টাফ ইউজারনেম (Staff Username)</label>
                            <input
                              type="text"
                              required
                              placeholder="যেমন: linemen1"
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                              value={newUsername}
                              onChange={e => setNewUsername(e.target.value)}
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">স্টাফ পাসওয়ার্ড</label>
                            <input
                              type="password"
                              required
                              placeholder="••••••••"
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                              value={newPassword}
                              onChange={e => setNewPassword(e.target.value)}
                            />
                          </div>

                          <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs py-2.5 px-6 rounded-xl shadow-md transition-all whitespace-nowrap h-[38px] w-full"
                          >
                            + স্টাফ একাউন্ট তৈরি করুন
                          </button>
                        </div>
                      )}
                    </form>
                  </div>

                  {/* Users Permissions Table */}
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                        <span>{isMasterAdmin ? 'বিদ্যমান রিসেলার ও পারমিশন কন্ট্রোল' : 'বিদ্যমান স্টাফ ও পারমিশন কন্ট্রোল'}</span>
                        <span className="text-xs font-normal text-slate-500 hidden sm:inline">
                          (* টিক চিহ্নের মাধ্যমে পারমিশন চালু বা বন্ধ করুন)
                        </span>
                      </h3>
                      {isMasterAdmin && users.length > 1 && (
                        <button
                          type="button"
                          onClick={handleDeleteAllStaffUsers}
                          className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors"
                          title="এডমিন ছাড়া সব রিসেলার ডিলিট করুন"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          <span>সকল রিসেলার ডিলিট করুন</span>
                        </button>
                      )}
                    </div>

                    <div className="border border-slate-200 rounded-2xl overflow-x-auto">
                      <table className="w-full text-left text-xs min-w-[700px]">
                        <thead className="bg-slate-100 text-slate-600 font-bold text-[9px] uppercase tracking-wider border-b border-slate-200">
                          <tr>
                            <th className="p-3.5">ইউজারনেম</th>
                            <th className="p-3.5 text-center">রোল</th>
                            <th className="p-3.5 text-center">➕ গ্রাহক যোগ</th>
                            <th className="p-3.5 text-center">✏️ তথ্য এডিট</th>
                            <th className="p-3.5 text-center">🗑️ ডিলিট</th>
                            <th className="p-3.5 text-center">💳 বিল জমা</th>
                            <th className="p-3.5 text-center">📊 ইমপোর্ট</th>
                            <th className="p-3.5 text-center text-amber-700">💸 ডেলি খরচ</th>
                            {isMasterAdmin && <th className="p-3.5 text-center text-emerald-700">⏱️ লাইসেন্স</th>}
                            <th className="p-3.5 text-right">অ্যাকশন</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                          {filteredUsers.map(u => {
                            const isAdmin = u.role === 'admin';
                            const perms = u.permissions || {
                              canAddCustomer: isAdmin,
                              canEditCustomer: isAdmin,
                              canDeleteCustomer: isAdmin,
                              canAddPayment: isAdmin,
                              canBulkImport: isAdmin,
                              canExpense: isAdmin
                            };

                            const expiryDays = u.licenseExpiryDate 
                              ? Math.ceil((u.licenseExpiryDate - Date.now()) / (1000 * 60 * 60 * 24))
                              : 30;

                            return (
                              <tr key={u.username} className="hover:bg-slate-50">
                                <td className="p-3.5 font-bold text-slate-900">
                                  <div className="flex items-center gap-2">
                                    <span className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-black text-xs uppercase">
                                      {u.username.charAt(0)}
                                    </span>
                                    <div>
                                      <span>{u.username}</span>
                                      {u.siteName && <p className="text-[9px] text-blue-600 font-normal">সাইট: {u.siteName}</p>}
                                    </div>
                                  </div>
                                </td>

                                <td className="p-3.5 text-center">
                                  {isMasterAdmin ? (
                                    <select
                                      disabled={u.username.toLowerCase() === 'admin'}
                                      value={u.role || 'staff'}
                                      onChange={e => handleRoleChange(u.username, e.target.value as any)}
                                      className="bg-slate-100 text-[10px] font-black px-2 py-1 rounded-lg border border-slate-200 cursor-pointer disabled:opacity-50"
                                    >
                                      <option value="admin">ADMIN</option>
                                      <option value="staff">RESELLER</option>
                                    </select>
                                  ) : (
                                    <span className="bg-slate-100 text-[10px] font-black px-2 py-1.5 rounded-lg border border-slate-200 text-slate-600 uppercase">
                                      {u.role === 'staff' ? 'RESELLER' : (u.role || 'staff')}
                                    </span>
                                  )}
                                </td>

                                {/* Checkbox 1: Add Customer */}
                                <td className="p-3.5 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isAdmin || perms.canAddCustomer}
                                    disabled={isAdmin}
                                    onChange={() => handleTogglePermission(u.username, 'canAddCustomer')}
                                    className="w-4 h-4 text-blue-600 rounded cursor-pointer disabled:opacity-50"
                                  />
                                </td>

                                {/* Checkbox 2: Edit Customer */}
                                <td className="p-3.5 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isAdmin || perms.canEditCustomer}
                                    disabled={isAdmin}
                                    onChange={() => handleTogglePermission(u.username, 'canEditCustomer')}
                                    className="w-4 h-4 text-blue-600 rounded cursor-pointer disabled:opacity-50"
                                  />
                                </td>

                                {/* Checkbox 3: Delete Customer */}
                                <td className="p-3.5 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isAdmin || perms.canDeleteCustomer}
                                    disabled={isAdmin}
                                    onChange={() => handleTogglePermission(u.username, 'canDeleteCustomer')}
                                    className="w-4 h-4 text-blue-600 rounded cursor-pointer disabled:opacity-50"
                                  />
                                </td>

                                {/* Checkbox 4: Add Payment */}
                                <td className="p-3.5 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isAdmin || perms.canAddPayment}
                                    disabled={isAdmin}
                                    onChange={() => handleTogglePermission(u.username, 'canAddPayment')}
                                    className="w-4 h-4 text-blue-600 rounded cursor-pointer disabled:opacity-50"
                                  />
                                </td>

                                {/* Checkbox 5: Bulk Import */}
                                <td className="p-3.5 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isAdmin || perms.canBulkImport}
                                    disabled={isAdmin}
                                    onChange={() => handleTogglePermission(u.username, 'canBulkImport')}
                                    className="w-4 h-4 text-blue-600 rounded cursor-pointer disabled:opacity-50"
                                  />
                                </td>

                                {/* Checkbox 6: Daily Expense */}
                                <td className="p-3.5 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isAdmin || Boolean(perms.canExpense)}
                                    disabled={isAdmin}
                                    onChange={() => handleTogglePermission(u.username, 'canExpense')}
                                    className="w-4 h-4 text-amber-600 rounded cursor-pointer disabled:opacity-50"
                                  />
                                </td>

                                {/* License Column */}
                                {isMasterAdmin && (
                                  <td className="p-3.5 text-center">
                                    <div className="flex flex-col items-center gap-1">
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                        expiryDays > 5 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
                                      }`}>
                                        {expiryDays > 0 ? `${expiryDays} দিন বাকি` : 'মেয়াদ উত্তীর্ণ'}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => setLicenseTargetUser(u.username)}
                                        className="text-[9px] bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-0.5 rounded font-bold shadow-sm"
                                      >
                                        + মেয়াদ বাড়ান
                                      </button>
                                    </div>
                                  </td>
                                )}

                                <td className="p-3.5 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setResetTargetUser(u.username)}
                                      className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg font-bold"
                                    >
                                      পাসওয়ার্ড
                                    </button>
                                    {u.username.toLowerCase() !== 'admin' && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteUser(u.username)}
                                        className="text-[10px] bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors"
                                        title="ইউজার মুছুন"
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        <span>ডিলিট</span>
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: BRANDING & SITE LOGO SETTINGS */}
              {activeTab === 'branding' && (
                <form onSubmit={handleSaveBranding} className="space-y-6 max-w-2xl">
                  
                  {/* Site Title */}
                  <div>
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-1.5">
                      সাইটের নাম (Website Title)
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:border-blue-500 outline-none"
                      value={siteName}
                      onChange={e => setSiteName(e.target.value)}
                      placeholder="যেমন: আকাশ নেটওয়ার্ক লেজার প্রো"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">এই নামটি পুরো ওয়েবসাইটের হেডার ও নেভিগেশনে দেখা যাবে</p>
                  </div>

                  {/* Site Tagline */}
                  <div>
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-1.5">
                      ট্যাগলাইন / সাবটাইটেল (Subtitle)
                    </label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 outline-none"
                      value={siteTagline}
                      onChange={e => setSiteTagline(e.target.value)}
                      placeholder="যেমন: Smart Billing & Account Management"
                    />
                  </div>

                  {/* Preset Logo Selection */}
                  <div>
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2">
                      লোগো আইকন নির্বাচন করুন (Preset Icons)
                    </label>
                    
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                      {[
                        { id: 'wifi', label: 'WiFi', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" /> },
                        { id: 'zap', label: 'Zap', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /> },
                        { id: 'globe', label: 'Globe', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /> },
                        { id: 'network', label: 'Server', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /> },
                        { id: 'shield', label: 'Shield', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /> },
                        { id: 'rocket', label: 'Rocket', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 010 12.728" /> }
                      ].map(item => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => { setLogoPreset(item.id); setLogoUrl(''); }}
                          className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-all ${
                            logoPreset === item.id && !logoUrl 
                              ? 'border-blue-600 bg-blue-50/50 text-blue-600 shadow-sm' 
                              : 'border-slate-200 text-slate-500 hover:border-slate-300'
                          }`}
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">{item.icon}</svg>
                          <span className="text-[10px] font-bold">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Logo Image Upload or URL */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-widest">
                      অথবা কাস্টম লোগো ছবি আপলোড করুন
                    </label>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      {logoUrl ? (
                        <div className="relative group shrink-0">
                          <img src={logoUrl} alt="Custom Logo" className="w-14 h-14 object-contain rounded-xl border border-slate-200 bg-white p-1" />
                          <button
                            type="button"
                            onClick={() => setLogoUrl('')}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow"
                            title="ছবি সরান"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
                          </button>
                        </div>
                      ) : null}

                      <div className="flex-1 space-y-2 w-full">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoFileUpload}
                          className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                        />
                        <input
                          type="url"
                          placeholder="অথবা লোগো ছবির লিংক (URL) লিখুন..."
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
                          value={logoUrl}
                          onChange={e => { setLogoUrl(e.target.value); setLogoPreset('custom'); }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Save Branding Button */}
                  <div className="pt-4">
                    <button
                      type="submit"
                      className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-2xl shadow-lg transition-all"
                    >
                      সেটিংস সেভ করুন
                    </button>
                  </div>

                </form>
              )}



              {/* TAB 3: ADMIN PIN / PASSWORD CHANGE */}
              {activeTab === 'pin' && (
                isMasterAdmin ? (
                  <form onSubmit={handleChangePin} className="space-y-6 max-w-md bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8">
                    <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-800">এডমিন সিক্রেট পিন আপডেট</h3>
                        <p className="text-[10px] text-slate-500 font-medium">গোপন এডমিন প্যানেল আনলক করার পিন পরিবর্তন করুন</p>
                      </div>
                    </div>

                    {pinMsg && (
                      <div className={`p-3.5 rounded-xl border text-xs font-bold ${
                        pinMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'
                      }`}>
                        {pinMsg.text}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-1.5">
                        বর্তমান পিন (Current PIN)
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="ডিফল্ট পিন: 1234"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono tracking-widest font-bold text-slate-900 outline-none focus:border-amber-500"
                        value={currentPinInput}
                        onChange={e => setCurrentPinInput(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-1.5">
                        নতুন সিক্রেট পিন (New PIN)
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="কমপক্ষে ৪ সংখ্যার পিন"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono tracking-widest font-bold text-slate-900 outline-none focus:border-amber-500"
                        value={newPinInput}
                        onChange={e => setNewPinInput(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-1.5">
                        কনফার্ম নতুন পিন (Confirm New PIN)
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="নতুন পিনটি পুনরায় লিখুন"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono tracking-widest font-bold text-slate-900 outline-none focus:border-amber-500"
                        value={confirmPinInput}
                        onChange={e => setConfirmPinInput(e.target.value)}
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-2xl shadow-md transition-all"
                    >
                      পিন আপডেট করুন
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleSubUserPasswordChange} className="space-y-6 max-w-md bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8">
                    <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                      <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-800">পাসওয়ার্ড পরিবর্তন করুন</h3>
                        <p className="text-[10px] text-slate-500 font-medium">আপনার বর্তমান লগইন পাসওয়ার্ড পরিবর্তন করুন</p>
                      </div>
                    </div>

                    {subPassMsg && (
                      <div className={`p-3.5 rounded-xl border text-xs font-bold ${
                        subPassMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'
                      }`}>
                        {subPassMsg.text}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-1.5">নতুন পাসওয়ার্ড</label>
                      <input
                        type="password"
                        required
                        placeholder="কমপক্ষে ৪ অক্ষরের পাসওয়ার্ড"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500"
                        value={subNewPass}
                        onChange={e => setSubNewPass(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-1.5">কনফার্ম নতুন পাসওয়ার্ড</label>
                      <input
                        type="password"
                        required
                        placeholder="পুনরায় পাসওয়ার্ড লিখুন"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500"
                        value={subConfirmPass}
                        onChange={e => setSubConfirmPass(e.target.value)}
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-2xl shadow-lg transition-all"
                    >
                      পাসওয়ার্ড আপডেট করুন
                    </button>
                  </form>
                )
              )}

            </div>
          </div>
        )}

      </div>

      {/* Password Reset Modal inside Admin */}
      {resetTargetUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[300]">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-slate-800 text-sm">
              "{resetTargetUser}"-এর পাসওয়ার্ড পরিবর্তন
            </h3>
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <input
                type="password"
                required
                placeholder="নতুন পাসওয়ার্ড লিখুন"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none"
                value={resetNewPass}
                onChange={e => setResetNewPass(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setResetTargetUser(null)}
                  className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl font-bold text-xs"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-bold text-xs"
                >
                  সেভ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* License Extension Modal */}
      {licenseTargetUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[300]">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              "{licenseTargetUser}"-এর লাইসেন্স মেয়াদ বাড়ান
            </h3>
            <form onSubmit={handleExtendLicenseSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">কয় দিন বাড়াতে চান?</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={3650}
                  placeholder="যেমন: ৩০ দিন"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:border-blue-500"
                  value={extendDaysInput}
                  onChange={e => setExtendDaysInput(Number(e.target.value))}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setLicenseTargetUser(null)}
                  className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl font-bold text-xs"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold text-xs"
                >
                  মেয়াদ বৃদ্ধি করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
