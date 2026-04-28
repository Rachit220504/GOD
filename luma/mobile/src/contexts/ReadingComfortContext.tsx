import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { profileApi } from '../services/api';
import { ReadingComfortSettings } from '../types';
import { DefaultReadingComfort } from '../constants/theme';
import { useAuth } from './AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReadingComfortContextValue extends ReadingComfortSettings {
  isUpdating: boolean;
  updateFontSize: (size: number) => void;
  updateLetterSpacing: (spacing: number) => void;
  updateLineHeight: (height: number) => void;
  updateBackgroundColor: (color: string) => void;
  updateFontFamily: (family: string) => void;
  resetToDefaults: () => void;
  syncToServer: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ReadingComfortContext = createContext<ReadingComfortContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ReadingComfortProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [settings, setSettings] = useState<ReadingComfortSettings>({
    ...DefaultReadingComfort,
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // ─── Load profile settings when user changes ───────────────────────────────

  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      try {
        const profile = await profileApi.getProfile(user.id);
        setSettings({
          fontSize: profile.fontSize,
          letterSpacing: profile.letterSpacing,
          lineHeight: profile.lineHeight,
          backgroundColor: profile.backgroundColor,
          fontFamily: profile.fontFamily,
        });
      } catch {
        // Silently fall back to defaults — don't break UI
        setSettings({ ...DefaultReadingComfort });
      }
    };

    void loadProfile();
  }, [user?.id]);

  // ─── Instant local updates (no reload required) ────────────────────────────

  const updateFontSize = useCallback((size: number) => {
    setSettings((prev) => ({ ...prev, fontSize: Math.max(12, Math.min(32, size)) }));
  }, []);

  const updateLetterSpacing = useCallback((spacing: number) => {
    setSettings((prev) => ({ ...prev, letterSpacing: Math.max(0, Math.min(0.25, spacing)) }));
  }, []);

  const updateLineHeight = useCallback((height: number) => {
    setSettings((prev) => ({ ...prev, lineHeight: Math.max(1.0, Math.min(2.5, height)) }));
  }, []);

  const updateBackgroundColor = useCallback((color: string) => {
    setSettings((prev) => ({ ...prev, backgroundColor: color }));
  }, []);

  const updateFontFamily = useCallback((family: string) => {
    setSettings((prev) => ({ ...prev, fontFamily: family }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setSettings({ ...DefaultReadingComfort });
  }, []);

  // ─── Persist to server (debounced by caller) ───────────────────────────────

  const syncToServer = useCallback(async (): Promise<void> => {
    if (!user) return;
    setIsUpdating(true);
    try {
      await profileApi.updateReadingComfort(user.id, settings);
    } finally {
      setIsUpdating(false);
    }
  }, [user, settings]);

  const value: ReadingComfortContextValue = {
    ...settings,
    isUpdating,
    updateFontSize,
    updateLetterSpacing,
    updateLineHeight,
    updateBackgroundColor,
    updateFontFamily,
    resetToDefaults,
    syncToServer,
  };

  return (
    <ReadingComfortContext.Provider value={value}>
      {children}
    </ReadingComfortContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useReadingComfort(): ReadingComfortContextValue {
  const context = useContext(ReadingComfortContext);
  if (!context) {
    throw new Error('useReadingComfort must be used within a <ReadingComfortProvider>');
  }
  return context;
}
