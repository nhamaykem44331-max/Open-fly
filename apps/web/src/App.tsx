import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { useThemeSync } from './theme/theme'
import { useAuthStore } from './stores/auth'
import { router } from './router'

export default function App() {
  useThemeSync()
  // Restore a session from the stored refresh token (no-op when the API is disabled).
  useEffect(() => {
    void useAuthStore.getState().bootstrap()
  }, [])
  return <RouterProvider router={router} />
}
