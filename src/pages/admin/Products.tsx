import { useState } from "react";
import { useMyStore, useProducts, useCategories, useCreateProduct, useUpdateProduct, useDeleteProduct, DbProduct } from "@/hooks/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Plus, Pencil, Trash2, Star, Package, Settings2, Search } from "lucide-react";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { ProductOptionsEditor, ProductOption } from "@/components/admin/ProductOptionsEditor";

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  original_price: string;
  image_url: string;
  category_id: string;
  available: boolean;
  featured: boolean;
  min_order_quantity: string;
  has_options: boolean;
  options: ProductOption[];
  stock_enabled: boolean;
  stock_quantity: string;
}

const defaultFormData: ProductFormData = {
  name: "",
  description: "",
  price: "",
  original_price: "",
  image_url: "",
  category_id: "",
  available: true,
  featured: false,
  min_order_quantity: "1",
  has_options: false,
  options: [],
  stock_enabled: false,
  stock_quantity: "",
};

export default function Products() {
  const { data: store } = useMyStore();
  const { data: products, isLoading } = useProducts(store?.id);
  const { data: categories } = useCategories(store?.id);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DbProduct | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(defaultFormData);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter products by search query
  const filteredProducts = products?.filter((product) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      product.description?.toLowerCase().includes(query) ||
      getCategoryName(product.category_id).toLowerCase().includes(query)
    );
  }) ?? [];

  const resetForm = () => {
    setFormData(defaultFormData);
    setEditingProduct(null);
  };

  const openEditDialog = (product: DbProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      original_price: product.original_price?.toString() || "",
      image_url: product.image_url || "",
      category_id: product.category_id || "",
      available: product.available ?? true,
      featured: product.featured ?? false,
      min_order_quantity: (product as any).min_order_quantity?.toString() || "1",
      has_options: (product as any).has_options || false,
      options: ((product as any).options as ProductOption[]) || [],
      stock_enabled: (product as any).stock_enabled || false,
      stock_quantity: (product as any).stock_quantity?.toString() || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;

    // Calculate availability based on stock if enabled
    const stockQty = formData.stock_enabled && formData.stock_quantity ? parseInt(formData.stock_quantity) : null;
    const computedAvailable = formData.stock_enabled && stockQty !== null ? stockQty > 0 : formData.available;

    const productData = {
      store_id: store.id,
      name: formData.name,
      description: formData.description || null,
      price: parseFloat(formData.price),
      original_price: formData.original_price ? parseFloat(formData.original_price) : null,
      image_url: formData.image_url || null,
      category_id: formData.category_id || null,
      available: computedAvailable,
      featured: formData.featured,
      sort_order: products?.length || 0,
      min_order_quantity: parseInt(formData.min_order_quantity) || 1,
      has_options: formData.has_options,
      options: formData.has_options ? formData.options : [],
      stock_enabled: formData.stock_enabled,
      stock_quantity: stockQty,
    };

    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({ id: editingProduct.id, ...productData });
      } else {
        await createProduct.mutateAsync(productData);
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving product:", error);
    }
  };

  const handleDelete = async (product: DbProduct) => {
    if (!store) return;
    await deleteProduct.mutateAsync({ id: product.id, storeId: store.id });
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "Sem categoria";
    return categories?.find((c) => c.id === categoryId)?.name || "Sem categoria";
  };

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40 sm:h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Produtos</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus produtos</p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[95vh] sm:max-h-[90vh] p-0 mx-2 sm:mx-auto">
            <DialogHeader className="p-4 sm:p-6 pb-0">
              <DialogTitle className="text-base sm:text-lg">{editingProduct ? "Editar Produto" : "Novo Produto"}</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                {editingProduct ? "Atualize as informações" : "Preencha os dados"}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[calc(95vh-120px)] sm:max-h-[calc(90vh-140px)]">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-3 sm:pt-4">
                {/* Basic Info */}
                <div className="space-y-4">
                  <ImageUpload
                    value={formData.image_url}
                    onChange={(url) => setFormData({ ...formData, image_url: url })}
                    label="Foto do Produto"
                    folder="products"
                    aspectRatio="video"
                  />

                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm">Nome *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: X-Burger Especial"
                      required
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm">Descrição</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descreva seu produto..."
                      rows={2}
                      className="text-sm"
                    />
                  </div>

                  {/* Prices - responsive grid */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price" className="text-xs sm:text-sm">Preço (R$) *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="29.90"
                        required
                        className="h-10 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="original_price" className="text-xs sm:text-sm">Preço Orig.</Label>
                      <Input
                        id="original_price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.original_price}
                        onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                        placeholder="39.90"
                        className="h-10 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="min_order" className="text-xs sm:text-sm">Qtd. Mín.</Label>
                      <Input
                        id="min_order"
                        type="number"
                        min="1"
                        value={formData.min_order_quantity}
                        onChange={(e) => setFormData({ ...formData, min_order_quantity: e.target.value })}
                        placeholder="1"
                        className="h-10 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-sm">Categoria</Label>
                    <Select
                      value={formData.category_id || "__none__"}
                      onValueChange={(value) => setFormData({ ...formData, category_id: value === "__none__" ? "" : value })}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Sem categoria</SelectItem>
                        {categories?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.icon} {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Toggles - mobile optimized */}
                  <div className="space-y-3 p-3 rounded-lg bg-secondary/50">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <Switch
                          id="available"
                          checked={formData.available}
                          onCheckedChange={(checked) => setFormData({ ...formData, available: checked })}
                          disabled={formData.stock_enabled}
                        />
                        <Label htmlFor="available" className="text-sm">
                          Disponível {formData.stock_enabled && <span className="text-xs text-muted-foreground">(automático)</span>}
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="featured"
                          checked={formData.featured}
                          onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                        />
                        <Label htmlFor="featured" className="text-sm">Destaque</Label>
                      </div>
                    </div>
                    
                    {/* Stock Control */}
                    <Separator className="my-2" />
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          id="stock_enabled"
                          checked={formData.stock_enabled}
                          onCheckedChange={(checked) => setFormData({ ...formData, stock_enabled: checked })}
                        />
                        <Label htmlFor="stock_enabled" className="text-sm">Controlar Estoque</Label>
                      </div>
                      {formData.stock_enabled && (
                        <div className="space-y-2 pl-1">
                          <Label htmlFor="stock_quantity" className="text-xs text-muted-foreground">
                            Quantidade em estoque (0 = indisponível automaticamente)
                          </Label>
                          <Input
                            id="stock_quantity"
                            type="number"
                            min="0"
                            value={formData.stock_quantity}
                            onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                            placeholder="Ex: 50"
                            className="h-10 text-sm w-32"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Product Options */}
                <ProductOptionsEditor
                  options={formData.options}
                  onChange={(options) => setFormData({ ...formData, options })}
                  hasOptions={formData.has_options}
                  onHasOptionsChange={(hasOptions) =>
                    setFormData({
                      ...formData,
                      has_options: hasOptions,
                      options: hasOptions && formData.options.length === 0
                        ? [{ name: "", required: false, max_select: 1, min_select: 0, choices: [{ name: "", price_modifier: 0 }] }]
                        : formData.options,
                    })
                  }
                />

                <DialogFooter className="pt-4 flex-col gap-2 sm:flex-row">
                  <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending} className="w-full sm:w-auto">
                    {editingProduct ? "Salvar" : "Criar Produto"}
                  </Button>
                </DialogFooter>
              </form>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por nome, descrição ou categoria..."
          className="pl-10 h-10"
        />
      </div>

      {filteredProducts.length === 0 ? (
        <Card className="py-8 sm:py-12">
          <CardContent className="text-center">
            <Package className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-base sm:text-lg font-medium mb-2">
              {searchQuery ? "Nenhum produto encontrado" : "Nenhum produto"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery ? `Nenhum resultado para "${searchQuery}"` : "Adicione seu primeiro produto"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-video bg-muted relative">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl sm:text-4xl">🍽️</div>
                )}
                <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                  {product.featured && (
                    <Badge className="bg-accent text-accent-foreground text-xs">
                      <Star className="w-3 h-3 mr-1" />
                      Destaque
                    </Badge>
                  )}
                  {(product as any).has_options && (
                    <Badge variant="outline" className="bg-background/80 text-xs">
                      <Settings2 className="w-3 h-3 mr-1" />
                      Opções
                    </Badge>
                  )}
                </div>
                <Badge 
                  variant={product.available ? "default" : "secondary"} 
                  className={`absolute top-2 right-2 text-xs ${product.available ? "bg-success hover:bg-success/90" : ""}`}
                >
                  {product.available ? "Disponível" : "Indisponível"}
                </Badge>
                {(product as any).stock_enabled && (
                  <Badge variant="outline" className="absolute bottom-2 right-2 text-xs bg-background/80">
                    Estoque: {(product as any).stock_quantity ?? 0}
                  </Badge>
                )}
              </div>
              <CardHeader className="p-3 sm:p-4 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-sm sm:text-base line-clamp-1">{product.name}</CardTitle>
                    <CardDescription className="text-xs">{getCategoryName(product.category_id)}</CardDescription>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-primary text-sm sm:text-base">R$ {product.price.toFixed(2).replace(".", ",")}</div>
                    {product.original_price && (
                      <div className="text-xs text-muted-foreground line-through">
                        R$ {product.original_price.toFixed(2).replace(".", ",")}
                      </div>
                    )}
                  </div>
                </div>
                {(product as any).min_order_quantity > 1 && (
                  <Badge variant="outline" className="w-fit text-xs mt-1">
                    Mín: {(product as any).min_order_quantity} un.
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-3 sm:mb-4">
                  {product.description || "Sem descrição"}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 h-9 text-xs sm:text-sm" onClick={() => openEditDialog(product)}>
                    <Pencil className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    Editar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 h-9 w-9 p-0">
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="mx-4 sm:mx-auto max-w-md">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-base sm:text-lg">Excluir produto?</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm">
                          Essa ação não pode ser desfeita. O produto "{product.name}" será removido.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
                        <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(product)}
                          className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
