import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#4F46E5', '#22C55E', '#F59E0B', '#EC4899', '#06B6D4', '#A855F7', '#EF4444', '#10B981', '#3B82F6'];

const currency = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);

const ReportChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <p className="text-sm text-gray-500">No expense data to display.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={360}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={120}
          paddingAngle={2}
          label={({ name, value }) => `${name}: ${Math.round((value / data.reduce((s,d)=>s+d.value,0)) * 100)}%`}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => currency(v)} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default ReportChart;
