import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter as Router } from 'react-router-dom'

// Keep only a simple error logger to see what happens
window.onerror = function (message) {
  alert("Error: " + message);
  alert('حدث خطأ, حاول من جهاز آخر')
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router basename={import.meta.env.BASE_URL}>
      <App />
    </Router>
  </StrictMode>,
)
