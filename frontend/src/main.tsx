import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { SocketProvider } from './contexts/SocketContext.tsx'
import { router } from './router.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { RouterProvider } from 'react-router-dom'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <SocketProvider>
        <RouterProvider router={router} />
      </SocketProvider>
    </AuthProvider>
  </StrictMode>,
)
