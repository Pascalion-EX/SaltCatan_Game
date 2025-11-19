import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import { TradeProvider } from './context/TradeContext'   // ✅ IMPORT CONTEXT

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TradeProvider>            {/* ✅ WRAP THE APP */}
      <App />
    </TradeProvider>
  </StrictMode>
)
