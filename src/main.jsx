import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Apply saved theme early
try {
  const t = localStorage.getItem('ffh_theme');
  const root = document.documentElement;
  if (t === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
} catch {}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
