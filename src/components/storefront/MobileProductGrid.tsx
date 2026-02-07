import { useState, useMemo } from "react";
import { Product, StoreInfo } from "@/types/store";
import { MobileProductCard } from "./MobileProductCard";
import { ProductSearch } from "./ProductSearch";
import { Package } from "lucide-react";

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

interface ProductWithOptions extends Product {
  hasOptions?: boolean;
  options?: ProductOption[];
  minQuantity?: number;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface MobileProductGridProps {
  products: ProductWithOptions[];
  categories: Category[];
  activeCategory: string;
  store?: StoreInfo;
  unavailableWhatsappEnabled?: boolean;
}

export function MobileProductGrid({ 
  products, 
  categories, 
  activeCategory,
  store,
  unavailableWhatsappEnabled = true,
}: MobileProductGridProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter products based on active category and search
  const filteredProducts = useMemo(() => {
    let result = activeCategory === "featured"
      ? products.filter((p) => p.featured)
      : products.filter((p) => p.category === activeCategory);

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
      );
    }

    return result;
  }, [products, activeCategory, searchQuery]);

  // Group products by category for "all" view or single category
  const getProductsByCategory = () => {
    if (activeCategory !== "featured") {
      const category = categories.find((c) => c.id === activeCategory);
      return [{
        category,
        products: filteredProducts,
      }];
    }

    // For featured, just show featured products
    return [{
      category: { id: "featured", name: "Destaques", icon: "⭐" },
      products: filteredProducts,
    }];
  };

  const groupedProducts = getProductsByCategory();

  return (
    <div className="container py-4 sm:py-6 space-y-6">
      {/* Search Bar - Premium style with neuro-cue */}
      <div className="px-1 relative">
        <ProductSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="O que você procura hoje?"
        />
        {/* Social proof micro-cue */}
        {!searchQuery && (
          <div className="flex items-center justify-center gap-2 mt-3 animate-fade-in">
            <div className="flex -space-x-2">
              {["🧑", "👩", "👨", "👧"].map((emoji, i) => (
                <span key={i} className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs border-2 border-background">
                  {emoji}
                </span>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              <strong className="text-foreground">+42 pessoas</strong> navegando agora
            </span>
          </div>
        )}
      </div>

      {/* Products Grid */}
      {groupedProducts.map(({ category, products: categoryProducts }) => (
        <div key={category?.id} className="space-y-4">
          {category && (
            <div className="flex items-center justify-between gap-3 px-1 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl gradient-primary flex items-center justify-center text-lg sm:text-xl shadow-glow">
                  {category.icon}
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-foreground font-display tracking-tight">
                    {category.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {categoryProducts.length} {categoryProducts.length === 1 ? "item" : "itens"}
                  </p>
                </div>
              </div>
              {/* Urgency badge */}
              {categoryProducts.length > 0 && (
                <div className="hidden sm:flex items-center gap-1.5 bg-warning/10 text-warning-foreground px-3 py-1.5 rounded-full text-xs font-semibold animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-warning animate-ping" />
                  Alta demanda
                </div>
              )}
            </div>
          )}

          {categoryProducts.length === 0 ? (
            <div className="text-center py-12 animate-fade-in">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                {searchQuery ? (
                  <span className="text-3xl">🔍</span>
                ) : (
                  <Package className="w-7 h-7 text-muted-foreground" />
                )}
              </div>
              <p className="text-muted-foreground font-medium text-sm">
                {searchQuery
                  ? `Nenhum produto encontrado para "${searchQuery}"`
                  : "Nenhum produto nesta categoria"}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-3 text-sm text-primary font-semibold hover:underline"
                >
                  Limpar busca
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {categoryProducts.map((product, idx) => (
                <div
                  key={product.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${Math.min(idx * 50, 300)}ms` }}
                >
                  <MobileProductCard
                    product={product}
                    hasOptions={product.hasOptions}
                    options={product.options}
                    minQuantity={product.minQuantity}
                    store={store}
                    unavailableWhatsappEnabled={unavailableWhatsappEnabled}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
