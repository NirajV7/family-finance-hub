import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

const AccountsReportChart = ({ users, transactions }) => {
  const totalsByUser = users.reduce((acc, u) => {
    acc[u.id] = { name: u.name, income: 0, expense: 0 };
    return acc;
  }, {});

  transactions.forEach(t => {
    // Count by originating user
    const userId = t.user;
    if (!totalsByUser[userId]) return;
    if (t.type === 'Income' || t.type === 'Profit' || t.type === 'Return of Principal') {
      totalsByUser[userId].income += t.amount;
    } else if (t.type === 'Expense' || t.type === 'Investment') {
      totalsByUser[userId].expense += t.amount;
    }
  });

  const data = Object.values(totalsByUser);

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="income" name="Income" fill="#16A34A" />
        <Bar dataKey="expense" name="Expense" fill="#DC2626" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default AccountsReportChart;
