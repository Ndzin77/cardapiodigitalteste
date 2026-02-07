import { useMyStore, useProducts, useCategories } from "@/hooks/useStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Tag, Eye, TrendingUp, Copy, ExternalLink, Sparkles, ArrowUpRight, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Dashboard() {
  const { data: store, isLoading: storeLoading } = useMyStore();
  const { data: products, isLoading: productsLoading } = useProducts(store?.id);
  const { data: categories, isLoading: categoriesLoading } = useCategories(store?.id);

  const storeUrl = store?.slug ? `${window.location.origin}/loja/${store.slug}` : "";

  const copyLink = () => {
    navigator.clipboard.writeText(storeUrl);
    toast.success("Link copiado para a área de transferência!");
  };

  const stats = [
    {
      title: "Produtos",
      value: products?.length ?? 0,
      icon: Package,
      gradient: "from-primary/20 to-orange-500/20",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      trend: "+12%",
    },
    {
      title: "Categorias",
      value: categories?.length ?? 0,
      icon: Tag,
      gradient: "from-accent/20 to-emerald-500/20",
      iconBg: "bg-accent/10",
      iconColor: "text-accent",
      trend: null,
    },
    {
      title: "Ativos",
      value: products?.filter(p => p.available).length ?? 0,
      icon: TrendingUp,
      gradient: "from-green-500/20 to-emerald-500/20",
      iconBg: "bg-green-500/10",
      iconColor: "text-green-600",
      trend: "+5%",
    },
    {
      title: "Destaque",
      value: products?.filter(p => p.featured).length ?? 0,
      icon: Sparkles,
      gradient: "from-yellow-500/20 to-amber-500/20",
      iconBg: "bg-yellow-500/10",
      iconColor: "text-yellow-600",
      trend: null,
    },
  ];

  if (storeLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Header */}
      <div className="animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-display flex items-center gap-2">
          <span className="text-3xl">👋</span>
          Olá!
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie sua vitrine e acompanhe seu desempenho
        </p>
      </div>

      {/* Store Link Card - Premium */}
      <Card className="relative overflow-hidden border-primary/20 shadow-soft animate-slide-up">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-accent/5" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <CardHeader className="relative p-4 sm:p-6 pb-2 sm:pb-3">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2 font-display">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Eye className="w-5 h-5 text-primary" />
            </div>
            Link da Vitrine
          </CardTitle>
          <CardDescription className="text-sm">
            Compartilhe este link com seus clientes
          </CardDescription>
        </CardHeader>
        <CardContent className="relative p-4 sm:p-6 pt-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <code className="flex-1 bg-background/80 backdrop-blur-sm rounded-xl px-4 py-3 text-sm border border-border font-medium truncate block shadow-xs">
              {storeUrl}
            </code>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={copyLink} 
                className="flex-1 sm:flex-initial h-11 rounded-xl hover:bg-primary/5 hover:border-primary/30 transition-all"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copiar
              </Button>
              <Button 
                asChild 
                className="flex-1 sm:flex-initial h-11 rounded-xl gradient-primary text-white border-0 shadow-soft hover:shadow-glow transition-all"
              >
                <a href={storeUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Abrir
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => (
          <Card 
            key={stat.title} 
            className="relative overflow-hidden hover:shadow-medium transition-all duration-300 hover:-translate-y-0.5 animate-slide-up group"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-50 group-hover:opacity-70 transition-opacity`} />
            
            <CardHeader className="relative flex flex-row items-center justify-between p-4 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2.5 rounded-xl ${stat.iconBg} transition-transform group-hover:scale-110`}>
                <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent className="relative p-4 pt-0">
              {productsLoading || categoriesLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="flex items-end gap-2">
                  <div className="text-3xl sm:text-4xl font-bold text-foreground font-display">
                    {stat.value}
                  </div>
                  {stat.trend && (
                    <span className="text-xs font-semibold text-accent flex items-center mb-1">
                      <ArrowUpRight className="w-3 h-3" />
                      {stat.trend}
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="shadow-soft animate-slide-up" style={{ animationDelay: "400ms" }}>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2 font-display">
            <BarChart3 className="w-5 h-5 text-primary" />
            Ações Rápidas
          </CardTitle>
          <CardDescription className="text-sm">
            Personalize e gerencie sua vitrine
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Button 
            variant="outline" 
            className="justify-start h-auto py-4 px-4 rounded-xl border-dashed hover:border-primary/50 hover:bg-primary/5 transition-all group" 
            asChild
          >
            <a href="/admin/products">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-sm">Adicionar Produto</div>
                <div className="text-xs text-muted-foreground">
                  Cadastre novos itens
                </div>
              </div>
            </a>
          </Button>
          
          <Button 
            variant="outline" 
            className="justify-start h-auto py-4 px-4 rounded-xl border-dashed hover:border-accent/50 hover:bg-accent/5 transition-all group" 
            asChild
          >
            <a href="/admin/categories">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                <Tag className="w-5 h-5 text-accent" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-sm">Categorias</div>
                <div className="text-xs text-muted-foreground">
                  Organize seus produtos
                </div>
              </div>
            </a>
          </Button>
          
          <Button 
            variant="outline" 
            className="justify-start h-auto py-4 px-4 rounded-xl border-dashed hover:border-primary/50 hover:bg-primary/5 transition-all group sm:col-span-2 lg:col-span-1" 
            asChild
          >
            <a href="/admin/settings">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-sm">Configurações</div>
                <div className="text-xs text-muted-foreground">
                  Personalize sua loja
                </div>
              </div>
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
