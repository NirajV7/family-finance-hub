import React, { useEffect } from 'react';
import { initializeUserData } from './firebase/firestore';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import ReportsPage from './pages/ReportsPage';
import UserPage from './pages/UserPage';
import Navbar from './components/Navbar';
import GoalsPage from './pages/GoalsPage';
import SplitBillPage from './pages/SplitBillPage';
import WishlistPage from './pages/WishlistPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import ClaimProfilePage from './pages/ClaimProfilePage';

function App() {
  useEffect(() => {
    initializeUserData();
  }, []);
  return (
    <Router>
      <Navbar />
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/claim-profile"
            element={
              <ProtectedRoute>
                <ClaimProfilePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <ProtectedRoute>
                <TransactionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users/:userId"
            element={
              <ProtectedRoute>
                <UserPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/goals"
            element={
              <ProtectedRoute>
                <GoalsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/split"
            element={
              <ProtectedRoute>
                <SplitBillPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wishlist"
            element={
              <ProtectedRoute>
                <WishlistPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
