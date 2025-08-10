import React, { useEffect } from 'react';
import Dashboard from '../components/Dashboard';
import useStore from '../store';

const DashboardPage = () => {
  const { users, transactions, fetchUsers, fetchTransactions } = useStore();

  useEffect(() => {
    const unsubUsers = fetchUsers();
    const unsubTransactions = fetchTransactions();

    return () => {
      unsubUsers();
      unsubTransactions();
    };
  }, [fetchUsers, fetchTransactions]);

  return (
    <div>
      <Dashboard users={users} transactions={transactions} />
    </div>
  );
};

export default DashboardPage;