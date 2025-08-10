import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, writeBatch, doc, updateDoc } from "firebase/firestore";
import { firebaseConfig } from "./config";

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Function to initialize user data in Firestore
export const initializeUserData = async () => {
  const usersCollectionRef = collection(db, "users");
  const querySnapshot = await getDocs(usersCollectionRef);

  if (querySnapshot.empty) {
    console.log("No users found, initializing data...");
    const batch = writeBatch(db);
    const users = [
      { id: 'achan', name: 'Achan', balance: 2500000, role: 'admin' },
      { id: 'amma', name: 'Amma', balance: 0, role: 'member' },
      { id: 'kunji', name: 'Kunji', balance: 0, role: 'member' },
      { id: 'chunju', name: 'Chunju', balance: 0, role: 'admin' } // Changed 'me' to 'chunju'
    ];

    users.forEach(user => {
      const userDocRef = doc(db, "users", user.id);
      batch.set(userDocRef, { name: user.name, balance: user.balance, role: user.role });
    });

    await batch.commit();
    console.log("Initial user data has been set.");
  } else {
    // Ensure roles for existing users: achan and chunju should be admin.
    try {
      const batch = writeBatch(db);
      querySnapshot.docs.forEach(d => {
        const data = d.data() || {};
        if (d.id === 'achan' && data.role !== 'admin') {
          batch.update(doc(db, 'users', d.id), { role: 'admin' });
        }
        if (d.id === 'chunju' && data.role !== 'admin') {
          batch.update(doc(db, 'users', d.id), { role: 'admin' });
        }
        // For others, if role missing, set to member (non-destructive default)
        if (d.id !== 'achan' && d.id !== 'chunju' && (data.role == null)) {
          batch.update(doc(db, 'users', d.id), { role: 'member' });
        }
      });
      await batch.commit();
      console.log("Ensured roles: achan/chunju=admin; others defaulted if missing.");
    } catch (e) {
      console.warn("Role ensure step skipped or failed:", e?.message || e);
    }
  }
};

// Firestore interaction functions will go here

// Example function (placeholder)
export const getTransactions = async () => {
  // Logic to fetch transactions from Firestore
  console.log("Fetching transactions...");
  return [];
};
