import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter as Router } from 'react-router-dom'
import { Toaster } from 'react-hot-toast';
import posthog from 'posthog-js';
import { PostHogProvider } from '@posthog/react'

// Keep only a simple error logger to see what happens
window.onunhandledrejection = rejection => {
  alert("حدث خطأ غير متوقع!!!")

  posthog?.capture('$exception', { 
    describtion: 'Error in application window',
    location: 'main.tsx' ,
    type: rejection.type,
    message: rejection.reason || String(rejection),
  });
}

try {
  posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
    defaults: '2025-11-30',
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
    session_recording: {
      maskAllInputs: true,
    },
    on_request_error: (error) => {
      console.warn("Analytics blocked by client.")
      console.warn(error)
    }
  });
} catch (error) {
  console.warn("Analytics init Error.")
  console.warn(error)
}


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router basename={import.meta.env.BASE_URL}>
      <PostHogProvider client={posthog}>
        <Toaster position="top-center" toastOptions={{ duration: 5000 }} />
        <App />
      </PostHogProvider>
    </Router>
  </StrictMode>,
)
