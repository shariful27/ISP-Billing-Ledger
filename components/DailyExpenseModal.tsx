import React, { useState, useEffect, useMemo } from 'react';
import { Expense, EXPENSE_CATEGORIES } from '../types';
import { storageService } from '../services/storageService';
import { User } from '../services/authService';

interface DailyExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
}

export const DailyExpenseModal: React.FC<DailyExpenseModalProps> = ({
  isOpen,
  onClose,
  currentUser
}) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    title: '',
    category: EXPENSE_CATEGORIES[0],
    amount: '',
    note: ''
  });

  const isAdmin = currentUser?.role === 'admin' || currentUser?.username.toLowerCase() === 'admin';
  const canManageExpense = isAdmin || Boolean(currentUser?.permissions?.canExpense);

  const loadExpenses = () => {
    setExpenses(storageService.getExpenses());
  };

  useEffect(() => {
    if (isOpen) {
      loadExpenses();
    }
  }, [isOpen]);

  const handleOpenAdd = () => {
    if (!canManageExpense) {
      alert('আপনার ডেলি খরচ এন্ট্রি করার অনুমতি নেই!');
      return;
    }
    setEditingExpense(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      title: '',
      category: EXPENSE_CATEGORIES[0],
      amount: '',
      note: ''
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (exp: Expense) => {
    if (!canManageExpense) {
      alert('আপনার ডেলি খরচ এডিট করার অনুমতি নেই!');
      return;
    }
    setEditingExpense(exp);
    setFormData({
      date: exp.date,
      title: exp.title,
      category: exp.category,
      amount: String(exp.amount),
      note: exp.note || ''
    });
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageExpense) {
      alert('আপনার ডেলি খরচ এন্ট্রি বা এডিট করার অনুমতি নেই!');
      return;
    }
    if (!formData.title.trim() || !formData.amount || Number(formData.amount) <= 0) {
      alert('অনুগ্রহ করে সঠিক বিবরণ ও খরচের পরিমাণ লিখুন!');
      return;
    }

    if (editingExpense) {
      storageService.updateExpense(editingExpense.id, {
        date: formData.date,
        title: formData.title.trim(),
        category: formData.category,
        amount: Number(formData.amount),
        note: formData.note.trim()
      });
    } else {
      storageService.addExpense({
        date: formData.date,
        title: formData.title.trim(),
        category: formData.category,
        amount: Number(formData.amount),
        note: formData.note.trim(),
        createdBy: currentUser.username
      });
    }

    setIsFormOpen(false);
    loadExpenses();
  };

  const handleDelete = (id: string) => {
    if (!canManageExpense) {
      alert('আপনার ডেলি খরচ ডিলিট করার অনুমতি নেই!');
      return;
    }
    if (window.confirm('আপনি কি নিশ্চিত যে এই খরচের এন্ট্রিটি মুছে ফেলতে চান?')) {
      storageService.deleteExpense(id);
      loadExpenses();
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Calculated Stats
  const todayTotal = useMemo(() => {
    return expenses
      .filter(e => e.date === todayStr)
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses, todayStr]);

  const monthTotal = useMemo(() => {
    return expenses
      .filter(e => e.date.startsWith(selectedMonth))
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses, selectedMonth]);

  // Filtered expenses list
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      // Month filter
      if (selectedMonth && !exp.date.startsWith(selectedMonth)) {
        return false;
      }
      // Specific date filter
      if (selectedDate && exp.date !== selectedDate) {
        return false;
      }
      // Category filter
      if (categoryFilter !== 'all' && exp.category !== categoryFilter) {
        return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const titleMatch = exp.title.toLowerCase().includes(term);
        const noteMatch = (exp.note || '').toLowerCase().includes(term);
        const categoryMatch = exp.category.toLowerCase().includes(term);
        if (!titleMatch && !noteMatch && !categoryMatch) return false;
      }
      return true;
    });
  }, [expenses, selectedMonth, selectedDate, categoryFilter, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-[200] font-['Hind_Siliguri']">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 sm:px-8 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight">ডেলি খরচের হিসাব ও রেজিস্টার</h2>
              <p className="text-slate-400 text-[10px] sm:text-xs font-medium">দৈনন্দিন অফিস, ইন্টারনেট ও সার্ভিসিং খরচের সঠিক ট্র্যাকিং</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canManageExpense ? (
              <button
                onClick={handleOpenAdd}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                <span>+ নতুন খরচ যোগ</span>
              </button>
            ) : (
              <span className="text-[11px] font-bold text-amber-300/80 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                🔒 রিড-অনলি মোড
              </span>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-amber-50/70 border border-amber-200/80 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">আজকের মোট খরচ</p>
                <h3 className="text-2xl font-black text-amber-950 mt-1">৳ {todayTotal.toLocaleString('bn-BD')}</h3>
                <p className="text-[10px] text-amber-600 font-bold mt-0.5">তারিখ: {todayStr}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-xl shadow-md">
                💸
              </div>
            </div>

            <div className="bg-blue-50/70 border border-blue-200/80 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest">এই মাসের মোট খরচ</p>
                <h3 className="text-2xl font-black text-blue-950 mt-1">৳ {monthTotal.toLocaleString('bn-BD')}</h3>
                <p className="text-[10px] text-blue-600 font-bold mt-0.5">মাস: {selectedMonth}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-md">
                📅
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ফিল্টারকৃত খরচের মোট</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">
                  ৳ {filteredExpenses.reduce((s, e) => s + e.amount, 0).toLocaleString('bn-BD')}
                </h3>
                <p className="text-[10px] text-slate-500 font-bold mt-0.5">{filteredExpenses.length} টি এন্ট্রি</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-200 text-slate-700 flex items-center justify-center font-black text-xl">
                📊
              </div>
            </div>
          </div>

          {/* Add / Edit Form Modal (Collapsible or Overlay) */}
          {isFormOpen && (
            <form onSubmit={handleSubmit} className="bg-slate-900 text-white p-5 sm:p-6 rounded-2xl border border-slate-700 space-y-4 animate-fadeIn shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black text-amber-400 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  {editingExpense ? 'খরচের এন্ট্রি এডিট করুন' : 'নতুন ডেলি খরচের এন্ট্রি দিন'}
                </h3>
                <button 
                  type="button" 
                  onClick={() => setIsFormOpen(false)}
                  className="text-slate-400 hover:text-white text-xs font-bold bg-slate-800 px-3 py-1 rounded-lg"
                >
                  বাতিল
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">তারিখ</label>
                  <input
                    type="date"
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-amber-400"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">খরচের খাত / ক্যাটাগরি</label>
                  <select
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-amber-400"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                  >
                    {EXPENSE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">বিবরণ / শিরোনাম</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: তার কেনা বা অপটিক্যাল ফাইবার সার্ভিসিং"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-amber-400"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">টাকার পরিমাণ (৳)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="যেমন: 1200"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-black text-amber-400 outline-none focus:border-amber-400"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">নোট (ঐচ্ছিক)</label>
                <input
                  type="text"
                  placeholder="যেমন: চালান নম্বর বা কর্মচারীর নাম"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-300 outline-none focus:border-amber-400"
                  value={formData.note}
                  onChange={e => setFormData({ ...formData, note: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-6 py-2.5 rounded-xl transition-all shadow-md"
                >
                  {editingExpense ? 'আপডেট করুন' : 'সেভ করুন'}
                </button>
              </div>
            </form>
          )}

          {/* Filters Bar */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
            
            {/* Search Input */}
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">সার্চ করুন</label>
              <input
                type="text"
                placeholder="বিবরণ বা ক্যাটাগরি..."
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">খাত ফিল্টার</label>
              <select
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
              >
                <option value="all">সকল খাত (All Categories)</option>
                {EXPENSE_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Month Filter */}
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">মাস সিলেক্ট করুন</label>
              <input
                type="month"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
              />
            </div>

            {/* Specific Date Filter */}
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">নির্দিষ্ট তারিখ (ঐচ্ছিক)</label>
              <div className="flex gap-1">
                <input
                  type="date"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                />
                {selectedDate && (
                  <button
                    type="button"
                    onClick={() => setSelectedDate('')}
                    className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-lg border border-red-100 shrink-0"
                    title="তারিখ ফিল্টার মুছুন"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* Expenses Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                খরচের তালিকা ({filteredExpenses.length} টি)
              </h3>
            </div>

            {filteredExpenses.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center font-bold text-xl">
                  💸
                </div>
                <p className="text-xs font-bold text-slate-500">কোন খরচের হিসাব পাওয়া যায়নি</p>
                <button
                  onClick={handleOpenAdd}
                  className="text-xs font-black text-amber-600 bg-amber-50 px-4 py-2 rounded-xl border border-amber-200"
                >
                  + প্রথম খরচটি যুক্ত করুন
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="bg-slate-100 text-slate-600 font-bold text-[10px] uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">তারিখ</th>
                      <th className="p-3.5">বিবরণ / শিরোনাম</th>
                      <th className="p-3.5">খাত / ক্যাটাগরি</th>
                      <th className="p-3.5 text-right">পরিমাণ (৳)</th>
                      <th className="p-3.5">এন্ট্রি বাই</th>
                      <th className="p-3.5 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {filteredExpenses.map(exp => (
                      <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-bold text-slate-600 whitespace-nowrap">
                          {exp.date}
                        </td>
                        <td className="p-3.5">
                          <p className="font-bold text-slate-900">{exp.title}</p>
                          {exp.note && <p className="text-[10px] text-slate-500 mt-0.5">{exp.note}</p>}
                        </td>
                        <td className="p-3.5">
                          <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-lg inline-block">
                            {exp.category}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-black text-amber-600 text-sm whitespace-nowrap">
                          ৳ {exp.amount.toLocaleString('bn-BD')}
                        </td>
                        <td className="p-3.5 text-slate-500 text-[11px] font-bold">
                          {exp.createdBy}
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          {canManageExpense ? (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleOpenEdit(exp)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="এডিট"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                              </button>
                              <button
                                onClick={() => handleDelete(exp.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="ডিলিট"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-bold">🔒 সংরক্ষিত</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
