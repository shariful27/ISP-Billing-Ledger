
import React, { useState, useEffect } from 'react';
import { Customer } from '../types';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Partial<Customer>) => void;
  initialData?: Customer;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    connectionName: '',
    address: '',
    mobile: '',
    monthlyBill: 500,
    connectionDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({ 
        name: '', 
        connectionName: '', 
        address: '', 
        mobile: '', 
        monthlyBill: 500,
        connectionDate: new Date().toISOString().split('T')[0]
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[200]">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
        <div className="bg-slate-50 px-8 py-6 border-b border-slate-200 relative">
          <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
          <h2 className="text-slate-800 text-xl font-bold tracking-tight">
            {initialData ? 'গ্রাহকের তথ্য পরিবর্তন' : 'নতুন গ্রাহক প্রোফাইল তৈরি'}
          </h2>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">ISP Management Portal</p>
        </div>
        
        <form className="p-8 space-y-4" onSubmit={(e) => {
          e.preventDefault();
          onSave(formData);
          onClose();
        }}>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">গ্রাহকের পূর্ণ নাম</label>
            <input
              required
              autoFocus
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none font-bold text-slate-800 placeholder:text-slate-300 transition-all"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="আব্দুল করিম"
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">কানেকশন আইডি</label>
              <input
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none text-xs font-bold text-slate-800 placeholder:text-slate-300 transition-all"
                value={formData.connectionName}
                onChange={e => setFormData({ ...formData, connectionName: e.target.value })}
                placeholder="ID_12345"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">মোবাইল নম্বর</label>
              <input
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none font-bold text-slate-800 placeholder:text-slate-300 transition-all"
                value={formData.mobile}
                onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                placeholder="01711223344"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">মাসিক বিল (৳)</label>
              <input
                type="number"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none font-bold text-blue-600"
                value={formData.monthlyBill}
                onChange={e => setFormData({ ...formData, monthlyBill: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">কানেকশন শুরুর তারিখ</label>
              <input
                type="date"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none text-xs font-bold text-slate-800"
                value={formData.connectionDate}
                onChange={e => setFormData({ ...formData, connectionDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">ঠিকানা</label>
            <input
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none font-medium text-slate-800 text-xs transition-all"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              placeholder="হাউস ৫, রোড ২, ঢাকা"
            />
          </div>
          
          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-50 text-slate-500 border border-slate-200 font-bold py-2.5 rounded-lg hover:bg-slate-100 transition-all active:scale-95"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-lg shadow-sm hover:bg-blue-700 transition-all active:scale-95"
            >
              তথ্য সংরক্ষণ করুন
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
