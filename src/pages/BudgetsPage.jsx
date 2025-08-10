import React, { useState } from 'react';
import BudgetTracker from '../components/BudgetTracker';

const BudgetsPage = () => {
  const [budgets, setBudgets] = useState([]);
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');

  const handleAddBudget = (e) => {
    e.preventDefault();
    if (category && amount) {
      setBudgets([...budgets, { category, amount: parseFloat(amount), spent: 0 }]);
      setCategory('');
      setAmount('');
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-3xl font-bold mb-4">Budgets</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <form onSubmit={handleAddBudget} className="p-4 bg-white rounded-lg shadow">
            <h3 className="font-bold mb-4">Add New Budget</h3>
            <div className="mb-4">
              <label className="block mb-1">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1">Amount</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
              Add Budget
            </button>
          </form>
        </div>
        <div className="md:col-span-2">
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="font-bold mb-4">Existing Budgets</h3>
            {budgets.length > 0 ? (
              <ul>
                {budgets.map((budget, index) => (
                  <li key={index} className="mb-2 p-2 border-b">
                    <div className="flex justify-between">
                      <span>{budget.category}</span>
                      <span>₹{budget.amount.toLocaleString()}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No budgets set yet.</p>
            )}
          </div>
        </div>
      </div>
      <div className="mt-6">
        <BudgetTracker budgets={budgets} />
      </div>
    </div>
  );
};

export default BudgetsPage;
