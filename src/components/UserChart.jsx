import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg rounded-md p-2">
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className="text-sm font-semibold text-indigo-600">{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

const UserChart = ({ users }) => {
  const data = users.map(user => ({
    name: user.name,
    balance: user.balance,
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366F1" stopOpacity={0.95} />
            <stop offset="100%" stopColor="#A78BFA" stopOpacity={0.7} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={{ stroke: '#E5E7EB' }} tickLine={false} />
        <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={{ stroke: '#E5E7EB' }} tickLine={false} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v/1000)}k` : v)} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
        <Legend wrapperStyle={{ paddingTop: 8 }} formatter={() => 'Balance'} iconType="circle" />
        <Bar dataKey="balance" name="Balance" fill="url(#balanceGradient)" radius={[10, 10, 0, 0]} barSize={36} animationDuration={700} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default UserChart;
