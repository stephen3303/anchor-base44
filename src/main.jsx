import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { installFaultCapture } from '@/lib/diagnostics'

// Before the first render, so a failure during start-up is captured too.
installFaultCapture()

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)