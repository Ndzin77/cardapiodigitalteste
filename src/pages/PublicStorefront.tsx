import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CartProvider } from "@/hooks/useCart";
import { CustomerAuthProvider } from "@/hooks/useCustomerAuth";
import { useStoreBySlug, useCategories, useProducts } from "@/hooks/useStore";
import { StoreHeader } from "@/components/storefront/StoreHeader";
import { StoreHeaderSkeleton } from "@/components/storefront/StoreHeaderSkeleton";
import { CategoryNav } from "@/components/storefront/CategoryNav";
import { CategoryNavSkeleton } from "@/components/storefront/CategoryNavSkeleton";
import { MobileProductGrid } from "@/components/storefront/MobileProductGrid";
import { ProductGridSkeleton } from "@/components/storefront/ProductCardSkeleton";
import { DynamicCartSheet } from "@/components/storefront/DynamicCartSheet";
import { FloatingCart } from "@/components/storefront/FloatingCart";
import { FloatingHelpButton } from "@/components/storefront/FloatingHelpButton";
import { StoreFooter } from "@/components/storefront/StoreFooter";
import { DeveloperWatermarks, FooterDeveloperBadge } from "@/components/DeveloperWatermark";
import { StoreInfo, Category, Product, ProductOption } from "@/types/store";
import { sanitizeProductOptions } from "@/lib/sanitizeProductOptions";
import { applyThemeToDocument, parseThemeColorField } from "@/lib/storeTheme";

interface ProductWithOptions extends Product {
  hasOptions?: boolean;
  options?: ProductOption[];
  minQuantity?: number;
}

export default function PublicStorefront() {
  const { slug } = useParams<{ slug: string }>();
  const { data: store, isLoading: storeLoading, error: storeError } = useStoreBySlug(slug || "");
  const { data: dbCategories, isLoading: categoriesLoading } = useCategories(store?.id);
  const { data: dbProducts, isLoading: productsLoading } = useProducts(store?.id);

  useEffect(() => {
    if (!store) return;
    return applyThemeToDocument({ themeColorField: (store as any).theme_color });
  }, [store]);

  // Add "Destaques" category at the beginning
  const categories: Category[] = [
    { id: "featured", name: "Destaques", icon: "⭐" },
    ...(dbCategories?.filter(c => c.is_active).map(c => ({
      id: c.id,
      name: c.name,
      icon: c.icon || "🍽️",
    })) || []),
  ];

  const [activeCategory, setActiveCategory] = useState("featured");

  // Convert DB products to storefront format with options
  const products: ProductWithOptions[] = dbProducts?.map(p => {
    const productOptions = sanitizeProductOptions((p as any).options as ProductOption[] | null);
    const hasOptions = (p as any).has_options === true && productOptions.length > 0;
    
    return {
      id: p.id,
      name: p.name,
      description: p.description || "",
      price: Number(p.price),
      originalPrice: p.original_price ? Number(p.original_price) : undefined,
      image: p.image_url || "/placeholder.svg",
      category: p.category_id || "",
      available: p.available ?? true,
      featured: p.featured ?? false,
      hasOptions,
      options: hasOptions ? productOptions : undefined,
      minQuantity: (p as any).min_order_quantity || 1,
      // Stock info for display
      stockEnabled: (p as any).stock_enabled ?? false,
      stockQuantity: (p as any).stock_quantity ?? null,
    };
  }) || [];

  // Convert DB store to storefront format
  const themeParsed = parseThemeColorField((store as any)?.theme_color);
  const fulfillmentFromConfig = themeParsed.config
    ? {
        deliveryEnabled: themeParsed.config.deliveryEnabled ?? true,
        pickupEnabled: themeParsed.config.pickupEnabled ?? true,
      }
    : { deliveryEnabled: true, pickupEnabled: true };

  const storeInfo: StoreInfo | null = store ? {
    name: store.name,
    slug: store.slug,
    description: store.description || "",
    logo: store.logo_url || "/placeholder.svg",
    coverImage: store.cover_image_url || "/placeholder.svg",
    address: store.address || "",
    googleMapsUrl: (store as any).google_maps_url || undefined,
    phone: store.phone || "",
    whatsapp: store.whatsapp || "",
    whatsappMessage: (store as any).whatsapp_message || undefined,
    instagram: store.instagram || undefined,
    openingHours: (store.opening_hours as any[]) || [],
    deliveryFee: Number(store.delivery_fee) || 0,
    minOrder: Number(store.min_order) || 0,
    estimatedTime: store.estimated_time || "30-45 min",
    acceptedPayments: store.accepted_payments || [],
    isOpen: store.is_open ?? true,
    rating: (store as any).rating || 4.8,
    reviewCount: (store as any).review_count || 0,
    checkoutLink: (store as any).checkout_link || undefined,
    customPayments: (store as any).custom_payments || [],
    helpButtonEnabled: (store as any).help_button_enabled ?? true,
    helpButtonMessage: (store as any).help_button_message || "Olá! Tenho uma dúvida.",
    deliveryEnabled: fulfillmentFromConfig.deliveryEnabled,
    pickupEnabled: fulfillmentFromConfig.pickupEnabled,
  } : null;

  if (storeLoading || categoriesLoading || productsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <StoreHeaderSkeleton />
        <CategoryNavSkeleton />
        <div className="container py-4 sm:py-6 space-y-4">
          <div className="px-1">
            <div className="h-10 bg-muted rounded-lg animate-pulse" />
          </div>
          <ProductGridSkeleton count={8} />
        </div>
      </div>
    );
  }

  if (storeError || !store) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🏪</div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Loja não encontrada</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            A loja que você está procurando não existe ou foi removida.
          </p>
        </div>
      </div>
    );
  }

  return (
    <CustomerAuthProvider storeId={store.id}>
      <CartProvider>
        <div className="min-h-screen bg-background">
          {storeInfo && (
            <>
              <StoreHeader store={storeInfo} storeId={store.id} />
              <CategoryNav
                categories={categories}
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
              />
              <MobileProductGrid
                products={products}
                categories={categories}
                activeCategory={activeCategory}
                store={storeInfo}
                unavailableWhatsappEnabled={true}
              />
              <StoreFooter store={storeInfo} />
              <FooterDeveloperBadge />
              <FloatingHelpButton store={storeInfo} />
              <FloatingCart />
              <DynamicCartSheet store={storeInfo} storeId={store.id} />
              <DeveloperWatermarks />
            </>
          )}
        </div>
      </CartProvider>
    </CustomerAuthProvider>
  );
}
