import { createContext } from 'react'

// Kept in its own file (no component here) so AuthProvider.jsx can stay
// component-only and useAuth.js can stay hook-only -- react-refresh/
// only-export-components requires each file to export just one kind.
export const AuthContext = createContext(null)
