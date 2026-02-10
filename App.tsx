
import React, { useState, useEffect, useCallback } from 'react';
import { Customer, MonthlyRecord } from './types.ts';
import { storageService } from './services/storageService.ts';
import { authService, User } from './services/authService.ts';
import { Dashboard } from './components/Dashboard.tsx';
import { CustomerLedger } from './components/CustomerLedger.tsx';
import { CustomerModal } from './components/CustomerModal.tsx';
import { Auth } from './components/Auth.tsx';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editCustomerData, setEditCustomerData] = useState<Customer | undefined>();

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setCustomers(storageService.getCustomers());
    }
  }, []);

  const handleLoginSuccess = () => {
    setCurrentUser(authService.getCurrentUser());
    setCustomers(storageService.getCustomers());
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

  const handleQuickPay = (customerId: string, monthKey: string, amount: number, method?: string, trxId?: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    let remarks = amount < customer.monthlyBill ? 'আংশিক বিল পরিশোধ' : 'বিল পরিশোধ করা হয়েছে';
    let paidAmount = amount;
    let due = Math.max(0, customer.monthlyBill - amount);

    if (method === 'Cash') remarks = amount < customer.monthlyBill ? `নগদ আংশিক জমা (৳${amount})` : 'নগদ (Cash) পেমেন্ট';
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
    storageService.updateMonthlyRecord(selectedCustomerId, monthKey, recordUpdate);
    setCustomers(storageService.getCustomers());
  }, [selectedCustomerId]);

  const handleDeleteCustomer = (id?: string) => {
    const targetId = id || selectedCustomerId;
    if (targetId) {
      storageService.deleteCustomer(targetId);
      setCustomers(storageService.getCustomers());
      if (targetId === selectedCustomerId) {
        setSelectedCustomerId(null);
      }
    }
  };

  if (!currentUser) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <nav className="bg-slate-900 sticky top-0 z-40 shadow-lg no-print font-['Hind_Siliguri']">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedCustomerId(null)}>
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white">ISP লেজার প্রো</span>
              <p className="text-[9px] text-blue-300 font-medium uppercase tracking-[0.1em] leading-none">Smart Billing & Accounts</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right hidden md:block">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">ইউজার: {currentUser.username}</p>
                <div className="flex items-center gap-1.5 justify-end">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                   <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-tighter">সচল আছে</span>
                </div>
             </div>
             <button 
              onClick={handleLogout}
              className="flex items-center gap-2 bg-slate-800 hover:bg-red-900/40 text-slate-300 hover:text-white px-4 py-2 rounded-xl transition-all font-bold text-xs"
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
               লগআউট
             </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 w-full">
        {selectedCustomer ? (
          <CustomerLedger
            customer={selectedCustomer}
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
            onSelectCustomer={setSelectedCustomerId}
            onAddCustomer={handleAddCustomer}
            onQuickPay={handleQuickPay}
            onDeleteCustomer={handleDeleteCustomer}
          />
        )}
      </main>

      <footer className="no-print py-6 border-t border-slate-200 text-center text-slate-400 font-bold text-[10px] uppercase tracking-widest bg-white">
        &copy; {new Date().getFullYear()} ISP লেজার প্রো • ডিজিটাল ম্যানেজমেন্ট
      </footer>

      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCustomer}
        initialData={editCustomerData}
      />
    </div>
  );
};

export default App;
