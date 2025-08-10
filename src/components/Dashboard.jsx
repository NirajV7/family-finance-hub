import React from 'react';
import { Link } from 'react-router-dom';
import UserChart from './UserChart';

const Dashboard = ({ users, transactions }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalCapitalSum = users.reduce((sum, user) => sum + (user.balance || 0), 0);
  const baselineStored = typeof window !== 'undefined' ? window.localStorage.getItem('totalCapitalBaseline') : null;
  const [editingCapital, setEditingCapital] = React.useState(false);
  const [baselineCapital, setBaselineCapital] = React.useState(() => baselineStored ? parseFloat(baselineStored) : 2500000);
  const recentTransactions = transactions.slice(0, 5);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('totalCapitalBaseline', String(baselineCapital || 0));
    }
  }, [baselineCapital]);

  return (
    <div>
      <h2 className="text-3xl font-bold mb-4">Family Dashboard</h2>
      
      {/* Total Capital Display */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-6 rounded-xl shadow-xl mb-6">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white_0,transparent_40%),radial-gradient(circle_at_80%_0,white_0,transparent_35%)]" aria-hidden="true"></div>
        <div className="relative">
          <h3 className="text-xl font-semibold mb-1">Total Family Capital</h3>
          <div className="flex items-end gap-3">
            <p className="text-4xl font-extrabold">{formatCurrency(baselineCapital)}</p>
            <button onClick={()=>setEditingCapital(true)} className="ml-2 text-sm bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-md">Edit</button>
          </div>
          <p className="mt-1 text-xs text-white/80">Sum of user balances: {formatCurrency(totalCapitalSum)}</p>
        </div>
      </div>

      {editingCapital && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl p-5 w-full max-w-sm">
            <h4 className="font-bold text-lg mb-3">Update Total Capital</h4>
            <label className="block text-sm mb-1">Amount (INR)</label>
            <input type="number" value={baselineCapital} onChange={(e)=>setBaselineCapital(parseFloat(e.target.value)||0)} className="w-full p-2 border rounded mb-4" min="0" step="1" />
            <div className="flex justify-end gap-2">
              <button onClick={()=>setEditingCapital(false)} className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300">Close</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {users.map(user => (
          <Link to={`/users/${user.id}`} key={user.id} className="bg-white p-4 rounded-lg shadow hover:bg-gray-50">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-bold text-lg">{user.name}</h3>
            </div>
            <p className="text-2xl">{formatCurrency(user.balance)}</p>
          </Link>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white p-4 rounded-lg shadow">
          <h3 className="font-bold mb-4">User Balances</h3>
          <UserChart users={users} />
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-bold mb-4">Recent Transactions</h3>
          <ul>
            {recentTransactions.map(t => (
              <li key={t.id} className="border-b py-2">
                <p className="font-semibold">{(t.description && String(t.description).trim()) || 'General Transaction'}</p>
                <p className="text-sm text-gray-600">
                  {t.user} - {formatCurrency(t.amount)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
