
import React, { useState, useEffect } from 'react';
import { Customer } from '../types';
import { storageService } from '../services/storageService';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Partial<Customer>) => boolean | void;
  initialData?: Customer;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [errorMsg, setErrorMsg] = useState('');
  const [formData, setFormData] = useState<Partial<Customer>>({
    sr: '',
    name: '',
    connectionName: '',
    mobile: '',
    zone: '',
    monthlyBill: 500,
    initialDue: 0,
    address: '',
    connectionDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    setErrorMsg('');
    if (initialData) {
      setFormData(initialData);
    } else {
      const currentCustomers = storageService.getCustomers();
      const maxSr = currentCustomers.reduce((max, c) => Math.max(max, Number(c.sr) || 0), 0);
      setFormData({ 
        sr: maxSr + 1,
        name: '', 
        connectionName: '', 
        mobile: '', 
        zone: '',
        monthlyBill: 500,
        initialDue: 0,
        address: '', 
        connectionDate: new Date().toISOString().split('T')[0]
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const connName = (formData.connectionName || '').trim();
    if (!connName) {
      setErrorMsg('আইডি/আইপি (ID/IP) প্রদান করা আবশ্যক!');
      return;
    }

    // Duplicate check
    const existingCustomers = storageService.getCustomers();
    const duplicate = existingCustomers.find(c => 
      c.connectionName.trim().toLowerCase() === connName.toLowerCase() && 
      (!initialData || c.id !== initialData.id)
    );

    if (duplicate) {
      setErrorMsg(`⚠️ এই ID/IP (${connName}) দিয়ে ইতোমধ্যে একজন গ্রাহক (${duplicate.name}) যুক্ত রয়েছেন! নতুন কাস্টমার যুক্ত হবে না।`);
      return;
    }

    const saved = onSave(formData);
    if (saved !== false) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-[200]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        <div className="bg-slate-50 px-6 sm:px-8 py-4 sm:py-5 border-b border-slate-200 relative shrink-0">
          <button onClick={onClose} className="absolute top-4 sm:top-5 right-4 sm:right-6 text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
          <h2 className="text-slate-800 text-lg sm:text-xl font-bold tracking-tight">
            {initialData ? 'গ্রাহকের তথ্য সংশোধন' : 'নতুন গ্রাহক প্রোফাইল'}
          </h2>
          <p className="text-slate-400 text-[8px] sm:text-[10px] font-bold uppercase tracking-widest mt-0.5">ISP Client Entry Form</p>
        </div>
        
        <form className="p-6 sm:p-8 space-y-4 overflow-y-auto scrollbar-hide" onSubmit={handleSubmit}>
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-bold p-3 rounded-xl flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              <span>{errorMsg}</span>
            </div>
          )}
          {/* Row 1: Sr & ID/IP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">ক্রমিক নং (Sr)</label>
              <input
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none font-bold text-slate-800 text-xs"
                value={formData.sr || ''}
                onChange={e => setFormData({ ...formData, sr: e.target.value })}
                placeholder="যেমন: 1, 2, 01"
              />
            </div>
            <div>
              <label className="block text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">আইডি / আইপি (ID/IP) <span className="text-red-500">*</span></label>
              <input
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none text-xs font-bold text-slate-800 placeholder:text-slate-300 transition-all"
                value={formData.connectionName}
                onChange={e => setFormData({ ...formData, connectionName: e.target.value })}
                placeholder="যেমন: 10.10.1.5 বা ID-101"
              />
            </div>
          </div>

          {/* Row 2: Client Name & Mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">গ্রাহকের নাম (Client Name) <span className="text-red-500">*</span></label>
              <input
                required
                autoFocus
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none font-bold text-slate-800 text-sm"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="যেমন: রহিম সিকদার"
              />
            </div>
            <div>
              <label className="block text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">মোবাইল নম্বর (Mobile) <span className="text-red-500">*</span></label>
              <input
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none font-bold text-slate-800 text-sm"
                value={formData.mobile}
                onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                placeholder="01711000000"
              />
            </div>
          </div>

          {/* Row 3: Zone & Monthly Bill */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">জোন / এলাকা (Zone)</label>
              <input
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none font-bold text-slate-800 text-xs"
                value={formData.zone || ''}
                onChange={e => setFormData({ ...formData, zone: e.target.value })}
                placeholder="যেমন: জোন-এ / উত্তরা"
              />
            </div>
            <div>
              <label className="block text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">মাসিক বিল (৳)</label>
              <input
                type="number"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none font-black text-blue-600 text-sm"
                value={formData.monthlyBill || ''}
                onChange={e => setFormData({ ...formData, monthlyBill: Number(e.target.value) })}
                placeholder="500"
              />
            </div>
          </div>

          {/* Row 4: Initial Due & Connection Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">পূর্বের বকেয়া (Due ৳)</label>
              <input
                type="number"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none font-bold text-red-600 text-xs"
                value={formData.initialDue ?? ''}
                onChange={e => setFormData({ ...formData, initialDue: Number(e.target.value) })}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">বিল লাস্ট ডেট (১-৩১)</label>
              <input
                type="number"
                min={1}
                max={31}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none font-bold text-slate-800 text-xs"
                value={formData.dueDay ?? ''}
                onChange={e => setFormData({ ...formData, dueDay: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="ডিফল্ট: ১০"
              />
            </div>
            <div>
              <label className="block text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">শুরুর তারিখ</label>
              <input
                type="date"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none text-xs font-bold text-slate-800"
                value={formData.connectionDate}
                onChange={e => setFormData({ ...formData, connectionDate: e.target.value })}
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">ঠিকানা</label>
            <input
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none font-medium text-slate-800 text-xs"
              value={formData.address || ''}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              placeholder="বাসা নং, রোড নং, এলাকা"
            />
          </div>
          
          <div className="flex gap-3 pt-4 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 text-slate-600 border border-slate-200 font-bold py-3 rounded-xl hover:bg-slate-200 transition-all active:scale-95 text-xs"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl shadow-md hover:bg-blue-700 transition-all active:scale-95 text-xs"
            >
              তথ্য সেভ করুন
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
