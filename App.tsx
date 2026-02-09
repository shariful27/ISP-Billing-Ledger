
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
    <div className="min-h-screen flex flex-col">
      <nav className="glass-card sticky top-0 z-40 border-b border-white/5 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setSelectedCustomerId(null)}>
            <div className="premium-btn p-2.5 rounded-2xl shadow-lg shadow-indigo-500/20 transform group-hover:rotate-12 transition-transform duration-300">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div>
              <span className="text-2xl font-black text-glow tracking-tighter bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">ISP লেজার প্রো</span>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] leading-none mt-1">ম্যানেজমেন্ট ক্লাউড ৩.০</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">সার্ভার সংযোগ</p>
              <div className="flex items-center gap-2 justify-end mt-0.5">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse"></div>
                 <span className="text-[11px] font-bold text-slate-300">নিরাপদ সংযোগ</span>
              </div>
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

      <footer className="no-print py-10 text-center text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em] mt-auto">
        ISP ম্যানেজমেন্ট সিস্টেম • © {new Date().getFullYear()} ডিজিটাল লেজার সার্ভিস
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
