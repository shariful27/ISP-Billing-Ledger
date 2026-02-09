
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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-8 py-6 relative">
          <button onClick={onClose} className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
          <h2 className="text-white text-2xl font-black">
            {initialData ? 'গ্রাহকের তথ্য এডিট করুন' : 'নতুন গ্রাহক যুক্ত করুন'}
          </h2>
          <p className="text-indigo-100 text-sm mt-1">সবগুলো তথ্য নির্ভুলভাবে পূরণ করুন</p>
        </div>
        
        <form className="p-8 space-y-5" onSubmit={(e) => {
          e.preventDefault();
          onSave(formData);
          onClose();
        }}>
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">গ্রাহকের নাম</label>
            <input
              required
              autoFocus
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 focus:bg-white transition-all outline-none font-bold"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="উদা: কামাল হোসেন"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">কানেকশন নাম</label>
              <input
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 focus:bg-white transition-all outline-none text-sm font-bold"
                value={formData.connectionName}
                onChange={e => setFormData({ ...formData, connectionName: e.target.value })}
                placeholder="উদা: Home WiFi / Line 1"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">মোবাইল নম্বর</label>
              <input
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 focus:bg-white transition-all outline-none font-bold"
                value={formData.mobile}
                onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                placeholder="017XXXXXXXX"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">মাসিক বিল (৳)</label>
              <input
                type="number"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 focus:bg-white transition-all outline-none font-black text-indigo-600"
                value={formData.monthlyBill}
                onChange={e => setFormData({ ...formData, monthlyBill: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">কানেকশন তারিখ</label>
              <input
                type="date"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 focus:bg-white transition-all outline-none text-sm font-bold"
                value={formData.connectionDate}
                onChange={e => setFormData({ ...formData, connectionDate: e.target.value })}
              />
            </div>
          </div>
          
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 text-slate-600 font-black py-4 rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all active:scale-95"
            >
              সংরক্ষণ করুন
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
