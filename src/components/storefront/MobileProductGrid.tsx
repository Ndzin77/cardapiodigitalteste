import { useState, useMemo, useCallback } from "react";
import { Product, StoreInfo } from "@/types/store";
import { MobileProductCard } from "./MobileProductCard";
import { ProductSearch } from "./ProductSearch";
import { FeaturedCarousel } from "./FeaturedCarousel";
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
  onCategoryChange?: (categoryId: string) => void;
}

export function MobileProductGrid({ 
  products, 
  categories, 
  activeCategory,
  store,
  unavailableWhatsappEnabled = true,
  onCategoryChange,
}: MobileProductGridProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Featured products for the carousel
  const featuredProducts = useMemo(() => 
    products.filter(p => p.featured && p.available), 
    [products]
  );

  // All real categories (excluding "featured")
  const realCategories = useMemo(() => 
    categories.filter(c => c.id !== "featured"),
    [categories]
  );

  // Products grouped by category
  const productsByCategory = useMemo(() => {
    return realCategories.map(cat => ({
      category: cat,
      products: products.filter(p => p.category === cat.id),
    })).filter(g => g.products.length > 0);
  }, [products, realCategories]);

  // For single category view
  const singleCategoryProducts = useMemo(() => {
    if (activeCategory === "featured") return [];
    let result = products.filter(p => p.category === activeCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      );
    }
    return result;
  }, [products, activeCategory, searchQuery]);

  // Search-filtered for "all" view
  const searchFilteredByCategory = useMemo(() => {
    if (!searchQuery.trim()) return productsByCategory;
    const q = searchQuery.toLowerCase().trim();
    return productsByCategory
      .map(g => ({
        ...g,
        products: g.products.filter(p =>
          p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
        ),
      }))
      .filter(g => g.products.length > 0);
  }, [productsByCategory, searchQuery]);

  const handleProductClick = useCallback((productId: string, categoryId: string) => {
    onCategoryChange?.(categoryId);
    setSearchQuery("");
    // Scroll to product after category switch
    setTimeout(() => {
      const el = document.getElementById(`product-${productId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 200);
  }, [onCategoryChange]);

  const isAllView = activeCategory === "featured";

  return (
    <div className="container py-4 sm:py-6 space-y-6">
      {/* Search Bar - always global */}
      <div className="px-1">
        <ProductSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Buscar no cardápio..."
          products={products}
          onProductClick={handleProductClick}
        />
      </div>

      {/* === ALL PRODUCTS VIEW (when "featured" / first tab is active) === */}
      {isAllView && (
        <>
          {/* Featured Carousel */}
          {featuredProducts.length > 0 && !searchQuery.trim() && (
            <FeaturedCarousel
              products={featuredProducts as ProductWithOptions[]}
              store={store}
              unavailableWhatsappEnabled={unavailableWhatsappEnabled}
            />
          )}

          {/* All Categories with Products */}
          {searchFilteredByCategory.length > 0 ? (
            searchFilteredByCategory.map(({ category, products: catProducts }, groupIdx) => (
              <div key={category.id} className="space-y-4 animate-fade-in" style={{ animationDelay: `${groupIdx * 100}ms` }}>
                {/* Category Header */}
                <div className="flex items-center justify-between gap-3 px-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl gradient-primary flex items-center justify-center text-lg sm:text-xl shadow-soft">
                      {category.icon}
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-foreground font-display tracking-tight">
                        {category.name}
                      </h2>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {catProducts.length} {catProducts.length === 1 ? "item" : "itens"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Products Horizontal Scroll */}
                <div className="relative -mx-4 px-4">
                  <div className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth pb-2">
                    {catProducts.map((product, idx) => (
                      <div
                        key={product.id}
                        id={`product-${product.id}`}
                        className="snap-start shrink-0 w-[44vw] sm:w-[38vw] md:w-[28vw] lg:w-[22vw] animate-slide-up"
                        style={{ animationDelay: `${Math.min(idx * 60, 300)}ms` }}
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
                </div>
              </div>
            ))
          ) : searchQuery.trim() ? (
            <div className="text-center py-12 animate-fade-in">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                <span className="text-3xl">🔍</span>
              </div>
              <p className="text-muted-foreground font-medium text-sm">
                Nenhum produto encontrado para "{searchQuery}"
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="mt-3 text-sm text-primary font-semibold hover:underline"
              >
                Limpar busca
              </button>
            </div>
          ) : null}
        </>
      )}

      {/* === SINGLE CATEGORY VIEW === */}
      {!isAllView && (
        <div className="space-y-4">
          {/* Category Header */}
          {(() => {
            const category = categories.find(c => c.id === activeCategory);
            return category ? (
              <div className="flex items-center gap-3 px-1 animate-fade-in">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl gradient-primary flex items-center justify-center text-lg sm:text-xl shadow-soft">
                  {category.icon}
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-foreground font-display tracking-tight">
                    {category.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {singleCategoryProducts.length} {singleCategoryProducts.length === 1 ? "item" : "itens"}
                  </p>
                </div>
              </div>
            ) : null;
          })()}

          {singleCategoryProducts.length === 0 ? (
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
              {singleCategoryProducts.map((product, idx) => (
                <div
                  key={product.id}
                  id={`product-${product.id}`}
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
      )}
    </div>
  );
}
