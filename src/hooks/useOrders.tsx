import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
}

export interface Order {
  id: string;
  store_id: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  delivery_type: string;
  payment_method: string | null;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export type OrderStatus = "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  preparing: "Preparando",
  ready: "Pronto",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
  confirmed: "bg-blue-500/20 text-blue-700 border-blue-500/30",
  preparing: "bg-orange-500/20 text-orange-700 border-orange-500/30",
  ready: "bg-green-500/20 text-green-700 border-green-500/30",
  delivered: "bg-muted text-muted-foreground border-muted",
  cancelled: "bg-destructive/20 text-destructive border-destructive/30",
};

export function useOrders(storeId: string | undefined) {
  return useQuery({
    queryKey: ["orders", storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("store_id", storeId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data.map((order) => ({
        ...order,
        items: (order.items as unknown as OrderItem[]) || [],
        subtotal: Number(order.subtotal),
        delivery_fee: Number(order.delivery_fee),
        total: Number(order.total),
      })) as Order[];
    },
    enabled: !!storeId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (order: Omit<Order, "id" | "created_at" | "updated_at">) => {
      // Create the order
      const { data, error } = await supabase
        .from("orders")
        .insert({
          store_id: order.store_id,
          customer_name: order.customer_name,
          customer_phone: order.customer_phone,
          customer_address: order.customer_address,
          delivery_type: order.delivery_type,
          payment_method: order.payment_method,
          items: order.items as unknown as any,
          subtotal: order.subtotal,
          delivery_fee: order.delivery_fee,
          total: order.total,
          notes: order.notes,
          status: order.status,
        })
        .select()
        .single();

      if (error) throw error;

      // IMPORTANT: Stock is decremented when the admin confirms the order.
      // This avoids prematurely reserving stock for orders that are still pending/cancelled.

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["orders", data.store_id] });
      queryClient.invalidateQueries({ queryKey: ["products", data.store_id] });
    },
    onError: (error) => {
      console.error("Order creation error:", error);
      toast.error("Erro ao criar pedido: " + error.message);
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, storeId }: { id: string; status: OrderStatus; storeId: string }) => {
      // Fetch current order status/items so we can safely process stock only once.
      const { data: currentOrder, error: currentError } = await supabase
        .from("orders")
        .select("id, status, items")
        .eq("id", id)
        .single();

      if (currentError) throw currentError;

      // If no actual change, no-op.
      if ((currentOrder as any)?.status === status) {
        return { ...(currentOrder as any), storeId };
      }

      const { data, error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      const items = ((currentOrder as any)?.items as unknown as OrderItem[]) || [];
      const previousStatus = (currentOrder as any)?.status as string;

      console.log("[Stock] Status change:", previousStatus, "→", status);
      console.log("[Stock] Order items:", items);

      // Track if we already decremented stock for this order (confirmed state means stock was taken)
      const stockWasDeducted = ["confirmed", "preparing", "ready"].includes(previousStatus);

      // Decrement stock ONLY when transitioning to confirmed from pending.
      if (status === "confirmed" && previousStatus === "pending") {
        const stockChanges: string[] = [];

        for (const item of items) {
          const { data: product, error: productError } = await supabase
            .from("products")
            .select("name, stock_enabled, stock_quantity")
            .eq("id", item.product_id)
            .single();

          if (productError) {
            console.error("[Stock] Error fetching product:", productError);
            continue;
          }

          console.log("[Stock] Product:", product?.name, "stock_enabled:", product?.stock_enabled, "stock_quantity:", product?.stock_quantity);

          // Only apply when stock control is enabled and there is a numeric quantity.
          if (product?.stock_enabled && typeof product.stock_quantity === "number") {
            const newQuantity = Math.max(0, product.stock_quantity - item.quantity);
            const { error: updateError } = await supabase
              .from("products")
              .update({
                stock_quantity: newQuantity,
                available: newQuantity > 0,
              })
              .eq("id", item.product_id);

            if (updateError) {
              console.error("[Stock] Error updating stock:", updateError);
              throw updateError;
            }
            
            console.log("[Stock] Decremented:", product.name, product.stock_quantity, "→", newQuantity);
            stockChanges.push(`📦 ${product.name}: ${product.stock_quantity} → ${newQuantity}`);
          }
        }

        if (stockChanges.length > 0) {
          toast.info(`Estoque atualizado!\n${stockChanges.join("\n")}`, { duration: 5000 });
        }
      }

      // Restore stock when order is cancelled AND stock was previously deducted
      if (status === "cancelled" && stockWasDeducted) {
        const stockChanges: string[] = [];

        for (const item of items) {
          const { data: product, error: productError } = await supabase
            .from("products")
            .select("name, stock_enabled, stock_quantity")
            .eq("id", item.product_id)
            .single();

          if (productError) {
            console.error("[Stock] Error fetching product for restore:", productError);
            continue;
          }

          console.log("[Stock] Restoring product:", product?.name, "stock_enabled:", product?.stock_enabled, "current:", product?.stock_quantity, "adding:", item.quantity);

          // Only restore when stock control is enabled
          if (product?.stock_enabled && typeof product.stock_quantity === "number") {
            const newQuantity = product.stock_quantity + item.quantity;
            const { error: updateError } = await supabase
              .from("products")
              .update({
                stock_quantity: newQuantity,
                available: true,
              })
              .eq("id", item.product_id);

            if (updateError) {
              console.error("[Stock] Error restoring stock:", updateError);
              throw updateError;
            }
            
            console.log("[Stock] Restored:", product.name, product.stock_quantity, "→", newQuantity);
            stockChanges.push(`🔄 ${product.name}: ${product.stock_quantity} → ${newQuantity}`);
          }
        }

        if (stockChanges.length > 0) {
          toast.warning(`⚠️ Pedido cancelado!\nEstoque restaurado:\n${stockChanges.join("\n")}`, { duration: 6000 });
        }
      } else if (status === "cancelled" && !stockWasDeducted) {
        console.log("[Stock] Order cancelled from pending - no stock to restore");
        toast.info("Pedido cancelado. Nenhum estoque foi afetado pois o pedido ainda não tinha sido confirmado.");
      }

      return { ...data, storeId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["orders", data.storeId] });
      queryClient.invalidateQueries({ queryKey: ["products", data.storeId] });
      toast.success(`Pedido ${ORDER_STATUS_LABELS[data.status as OrderStatus]}!`);
    },
    onError: (error) => {
      toast.error("Erro ao atualizar pedido: " + error.message);
    },
  });
}
