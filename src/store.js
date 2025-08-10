import { create } from 'zustand';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase/firestore';

const useStore = create((set) => ({
  users: [],
  transactions: [],
  allTransactions: [],
  currentProfile: null,
  setCurrentProfile: (profile) => set({ currentProfile: profile }),
  fetchUsers: () => {
    const usersCollectionRef = collection(db, 'users');
    const unsubscribe = onSnapshot(usersCollectionRef, (snapshot) => {
      const usersData = snapshot.docs.map(doc => {
        const data = doc.data();
        // Prefer displayName for showing across the app; keep avatarUrl if present
        const name = data.displayName || data.name || doc.id;
        return { id: doc.id, ...data, name };
      });
      set({ users: usersData });
    });
    return unsubscribe;
  },
  fetchTransactions: () => {
    const transactionsCollectionRef = collection(db, 'transactions');
    const q = query(transactionsCollectionRef, orderBy('date', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transactionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      set({ transactions: transactionsData });
    });
    return unsubscribe;
  },
  fetchAllTransactions: () => {
    const transactionsCollectionRef = collection(db, 'transactions');
    const q = query(transactionsCollectionRef, orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transactionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      set({ allTransactions: transactionsData });
    });
    return unsubscribe;
  },
}));

export default useStore;
