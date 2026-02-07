import { useState, useMemo, forwardRef } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useMyStore } from "@/hooks/useStore";
import { useOrders, useUpdateOrderStatus, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, OrderStatus } from "@/hooks/useOrders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChefHat,
  Truck,
  ShoppingBag,
  User,
  Phone,
  MapPin,
  CreditCard,
  Calendar,
  Search,
  Filter,
  ArrowUpDown,
  RefreshCw,
} from "lucide-react";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Orders() {
  const { data: store, isLoading: storeLoading } = useMyStore();
  const { data: orders = [], isLoading: ordersLoading, refetch } = useOrders(store?.id);
  const updateStatus = useUpdateOrderStatus();

  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Filter and sort orders
  const processedOrders = useMemo(() => {
    let result = [...orders];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.customer_name?.toLowerCase().includes(query) ||
          o.customer_phone?.includes(query) ||
          o.id.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((o) => o.status === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [orders, searchQuery, sortOrder, statusFilter]);

  const activeOrders = processedOrders.filter((o) => 
    !["delivered", "cancelled"].includes(o.status)
  );
  const completedOrders = processedOrders.filter((o) => 
    ["delivered", "cancelled"].includes(o.status)
  );

  // Group orders by date for better organization
  const groupOrdersByDate = (orderList: typeof orders) => {
    const groups: { label: string; orders: typeof orders }[] = [];
    const groupMap = new Map<string, typeof orders>();

    orderList.forEach((order) => {
      const date = parseISO(order.created_at);
      let label: string;

      if (isToday(date)) {
        label = "Hoje";
      } else if (isYesterday(date)) {
        label = "Ontem";
      } else {
        label = format(date, "dd 'de' MMMM", { locale: ptBR });
      }

      const existing = groupMap.get(label) || [];
      existing.push(order);
      groupMap.set(label, existing);
    });

    groupMap.forEach((orders, label) => {
      groups.push({ label, orders });
    });

    return groups;
  };

  const handleStatusChange = (orderId: string, status: OrderStatus) => {
    if (!store) return;
    updateStatus.mutate({ id: orderId, status, storeId: store.id });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="w-4 h-4" />;
      case "confirmed": return <CheckCircle2 className="w-4 h-4" />;
      case "preparing": return <ChefHat className="w-4 h-4" />;
      case "ready": return <Package className="w-4 h-4" />;
      case "delivered": return <Truck className="w-4 h-4" />;
      case "cancelled": return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  // Count orders by status for quick stats
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach((o) => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return counts;
  }, [orders]);

  if (storeLoading || ordersLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-primary/5 via-card to-secondary/30 border border-primary/10 shadow-soft">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl gradient-primary text-white shadow-medium">
                <Package className="w-5 h-5" />
              </span>
              Pedidos
            </h1>
            <p className="text-sm text-muted-foreground pl-12">
              Gerencie os pedidos da sua loja
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </Button>
            <Badge variant="outline" className="text-sm px-3 py-1.5 bg-primary/5 border-primary/20">
              {activeOrders.length} ativos
            </Badge>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          {(["pending", "confirmed", "preparing", "ready", "delivered", "cancelled"] as OrderStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? "all" : status)}
              className={`p-3 rounded-xl border transition-all ${
                statusFilter === status
                  ? "border-primary bg-primary/10 shadow-soft"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={`p-1.5 rounded-lg ${ORDER_STATUS_COLORS[status]}`}>
                  {getStatusIcon(status)}
                </div>
              </div>
              <div className="text-left">
                <div className="text-lg font-bold text-foreground">{statusCounts[status] || 0}</div>
                <div className="text-xs text-muted-foreground">{ORDER_STATUS_LABELS[status]}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome, telefone ou ID..."
              className="pl-10 h-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as "newest" | "oldest")}>
              <SelectTrigger className="w-[140px] h-10">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mais recentes</SelectItem>
                <SelectItem value="oldest">Mais antigos</SelectItem>
              </SelectContent>
            </Select>
            {statusFilter !== "all" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStatusFilter("all")}
                className="h-10"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Limpar filtro
              </Button>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "active" | "completed")}>
          <TabsList className="grid w-full grid-cols-2 h-12">
            <TabsTrigger value="active" className="gap-2 text-sm">
              <Clock className="w-4 h-4" />
              Ativos ({activeOrders.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              Finalizados ({completedOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4">
            {activeOrders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                    <Package className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground font-medium">Nenhum pedido ativo no momento</p>
                  <p className="text-sm text-muted-foreground mt-1">Novos pedidos aparecerão aqui</p>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[calc(100vh-420px)] min-h-[400px]">
                <div className="space-y-6 pr-4">
                  {groupOrdersByDate(activeOrders).map(({ label, orders: groupOrders }) => (
                    <div key={label} className="space-y-3">
                      <div className="flex items-center gap-3 sticky top-0 bg-background py-2 z-10">
                        <span className="text-sm font-semibold text-foreground">{label}</span>
                        <div className="flex-1 h-px bg-border" />
                        <Badge variant="secondary" className="text-xs">
                          {groupOrders.length} {groupOrders.length === 1 ? "pedido" : "pedidos"}
                        </Badge>
                      </div>
                      <div className="grid gap-3">
                        {groupOrders.map((order) => (
                          <OrderCard
                            key={order.id}
                            order={order}
                            onStatusChange={handleStatusChange}
                            getStatusIcon={getStatusIcon}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-4">
            {completedOrders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground font-medium">Nenhum pedido finalizado ainda</p>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[calc(100vh-420px)] min-h-[400px]">
                <div className="space-y-6 pr-4">
                  {groupOrdersByDate(completedOrders).map(({ label, orders: groupOrders }) => (
                    <div key={label} className="space-y-3">
                      <div className="flex items-center gap-3 sticky top-0 bg-background py-2 z-10">
                        <span className="text-sm font-semibold text-foreground">{label}</span>
                        <div className="flex-1 h-px bg-border" />
                        <Badge variant="secondary" className="text-xs">
                          {groupOrders.length} {groupOrders.length === 1 ? "pedido" : "pedidos"}
                        </Badge>
                      </div>
                      <div className="grid gap-3">
                        {groupOrders.map((order) => (
                          <OrderCard
                            key={order.id}
                            order={order}
                            onStatusChange={handleStatusChange}
                            getStatusIcon={getStatusIcon}
                            isCompleted
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

interface OrderCardProps {
  order: any;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  getStatusIcon: (status: string) => React.ReactNode;
  isCompleted?: boolean;
}

// Forward ref to fix the Select warning
const OrderCard = forwardRef<HTMLDivElement, OrderCardProps>(
  function OrderCard({ order, onStatusChange, getStatusIcon, isCompleted }, ref) {
    const statusColor = ORDER_STATUS_COLORS[order.status as OrderStatus] || ORDER_STATUS_COLORS.pending;

    const fulfillmentLabel = String(order.delivery_type || "delivery").toLowerCase() === "pickup" ? "Retirada" : "Entrega";
    const fulfillmentIcon = fulfillmentLabel === "Retirada" ? ShoppingBag : Truck;
    const FulfillmentIcon = fulfillmentIcon;

    const orderTime = format(new Date(order.created_at), "HH:mm", { locale: ptBR });

    return (
      <Card ref={ref} className="overflow-hidden hover:shadow-soft transition-shadow">
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`p-2 rounded-lg shrink-0 ${statusColor}`}>
                {getStatusIcon(order.status)}
              </div>
              <div className="min-w-0">
                <CardTitle className="text-sm font-semibold truncate">
                  #{order.id.slice(-6).toUpperCase()}
                </CardTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <Clock className="w-3 h-3 shrink-0" />
                  <span>{orderTime}</span>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                  <span className="truncate">{order.customer_name || "Cliente"}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm font-bold text-primary">
                R$ {order.total.toFixed(2).replace(".", ",")}
              </span>
              <Badge className={`${statusColor} border text-xs`}>
                {ORDER_STATUS_LABELS[order.status as OrderStatus] || order.status}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-2 pb-3 px-4 space-y-3">
          {/* Fulfillment & Customer Info - Compact */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full ${
              fulfillmentLabel === "Entrega" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent-foreground"
            }`}>
              <FulfillmentIcon className="w-3 h-3" />
              <span className="font-medium">{fulfillmentLabel}</span>
            </div>
            {order.customer_phone && (
              <a
                href={`tel:${order.customer_phone}`}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <Phone className="w-3 h-3" />
                <span>{order.customer_phone}</span>
              </a>
            )}
            {order.payment_method && (
              <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-secondary">
                <CreditCard className="w-3 h-3" />
                <span className="capitalize">{order.payment_method}</span>
              </div>
            )}
          </div>

          {/* Address - Only for delivery */}
          {fulfillmentLabel === "Entrega" && order.customer_address && (
            <div className="flex items-start gap-2 text-xs p-2 rounded-lg bg-secondary/50">
              <MapPin className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />
              <span className="text-muted-foreground">{order.customer_address}</span>
            </div>
          )}

          {/* Items - Compact */}
          <div className="bg-secondary/50 rounded-lg p-3 space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Itens do pedido</p>
            {order.items.map((item: any, index: number) => (
              <div key={index} className="flex justify-between text-xs">
                <span className="text-foreground">
                  <span className="font-medium">{item.quantity}x</span> {item.product_name}
                  {item.notes && (
                    <span className="text-muted-foreground ml-1">({item.notes})</span>
                  )}
                </span>
                <span className="font-medium text-foreground">
                  R$ {item.total_price.toFixed(2).replace(".", ",")}
                </span>
              </div>
            ))}

            {/* Totals */}
            <div className="border-t border-border pt-2 mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Subtotal</span>
                <span>R$ {Number(order.subtotal).toFixed(2).replace(".", ",")}</span>
              </div>
              {fulfillmentLabel === "Entrega" && Number(order.delivery_fee) > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Taxa de entrega</span>
                  <span>R$ {Number(order.delivery_fee).toFixed(2).replace(".", ",")}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-sm pt-1">
                <span>Total</span>
                <span className="text-primary">R$ {order.total.toFixed(2).replace(".", ",")}</span>
              </div>
            </div>
          </div>

          {order.notes && (
            <div className="bg-warning/10 rounded-lg p-2.5">
              <p className="text-xs font-medium text-warning-foreground mb-0.5">Observações</p>
              <p className="text-xs text-foreground">{order.notes}</p>
            </div>
          )}

          {/* Status Actions */}
          {!isCompleted && (
            <div className="pt-1">
              <Select
                value={order.status}
                onValueChange={(value) => onStatusChange(order.id, value as OrderStatus)}
              >
                <SelectTrigger className="w-full h-9 text-sm">
                  <SelectValue placeholder="Alterar status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">⏳ Pendente</SelectItem>
                  <SelectItem value="confirmed">✓ Confirmado</SelectItem>
                  <SelectItem value="preparing">👨‍🍳 Preparando</SelectItem>
                  <SelectItem value="ready">📦 Pronto</SelectItem>
                  <SelectItem value="delivered">🚚 Entregue</SelectItem>
                  <SelectItem value="cancelled">✕ Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
);
