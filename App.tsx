
import React, { useState, useEffect, useCallback } from 'react';
import { Customer, MonthlyRecord } from './types.ts';
import { storageService } from './services/storageService.ts';
import { Dashboard } from './components/Dashboard.tsx';
import { CustomerLedger } from './components/CustomerLedger.tsx';
import { CustomerModal } from './components/CustomerModal.tsx';

const App: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editCustomerData, setEditCustomerData] = useState<Customer | undefined>();

  useEffect(() => {
    setCustomers(storageService.getCustomers());
  }, []);

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

  const handleQuickPay = (customerId: string, monthKey: string, method?: string, trxId?: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    storageService.updateMonthlyRecord(customerId, monthKey, {
      paidAmount: customer.monthlyBill,
      due: 0,
      paymentDate: new Date().toISOString().split('T')[0],
      remarks: method === 'bKash' ? `বিকাশ (TrxID: ${trxId})` : 'দ্রুত পেমেন্ট',
      paymentMethod: method as any,
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

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => setSelectedCustomerId(null)}>
            <div className="bg-indigo-600 p-2 rounded-2xl shadow-lg shadow-indigo-200">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div>
              <span className="text-2xl font-black text-slate-800 tracking-tighter">ISP লেজার <span className="text-indigo-600">PRO</span></span>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">Monthly Billing System</p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black text-slate-400 uppercase tracking-tighter">সিস্টেম স্ট্যাটাস</p>
            <div className="flex items-center gap-1.5 justify-end mt-0.5">
               <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
               <span className="text-xs font-bold text-slate-700">অনলাইন</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 w-full">
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

      <footer className="no-print py-8 text-center border-t border-slate-200 bg-white text-slate-400 font-bold text-xs uppercase tracking-widest mt-auto">
        © {new Date().getFullYear()} ডিজিটাল ISP লেজার সার্ভিস
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