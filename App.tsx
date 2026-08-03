import React, { useState, useEffect, useCallback } from 'react';
import { Customer, MonthlyRecord, SiteSettings } from './types.ts';
import { storageService } from './services/storageService.ts';
import { authService, User } from './services/authService.ts';
import { Dashboard } from './components/Dashboard.tsx';
import { CustomerLedger } from './components/CustomerLedger.tsx';
import { CustomerModal } from './components/CustomerModal.tsx';
import { BulkImportModal } from './components/BulkImportModal.tsx';
import { Auth } from './components/Auth.tsx';
import { AdminPanelModal } from './components/AdminPanelModal.tsx';
import { DailyExpenseModal } from './components/DailyExpenseModal.tsx';
import { SiteLogo } from './components/SiteLogo.tsx';
import { SyncModal } from './components/SyncModal.tsx';
import { firebaseService } from './services/firebaseService.ts';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<SiteSettings>(() => storageService.getSettings());
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [editCustomerData, setEditCustomerData] = useState<Customer | undefined>();

  const loadAllData = useCallback(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setCustomers(storageService.getCustomers());
    } else {
      setCurrentUser(null);
    }
    setSettings(storageService.getSettings());
  }, []);

  useEffect(() => {
    // 1. First sync user credentials list from cloud so they can login instantly on any new browser
    firebaseService.syncUsersFromCloud().then(() => {
      loadAllData();
    }).catch(e => {
      console.warn('Initial cloud sync warning:', e);
      loadAllData();
    });

    const handleSync = () => {
      loadAllData();
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('isp_sync', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('isp_sync', handleSync);
    };
  }, [loadAllData]);

  // 2. Automatically sync backup to Cloud in the background whenever local changes are made (debounced)
  useEffect(() => {
    if (!currentUser) return;

    let syncTimeout: any;

    const handleCloudBackupSync = () => {
      clearTimeout(syncTimeout);
      syncTimeout = setTimeout(async () => {
        try {
          const masterUname = storageService.getCurrentUsername();
          if (masterUname) {
            await firebaseService.uploadBackupToCloud(masterUname);
          }
        } catch (e) {
          console.error('Automated cloud backup sync failed:', e);
        }
      }, 2000); // Debounce by 2 seconds to optimize firestore writes
    };

    window.addEventListener('isp_sync', handleCloudBackupSync);
    return () => {
      clearTimeout(syncTimeout);
      window.removeEventListener('isp_sync', handleCloudBackupSync);
    };
  }, [currentUser]);

  const handleLoginSuccess = () => {
    loadAllData();
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setSelectedCustomerId(null);
  };

  const handleAddCustomer = () => {
    setEditCustomerData(undefined);
    setIsModalOpen(true);
  };

  const handleSaveCustomer = (data: Partial<Customer>) => {
    if (editCustomerData) {
      storageService.updateCustomer(editCustomerData.id, data);
    } else {
      storageService.addCustomer(data);
    }
    setCustomers(storageService.getCustomers());
  };

  const handleBulkImportSuccess = (bulkData: Partial<Customer>[]) => {
    storageService.addBulkCustomers(bulkData);
    setCustomers(storageService.getCustomers());
  };

  const isAdmin = currentUser?.role === 'admin' || currentUser?.username.toLowerCase() === 'admin';
  const isReseller = !isAdmin && (!currentUser?.createdBy || currentUser.createdBy.toLowerCase() === 'admin');
  const canOpenAdminPanel = isAdmin || isReseller;
  const canAddPayment = isAdmin || Boolean(currentUser?.permissions?.canAddPayment);

  const handleQuickPay = (customerId: string, monthKey: string, amount: number, method?: string, trxId?: string) => {
    if (!canAddPayment) {
      alert('আপনার বিল জমা/আদায় করার অনুমতি নেই!');
      return;
    }
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    let remarks = amount < customer.monthlyBill ? 'আংশিক বিল পরিশোধ' : 'বিল পরিশোধ করা হয়েছে';
    let paidAmount = amount;
    let due = Math.max(0, customer.monthlyBill - amount);

    if (method === 'Cash') remarks = amount < customer.monthlyBill ? `ক্যাশ আংশিক জমা (৳${amount})` : 'ক্যাশ পেমেন্ট';
    if (method === 'bKash') remarks = `বিকাশ পেমেন্ট (TrxID: ${trxId || 'N/A'})`;
    if (method === 'Free') {
      remarks = 'ফ্রি বিল পরিশোধ করা হয়েছে';
      paidAmount = customer.monthlyBill;
      due = 0;
    }

    storageService.updateMonthlyRecord(customerId, monthKey, {
      paidAmount: paidAmount,
      due: due,
      paymentDate: new Date().toISOString().split('T')[0],
      remarks: remarks,
      paymentMethod: method as any || 'Other',
      trxId: trxId
    });

    setCustomers(storageService.getCustomers());
  };

  const handleUpdateRecord = useCallback((monthKey: string, recordUpdate: Partial<MonthlyRecord>) => {
    if (!selectedCustomerId) return;
    const isUserAdmin = currentUser?.role === 'admin' || currentUser?.username.toLowerCase() === 'admin';
    const canUserPay = isUserAdmin || Boolean(currentUser?.permissions?.canAddPayment);
    if (!canUserPay) {
      alert('আপনার আদায়কৃত পরিমাণ পরিবর্তন করার অনুমতি নেই!');
      return;
    }
    storageService.updateMonthlyRecord(selectedCustomerId, monthKey, recordUpdate);
    setCustomers(storageService.getCustomers());
  }, [selectedCustomerId, currentUser]);

  const handleDeleteCustomer = (id?: string) => {
    const targetId = id || selectedCustomerId;
    if (targetId) {
      const cust = customers.find(c => c.id === targetId);
      const name = cust ? cust.name : '';
      const message = name 
        ? `আপনি কি নিশ্চিত যে "${name}" গ্রাহকের অ্যাকাউন্টটি ডিলিট করতে চান?` 
        : 'আপনি কি নিশ্চিত যে এই গ্রাহকের অ্যাকাউন্টটি ডিলিট করতে চান?';
      if (window.confirm(message)) {
        storageService.deleteCustomer(targetId);
        setCustomers(storageService.getCustomers());
        if (targetId === selectedCustomerId) {
          setSelectedCustomerId(null);
        }
      }
    }
  };

  if (!currentUser) {
    return <Auth onLoginSuccess={handleLoginSuccess} settings={settings} />;
  }

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-['Hind_Siliguri']">
      <nav className="bg-slate-900 sticky top-0 z-40 shadow-lg no-print border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
          
          {/* Logo & Site Name */}
          <div className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none min-w-0" onClick={() => setSelectedCustomerId(null)}>
            <SiteLogo settings={settings} size="md" lightMode={false} />
          </div>

          <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
             
             {/* User Badge & Role */}
             <div className="text-right hidden md:block border-r border-slate-800 pr-3">
                <div className="flex items-center gap-1.5 justify-end">
                  <span className="text-xs font-black text-white">{currentUser.username}</span>
                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                    isAdmin ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {isAdmin ? 'ADMIN' : (currentUser?.createdBy && currentUser.createdBy.toLowerCase() !== 'admin' ? 'STAFF' : 'RESELLER')}
                  </span>
                </div>
                <p className="text-[9px] font-bold text-emerald-400 mt-0.5">● এক্টিভ সেশন</p>
             </div>

             {/* Hidden Admin Trigger */}
             {canOpenAdminPanel && (
               <button 
                  onClick={() => setIsAdminModalOpen(true)}
                  className="hidden sm:flex p-2 text-slate-500 hover:text-slate-300 transition-colors rounded-lg opacity-30 hover:opacity-100"
                  aria-label="Admin"
                  title="এডমিন প্যানেল"
               >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
               </button>
             )}
             
             {/* Daily Expense Button */}
             <button 
                onClick={() => setIsExpenseModalOpen(true)}
                className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 p-2 sm:px-3 sm:py-2 rounded-xl transition-all flex items-center gap-1.5 font-bold text-xs"
                title="ডেলি খরচের হিসাব"
             >
                <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="hidden md:inline">ডেলি খরচ</span>
             </button>

             {/* Backup & Sync Button */}
             <button 
                onClick={() => setIsSyncModalOpen(true)}
                className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 p-2 sm:px-3 sm:py-2 rounded-xl transition-all flex items-center gap-1.5 font-bold text-xs"
                title="ব্যাকআপ ও রিস্টোর"
             >
                <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v8" />
                </svg>
                <span className="hidden md:inline">ব্যাকআপ ও সিঙ্ক</span>
             </button>

             {/* Logout Button */}
             <button 
              onClick={handleLogout}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-red-900/40 text-slate-300 hover:text-white p-2 sm:px-3.5 sm:py-2 rounded-xl transition-all font-bold text-xs"
              title="লগআউট"
             >
               <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
               <span className="hidden sm:inline">লগআউট</span>
             </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 w-full">
        {selectedCustomer ? (
          <CustomerLedger
            customer={selectedCustomer}
            currentUser={currentUser}
            settings={settings}
            onBack={() => setSelectedCustomerId(null)}
            onUpdateRecord={handleUpdateRecord}
            onEditCustomer={() => {
              setEditCustomerData(selectedCustomer);
              setIsModalOpen(true);
            }}
            onDeleteCustomer={() => handleDeleteCustomer()}
          />
        ) : (
          <Dashboard
            customers={customers}
            currentUser={currentUser}
            onSelectCustomer={setSelectedCustomerId}
            onAddCustomer={handleAddCustomer}
            onBulkImport={() => setIsBulkModalOpen(true)}
            onQuickPay={handleQuickPay}
            onDeleteCustomer={handleDeleteCustomer}
            onOpenExpenseModal={() => setIsExpenseModalOpen(true)}
          />
        )}
      </main>

      <footer 
        onDoubleClick={() => {
          if (canOpenAdminPanel) {
            setIsAdminModalOpen(true);
          }
        }}
        className={`no-print py-6 border-t border-slate-200 text-center text-slate-400 font-bold text-[10px] uppercase tracking-widest bg-white select-none ${
          canOpenAdminPanel ? 'cursor-pointer hover:text-slate-500 transition-colors' : ''
        }`}
        title={canOpenAdminPanel ? "Double-click for secret access" : undefined}
      >
        &copy; {new Date().getFullYear()} {settings.siteName || 'ISP লেজার প্রো'} • সকল অধিকার সংরক্ষিত
      </footer>

      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCustomer}
        initialData={editCustomerData}
      />

      <BulkImportModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onImportSuccess={handleBulkImportSuccess}
      />

      <DailyExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        currentUser={currentUser || { username: 'GUEST', role: 'staff', permissions: { canAddCustomer: false, canEditCustomer: false, canDeleteCustomer: false, canAddPayment: false, canBulkImport: false } }}
      />

      <AdminPanelModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        currentUser={currentUser}
        settings={settings}
        onSettingsUpdate={(newSettings) => {
          setSettings(newSettings);
        }}
        onUserListUpdate={() => {
          const user = authService.getCurrentUser();
          setCurrentUser(user);
        }}
      />

      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onRestoreSuccess={loadAllData}
      />
    </div>
  );
};

export default App;

