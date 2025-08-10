import React, { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app, db } from '../firebase/firestore';
import { Navigate, useLocation } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import useStore from '../store';

const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [claimed, setClaimed] = useState(undefined); // true/false after check
  const [authEmail, setAuthEmail] = useState('');
  const location = useLocation();
  const setCurrentProfile = useStore(s => s.setCurrentProfile);
  const currentProfile = useStore(s => s.currentProfile);

  useEffect(() => {
    const auth = getAuth(app);
    const unsub = onAuthStateChanged(auth, async (user) => {
      setAuthed(!!user);
      setAuthEmail(user?.email || '');
      if (!user) {
        setClaimed(undefined);
        setCurrentProfile(null);
        setLoading(false);
        return;
      }
      // Check if this auth email is already linked to a users doc
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', user.email || ''));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const docSnap = snap.docs[0];
          const profile = { id: docSnap.id, ...docSnap.data() };
          setCurrentProfile(profile);
          setClaimed(true);
        } else {
          // No match yet in Firestore; may still be in the process of claiming
          setClaimed(false);
        }
      } catch (e) {
        console.error('Claim check failed', e);
        setClaimed(false);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [setCurrentProfile]);

  // If local currentProfile matches the signed-in email, treat as claimed immediately (avoids redirect bounce after claiming)
  useEffect(() => {
    if (authed && currentProfile && currentProfile.email && authEmail && currentProfile.email === authEmail) {
      setClaimed(true);
    }
  }, [authed, currentProfile, authEmail]);

  if (loading) {
    return (
      <div className="p-6 text-center text-sm text-gray-600">Checking authentication...</div>
    );
  }

  if (!authed) {
    return <Navigate to="/login" replace />;
  }

  const isClaimed = claimed === true || (currentProfile && currentProfile.email && currentProfile.email === authEmail);

  // If signed in but not claimed and not already on claim page, redirect there
  if (!isClaimed && location.pathname !== '/claim-profile') {
    return <Navigate to="/claim-profile" replace />;
  }

  // Allow claim page itself even if unclaimed
  return <>{children}</>;
};

export default ProtectedRoute;
