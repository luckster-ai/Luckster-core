import { createContext } from 'react'

// Kept in its own file (no component here) so AuthProvider.jsx can stay
// component-only and useAuth.js can stay hook-only -- react-refresh/
// only-export-components requires each file to export just one kind.
export const AuthContext = createContext(null)

// Auth email redirect targets. Both must be listed in the Supabase
// project's Auth "Redirect URLs" allow list for every site origin
// (Preview / Production), or the email link falls back to Site URL.
export const AUTH_CALLBACK_PATH = '/auth/callback'
export const RESET_PASSWORD_PATH = '/auth/reset-password'
