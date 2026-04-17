import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import backgroundImage from './assets/background.jpg'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div
      style={{
        minHeight: '100dvh',
        width: '100%',
        backgroundImage: `linear-gradient(rgba(248, 250, 252, 0.84), rgba(245, 247, 251, 0.84)), url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        overflowX: 'hidden',
      }}
    >
      <App />
    </div>
  </StrictMode>,
)
