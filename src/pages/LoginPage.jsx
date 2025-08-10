import React, { useEffect, useState } from 'react';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { app } from '../firebase/firestore';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const auth = getAuth(app);
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate('/', { replace: true });
      }
      setLoading(false);
    });
    return () => unsub();
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      const auth = getAuth(app);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('/', { replace: true });
    } catch (e) {
      console.error('Google sign-in failed', e);
      setError('Sign-in failed. Please try again.');
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-4">
          <h1 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-pink-600">Family Finance Hub</h1>
          <p className="text-sm text-gray-600 mt-1">Please sign in to continue</p>
        </div>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <button
          onClick={handleGoogleSignIn}
          className="w-full inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg hover:bg-gray-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C33.428,6.053,28.955,4,24,4C12.955,4,4,12.955,4,24 s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,16.108,19.001,13,24,13c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657 C33.428,6.053,28.955,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
            <path fill="#4CAF50" d="M24,44c4.874,0,9.29-1.836,12.645-4.836l-5.837-4.943C28.75,35.234,26.483,36,24,36 c-5.202,0-9.619-3.325-11.283-7.957l-6.51,5.02C9.5,39.556,16.227,44,24,44z"/>
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.137,5.546 c0.001-0.001,0.002-0.001,0.003-0.002l5.837,4.943C36.861,39.48,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
          </svg>
          Continue with Google
        </button>
        {loading && (
          <p className="text-xs text-gray-500 mt-3">Checking session...</p>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
