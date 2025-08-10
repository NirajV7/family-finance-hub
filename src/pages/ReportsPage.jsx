import React, { useEffect, useMemo, useState, useRef } from 'react';
import useStore from '../store';
import ReportChart from '../components/ReportChart';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, LineChart, Line } from 'recharts';

const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
const toJSDate = (d) => (d && typeof d.toDate === 'function') ? d.toDate() : new Date(d);

const PERIODS = [
  { key: 'thisMonth', label: 'This Month' },
  { key: 'lastMonth', label: 'Last Month' },
  { key: 'thisYear', label: 'This Year' },
];

const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
const monthLabel = (date) => date.toLocaleString('en-IN', { month: 'short', year: '2-digit' });

const ReportsPage = () => {
  const { users, allTransactions, fetchAllTransactions, fetchUsers } = useStore();
  const [monthsRange, setMonthsRange] = useState(6);
  const [period, setPeriod] = useState('thisMonth');
  const [exportFrom, setExportFrom] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10));
  const [exportTo, setExportTo] = useState(() => new Date().toISOString().slice(0,10));
  const [spendingMode, setSpendingMode] = useState('Expense'); // 'Expense' | 'Income'
  const printRef = useRef(null);

  useEffect(() => {
    const unsubUsers = fetchUsers?.();
    const unsubAll = fetchAllTransactions?.();
    return () => {
      unsubUsers && unsubUsers();
      unsubAll && unsubAll();
    };
  }, [fetchAllTransactions, fetchUsers]);

  // Helper: get date range for selected period
  const getPeriodRange = useMemo(() => {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    if (period === 'thisMonth') return { from: startOfThisMonth, to: endOfThisMonth };
    if (period === 'lastMonth') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { from: start, to: end };
    }
    if (period === 'thisYear') {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      return { from: start, to: end };
    }
    return { from: new Date(0), to: new Date() };
  }, [period]);

  // Filter transactions for selected period (for category and spending-by-user)
  const periodTx = useMemo(() => {
    const { from, to } = getPeriodRange;
    return (allTransactions || []).filter(t => {
      const d = toJSDate(t.date);
      return d >= from && d <= to;
    });
  }, [allTransactions, getPeriodRange]);

  // Expense Breakdown by Category data
  const expenseData = useMemo(() => {
    const expenseByCategory = {};
    periodTx
      .filter(t => t.type === 'Expense')
      .forEach(t => {
        const category = t.category || 'Uncategorized';
        expenseByCategory[category] = (expenseByCategory[category] || 0) + (t.amount || 0);
      });
    return Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }));
  }, [periodTx]);

  // Spending by User (Expense totals) for selected period
  const spendingByUserData = useMemo(() => {
    const map = {};
    users.forEach(u => { map[u.id] = { name: u.name, expense: 0, income: 0 }; });
    periodTx.forEach(t => {
      const uid = t.user;
      if (!map[uid]) return;
      if (t.type === 'Expense') {
        map[uid].expense += t.amount || 0;
      } else if (t.type === 'Income' || t.type === 'Profit' || t.type === 'Return of Principal') {
        map[uid].income += t.amount || 0;
      }
    });
    return Object.values(map);
  }, [periodTx, users]);

  // Monthly Income vs Expense and Net for last N months
  const monthlyTrends = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = monthsRange - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: monthKey(d), label: monthLabel(d), income: 0, expense: 0, net: 0 });
    }
    const indexByKey = months.reduce((acc, m, idx) => { acc[m.key] = idx; return acc; }, {});
    (allTransactions || []).forEach(t => {
      const d = toJSDate(t.date);
      const key = monthKey(new Date(d.getFullYear(), d.getMonth(), 1));
      const idx = indexByKey[key];
      if (idx === undefined) return;
      if (t.type === 'Income' || t.type === 'Profit' || t.type === 'Return of Principal') {
        months[idx].income += t.amount || 0;
      } else if (t.type === 'Expense' || t.type === 'Investment') {
        months[idx].expense += t.amount || 0;
      }
    });
    months.forEach(m => { m.net = (m.income || 0) - (m.expense || 0); });
    return months;
  }, [allTransactions, monthsRange]);

  // CSV Export
  const handleExportCSV = () => {
    const from = new Date(exportFrom);
    const to = new Date(exportTo);
    to.setHours(23,59,59,999);
    const rows = (allTransactions || []).filter(t => {
      const d = toJSDate(t.date);
      return d >= from && d <= to;
    }).map(t => ({
      id: t.id,
      date: toJSDate(t.date).toISOString().slice(0,10),
      user: users.find(u => u.id === t.user)?.name || t.user,
      type: t.type,
      category: t.category || '',
      description: t.description || '',
      amount: t.amount,
      to: t.to ? (users.find(u => u.id === t.to)?.name || t.to) : ''
    }));

    const header = ['ID','Date','User','Type','Category','Description','Amount','To'];
    const csv = [header.join(','), ...rows.map(r => [r.id, r.date, `"${r.user}"`, r.type, `"${r.category}"`, `"${r.description.replace(/"/g,'""')}"`, r.amount, `"${r.to}"`].join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions_${exportFrom}_to_${exportTo}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintPDF = () => {
    // Open print dialog; user can choose "Save as PDF"
    window.print();
  };

  return (
    <div className="p-4">
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-6 rounded-xl shadow mb-6">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white_0,transparent_40%),radial-gradient(circle_at_80%_0,white_0,transparent_35%)]" aria-hidden="true"></div>
        <div className="relative">
          <h2 className="text-2xl font-extrabold">Reports</h2>
          <p className="text-sm text-white/85">Trends, breakdowns and exports for smarter decisions</p>
        </div>
      </div>

      {/* Overall Financial Trends */}
      <div className="card p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold">Overall Financial Trends</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Last</span>
            <select value={monthsRange} onChange={(e)=>setMonthsRange(parseInt(e.target.value))} className="p-1 border rounded text-sm">
              <option value={6}>6 months</option>
              <option value={12}>12 months</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="border rounded p-2">
            <h4 className="font-semibold mb-2 text-sm text-gray-700">Income vs Expense</h4>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthlyTrends} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis tickFormatter={v=>v>=1000?`${Math.round(v/1000)}k`:v} />
                <Tooltip formatter={(v)=>formatCurrency(v)} />
                <Legend />
                <Line type="monotone" dataKey="income" name="Income" stroke="#16A34A" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="expense" name="Expense" stroke="#DC2626" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Spending Analysis */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold">Spending Analysis</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Period</span>
            <select value={period} onChange={(e)=>setPeriod(e.target.value)} className="p-1 border rounded text-sm">
              {PERIODS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="border rounded p-2">
            <h4 className="font-semibold mb-2 text-sm text-gray-700">Expense Breakdown by Category</h4>
            <ReportChart data={expenseData} />
          </div>
          <div className="border rounded p-2">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm text-gray-700">Spending by User</h4>
              <div className="inline-flex rounded-md shadow-sm overflow-hidden border border-gray-200">
                <button type="button" className={`${spendingMode==='Expense'?'bg-gray-900 text-white':'bg-white text-gray-700'} px-3 py-1 text-xs`} onClick={()=>setSpendingMode('Expense')}>Expense</button>
                <button type="button" className={`${spendingMode==='Income'?'bg-gray-900 text-white':'bg-white text-gray-700'} px-3 py-1 text-xs border-l border-gray-200`} onClick={()=>setSpendingMode('Income')}>Income</button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={spendingByUserData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={v=>v>=1000?`${Math.round(v/1000)}k`:v} />
                <Tooltip formatter={(v)=>formatCurrency(v)} />
                <Legend />
                {spendingMode==='Expense' ? (
                  <Bar dataKey="expense" name="Expense" fill="#DC2626" />
                ) : (
                  <Bar dataKey="income" name="Income" fill="#16A34A" />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Data Export */}
      <div className="bg-white p-4 rounded-lg shadow mb-6" ref={printRef}>
        <h3 className="font-bold mb-4">Data Export</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block mb-1 text-sm">From</label>
            <input type="date" value={exportFrom} onChange={(e)=>setExportFrom(e.target.value)} className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block mb-1 text-sm">To</label>
            <input type="date" value={exportTo} onChange={(e)=>setExportTo(e.target.value)} className="w-full p-2 border rounded" />
          </div>
          <div className="flex gap-2 md:col-span-2">
            <button onClick={handleExportCSV} className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600">Export CSV</button>
            <button onClick={handlePrintPDF} className="bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-700">Export PDF</button>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-500">Tip: PDF export opens your browser's print dialog; choose "Save as PDF".</p>
      </div>
    </div>
  );
};

export default ReportsPage;
