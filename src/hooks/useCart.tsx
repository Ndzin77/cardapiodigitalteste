import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { CartItem, Product } from "@/types/store";
import { toast } from "sonner";

// Extended product type that includes stock info
interface ProductWithStock extends Product {
  stockEnabled?: boolean;
  stockQuantity?: number | null;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: ProductWithStock, quantity?: number, notes?: string) => void;
  removeItem: (productId: string, notes?: string) => void;
  updateQuantity: (productId: string, quantity: number, notes?: string) => void;
  updateNotes: (productId: string, notes: string) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "vitrine-cart";

// Helper to load cart from localStorage
function loadCartFromStorage(): CartItem[] {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load cart from localStorage:", e);
  }
  return [];
}

// Helper to save cart to localStorage
function saveCartToStorage(items: CartItem[]) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn("Failed to save cart to localStorage:", e);
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => loadCartFromStorage());
  const [isOpen, setIsOpen] = useState(false);

  // Persist cart to localStorage whenever items change
  useEffect(() => {
    saveCartToStorage(items);
  }, [items]);

  // Helper to check stock limit
  const getMaxQuantity = (product: ProductWithStock): number | null => {
    if (product.stockEnabled && typeof product.stockQuantity === "number") {
      return product.stockQuantity;
    }
    return null; // No limit
  };

  // Get total quantity of a product already in cart (across all variations)
  const getCartQuantityForProduct = (productId: string): number => {
    return items
      .filter((item) => item.product.id === productId)
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  const addItem = (product: ProductWithStock, quantity?: number, notes?: string) => {
    const initialQty = quantity ?? product.minQuantity ?? 1;
    const maxQty = getMaxQuantity(product);
    const currentInCart = getCartQuantityForProduct(product.id);
    
    // Check stock limit
    if (maxQty !== null) {
      const totalAfterAdd = currentInCart + initialQty;
      if (totalAfterAdd > maxQty) {
        const canAdd = maxQty - currentInCart;
        if (canAdd <= 0) {
          toast.error(`Estoque esgotado! Máximo: ${maxQty} unidades.`, {
            duration: 3000,
            position: "bottom-center",
          });
          return;
        }
        toast.warning(`Apenas ${canAdd} unidades disponíveis em estoque.`, {
          duration: 3000,
          position: "bottom-center",
        });
        // Add only what's available
        setItems((prev) => {
          const itemKey = notes ? `${product.id}-${notes}` : product.id;
          const existing = prev.find((item) => {
            const existingKey = item.notes ? `${item.product.id}-${item.notes}` : item.product.id;
            return existingKey === itemKey;
          });
          
          if (existing) {
            return prev.map((item) => {
              const existingItemKey = item.notes ? `${item.product.id}-${item.notes}` : item.product.id;
              return existingItemKey === itemKey
                ? { ...item, quantity: item.quantity + canAdd }
                : item;
            });
          }
          return [...prev, { product, quantity: canAdd, notes }];
        });
        return;
      }
    }

    setItems((prev) => {
      // For customizable products with notes, treat each unique combination as a distinct item
      // Use product.id + notes as unique key to differentiate same product with different options
      const itemKey = notes ? `${product.id}-${notes}` : product.id;
      const existing = prev.find((item) => {
        const existingKey = item.notes ? `${item.product.id}-${item.notes}` : item.product.id;
        return existingKey === itemKey;
      });
      
      if (existing) {
        return prev.map((item) => {
          const existingItemKey = item.notes ? `${item.product.id}-${item.notes}` : item.product.id;
          return existingItemKey === itemKey
            ? { ...item, quantity: item.quantity + initialQty }
            : item;
        });
      }
      return [...prev, { product, quantity: initialQty, notes }];
    });
    toast.success(`${product.name} adicionado ao carrinho!`, {
      duration: 2000,
      position: "bottom-center",
    });
  };

  const removeItem = (productId: string, notes?: string) => {
    setItems((prev) => prev.filter((item) => {
      const itemKey = item.notes ? `${item.product.id}-${item.notes}` : item.product.id;
      const targetKey = notes ? `${productId}-${notes}` : productId;
      return itemKey !== targetKey;
    }));
  };

  const updateQuantity = (productId: string, quantity: number, notes?: string) => {
    if (quantity <= 0) {
      removeItem(productId, notes);
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        const itemKey = item.notes ? `${item.product.id}-${item.notes}` : item.product.id;
        const targetKey = notes ? `${productId}-${notes}` : productId;
        if (itemKey !== targetKey) return item;

        // Enforce product minimum quantity (when set) for any positive quantity update
        const minQty = item.product.minQuantity ?? 1;
        let nextQty = Math.max(minQty, quantity);

        // Enforce stock maximum
        const productWithStock = item.product as ProductWithStock;
        if (productWithStock.stockEnabled && typeof productWithStock.stockQuantity === "number") {
          // Calculate total for this product across all cart items (excluding current item)
          const otherItemsQty = prev
            .filter((i) => i.product.id === productId && i !== item)
            .reduce((sum, i) => sum + i.quantity, 0);
          
          const maxForThisItem = productWithStock.stockQuantity - otherItemsQty;
          if (nextQty > maxForThisItem) {
            nextQty = Math.max(minQty, maxForThisItem);
            toast.warning(`Estoque limitado a ${productWithStock.stockQuantity} unidades.`, {
              duration: 2000,
              position: "bottom-center",
            });
          }
        }

        return { ...item, quantity: nextQty };
      })
    );
  };

  const updateNotes = (productId: string, notes: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, notes } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        updateNotes,
        clearCart,
        totalItems,
        subtotal,
        isOpen,
        setIsOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
