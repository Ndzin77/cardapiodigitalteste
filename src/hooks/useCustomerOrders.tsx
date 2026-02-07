import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { OrderItem, Order } from "./useOrders";

const CUSTOMER_PHONE_KEY = "vitrine-customer-phone";
const CUSTOMER_NAME_KEY = "vitrine-customer-name";

export interface CustomerInfo {
  phone: string;
  name: string;
}

// Save customer info to localStorage
export function saveCustomerInfo(info: CustomerInfo) {
  try {
    localStorage.setItem(CUSTOMER_PHONE_KEY, info.phone);
    localStorage.setItem(CUSTOMER_NAME_KEY, info.name);
  } catch (e) {
    console.warn("Failed to save customer info:", e);
  }
}

// Load customer info from localStorage
export function loadCustomerInfo(): CustomerInfo | null {
  try {
    const phone = localStorage.getItem(CUSTOMER_PHONE_KEY);
    const name = localStorage.getItem(CUSTOMER_NAME_KEY);
    if (phone) {
      return { phone, name: name || "" };
    }
  } catch (e) {
    console.warn("Failed to load customer info:", e);
  }
  return null;
}

// Clear customer info from localStorage
export function clearCustomerInfo() {
  try {
    localStorage.removeItem(CUSTOMER_PHONE_KEY);
    localStorage.removeItem(CUSTOMER_NAME_KEY);
  } catch (e) {
    console.warn("Failed to clear customer info:", e);
  }
}

// Normalize phone number for comparison (remove non-digits)
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

// Hook to fetch customer orders by phone number for a specific store
export function useCustomerOrders(storeId: string | undefined, customerPhone: string | null) {
  return useQuery({
    queryKey: ["customer-orders", storeId, customerPhone],
    queryFn: async () => {
      if (!storeId || !customerPhone) return [];
      
      const normalizedPhone = normalizePhone(customerPhone);
      if (normalizedPhone.length < 8) return []; // Minimum valid phone length
      
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("store_id", storeId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Filter orders by phone number (client-side for flexibility)
      const filteredOrders = data.filter((order) => {
        const orderPhone = normalizePhone(order.customer_phone || "");
        return orderPhone.includes(normalizedPhone) || normalizedPhone.includes(orderPhone);
      });

      return filteredOrders.map((order) => ({
        ...order,
        items: (order.items as unknown as OrderItem[]) || [],
        subtotal: Number(order.subtotal),
        delivery_fee: Number(order.delivery_fee),
        total: Number(order.total),
      })) as Order[];
    },
    enabled: !!storeId && !!customerPhone && normalizePhone(customerPhone).length >= 8,
  });
}
