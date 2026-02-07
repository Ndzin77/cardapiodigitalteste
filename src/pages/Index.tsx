import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Store, ArrowRight, Sparkles, ShoppingBag, Smartphone, CheckCircle2 } from "lucide-react";
import { DemoStorefront } from "@/components/landing/DemoStorefront";
import { DeveloperWatermarks, FooterDeveloperBadge } from "@/components/DeveloperWatermark";

export default function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background overflow-hidden">
      {/* Hero Section */}
      <div className="container py-8 md:py-16 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-6 animate-slide-up order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              Vitrine digital para seu negócio
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground leading-tight">
              Crie sua{" "}
              <span className="text-primary bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                vitrine online
              </span>{" "}
              em minutos
            </h1>
            
            <p className="text-base md:text-lg text-muted-foreground max-w-lg">
              A plataforma perfeita para microempreendedores e restaurantes 
              exibirem seus produtos, receberem pedidos pelo WhatsApp e 
              aumentarem suas vendas.
            </p>
            
            {/* Benefits */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                "Sem taxa por pedido",
                "Pedidos via WhatsApp",
                "Controle de estoque",
                "Personalização total",
              ].map((benefit) => (
                <div key={benefit} className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button size="lg" asChild className="gap-2 h-12 px-6 text-base">
                <Link to="/auth">
                  Começar Grátis
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-12 px-6 text-base">
                <Link to="/loja/sweets">
                  Ver Loja Real
                </Link>
              </Button>
            </div>
          </div>
          
          {/* Right - Demo Storefront */}
          <div className="relative animate-scale-in order-1 lg:order-2">
            {/* Glow effects */}
            <div className="absolute -top-10 -right-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl opacity-50" />
            <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-accent/20 rounded-full blur-3xl opacity-50" />
            
            {/* Demo Component */}
            <div className="relative z-10">
              <DemoStorefront />
            </div>
            
            {/* Floating badge */}
            <div className="absolute -top-4 -right-4 z-20 bg-card px-3 py-1.5 rounded-full shadow-lg border border-border text-sm font-medium text-foreground animate-bounce">
              ✨ Demo Interativa
            </div>
          </div>
        </div>
      </div>
      
      {/* Features */}
      <div className="container py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Tudo que você precisa
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Uma plataforma completa para gerenciar seu negócio online
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-card rounded-2xl p-6 shadow-soft hover:shadow-medium transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <Store className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Painel Completo
            </h3>
            <p className="text-muted-foreground text-sm">
              Gerencie produtos, categorias, preços e informações da sua loja 
              em um painel intuitivo.
            </p>
          </div>
          
          <div className="bg-card rounded-2xl p-6 shadow-soft hover:shadow-medium transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
              <ShoppingBag className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Carrinho Inteligente
            </h3>
            <p className="text-muted-foreground text-sm">
              Seus clientes podem montar o pedido e finalizar diretamente 
              pelo WhatsApp.
            </p>
          </div>
          
          <div className="bg-card rounded-2xl p-6 shadow-soft hover:shadow-medium transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <Smartphone className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Mobile First
            </h3>
            <p className="text-muted-foreground text-sm">
              Design otimizado para celular, onde a maioria dos seus 
              clientes vai acessar.
            </p>
          </div>
        </div>
      </div>
      
      {/* CTA */}
      <div className="container py-16">
        <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-3xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Pronto para começar?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Acesse o painel e comece a personalizar sua vitrine agora mesmo.
          </p>
          <Button size="lg" asChild>
            <Link to="/auth">
              Acessar Painel
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="container py-8 border-t">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">Vitrine SaaS</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 Vitrine SaaS. Todos os direitos reservados.
          </p>
        </div>
      </footer>
      
      {/* Developer Badge - at very bottom */}
      <FooterDeveloperBadge />
      
      <DeveloperWatermarks />
    </div>
  );
}
