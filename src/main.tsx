import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter as Router } from 'react-router-dom'

// // --- MOBILE DEBUGGER START ---
// // This catches crash errors and prints them on the phone screen
// window.onerror = function (message, lineno) {
//   const errorBox = document.createElement('div');
//   errorBox.style.position = 'fixed';
//   errorBox.style.top = '0';
//   errorBox.style.left = '0';
//   errorBox.style.width = '100%';
//   errorBox.style.background = 'red';
//   errorBox.style.color = 'white';
//   errorBox.style.padding = '20px';
//   errorBox.style.zIndex = '9999';
//   errorBox.style.fontSize = '14px';
//   errorBox.innerText = `💥 Error: ${message}\nLine: ${lineno}`;
//   document.body.appendChild(errorBox);
// };

// // Also catch "Promise Rejections" (like Database failures)
// window.onunhandledrejection = function (event) {
//   const errorBox = document.createElement('div');
//   errorBox.style.position = 'fixed';
//   errorBox.style.bottom = '0';
//   errorBox.style.left = '0';
//   errorBox.style.width = '100%';
//   errorBox.style.background = 'orange';
//   errorBox.style.color = 'black';
//   errorBox.style.padding = '20px';
//   errorBox.style.zIndex = '9999';
//   errorBox.style.fontSize = '14px';
//   errorBox.innerText = `⚠️ Promise Error: ${event.reason}`;
//   document.body.appendChild(errorBox);
// };
// // --- MOBILE DEBUGGER END ---

// --- SELF-HEALING CODE START ---
const DB_NAME = 'DarTahfezDB';

// 1. Listen for the Crash
window.onerror = function (message) {
  const errorMsg = String(message).toLowerCase();
  
  // 2. Detect the "Cursor" or "Schema" error
  if (errorMsg.includes('cursor') || errorMsg.includes('unknownerror') || errorMsg.includes('schema')) {
    
    // 3. Show a status message on screen so you know it's working
    document.body.innerHTML = `
      <div style="padding: 20px; text-align: center; font-family: sans-serif;">
        <h1 style="color: red;">⚠️ إصلاح البيانات</h1>
        <p>تم اكتشاف نسخة قديمة من قاعدة البيانات.</p>
        <p>جاري التنظيف والتحديث تلقائياً...</p>
        <p>سيتم إعادة التحميل خلال ثوانٍ.</p>
      </div>
    `;

    // 4. NUKE THE OLD DATABASE
    console.warn("Database conflict detected. Wiping old DB...");
    const req = indexedDB.deleteDatabase(DB_NAME);
    
    req.onsuccess = () => {
      console.log("Database deleted successfully.");
      // 5. Reload the page to create the NEW clean database
      setTimeout(() => window.location.reload(), 2000);
    };
    
    req.onerror = () => {
      alert("فشل حذف البيانات القديمة. يرجى مسح بيانات التصفح يدوياً.");
    };
    
    return true; // Stop the error from showing up elsewhere
  }
};
// --- SELF-HEALING CODE END ---

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <App />
    </Router>
  </StrictMode>,
)
