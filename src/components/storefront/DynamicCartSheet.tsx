import { useCart } from "@/hooks/useCart";
import { StoreInfo } from "@/types/store";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, Trash2, ShoppingBag, MessageCircle } from "lucide-react";
import { useState } from "react";
import { CheckoutModal } from "./CheckoutModal";

interface DynamicCartSheetProps {
  store: StoreInfo;
  storeId: string;
}

export function DynamicCartSheet({ store, storeId }: DynamicCartSheetProps) {
  const { items, isOpen, setIsOpen, updateQuantity, removeItem, subtotal, clearCart } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);

  const deliveryFee = store.deliveryFee;
  const total = subtotal + deliveryFee;
  const meetsMinOrder = subtotal >= store.minOrder;

  const handleCheckout = () => {
    setShowCheckout(true);
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
          <SheetHeader className="p-4 border-b border-border">
            <SheetTitle className="flex items-center gap-2 text-foreground">
              <ShoppingBag className="w-5 h-5 text-primary" />
              Seu Pedido
              <span className="text-sm font-normal text-muted-foreground">
                ({items.length} {items.length === 1 ? "item" : "itens"})
              </span>
            </SheetTitle>
          </SheetHeader>

          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center text-4xl mb-4">
                🛒
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Carrinho vazio
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                Adicione produtos para fazer seu pedido
              </p>
              <Button onClick={() => setIsOpen(false)} variant="outline">
                Ver cardápio
              </Button>
            </div>
          ) : (
            <>
              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {items.map((item) => {
                  const minQty = item.product.minQuantity ?? 1;

                  return (
                    <div
                      key={`${item.product.id}-${item.notes || ''}`}
                      className="bg-secondary/50 rounded-xl p-3 animate-scale-in"
                    >
                    <div className="flex gap-3">
                      {/* Product Image */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground text-sm line-clamp-1">
                          {item.product.name}
                        </h4>
                        {item.notes && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {item.notes}
                          </p>
                        )}
                        <p className="text-primary font-semibold text-sm mt-1">
                          R$ {(item.product.price * item.quantity).toFixed(2).replace(".", ",")}
                        </p>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - minQty, item.notes)}
                              disabled={item.quantity <= minQty}
                              className="w-7 h-7 flex items-center justify-center bg-background rounded-full border border-border hover:bg-muted transition-colors active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center font-medium text-sm">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + minQty, item.notes)}
                              className="w-7 h-7 flex items-center justify-center bg-background rounded-full border border-border hover:bg-muted transition-colors active:scale-95"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeItem(item.product.id, item.notes)}
                            className="text-destructive hover:text-destructive/80 p-1 active:scale-95"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              <div className="border-t border-border p-4 space-y-4 bg-card safe-area-bottom">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">R$ {subtotal.toFixed(2).replace(".", ",")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxa de entrega</span>
                    <span className="text-foreground">R$ {deliveryFee.toFixed(2).replace(".", ",")}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span className="text-foreground">Total</span>
                    <span className="text-primary text-lg">
                      R$ {total.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                </div>

                {!meetsMinOrder && (
                  <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg text-center">
                    Pedido mínimo: R$ {store.minOrder.toFixed(2).replace(".", ",")}
                    <br />
                    <span className="font-medium">
                      Faltam R$ {(store.minOrder - subtotal).toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                )}

                <Button
                  onClick={handleCheckout}
                  disabled={!meetsMinOrder}
                  className="w-full h-12 text-base font-semibold gap-2"
                  size="lg"
                >
                  <MessageCircle className="w-5 h-5" />
                  Finalizar Pedido
                </Button>

                <button
                  onClick={clearCart}
                  className="w-full text-center text-sm text-muted-foreground hover:text-destructive transition-colors"
                >
                  Limpar carrinho
                </button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <CheckoutModal
        open={showCheckout}
        onOpenChange={setShowCheckout}
        store={store}
        storeId={storeId}
      />
    </>
  );
}
