import { useEffect, useState } from "react";
import { Product } from "@/types/store";
import { useCart } from "@/hooks/useCart";
import { Plus, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { items, addItem, updateQuantity } = useCart();
  const cartItem = items.find((item) => item.product.id === product.id);
  const quantity = cartItem?.quantity || 0;
  const minQty = product.minQuantity ?? 1;

  const [qtyDraft, setQtyDraft] = useState("");

  useEffect(() => {
    if (quantity > 0) setQtyDraft(String(quantity));
  }, [quantity]);

  useEffect(() => {
    if (quantity > 0 && quantity < minQty) {
      updateQuantity(product.id, minQty);
    }
  }, [quantity, minQty, product.id, updateQuantity]);

  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercentage = hasDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;

  return (
    <div
      className={`group bg-card rounded-xl overflow-hidden shadow-soft hover:shadow-medium transition-all duration-300 animate-slide-up ${
        !product.available ? "opacity-60" : ""
      }`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.featured && (
            <Badge className="bg-primary text-primary-foreground text-xs">
              Destaque
            </Badge>
          )}
          {hasDiscount && (
            <Badge variant="destructive" className="text-xs">
              -{discountPercentage}%
            </Badge>
          )}
        </div>

        {!product.available && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <span className="text-muted-foreground font-medium">Indisponível</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground text-base mb-1 line-clamp-1 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <p className="text-muted-foreground text-sm line-clamp-2 mb-3 min-h-[40px]">
          {product.description}
        </p>

        <div className="flex items-center justify-between">
          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-foreground">
              R$ {product.price.toFixed(2).replace(".", ",")}
            </span>
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through">
                R$ {product.originalPrice!.toFixed(2).replace(".", ",")}
              </span>
            )}
          </div>

          {/* Add to Cart */}
          {product.available && (
            <div className="flex items-center gap-1">
              {quantity > 0 ? (
                <div className="flex items-center gap-2 bg-primary rounded-full p-1 animate-scale-in">
                  <button
                    onClick={() => updateQuantity(product.id, quantity - minQty)}
                    disabled={quantity <= minQty}
                    className="w-8 h-8 flex items-center justify-center text-primary-foreground hover:bg-primary-foreground/10 rounded-full transition-colors disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <input
                    value={qtyDraft}
                    onChange={(e) => setQtyDraft(e.target.value.replace(/[^0-9]/g, ""))}
                    onBlur={() => {
                      const parsed = parseInt(qtyDraft, 10);
                      if (Number.isNaN(parsed)) {
                        setQtyDraft(String(quantity));
                        return;
                      }
                      // Round to nearest multiple of minQty, minimum minQty
                      const rounded = Math.max(minQty, Math.round(parsed / minQty) * minQty);
                      if (rounded !== quantity) updateQuantity(product.id, rounded);
                      else setQtyDraft(String(quantity));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
                    }}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    aria-label="Quantidade"
                    className="w-10 text-center font-semibold text-primary-foreground bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />

                  <button
                    onClick={() => updateQuantity(product.id, quantity + minQty)}
                    className="w-8 h-8 flex items-center justify-center text-primary-foreground hover:bg-primary-foreground/10 rounded-full transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => addItem(product, minQty)}
                  className="w-10 h-10 flex items-center justify-center bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all hover:scale-105 shadow-soft"
                >
                  <Plus className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
