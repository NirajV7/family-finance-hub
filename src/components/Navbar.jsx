import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { app, db } from '../firebase/firestore';
import { doc, onSnapshot } from 'firebase/firestore';

const Navbar = () => {
  const [authed, setAuthed] = useState(false);
  const [uid, setUid] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth(app);
    let unsubPref = null;
    const unsub = onAuthStateChanged(auth, (user) => {
      setAuthed(!!user);
      setUid(user?.uid || '');
      if (unsubPref) { try { unsubPref(); } catch {} unsubPref = null; }
      if (user) {
        const prefRef = doc(db, 'profiles', user.uid);
        unsubPref = onSnapshot(prefRef, (snap) => {
          const data = snap.data() || {};
          setDisplayName(data.displayName || user.displayName || (user.email ? user.email.split('@')[0] : 'User'));
          setAvatarUrl(data.avatarUrl || user.photoURL || '');
        });
      } else {
        setAvatarUrl('');
        setDisplayName('');
      }
    });
    return () => {
      try { unsub(); } catch{}
      if (unsubPref) { try { unsubPref(); } catch{} }
    };
  }, []);

  useEffect(() => {
    const close = () => { setMenuOpen(false); setMobileNavOpen(false); };
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  const handleLogout = async () => {
    try {
      const auth = getAuth(app);
      await signOut(auth);
      navigate('/login');
    } catch (e) {
      console.error('Logout failed', e);
      alert('Logout failed. Please try again.');
    }
  };

  const onLoginPage = location.pathname === '/login';
  const initial = (displayName || 'U').charAt(0).toUpperCase();

  return (
    <nav className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/70 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
        <h1 className="text-xl font-extrabold tracking-tight">
          <Link to="/" className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-pink-600">Family Finance Hub</Link>
        </h1>
        {!onLoginPage && (
          <>
            <button className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-md border border-gray-200" onClick={(e)=>{e.stopPropagation(); setMobileNavOpen(o=>!o);}} aria-label="Open menu">
              <span className="i">≡</span>
            </button>
            <div className="hidden md:flex gap-6 text-sm font-medium text-slate-700">
              <Link to="/" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
              <Link to="/transactions" className="hover:text-indigo-600 transition-colors">Transactions</Link>
              <Link to="/goals" className="hover:text-indigo-600 transition-colors">Goals</Link>
              <Link to="/split" className="hover:text-indigo-600 transition-colors">Split Bill</Link>
              <Link to="/wishlist" className="hover:text-indigo-600 transition-colors">Wishlist</Link>
              <Link to="/reports" className="hover:text-indigo-600 transition-colors">Reports</Link>
            </div>
            <div className="flex items-center gap-3 relative" onClick={(e)=>e.stopPropagation()}>
              <div className="relative hidden md:block">
                <input
                  type="text"
                  placeholder="Search transactions..."
                  className="bg-gray-100 text-slate-700 rounded-full py-2 pl-4 pr-10 w-64 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">⌕</span>
              </div>
              {authed ? (
                <div className="relative">
                    <button
                        onClick={() => setMenuOpen((o) => !o)}
                        className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center border border-gray-200 shadow-sm bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600"
                        aria-label="User menu"
                    >
                        {avatarUrl ? (
                            <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover"/>
                        ) : (
                            <span className="text-white text-sm font-bold">{(displayName || 'U').charAt(0).toUpperCase()}</span>
                        )}
                    </button>
                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-44 bg-white rounded-md shadow-lg ring-1 ring-black/5 p-1 z-50">
                      <div className="px-2 py-1 text-xs text-gray-500">Signed in</div>
                      <Link to="/settings" className="block px-3 py-2 rounded hover:bg-gray-100 text-sm">Profile & Settings</Link>
                      <button onClick={handleLogout} className="w-full text-left block px-3 py-2 rounded hover:bg-gray-100 text-sm text-red-600">Logout</button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="text-sm px-3 py-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">Login</Link>
              )}
            </div>
          </>
        )}
      </div>
      {/* Mobile nav panel */}
      {mobileNavOpen && !onLoginPage && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-3 space-y-2 text-sm">
            <Link onClick={()=>setMobileNavOpen(false)} to="/" className="block py-2">Dashboard</Link>
            <Link onClick={()=>setMobileNavOpen(false)} to="/transactions" className="block py-2">Transactions</Link>
            <Link onClick={()=>setMobileNavOpen(false)} to="/goals" className="block py-2">Goals</Link>
            <Link onClick={()=>setMobileNavOpen(false)} to="/split" className="block py-2">Split Bill</Link>
            <Link onClick={()=>setMobileNavOpen(false)} to="/wishlist" className="block py-2">Wishlist</Link>
            <Link onClick={()=>setMobileNavOpen(false)} to="/reports" className="block py-2">Reports</Link>
            {authed ? (
              <>
                <Link onClick={()=>setMobileNavOpen(false)} to="/settings" className="block py-2">Profile & Settings</Link>
                <button onClick={handleLogout} className="w-full text-left py-2 text-red-600">Logout</button>
              </>
            ) : (
              <Link onClick={()=>setMobileNavOpen(false)} to="/login" className="block py-2 text-indigo-600">Login</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;