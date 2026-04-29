import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { authApi, TokenStorage } from '../services/api';
import { AuthUser, AuthResult } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  setOnboardingComplete: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
}

interface RegisterPayload {
  email: string;
  password: string;
  role: 'CHILD' | 'PARENT' | 'EDUCATOR';
  displayName: string;
  age?: number;
  gender?: 'MALE' | 'FEMALE';
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  // ─── Bootstrap — restore session on app start ──────────────────────────────

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = await TokenStorage.getAccessToken();
        if (!token) {
          setIsLoading(false);
          return;
        }

        const me = await authApi.me();
        setUser(me);
        // Consider onboarding complete if user has been set up via API
        setHasCompletedOnboarding(true);
      } catch {
        // Token invalid or expired — clear storage
        await TokenStorage.clear();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    void restoreSession();
  }, []);

  // ─── Login ─────────────────────────────────────────────────────────────────

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    const result: AuthResult = await authApi.login(email, password);
    await TokenStorage.save(result.tokens.accessToken, result.tokens.refreshToken);
    setUser(result.user);
    setHasCompletedOnboarding(true);
  }, []);

  // ─── Register ──────────────────────────────────────────────────────────────

  const register = useCallback(async (payload: RegisterPayload): Promise<void> => {
    const result: AuthResult = await authApi.register(payload);
    await TokenStorage.save(result.tokens.accessToken, result.tokens.refreshToken);
    setUser(result.user);
    // Only CHILD users need to complete onboarding (reading level, age, etc.)
    // PARENT and EDUCATOR users skip onboarding
    setHasCompletedOnboarding(result.user.role !== 'CHILD');
  }, []);

  // ─── Logout ────────────────────────────────────────────────────────────────

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch {
      // Even if API call fails, clear local state
    } finally {
      await TokenStorage.clear();
      setUser(null);
      setHasCompletedOnboarding(false);
    }
  }, []);

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const setOnboardingComplete = useCallback(() => {
    setHasCompletedOnboarding(true);
  }, []);

  const updateUser = useCallback((updates: Partial<AuthUser>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : prev));
  }, []);

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: !!user,
    hasCompletedOnboarding,
    login,
    register,
    logout,
    setOnboardingComplete,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return context;
}
