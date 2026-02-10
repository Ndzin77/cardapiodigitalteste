import { useEffect, useState } from "react";
import { Product, StoreInfo } from "@/types/store";
import { useCart } from "@/hooks/useCart";
import { Plus, Minus, Flame, Clock, Sparkles, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProductCustomizeModal } from "./ProductCustomizeModal";
import { ProductDetailModal } from "./ProductDetailModal";

interface ProductOption {
  name: string;
  required: boolean;
  enabled?: boolean;
  max_select: number;
  min_select: number;
  choices: {
    name: string;
    price_modifier: number;
    image_url?: string;
    enabled?: boolean;
  }[];
}

interface MobileProductCardProps {
  product: Product;
  hasOptions?: boolean;
  options?: ProductOption[];
  minQuantity?: number;
  store?: StoreInfo;
  unavailableWhatsappEnabled?: boolean;
}

export function MobileProductCard({ 
  product, 
  hasOptions = false,
  options = [],
  minQuantity = 1,
  store,
  unavailableWhatsappEnabled = true,
}: MobileProductCardProps) {
  const { items, addItem, updateQuantity } = useCart();
  const [showCustomize, setShowCustomize] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const minQty = Math.max(1, minQuantity);
  
  const cartItem = items.find((item) => item.product.id === product.id);
  const quantity = cartItem?.quantity || 0;

  const [qtyDraft, setQtyDraft] = useState("");

  useEffect(() => {
    if (quantity > 0) setQtyDraft(String(quantity));
  }, [quantity]);

  useEffect(() => {
    if (quantity > 0 && !hasOptions && quantity < minQty) {
      updateQuantity(product.id, minQty);
    }
  }, [quantity, minQty, hasOptions, product.id, updateQuantity]);

  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercentage = hasDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;

  const handleAddClick = () => {
    if (hasOptions && options.length > 0) {
      setShowCustomize(true);
    } else {
      addItem(product, minQty);
    }
  };

  // Handle unavailable product click -> WhatsApp
  const handleUnavailableClick = () => {
    if (!store?.whatsapp) return;
    const message = encodeURIComponent(
      `Olá! Vi na vitrine da ${store.name} que o produto "${product.name}" está indisponível. Gostaria de saber quando estará disponível novamente.`
    );
    window.open(`https://wa.me/${store.whatsapp}?text=${message}`, "_blank");
  };

  // Stock info
  const stockEnabled = (product as any).stockEnabled ?? false;
  const stockQuantity = (product as any).stockQuantity ?? null;
  const isLowStock = stockEnabled && typeof stockQuantity === "number" && stockQuantity <= 5 && stockQuantity > 0;

  return (
    <>
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`group relative bg-card rounded-2xl overflow-hidden shadow-soft transition-all duration-500 touch-manipulation hover:-translate-y-1 hover:shadow-strong ${
          !product.available ? "opacity-80" : ""
        } ${quantity > 0 ? "ring-2 ring-primary/30" : ""}`}
      >
        {/* Image Container - Clickable for detail */}
        <div className="relative aspect-[4/3] overflow-hidden cursor-pointer" onClick={() => setShowDetail(true)}>
          <img
            src={product.image}
            alt={product.name}
            className={`w-full h-full object-cover transition-transform duration-700 ${isHovered ? "scale-110" : "scale-100"}`}
            loading="lazy"
          />

          {/* Gradient overlay on hover */}
          <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300 ${isHovered ? "opacity-100" : "opacity-0"}`} />

          {/* Badges - Top Left */}
          <div className="absolute top-2 left-2 flex flex-col gap-1.5">
            {product.featured && (
              <Badge className="gradient-primary text-primary-foreground text-xs font-bold shadow-soft border-0 animate-pulse-attention">
                <Flame className="w-3 h-3 mr-1" />
                Destaque
              </Badge>
            )}
            {hasDiscount && (
              <Badge className="bg-destructive text-destructive-foreground text-xs font-bold shadow-soft border-0">
                <Sparkles className="w-3 h-3 mr-1" />
                -{discountPercentage}%
              </Badge>
            )}
            {hasOptions && (
              <Badge variant="secondary" className="text-xs bg-white/90 backdrop-blur-sm shadow-soft">
                Personalizável
              </Badge>
            )}
          </div>

          {/* Urgency Indicators - Top Right */}
          <div className="absolute top-2 right-2 flex flex-col gap-1.5">
            {isLowStock && product.available && (
              <Badge className="bg-warning text-warning-foreground text-xs font-bold animate-pulse shadow-soft border-0">
                <Clock className="w-3 h-3 mr-1" />
                Últimas {stockQuantity}!
              </Badge>
            )}
            {!product.available && (
              <Badge variant="outline" className="text-xs bg-background/95 backdrop-blur-sm text-muted-foreground border-muted shadow-soft">
                Indisponível
              </Badge>
            )}
          </div>

          {/* Quick Add Button - Shows on hover for available products */}
          {product.available && quantity === 0 && (
            <button
              onClick={handleAddClick}
              className={`absolute bottom-3 right-3 w-11 h-11 flex items-center justify-center rounded-full gradient-accent text-white shadow-strong transition-all duration-300 hover:scale-110 active:scale-95 ${
                isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              }`}
            >
              <Plus className="w-5 h-5" />
            </button>
          )}

          {/* Unavailable Overlay */}
          {!product.available && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
              <span className="text-muted-foreground font-semibold text-sm">Produto Indisponível</span>
              {unavailableWhatsappEnabled && store?.whatsapp && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnavailableClick();
                  }}
                  className="flex items-center gap-2 text-xs bg-accent text-accent-foreground px-4 py-2.5 rounded-full font-semibold hover:bg-accent/90 transition-all shadow-soft hover:shadow-medium active:scale-95"
                >
                  <MessageCircle className="w-4 h-4" />
                  Consultar disponibilidade
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4">
          <h3 className="font-bold text-foreground text-sm mb-1 line-clamp-1 group-hover:text-primary transition-colors font-display">
            {product.name}
          </h3>
          <p className="text-muted-foreground text-xs line-clamp-2 mb-3 min-h-[32px] text-pretty">
            {product.description}
          </p>

          <div className="flex items-center justify-between gap-2">
            {/* Price */}
            <div className="flex flex-col min-w-0">
              <span className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                R$ {product.price.toFixed(2).replace(".", ",")}
              </span>
              {hasDiscount && (
                <span className="text-xs text-muted-foreground line-through">
                  R$ {product.originalPrice!.toFixed(2).replace(".", ",")}
                </span>
              )}
            </div>

            {/* Add to Cart Button / Quantity Controls */}
            {product.available && (
              <div className="flex items-center shrink-0">
                {quantity > 0 && !hasOptions ? (
                  <div className="flex items-center gap-0.5 gradient-primary rounded-full px-1 py-1 shadow-soft animate-scale-in">
                    <button
                      onClick={() => updateQuantity(product.id, quantity - minQty)}
                      disabled={quantity <= minQty}
                      className="w-7 h-7 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition-colors active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                    >
                      <Minus className="w-3.5 h-3.5" />
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
                      className="w-7 text-center font-bold text-white text-xs bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />

                    <button
                      onClick={() => updateQuantity(product.id, quantity + minQty)}
                      className="w-7 h-7 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition-colors active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleAddClick}
                    className="w-10 h-10 flex items-center justify-center rounded-full gradient-accent text-white shadow-soft hover:shadow-glow-accent hover:scale-105 transition-all active:scale-95"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Selected indicator line */}
        {quantity > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 gradient-primary animate-scale-in" />
        )}
      </div>

      {/* Detail Modal */}
      <ProductDetailModal
        product={product}
        open={showDetail}
        onOpenChange={setShowDetail}
        hasOptions={hasOptions}
        options={options}
        minQuantity={minQty}
        store={store}
        unavailableWhatsappEnabled={unavailableWhatsappEnabled}
      />

      {/* Customization Modal */}
      <ProductCustomizeModal
        product={product}
        options={options}
        open={showCustomize}
        onOpenChange={setShowCustomize}
        minQuantity={minQty}
      />
    </>
  );
}
