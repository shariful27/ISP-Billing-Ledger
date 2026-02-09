
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
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4 z-[200] animate-in">
      <div className="glass-card rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-white/5">
        <div className="premium-btn px-8 py-6 relative">
          <button onClick={onClose} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
          <h2 className="text-white text-xl font-bold tracking-tight">
            {initialData ? 'গ্রাহকের তথ্য আপডেট করুন' : 'নতুন গ্রাহক যোগ করুন'}
          </h2>
          <p className="text-white/60 text-[10px] font-medium mt-1 uppercase tracking-widest">Digital Billing System 3.0</p>
        </div>
        
        <form className="p-8 space-y-5" onSubmit={(e) => {
          e.preventDefault();
          onSave(formData);
          onClose();
        }}>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">গ্রাহকের নাম</label>
            <input
              required
              autoFocus
              className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold text-white placeholder:text-slate-700 transition-all"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="উদা: আব্দুল জলিল"
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">কানেকশন আইডি</label>
              <input
                required
                className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-xs font-bold text-white placeholder:text-slate-700 transition-all"
                value={formData.connectionName}
                onChange={e => setFormData({ ...formData, connectionName: e.target.value })}
                placeholder="উদা: Home_05"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">মোবাইল নম্বর</label>
              <input
                required
                className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold text-white placeholder:text-slate-700 transition-all"
                value={formData.mobile}
                onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                placeholder="017XXXXXXXX"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">মাসিক বিল (৳)</label>
              <input
                type="number"
                required
                className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-black text-indigo-400"
                value={formData.monthlyBill}
                onChange={e => setFormData({ ...formData, monthlyBill: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">কানেকশন শুরুর তারিখ</label>
              <input
                type="date"
                required
                className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-xs font-bold text-white transition-all"
                value={formData.connectionDate}
                onChange={e => setFormData({ ...formData, connectionDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">ঠিকানা</label>
            <input
              className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium text-white placeholder:text-slate-700 text-xs transition-all"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              placeholder="উদা: ব্লক-এ, ঢাকা"
            />
          </div>
          
          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/5 text-slate-400 font-bold py-3.5 rounded-xl hover:bg-white/10 transition-all active:scale-95"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="flex-1 premium-btn text-white font-bold py-3.5 rounded-xl shadow-xl shadow-indigo-600/20 transition-all active:scale-95"
            >
              {initialData ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
