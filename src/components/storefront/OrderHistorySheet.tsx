import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  History,
  Package,
  Clock,
  MapPin,
  CreditCard,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Truck,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  ChefHat,
} from "lucide-react";
import { useCustomerOrders } from "@/hooks/useCustomerOrders";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, OrderStatus } from "@/hooks/useOrders";
import { format, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OrderHistorySheetProps {
  storeId: string;
}

export function OrderHistorySheet({ storeId }: OrderHistorySheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const { customer } = useCustomerAuth();

  const { data: orders, isLoading, refetch, isRefetching } = useCustomerOrders(
    storeId,
    customer?.phone || null
  );

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isToday(date)) {
        return `Hoje às ${format(date, "HH:mm", { locale: ptBR })}`;
      }
      if (isYesterday(date)) {
        return `Ontem às ${format(date, "HH:mm", { locale: ptBR })}`;
      }
      return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const formatPrice = (value: number) => `R$ ${value.toFixed(2).replace(".", ",")}`;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="w-3 h-3" />;
      case "confirmed": return <CheckCircle2 className="w-3 h-3" />;
      case "preparing": return <ChefHat className="w-3 h-3" />;
      case "ready": return <Package className="w-3 h-3" />;
      case "delivered": return <Truck className="w-3 h-3" />;
      case "cancelled": return <XCircle className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  // Only show if customer is logged in
  if (!customer) return null;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-muted-foreground hover:text-primary"
          title="Meus pedidos"
        >
          <History className="w-3.5 h-3.5 mr-1" />
          Pedidos
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-4 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-foreground">
              <div className="p-2 rounded-lg bg-primary/10">
                <History className="w-4 h-4 text-primary" />
              </div>
              Meus Pedidos
            </SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} />
            </Button>
          </div>
          {orders && orders.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {orders.length} {orders.length === 1 ? "pedido" : "pedidos"} no histórico
            </p>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 rounded-xl border border-border">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-24 mb-3" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
          ) : orders && orders.length > 0 ? (
            <div className="space-y-3">
              {orders.map((order, idx) => {
                const isExpanded = expandedOrderId === order.id;
                const status = order.status as OrderStatus;
                const fulfillmentLabel = String(order.delivery_type || "delivery").toLowerCase() === "pickup" ? "Retirada" : "Entrega";

                return (
                  <div
                    key={order.id}
                    className="rounded-xl border border-border overflow-hidden bg-card shadow-soft hover:shadow-medium transition-shadow animate-slide-up"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    {/* Order Header */}
                    <button
                      onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                      className="w-full p-3 text-left hover:bg-secondary/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-foreground text-sm">
                              #{order.id.slice(-6).toUpperCase()}
                            </span>
                            <Badge
                              variant="outline"
                              className={`${ORDER_STATUS_COLORS[status] || ""} text-xs flex items-center gap-1`}
                            >
                              {getStatusIcon(status)}
                              {ORDER_STATUS_LABELS[status] || status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>{formatDate(order.created_at)}</span>
                            <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                            <span className="flex items-center gap-1">
                              {fulfillmentLabel === "Entrega" ? <Truck className="w-3 h-3" /> : <ShoppingBag className="w-3 h-3" />}
                              {fulfillmentLabel}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-bold text-primary text-sm">
                            {formatPrice(order.total)}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Order Details (Expanded) */}
                    {isExpanded && (
                      <div className="px-3 pb-3 pt-0 space-y-3 animate-slide-up border-t border-border">
                        {/* Items */}
                        <div className="pt-3 space-y-2">
                          <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 uppercase tracking-wide">
                            <Package className="w-3 h-3" />
                            Itens do pedido
                          </h4>
                          <div className="space-y-1.5 bg-secondary/30 rounded-lg p-2.5">
                            {order.items.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between text-sm"
                              >
                                <span className="text-foreground">
                                  <span className="font-medium">{item.quantity}x</span> {item.product_name}
                                </span>
                                <span className="text-muted-foreground font-medium">
                                  {formatPrice(item.total_price)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Delivery Info */}
                        {order.customer_address && (
                          <div className="space-y-1">
                            <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 uppercase tracking-wide">
                              <MapPin className="w-3 h-3" />
                              Endereço
                            </h4>
                            <p className="text-sm text-foreground bg-secondary/30 rounded-lg p-2.5">
                              {order.customer_address}
                            </p>
                          </div>
                        )}

                        {/* Payment */}
                        {order.payment_method && (
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-sm text-foreground capitalize">{order.payment_method}</span>
                          </div>
                        )}

                        {/* Totals */}
                        <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl p-3 space-y-1.5 border border-primary/10">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>{formatPrice(order.subtotal)}</span>
                          </div>
                          {fulfillmentLabel === "Entrega" && order.delivery_fee > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Taxa de entrega</span>
                              <span>{formatPrice(order.delivery_fee)}</span>
                            </div>
                          )}
                          <Separator className="my-1.5" />
                          <div className="flex justify-between font-semibold">
                            <span>Total</span>
                            <span className="text-primary text-lg">{formatPrice(order.total)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-4xl mx-auto mb-4 animate-float">
                📭
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nenhum pedido ainda
              </h3>
              <p className="text-muted-foreground text-sm max-w-[200px] mx-auto">
                Seus pedidos aparecerão aqui depois da primeira compra
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
