// ─── Entidades de autenticación ───────────────────────────────────────────────

export interface UserProfile {
  id: string
  email: string
  fullName: string
  roles: string[]
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
  expiresAt: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  expiresAt: string
  user: UserProfile
}

export interface RefreshTokenResponse {
  accessToken: string
  refreshToken: string
  expiresAt: string
}

// ─── Permisos ─────────────────────────────────────────────────────────────────

export interface Permission {
  id: string
  name: string
  resource: string
  action: string
}

export interface Role {
  id: string
  name: string
  description?: string
  permissions: Permission[]
}

// ─── Estado de auth en el store ───────────────────────────────────────────────

export interface AuthState {
  user: UserProfile | null
  accessToken: string | null
  isAuthenticated: boolean
  isInitialized: boolean
}
