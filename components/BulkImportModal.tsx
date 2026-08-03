import React, { useState } from 'react';
import { Customer } from '../types';
import { storageService } from '../services/storageService';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (customers: Partial<Customer>[]) => void;
}

interface ParsedRow extends Partial<Customer> {
  isDuplicate?: boolean;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({ isOpen, onClose, onImportSuccess }) => {
  const [pastedText, setPastedText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [hasHeader, setHasHeader] = useState(true);
  const [step, setStep] = useState<'paste' | 'preview'>('paste');

  if (!isOpen) return null;

  // Helper to parse pasted raw Google Sheet TSV/CSV text
  const parseData = (rawText: string) => {
    if (!rawText.trim()) {
      setParsedRows([]);
      return;
    }

    const existingCustomers = storageService.getCustomers();
    const existingConnNames = new Set(existingCustomers.map(c => c.connectionName.trim().toLowerCase()));

    const lines = rawText.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) return;

    let startIndex = 0;
    let srIdx = -1;
    let idIdx = -1;
    let nameIdx = -1;
    let mobileIdx = -1;
    let zoneIdx = -1;
    let billIdx = -1;
    let dueIdx = -1;
    let addressIdx = -1;

    // Check header line
    const firstLineCells = lines[0].split(/\t|,/).map(c => c.trim().toLowerCase().replace(/^["']|["']$/g, ''));
    const isHeaderLine = firstLineCells.some(cell => 
      cell.includes('sr') || cell.includes('id') || cell.includes('ip') || cell.includes('client') || 
      cell.includes('name') || cell.includes('mobile') || cell.includes('zone') || cell.includes('bill') || 
      cell.includes('due') || cell.includes('গ্রাহক') || cell.includes('বকেয়া')
    );

    if (hasHeader && isHeaderLine) {
      startIndex = 1;
      firstLineCells.forEach((header, idx) => {
        if (header.includes('sr') || header.includes('ক্রমিক')) srIdx = idx;
        else if (header.includes('id') || header.includes('ip')) idIdx = idx;
        else if (header.includes('client') || header.includes('name') || header.includes('গ্রাহক')) nameIdx = idx;
        else if (header.includes('mobile') || header.includes('phone') || header.includes('মোবাইল')) mobileIdx = idx;
        else if (header.includes('zone') || header.includes('জোন')) zoneIdx = idx;
        else if (header.includes('bill') || header.includes('বিল')) billIdx = idx;
        else if (header.includes('due') || header.includes('বকেয়া')) dueIdx = idx;
        else if (header.includes('address') || header.includes('ঠিকানা')) addressIdx = idx;
      });
    }

    const customers: ParsedRow[] = [];
    const seenBatchConnNames = new Set<string>();

    let validCount = 0;

    for (let i = startIndex; i < lines.length; i++) {
      let cells = lines[i].split('\t');
      if (cells.length <= 1) {
        cells = lines[i].split(',');
      }

      cells = cells.map(c => c.trim().replace(/^["']|["']$/g, ''));
      if (cells.length === 0 || cells.every(c => c === '')) continue;

      let srVal: string | number = '';
      let connectionName = '';
      let name = '';
      let mobile = '';
      let zone = '';
      let bill = 500;
      let due = 0;
      let address = '';

      if (idIdx !== -1 || nameIdx !== -1 || mobileIdx !== -1) {
        if (srIdx !== -1 && cells[srIdx] !== undefined) srVal = cells[srIdx];
        if (idIdx !== -1 && cells[idIdx] !== undefined) connectionName = cells[idIdx];
        if (nameIdx !== -1 && cells[nameIdx] !== undefined) name = cells[nameIdx];
        if (mobileIdx !== -1 && cells[mobileIdx] !== undefined) mobile = cells[mobileIdx];
        if (zoneIdx !== -1 && cells[zoneIdx] !== undefined) zone = cells[zoneIdx];
        if (billIdx !== -1 && cells[billIdx] !== undefined) bill = Number(cells[billIdx]) || 500;
        if (dueIdx !== -1 && cells[dueIdx] !== undefined) due = Number(cells[dueIdx]) || 0;
        if (addressIdx !== -1 && cells[addressIdx] !== undefined) address = cells[addressIdx];
      } else {
        if (cells.length >= 6) {
          srVal = cells[0];
          connectionName = cells[1] || '';
          name = cells[2] || '';
          mobile = cells[3] || '';
          zone = cells[4] || '';
          bill = Number(cells[5]) || 500;
          due = Number(cells[6]) || 0;
          address = cells[7] || '';
        } else if (cells.length === 5) {
          connectionName = cells[0];
          name = cells[1];
          mobile = cells[2];
          zone = cells[3];
          bill = Number(cells[4]) || 500;
        } else if (cells.length === 4) {
          connectionName = cells[0];
          name = cells[1];
          mobile = cells[2];
          zone = cells[3];
        } else if (cells.length === 3) {
          connectionName = cells[0];
          name = cells[1];
          mobile = cells[2];
        } else if (cells.length === 2) {
          name = cells[0];
          mobile = cells[1];
        } else {
          name = cells[0];
        }
      }

      const connKey = connectionName.trim().toLowerCase();
      const isDuplicate = connKey !== '' && (existingConnNames.has(connKey) || seenBatchConnNames.has(connKey));

      if (connKey) {
        seenBatchConnNames.add(connKey);
      }

      if (!isDuplicate) {
        validCount++;
      }

      customers.push({
        sr: srVal || (isDuplicate ? '—' : validCount),
        connectionName,
        name: name || connectionName || `গ্রাহক-${validCount}`,
        mobile,
        zone,
        monthlyBill: isNaN(bill) ? 500 : bill,
        initialDue: isNaN(due) ? 0 : due,
        address,
        connectionDate: new Date().toISOString().split('T')[0],
        isDuplicate
      });
    }

    setParsedRows(customers);
  };

  const handleParsePreview = () => {
    parseData(pastedText);
    setStep('preview');
  };

  const validRows = parsedRows.filter(r => !r.isDuplicate);
  const duplicateRowsCount = parsedRows.filter(r => r.isDuplicate).length;

  const handleConfirmImport = () => {
    if (validRows.length > 0) {
      onImportSuccess(validRows);
      setPastedText('');
      setParsedRows([]);
      setStep('paste');
      onClose();
    }
  };

  const sampleTemplate = `Sr\tID/IP\tClientName\tMobile\tZone\tMonthlyBill\tDue\tAddress
1\t10.10.1.10\tআব্দুল করিম\t01711112233\tজোন-এ\t500\t0\tউত্তরা
2\t10.10.1.11\tরহিম সিকদার\t01822223344\tজোন-বি\t800\t500\tমিরপুর
3\tID-103\tসুমন আহমেদ\t01933334455\tজোন-এ\t1000\t0\tধানমন্ডি`;

  const copySample = () => {
    navigator.clipboard.writeText(sampleTemplate);
    alert('গুগল শিট ফরম্যাট কপি হয়েছে! আপনার শিটে পেস্ট করে তথ্য সাজাতে পারেন।');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-[200]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 sm:px-8 py-5 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500 text-slate-900 font-extrabold text-[10px] px-2 py-0.5 rounded">Google Sheets</span>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight">বাল্ক গ্রাহক ইমপোর্ট (Bulk User Setup)</h2>
            </div>
            <p className="text-slate-400 text-[10px] sm:text-[11px] mt-0.5 font-medium">
              গুগল শিট বা এক্সেল থেকে তথ্য কপি করে একসাথে শত শত গ্রাহক যুক্ত করুন
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto scrollbar-hide space-y-6 flex-1">
          {step === 'paste' ? (
            <div className="space-y-4">
              
              {/* Guidance Box */}
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-950 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    শিটের কলাম অর্ডার (Google Sheet Columns):
                  </span>
                  <button 
                    onClick={copySample}
                    className="text-[10px] font-bold bg-white text-blue-700 px-3 py-1 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors shadow-sm"
                  >
                    স্যাম্পল ফরম্যাট কপি করুন
                  </button>
                </div>
                <p className="font-bold text-slate-700 text-[11px] bg-white/80 p-2 rounded border border-blue-100 font-mono overflow-x-auto">
                  Sr | ID/IP | ClientName | Mobile | Zone | MonthlyBill | Due | Address
                </p>
                <p className="text-[10px] text-slate-500">
                  * গুগল শিটে সেল সিলেক্ট করে কপি (Ctrl+C) করে নিচের বক্সে পেস্ট (Ctrl+V) করুন।
                </p>
              </div>

              {/* Checkbox for Header */}
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="hasHeader" 
                  checked={hasHeader} 
                  onChange={e => setHasHeader(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="hasHeader" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                  প্রথম লাইনে কলামের নাম (Header Row) রয়েছে
                </label>
              </div>

              {/* Text Area Input */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">
                  গুগল শিট থেকে কপি করা ডাটা পেস্ট করুন:
                </label>
                <textarea
                  rows={8}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-4 text-xs font-mono focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-300"
                  placeholder={`1\t10.10.1.10\tআব্দুল করিম\t01711112233\tজোন-এ\t500\t0\tউত্তরা\n2\t10.10.1.11\tরহিম সিকদার\t01822223344\tজোন-বি\t800\t500\tমিরপুর`}
                  value={pastedText}
                  onChange={e => setPastedText(e.target.value)}
                />
              </div>

            </div>
          ) : (
            /* Step 2: Data Preview Table */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-200 gap-2">
                <div>
                  <span className="text-xs font-bold text-slate-700">মোট ইমপোর্ট হবে: </span>
                  <span className="text-sm font-black text-emerald-600 px-2 py-0.5 bg-emerald-50 rounded-lg">{validRows.length} জন নতুন গ্রাহক</span>
                  {duplicateRowsCount > 0 && (
                    <span className="text-xs font-bold text-red-600 ml-2 bg-red-50 px-2 py-0.5 rounded-lg border border-red-100">
                      ({duplicateRowsCount} টি ডুপ্লিকেট ID/IP বাদ দেওয়া হয়েছে)
                    </span>
                  )}
                </div>
                <button 
                  onClick={() => setStep('paste')}
                  className="text-xs text-slate-500 hover:text-slate-800 underline font-bold"
                >
                  ডাটা আবার এডিট করুন
                </button>
              </div>

              {duplicateRowsCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                  <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                  <span>লাল চিহ্নিত ID/IP গুলো ইতোমধ্যে ডাটাবেজে থাকায় বা একই শিটে পুনরাবৃত্তি হওয়ায় স্বয়ংক্রিয়ভাবে বাদ দেওয়া হয়েছে।</span>
                </div>
              )}

              {/* Table Preview */}
              <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-[350px]">
                <table className="w-full text-left text-xs border-collapse min-w-[650px]">
                  <thead className="bg-slate-100 sticky top-0 border-b border-slate-200 text-slate-600 font-bold uppercase text-[9px] tracking-widest">
                    <tr>
                      <th className="p-3">Sr</th>
                      <th className="p-3">ID / IP</th>
                      <th className="p-3">Client Name</th>
                      <th className="p-3">Mobile</th>
                      <th className="p-3">Zone</th>
                      <th className="p-3 text-center">Monthly Bill</th>
                      <th className="p-3 text-center">Due</th>
                      <th className="p-3">Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className={row.isDuplicate ? "bg-red-50/60 text-slate-400 line-through" : "hover:bg-slate-50"}>
                        <td className="p-3 font-bold text-slate-500">{row.sr}</td>
                        <td className="p-3 font-bold">
                          <span className={row.isDuplicate ? "text-red-500 font-extrabold" : "text-blue-600"}>
                            {row.connectionName}
                          </span>
                          {row.isDuplicate && (
                            <span className="ml-1.5 text-[8px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded no-underline inline-block">
                              ডুপ্লিকেট (বাদ)
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-bold text-slate-900">{row.name}</td>
                        <td className="p-3 text-slate-700">{row.mobile || '-'}</td>
                        <td className="p-3">
                          <span className="bg-slate-100 text-slate-700 font-bold text-[10px] px-2 py-0.5 rounded">
                            {row.zone || 'সাধারণ'}
                          </span>
                        </td>
                        <td className="p-3 text-center font-bold text-slate-800">৳{row.monthlyBill}</td>
                        <td className="p-3 text-center font-black text-red-500">৳{row.initialDue}</td>
                        <td className="p-3 text-slate-400 text-[11px] truncate max-w-[120px]">{row.address || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 p-4 sm:p-6 border-t border-slate-200 flex gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-white text-slate-600 border border-slate-200 font-bold py-3 rounded-xl hover:bg-slate-100 transition-all text-xs"
          >
            বাতিল
          </button>

          {step === 'paste' ? (
            <button
              type="button"
              disabled={!pastedText.trim()}
              onClick={handleParsePreview}
              className="flex-1 bg-blue-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-md hover:bg-blue-700 transition-all text-xs flex items-center justify-center gap-2"
            >
              <span>ডাটা প্রিভিউ দেখুন</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConfirmImport}
              className="flex-1 bg-emerald-600 text-white font-black py-3 rounded-xl shadow-md hover:bg-emerald-700 transition-all text-xs flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
              <span>সকল {parsedRows.length} জন গ্রাহক ইমপোর্ট করুন</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
