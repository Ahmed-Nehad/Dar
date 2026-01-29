import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter as Router } from 'react-router-dom'

// --- MOBILE DEBUGGER START ---
// This catches crash errors and prints them on the phone screen
window.onerror = function (message, source, lineno, colno, error) {
  const errorBox = document.createElement('div');
  errorBox.style.position = 'fixed';
  errorBox.style.top = '0';
  errorBox.style.left = '0';
  errorBox.style.width = '100%';
  errorBox.style.background = 'red';
  errorBox.style.color = 'white';
  errorBox.style.padding = '20px';
  errorBox.style.zIndex = '9999';
  errorBox.style.fontSize = '14px';
  errorBox.innerText = `💥 Error: ${message}\nLine: ${lineno}`;
  document.body.appendChild(errorBox);
};

// Also catch "Promise Rejections" (like Database failures)
window.onunhandledrejection = function (event) {
  const errorBox = document.createElement('div');
  errorBox.style.position = 'fixed';
  errorBox.style.bottom = '0';
  errorBox.style.left = '0';
  errorBox.style.width = '100%';
  errorBox.style.background = 'orange';
  errorBox.style.color = 'black';
  errorBox.style.padding = '20px';
  errorBox.style.zIndex = '9999';
  errorBox.style.fontSize = '14px';
  errorBox.innerText = `⚠️ Promise Error: ${event.reason}`;
  document.body.appendChild(errorBox);
};
// --- MOBILE DEBUGGER END ---

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <App />
    </Router>
  </StrictMode>,
)
