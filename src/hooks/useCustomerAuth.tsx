import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { saveCustomerInfo, clearCustomerInfo } from "@/hooks/useCustomerOrders";
import { supabase } from "@/integrations/supabase/client";

const CUSTOMER_SESSION_KEY = "vitrine-customer-session";

// Prefer env vars when available, but always fall back to the configured Supabase client
// so the storefront customer auth works even if VITE_* vars aren't set in the deployment.
const FALLBACK_SUPABASE_URL = "https://mqbhbarhosxfuivuksvr.supabase.co";

const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  ((supabase as any)?.supabaseUrl as string | undefined) ||
  FALLBACK_SUPABASE_URL;

const SUPABASE_KEY =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  ((supabase as any)?.supabaseKey as string | undefined) ||
  "";


export interface CustomerSession {
  id: string;
  name: string;
  phone: string;
  storeId: string;
}

interface CustomerAuthContextType {
  customer: CustomerSession | null;
  isLoading: boolean;
  login: (storeId: string, phone: string, password: string) => Promise<LoginResult>;
  register: (storeId: string, phone: string, name: string, password: string) => Promise<RegisterResult>;
  setPassword: (customerId: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

interface LoginResult {
  success: boolean;
  error?: string;
  needsPassword?: boolean;
  customerId?: string;
  customerName?: string;
}

interface RegisterResult {
  success: boolean;
  error?: string;
  customerId?: string;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

function getEdgeFunctionUrl() {
  return `${SUPABASE_URL}/functions/v1/customer-auth`;
}

function normalizePhone(phone: string) {
  return String(phone || "").replace(/\D/g, "");
}

export function CustomerAuthProvider({ children, storeId }: { children: ReactNode; storeId?: string }) {
  const [customer, setCustomer] = useState<CustomerSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CUSTOMER_SESSION_KEY);
      if (stored) {
        const session = JSON.parse(stored) as CustomerSession;
        if (!storeId || session.storeId === storeId) {
          setCustomer(session);
          saveCustomerInfo({ phone: session.phone, name: session.name });
        }
      }
    } catch (e) {
      console.warn("Failed to load customer session:", e);
    }
    setIsLoading(false);
  }, [storeId]);

  useEffect(() => {
    if (customer) {
      localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(customer));
      saveCustomerInfo({ phone: customer.phone, name: customer.name });
    } else {
      localStorage.removeItem(CUSTOMER_SESSION_KEY);
      clearCustomerInfo();
    }
  }, [customer]);

  const login = useCallback(async (storeId: string, phone: string, password: string): Promise<LoginResult> => {
    try {
      const response = await fetch(getEdgeFunctionUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(SUPABASE_KEY ? { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } : {}),
        },
        body: JSON.stringify({
          action: "login",
          store_id: storeId,
          phone,
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (data?.needs_password) {
          return {
            success: false,
            needsPassword: true,
            customerId: data.customer_id,
            customerName: data.customer_name,
            error: data.error,
          };
        }
        return { success: false, error: data.error || "Erro ao fazer login" };
      }

      const session: CustomerSession = {
        id: data.customer_id,
        name: data.customer_name,
        phone: normalizePhone(phone),
        storeId,
      };

      setCustomer(session);
      saveCustomerInfo({ phone: session.phone, name: session.name });

      return { success: true };
    } catch (error: any) {
      console.error("Login error:", error);
      return { success: false, error: "Erro de conexão com o servidor. Tente novamente." };
    }
  }, []);

  const register = useCallback(async (storeId: string, phone: string, name: string, password: string): Promise<RegisterResult> => {
    try {
      const response = await fetch(getEdgeFunctionUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(SUPABASE_KEY ? { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } : {}),
        },
        body: JSON.stringify({
          action: "register",
          store_id: storeId,
          phone,
          name,
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return { success: false, error: data.error || "Erro ao cadastrar" };
      }

      const session: CustomerSession = {
        id: data.customer_id,
        name,
        phone: normalizePhone(phone),
        storeId,
      };

      setCustomer(session);
      saveCustomerInfo({ phone: session.phone, name: session.name });

      return { success: true, customerId: data.customer_id };
    } catch (error: any) {
      console.error("Register error:", error);
      return { success: false, error: "Erro de conexão com o servidor. Tente novamente." };
    }
  }, []);

  const setPassword = useCallback(async (customerId: string, password: string) => {
    try {
      const response = await fetch(getEdgeFunctionUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(SUPABASE_KEY ? { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } : {}),
        },
        body: JSON.stringify({
          action: "set_password",
          customer_id: customerId,
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return { success: false, error: data.error || "Erro ao definir senha" };
      }

      return { success: true };
    } catch (error: any) {
      console.error("Set password error:", error);
      return { success: false, error: "Erro de conexão com o servidor. Tente novamente." };
    }
  }, []);

  const logout = useCallback(() => {
    setCustomer(null);
    localStorage.removeItem(CUSTOMER_SESSION_KEY);
    clearCustomerInfo();
  }, []);

  return (
    <CustomerAuthContext.Provider value={{ customer, isLoading, login, register, setPassword, logout }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error("useCustomerAuth must be used within CustomerAuthProvider");
  }
  return context;
}
