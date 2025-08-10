import React, { useState, useEffect } from 'react';
import useStore from '../store';
import { db } from '../firebase/firestore';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

const EditTransactionModal = ({ transaction, onClose }) => {
  const { users } = useStore();
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [user, setUser] = useState('');
  const [toUser, setToUser] = useState('');
  const [category, setCategory] = useState('');
  const [originalAmount, setOriginalAmount] = useState(0);

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setDescription(transaction.description);
      setAmount(transaction.amount);
      setOriginalAmount(transaction.amount);
      setDate(transaction.date.toDate().toISOString().slice(0, 10));
      setUser(transaction.user);
      setToUser(transaction.to || '');
      setCategory(transaction.category || '');
    }
  }, [transaction]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!type || !description || !amount || !date || !user) {
      alert('Please fill out all fields.');
      return;
    }

    const updatedTransaction = {
      ...transaction,
      type,
      description,
      amount: parseFloat(amount),
      date: new Date(date),
      user,
      category,
      to: type === 'Transfer' ? toUser : '',
    };

    try {
      // Revert original transaction amounts
      const userDocRef = doc(db, 'users', transaction.user);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        let balance = userDoc.data().balance;
        if (transaction.type === 'Expense' || transaction.type === 'Transfer' || transaction.type === 'Investment') {
          balance += originalAmount;
        } else if (transaction.type === 'Income') {
          balance -= originalAmount;
        }
        await updateDoc(userDocRef, { balance });
      }

      if (transaction.type === 'Transfer' && transaction.to) {
        const toUserDocRef = doc(db, 'users', transaction.to);
        const toUserDoc = await getDoc(toUserDocRef);
        if (toUserDoc.exists()) {
          let balance = toUserDoc.data().balance;
          balance -= originalAmount;
          await updateDoc(toUserDocRef, { balance });
        }
      }

      // Apply new transaction amounts
      const newUserDocRef = doc(db, 'users', updatedTransaction.user);
      const newUserDoc = await getDoc(newUserDocRef);
      if (newUserDoc.exists()) {
        let balance = newUserDoc.data().balance;
        if (updatedTransaction.type === 'Expense' || updatedTransaction.type === 'Transfer' || updatedTransaction.type === 'Investment') {
          balance -= updatedTransaction.amount;
        } else if (updatedTransaction.type === 'Income') {
          balance += updatedTransaction.amount;
        }
        await updateDoc(newUserDocRef, { balance });
      }

      if (updatedTransaction.type === 'Transfer' && updatedTransaction.to) {
        const newToUserDocRef = doc(db, 'users', updatedTransaction.to);
        const newToUserDoc = await getDoc(newToUserDocRef);
        if (newToUserDoc.exists()) {
          let balance = newToUserDoc.data().balance;
          balance += updatedTransaction.amount;
          await updateDoc(newToUserDocRef, { balance });
        }
      }

      await updateDoc(doc(db, 'transactions', transaction.id), updatedTransaction);
      onClose();
    } catch (error) {
      console.error('Error updating transaction: ', error);
    }
  };

  if (!transaction) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-bold">Edit Transaction</h3>
        <form onSubmit={handleSubmit} className="mt-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block mb-1">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full p-2 border rounded">
                <option>Expense</option>
                <option>Income</option>
                <option>Investment</option>
                <option>Transfer</option>
              </select>
            </div>
            <div>
              <label className="block mb-1">User</label>
              <select value={user} onChange={(e) => setUser(e.target.value)} className="w-full p-2 border rounded">
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            {type === 'Transfer' && (
              <div>
                <label className="block mb-1">To</label>
                <select value={toUser} onChange={(e) => setToUser(e.target.value)} className="w-full p-2 border rounded">
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block mb-1">Description</label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block mb-1">Amount</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block mb-1">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block mb-1">Category</label>
              <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-2 border rounded" />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button type="button" onClick={onClose} className="bg-gray-300 text-gray-800 p-2 rounded mr-2 hover:bg-gray-400">Cancel</button>
            <button type="submit" className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Update Transaction</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTransactionModal;
