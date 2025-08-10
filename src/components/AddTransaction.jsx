import React, { useState, useMemo } from 'react';
import { collection, addDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firestore';
import useStore from '../store';

const CATEGORY_OPTIONS = {
  Expense: [
    'Groceries', 'Food & Dining', 'Housing', 'Utilities', 'Transportation', 'Healthcare', 'Education', 'Entertainment', 'Shopping', 'Travel', 'Insurance', 'Taxes', 'Personal Care', 'Gifts & Donations', 'Miscellaneous'
  ],
  Income: [
    'Salary', 'Bonus', 'Interest', 'Gift', 'Rental Income', 'Business', 'Dividend', 'Refund'
  ],
  Investment: [
    'Stocks', 'Mutual Funds', 'Crypto', 'Bonds', 'Real Estate', 'Gold', 'PPF', 'FD/RD'
  ],
  Transfer: [
    'Family Transfer', 'Debt Payment', 'Loan', 'Savings', 'Other'
  ],
};

const AddTransaction = () => {
  const { users } = useStore();
  const [type, setType] = useState('Expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [user, setUser] = useState('');
  const [toUser, setToUser] = useState('');
  const [category, setCategory] = useState('');

  const categoriesForType = useMemo(() => CATEGORY_OPTIONS[type] || [], [type]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const requiredMissing = !type || !amount || !date || !user || ((type !== 'Transfer') && !category);
        if (requiredMissing) {
            alert('Please fill out all required fields (marked with *).');
            return;
        }

    const transactionData = {
      type,
      description,
      amount: parseFloat(amount),
      date: new Date(date),
      user,
      category,
    };

    if (type === 'Transfer' && toUser) {
      transactionData.to = toUser;
    }

    try {
      const docRef = await addDoc(collection(db, 'transactions'), transactionData);
      console.log('Transaction written with ID: ', docRef.id);

      // Update user balances
      const userDocRef = doc(db, 'users', user);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const currentBalance = userDoc.data().balance;
        let newBalance = currentBalance;
        if (type === 'Expense' || type === 'Transfer' || type === 'Investment') {
          newBalance -= transactionData.amount;
        } else if (type === 'Income') {
          newBalance += transactionData.amount;
        }
        await updateDoc(userDocRef, { balance: newBalance });
      }

      if (type === 'Transfer' && toUser) {
        const toUserDocRef = doc(db, 'users', toUser);
        const toUserDoc = await getDoc(toUserDocRef);
        if (toUserDoc.exists()) {
          const currentBalance = toUserDoc.data().balance;
          await updateDoc(toUserDocRef, { balance: currentBalance + transactionData.amount });
        }
      }

      // Reset form
      setType('Expense');
      setDescription('');
      setAmount('');
      setDate(new Date().toISOString().slice(0, 10));
      setUser('');
      setToUser('');
      setCategory('');
    } catch (error) {
      console.error('Error adding transaction: ', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white rounded-lg shadow mb-4">
        <div className="flex flex-col mb-2">
            <h3 className="font-bold w-full text-lg mb-1">Add New Transaction</h3>
            <span className="text-xs text-gray-500">Fields marked with <span className="text-red-500">*</span> are required</span>
        </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1">Type <span className="text-red-500">*</span></label>
          <select value={type} onChange={(e) => { setType(e.target.value); setCategory(''); }} className="w-full p-2 border rounded" required>
            <option>Expense</option>
            <option>Income</option>
            <option>Investment</option>
            <option>Transfer</option>
          </select>
        </div>
        <div>
          <label className="block mb-1">User <span className="text-red-500">*</span></label>
          <select value={user} onChange={(e) => setUser(e.target.value)} className="w-full p-2 border rounded" required>
            <option value="">Select User</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        {type === 'Transfer' && (
          <div>
            <label className="block mb-1">To</label>
            <select value={toUser} onChange={(e) => setToUser(e.target.value)} className="w-full p-2 border rounded">
              <option value="">Select User</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
        )}
          <div>
              <label className="block mb-1">Description</label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                     className="w-full p-2 border rounded"/>
          </div>
        <div>
          <label className="block mb-1">Amount <span className="text-red-500">*</span></label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-2 border rounded" required min="0" step="0.01" />
        </div>
        <div>
          <label className="block mb-1">Date <span className="text-red-500">*</span></label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-2 border rounded" required />
        </div>
        <div>
          <label className="block mb-1">Category{type !== 'Transfer' && <span className="text-red-500"> *</span>}</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-2 border rounded"
            required={type !== 'Transfer'}
          >
            <option value="">Select Category</option>
            {categoriesForType.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      <button type="submit" className="mt-4 bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Add Transaction</button>
    </form>
  );
};

export default AddTransaction;
