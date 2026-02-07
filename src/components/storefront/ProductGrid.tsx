import { Product, Category } from "@/types/store";
import { ProductCard } from "./ProductCard";

interface ProductGridProps {
  products: Product[];
  categories: Category[];
  activeCategory: string;
}

export function ProductGrid({ products, categories, activeCategory }: ProductGridProps) {
  const filteredProducts =
    activeCategory === "1"
      ? products.filter((p) => p.featured)
      : products.filter((p) => p.category === activeCategory);

  const categoryName =
    categories.find((c) => c.id === activeCategory)?.name || "Produtos";

  if (filteredProducts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🍽️</div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          Nenhum produto encontrado
        </h3>
        <p className="text-muted-foreground text-sm">
          Não há produtos nesta categoria no momento.
        </p>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <span>{categories.find((c) => c.id === activeCategory)?.icon}</span>
        {categoryName}
        <span className="text-sm font-normal text-muted-foreground">
          ({filteredProducts.length})
        </span>
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.map((product, index) => (
          <div
            key={product.id}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
}
