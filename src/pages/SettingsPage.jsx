import React, { useEffect, useState } from 'react';
import { db, app } from '../firebase/firestore';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const SettingsPage = () => {
  const [uid, setUid] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [initialLetter, setInitialLetter] = useState('U');
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('ffh_theme') || 'light');

  useEffect(() => {
    const auth = getAuth(app);
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user?.uid) {
        setUid(user.uid);
        // Initial letter from Auth displayName or email prefix
        const baseName = user.displayName || (user.email ? user.email.split('@')[0] : 'User');
        setInitialLetter((baseName || 'U').charAt(0).toUpperCase());
        const pref = doc(db, 'profiles', user.uid);
        const unsub = onSnapshot(pref, (snap) => {
          const data = snap.data() || {};
          const img = data.avatarUrl || user.photoURL || '';
          setAvatarUrl(img);
        });
        return () => unsub();
      } else {
        setUid('');
        setAvatarUrl('');
        setInitialLetter('U');
      }
    });
    return () => unsubAuth();
  }, []);

  const applyTheme = (t) => {
    const root = document.documentElement;
    if (t === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
  };

  const handleThemeChange = (e) => {
    const t = e.target.checked ? 'dark' : 'light';
    setTheme(t);
    localStorage.setItem('ffh_theme', t);
    applyTheme(t);
  };

  const handleUploadAvatar = async (file) => {
    if (!file || !uid) return;
    try {
      setSaving(true);
      const storage = getStorage(app);
      const avatarRef = ref(storage, `avatars/profiles/${uid}`);
      await uploadBytes(avatarRef, file);
      const url = await getDownloadURL(avatarRef);
      const pref = doc(db, 'profiles', uid);
      await updateDoc(pref, { avatarUrl: url });
      setAvatarUrl(url);
    } catch (e) {
      console.error('Failed to upload avatar', e);
      alert('Avatar upload failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4">
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-6 rounded-xl shadow mb-6">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white_0,transparent_40%),radial-gradient(circle_at_80%_0,white_0,transparent_35%)]" aria-hidden="true"></div>
        <div className="relative">
          <h2 className="text-2xl font-extrabold">Your Profile & Settings</h2>
          <p className="text-sm text-white/85">Update your avatar and theme</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-4">
          <h3 className="font-bold mb-3">Your Profile</h3>
          {!uid ? (
            <p className="text-sm text-gray-600">Please sign in to edit your profile.</p>
          ) : (
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl text-white font-semibold">{initialLetter}</span>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  Avatar shown in the top-right menu.
                </div>
              </div>
              <label className="text-sm bg-gray-900 text-white px-3 py-1.5 rounded cursor-pointer hover:bg-gray-800">
                Upload Avatar
                <input type="file" accept="image/*" className="hidden" onChange={(e)=>handleUploadAvatar(e.target.files?.[0])} />
              </label>
              {saving && <p className="text-xs text-gray-500">Uploading...</p>}
            </div>
          )}
        </div>
        <div className="card p-4">
          <h3 className="font-bold mb-3">Appearance</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Theme</p>
              <p className="text-xs text-gray-500">Switch between light and dark mode</p>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={theme==='dark'} onChange={handleThemeChange} />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:h-5 after:w-5 after:bg-white after:rounded-full after:transition-all relative"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
