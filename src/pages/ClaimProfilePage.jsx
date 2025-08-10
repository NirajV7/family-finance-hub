import React, { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db, app } from '../firebase/firestore';
import useStore from '../store';
import { useNavigate } from 'react-router-dom';

const ClaimProfilePage = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [saving, setSaving] = useState('');
  const setCurrentProfile = useStore(s => s.setCurrentProfile);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snap = await getDocs(collection(db, 'users'));
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setUsers(list);
      } catch (e) {
        console.error('Failed to load users for claiming', e);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const unclaimed = useMemo(() => users.filter(u => !('email' in u) || u.email == null || u.email === ''), [users]);

  const handleClaimProfile = async (profileId) => {
    const auth = getAuth(app);
    const user = auth.currentUser;
    if (!user?.email) {
      alert('No signed-in user email found. Please sign out and try again.');
      return;
    }
    try {
      setSaving(profileId);
      const ref = doc(db, 'users', profileId);
      // If claiming achan or chunju, also ensure role: 'admin'
      const rolePatch = (profileId === 'achan' || profileId === 'chunju') ? { role: 'admin' } : {};
      await updateDoc(ref, { email: user.email, ...rolePatch });
      // Update local state and redirect to dashboard
      const base = users.find(u => u.id === profileId) || {};
      setCurrentProfile({ ...base, id: profileId, email: user.email, ...rolePatch });
      navigate('/', { replace: true });
    } catch (e) {
      console.error('Failed to claim profile', e);
      alert('Unable to claim this profile. It may already be claimed.');
    } finally {
      setSaving('');
    }
  };

  return (
    <div className="p-4">
      <div className="min-h-[60vh] max-w-2xl mx-auto card p-6">
        <h2 className="text-2xl font-extrabold mb-1">Welcome!</h2>
        <p className="text-sm text-gray-600 mb-4">To get started, please select your profile.</p>
        {loading ? (
          <p className="text-sm text-gray-600">Loading profiles...</p>
        ) : (
          <>
            {unclaimed.length === 0 ? (
              <p className="text-sm text-gray-600">All profiles are already claimed. If this is a mistake, contact the administrator.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {unclaimed.map(u => (
                  <button
                    key={u.id}
                    onClick={() => handleClaimProfile(u.id)}
                    className="px-4 py-3 rounded-lg border hover:border-indigo-500 hover:bg-indigo-50 text-left"
                    disabled={!!saving}
                  >
                    <div className="font-semibold">I am {u.name || u.id}</div>
                    {u.role && <div className="text-xs text-gray-500 mt-0.5">Role: {u.role}</div>}
                    {saving === u.id && <div className="text-xs text-gray-500 mt-1">Linking...</div>}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ClaimProfilePage;
