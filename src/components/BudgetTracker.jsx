import React, { useMemo } from 'react';
import useStore from '../store';

const BudgetTracker = ({ budgets }) => {
  const { transactions } = useStore();

  const spentData = useMemo(() => {
    const spent = {};
    if (budgets && transactions) {
      budgets.forEach(budget => {
        spent[budget.category] = transactions
          .filter(t => t.category === budget.category && t.type === 'Expense')
          .reduce((acc, t) => acc + t.amount, 0);
      });
    }
    return spent;
  }, [budgets, transactions]);

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="font-bold mb-4">Budget Progress</h3>
      {budgets.length > 0 ? (
        budgets.map((budget, index) => {
          const spentAmount = spentData[budget.category] || 0;
          const progress = (spentAmount / budget.amount) * 100;
          return (
            <div key={index} className="mb-4">
              <div className="flex justify-between mb-1">
                <span className="font-bold">{budget.category}</span>
                <span>
                  ₹{spentAmount.toLocaleString()} / ₹{budget.amount.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-blue-500 h-4 rounded-full"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                ></div>
              </div>
            </div>
          );
        })
      ) : (
        <p>No budgets to track.</p>
      )}
    </div>
  );
};

export default BudgetTracker;
