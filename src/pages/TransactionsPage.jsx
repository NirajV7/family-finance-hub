import React, { useState, useEffect } from 'react';
import AddTransaction from '../components/AddTransaction';
import TransactionList from '../components/TransactionList';
import EditTransactionModal from '../components/EditTransactionModal';
import CommentsModal from '../components/CommentsModal';
import useStore from '../store';
import { db } from '../firebase/firestore';
import { doc, deleteDoc, updateDoc, getDoc } from 'firebase/firestore';

const TransactionsPage = () => {
  const { transactions, users, fetchTransactions, fetchUsers } = useStore();
  const [userFilter, setUserFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [commentsTx, setCommentsTx] = useState(null);

  useEffect(() => {
    const unsub = fetchTransactions();
    const unsubUsers = fetchUsers();
    return () => {
        unsub();
        unsubUsers();
    }
  }, [fetchTransactions, fetchUsers]);

  const filteredTransactions = transactions
    .filter(t => !userFilter || t.user === userFilter)
    .filter(t => !typeFilter || t.type === typeFilter);

  const deleteTransaction = async (transaction) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await deleteDoc(doc(db, 'transactions', transaction.id));

        const userDocRef = doc(db, 'users', transaction.user);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const currentBalance = userDoc.data().balance;
          let newBalance = currentBalance;
          if (transaction.type === 'Expense' || transaction.type === 'Transfer' || transaction.type === 'Investment') {
            newBalance += transaction.amount;
          } else if (transaction.type === 'Income') {
            newBalance -= transaction.amount;
          }
          await updateDoc(userDocRef, { balance: newBalance });
        }

        if (transaction.type === 'Transfer' && transaction.to) {
          const toUserDocRef = doc(db, 'users', transaction.to);
          const toUserDoc = await getDoc(toUserDocRef);
          if (toUserDoc.exists()) {
            const currentBalance = toUserDoc.data().balance;
            await updateDoc(toUserDocRef, { balance: currentBalance - transaction.amount });
          }
        }
      } catch (error) {
        console.error('Error deleting transaction: ', error);
      }
    }
  };

  return (
    <div className="p-4">
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-6 rounded-xl shadow mb-6">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white_0,transparent_40%),radial-gradient(circle_at_80%_0,white_0,transparent_35%)]" aria-hidden="true"></div>
        <div className="relative">
          <h2 className="text-2xl font-extrabold">Transactions</h2>
          <p className="text-sm text-white/85">Add, filter, and review your family's financial activity</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="p-4 bg-white rounded-lg shadow mb-4">
            <h3 className="font-bold mb-4">Filter Transactions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1">Filter by User</label>
                <select value={userFilter} onChange={(e) => setUserFilter(e.target.value)} className="w-full p-2 border rounded">
                  <option value="">All Users</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block mb-1">Filter by Type</label>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full p-2 border rounded">
                  <option value="">All Types</option>
                  <option>Expense</option>
                  <option>Income</option>
                  <option>Investment</option>
                  <option>Return of Principal</option>
                  <option>Profit</option>
                </select>
              </div>
            </div>
          </div>
          <TransactionList
            transactions={filteredTransactions}
            users={users}
            actions={(transaction) => (
              <>
                <button
                  onClick={() => setEditingTransaction(transaction)}
                  className="text-blue-500 hover:underline text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteTransaction(transaction)}
                  className="text-red-500 hover:underline ml-2 text-sm"
                >
                  Delete
                </button>
                <button
                  onClick={() => setCommentsTx(transaction)}
                  className="text-indigo-600 hover:underline ml-2 text-sm"
                >
                  Comments
                </button>
              </>
            )}
          />
        </div>
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-24">
            <AddTransaction />
          </div>
        </div>
      </div>
      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
        />
      )}
      {commentsTx && (
        <CommentsModal
          transaction={commentsTx}
          onClose={() => setCommentsTx(null)}
        />
      )}
    </div>
  );
};

export default TransactionsPage;