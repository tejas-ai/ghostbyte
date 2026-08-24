import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

/**
 * Simple vs Pro.
 *
 * The app serves two people who want incompatible things from the same engine.
 * Someone sending one private photo needs three decisions and no vocabulary
 * lesson. Someone doing forensics needs embedding density, dual vaults, keyring
 * management and bit-plane inspection.
 *
 * Showing both at once is what the old single surface did, and it failed the
 * first person without especially helping the second. So: Simple is the
 * default and is genuinely complete for its task; Pro is one switch away and
 * never hidden behind a menu.
 */
export type UiMode = 'simple' | 'pro';

const STORAGE_KEY = 'quietsend_ui_mode';

interface ModeContextValue {
  mode: UiMode;
  setMode: (m: UiMode) => void;
  toggleMode: () => void;
  isPro: boolean;
}

const ModeContext = createContext<ModeContextValue | undefined>(undefined);

function readStoredMode(): UiMode {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'pro' ? 'pro' : 'simple';
  } catch {
    // Private windows and blocked storage both land here.
    return 'simple';
  }
}

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<UiMode>(readStoredMode);

  const setMode = useCallback((next: UiMode) => {
    setModeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Preference simply does not persist; the app still works.
    }
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((prev) => {
      const next = prev === 'simple' ? 'pro' : 'simple';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* not persisted */
      }
      return next;
    });
  }, []);

  // Lets CSS and any future print styles respond to the mode.
  useEffect(() => {
    document.documentElement.dataset.uiMode = mode;
  }, [mode]);

  const value = useMemo(
    () => ({ mode, setMode, toggleMode, isPro: mode === 'pro' }),
    [mode, setMode, toggleMode],
  );

  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}

export function useMode(): ModeContextValue {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error('useMode must be used within a ModeProvider');
  return ctx;
}
