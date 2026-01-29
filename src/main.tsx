import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter as Router } from 'react-router-dom'
import { Toaster } from 'react-hot-toast';

// Keep only a simple error logger to see what happens
window.onerror = function (message) {
  alert("Error: " + message);
  alert('حدث خطأ, حاول من جهاز آخر')
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router basename={import.meta.env.BASE_URL}>
    <Toaster position="top-center" toastOptions={{ duration: 5000 }} />
      <App />
    </Router>
  </StrictMode>,
)
