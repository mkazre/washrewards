import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as SecureStore from "expo-secure-store";
import {
  api,
  AppConfig,
  LoyaltySummary,
  PartnerDashboard,
  PlatformDashboard,
  Tenant,
  User,
} from "./api";
import { registerPushToken, unregisterPushToken } from "./push";

const TOKEN_KEY = "washrewards_token";

interface AppStateShape {
  // auth
  token: string | null;
  user: User | null;
  authLoading: boolean;
  setSession: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;

  // public feature flags — social login buttons, map credentials — fetched
  // once at app start, before anyone is signed in
  config: AppConfig | null;

  // cached summaries
  tenants: Tenant[] | null;
  loyalty: LoyaltySummary | null;
  partnerDashboard: PartnerDashboard | null;
  platformDashboard: PlatformDashboard | null;
  setTenants: (t: Tenant[] | null) => void;
  setLoyalty: (l: LoyaltySummary | null) => void;
  setPartnerDashboard: (p: PartnerDashboard | null) => void;
  setPlatformDashboard: (p: PlatformDashboard | null) => void;

  // ephemeral booking draft, carried from Home -> Booking -> Confirmation
  bookingDraft: BookingDraft;
  setBookingDraft: (d: Partial<BookingDraft>) => void;
}

export interface BookingDraft {
  tenant?: Tenant;
  packageId?: string;
  packageName?: string;
  packagePrice?: string;
  slotLabel?: string;
  payMethodLabel?: string;
  bookingId?: string | number;
  receiptNo?: string;
}

const AppStateContext = createContext<AppStateShape | undefined>(undefined);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [config, setConfig] = useState<AppConfig | null>(null);

  const [tenants, setTenants] = useState<Tenant[] | null>(null);
  const [loyalty, setLoyalty] = useState<LoyaltySummary | null>(null);
  const [partnerDashboard, setPartnerDashboard] =
    useState<PartnerDashboard | null>(null);
  const [platformDashboard, setPlatformDashboard] =
    useState<PlatformDashboard | null>(null);

  const [bookingDraft, setBookingDraftState] = useState<BookingDraft>({});
  const setBookingDraft = useCallback((d: Partial<BookingDraft>) => {
    setBookingDraftState((prev) => ({ ...prev, ...d }));
  }, []);

  useEffect(() => {
    api.config
      .get()
      .then(setConfig)
      .catch(() => setConfig(null));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(TOKEN_KEY);
        if (stored) {
          setToken(stored);
          try {
            const me = await api.auth.me(stored);
            setUser(me);
            registerPushToken(stored);
          } catch {
            // token invalid/expired or API unreachable — fall back to logged-out state
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            setToken(null);
          }
        }
      } finally {
        setAuthLoading(false);
      }
    })();
  }, []);

  const setSession = useCallback(async (newToken: string, newUser: User) => {
    await SecureStore.setItemAsync(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(newUser);
    registerPushToken(newToken);
  }, []);

  const logout = useCallback(async () => {
    if (token) {
      try {
        await unregisterPushToken(token);
        await api.auth.logout(token);
      } catch {
        // best-effort; still clear local session
      }
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setTenants(null);
    setLoyalty(null);
    setPartnerDashboard(null);
    setPlatformDashboard(null);
  }, [token]);

  const value = useMemo<AppStateShape>(
    () => ({
      token,
      user,
      authLoading,
      setSession,
      logout,
      config,
      tenants,
      loyalty,
      partnerDashboard,
      platformDashboard,
      setTenants,
      setLoyalty,
      setPartnerDashboard,
      setPlatformDashboard,
      bookingDraft,
      setBookingDraft,
    }),
    [
      token,
      user,
      authLoading,
      setSession,
      logout,
      config,
      tenants,
      loyalty,
      partnerDashboard,
      platformDashboard,
      bookingDraft,
      setBookingDraft,
    ]
  );

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppStateShape {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
