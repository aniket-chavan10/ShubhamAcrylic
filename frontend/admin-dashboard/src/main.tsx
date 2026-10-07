import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { AppStatus } from './components/AppStatus'
// Captures the browser's install prompt as early as possible
import './hooks/useInstallPrompt'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <AppStatus />
  </React.StrictMode>,
)
