import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase/firestore';
import { doc, getDoc, collection, query, where, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';
import TransactionList from '../components/TransactionList';
import ReportChart from '../components/ReportChart';
import EditTransactionModal from '../components/EditTransactionModal';
import useStore from '../store';

const UserPage = () => {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const { users, fetchUsers } = useStore();

  useEffect(() => {
    const unsubUsers = fetchUsers();

    const fetchAll = async () => {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        setUser({ id: userDoc.id, ...userDoc.data() });
      }

      const transactionsCollectionRef = collection(db, 'transactions');

      const userTransactionsQuery = query(transactionsCollectionRef, where('user', '==', userId));
      const toTransactionsQuery = query(transactionsCollectionRef, where('to', '==', userId));

      const [userTransactionsSnapshot, toTransactionsSnapshot] = await Promise.all([
        getDocs(userTransactionsQuery),
        getDocs(toTransactionsQuery),
      ]);

      const userTransactions = userTransactionsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      const toTransactions = toTransactionsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      const allTransactions = [...userTransactions, ...toTransactions];
      const uniqueTransactions = Array.from(new Map(allTransactions.map(t => [t.id, t])).values())
        .sort((a, b) => {
          const dateA = a.date?.toDate ? a.date.toDate() : 0;
          const dateB = b.date?.toDate ? b.date.toDate() : 0;
          return dateB - dateA;
        });

      setTransactions(uniqueTransactions);
      setLoading(false);
    };

    if (userId) {
      fetchAll();
    }

    return () => {
      if (typeof unsubUsers === 'function') unsubUsers();
    };
  }, [userId, fetchUsers]);

  const refreshTransactions = async () => {
    // Reuse the same fetch logic to refresh local list after edits/deletes
    const transactionsCollectionRef = collection(db, 'transactions');
    const userTransactionsQuery = query(transactionsCollectionRef, where('user', '==', userId));
    const toTransactionsQuery = query(transactionsCollectionRef, where('to', '==', userId));
    const [userTransactionsSnapshot, toTransactionsSnapshot] = await Promise.all([
      getDocs(userTransactionsQuery),
      getDocs(toTransactionsQuery),
    ]);
    const userTransactions = userTransactionsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    const toTransactions = toTransactionsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    const allTransactions = [...userTransactions, ...toTransactions];
    const uniqueTransactions = Array.from(new Map(allTransactions.map(t => [t.id, t])).values())
      .sort((a, b) => {
        const dateA = a.date?.toDate ? a.date.toDate() : 0;
        const dateB = b.date?.toDate ? b.date.toDate() : 0;
        return dateB - dateA;
      });
    setTransactions(uniqueTransactions);
  };

  const deleteTransaction = async (transaction) => {
    if (!transaction) return;
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;

    try {
      await deleteDoc(doc(db, 'transactions', transaction.id));

      // Revert original user's balance
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

      // Revert recipient's balance if transfer
      if (transaction.type === 'Transfer' && transaction.to) {
        const toUserDocRef = doc(db, 'users', transaction.to);
        const toUserDoc = await getDoc(toUserDocRef);
        if (toUserDoc.exists()) {
          const currentBalance = toUserDoc.data().balance;
          await updateDoc(toUserDocRef, { balance: currentBalance - transaction.amount });
        }
      }

      await refreshTransactions();
    } catch (error) {
      console.error('Error deleting transaction: ', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const currentMonthExpenses = transactions.filter(t => {
    if (t.type !== 'Expense' || !t.date || !t.date.toDate) {
      return false;
    }
    const transactionDate = t.date.toDate();
    const now = new Date();
    return transactionDate.getMonth() === now.getMonth() &&
           transactionDate.getFullYear() === now.getFullYear();
  });

  const expenseData = useMemo(() => {
    const expenseByCategory = {};
    currentMonthExpenses.forEach(t => {
      const category = t.category || 'Uncategorized';
      if (expenseByCategory[category]) {
        expenseByCategory[category] += t.amount;
      } else {
        expenseByCategory[category] = t.amount;
      }
    });
    return Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }));
  }, [currentMonthExpenses]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-4">{user.name}'s Account</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="md:col-span-1 bg-white p-4 rounded-lg shadow">
          <h3 className="font-bold text-lg">Current Balance</h3>
          <p className="text-3xl">{formatCurrency(user.balance)}</p>
        </div>
        <div className="md:col-span-2 bg-white p-4 rounded-lg shadow">
          <h3 className="font-bold text-lg mb-2">Current Month's Expense Breakdown</h3>
          <ReportChart data={expenseData} />
        </div>
      </div>
      <h3 className="text-2xl font-bold mb-4">Complete Transaction History</h3>
      <TransactionList
        transactions={transactions}
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
          </>
        )}
      />
      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          onClose={async () => {
            setEditingTransaction(null);
            await refreshTransactions();
          }}
        />
      )}
    </div>
  );
};

export default UserPage;