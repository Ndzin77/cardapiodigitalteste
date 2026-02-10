import { StoreInfo } from "@/types/store";
import { MapPin, Clock, Star, ChevronDown, CreditCard, ExternalLink, User, LogOut, Sparkles, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { OrderHistorySheet } from "./OrderHistorySheet";
import { CustomerAuthModal } from "./CustomerAuthModal";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";

interface StoreHeaderProps {
  store: StoreInfo;
  storeId?: string;
}

export function StoreHeader({ store, storeId }: StoreHeaderProps) {
  const [showHours, setShowHours] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { customer, logout, isLoading: authLoading } = useCustomerAuth();

  return (
    <div className="relative overflow-hidden">
      {/* Hero Cover Image with Parallax Effect */}
      <div className="relative h-56 sm:h-72 md:h-96 w-full overflow-hidden">
        <img
          src={store.coverImage}
          alt={store.name}
          className="w-full h-full object-cover scale-105 transition-transform duration-700 group-hover:scale-110"
          loading="eager"
        />
        
        {/* Cinematic gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/15 via-transparent to-accent/15" />
        
        {/* Animated blur orbs for premium feel */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/25 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-accent/25 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        
        {/* Trust badge overlay */}
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-full px-4 py-2 border border-white/20 animate-slide-down">
          <div className="w-2 h-2 rounded-full bg-accent animate-ping" />
          <span className="text-white text-sm font-medium">Loja Verificada</span>
        </div>
      </div>

      {/* Store Info Card - Premium Glass Design */}
      <div className="container relative -mt-20 sm:-mt-28 md:-mt-36 px-3 sm:px-4 z-10">
        <div className="glass rounded-2xl sm:rounded-3xl shadow-elevation p-4 sm:p-6 md:p-8 animate-slide-up border border-white/30">
          <div className="flex flex-col md:flex-row md:items-start gap-5 md:gap-6">
            
            {/* Logo with glow effect */}
            <div className="relative group mx-auto md:mx-0">
              <div className="absolute inset-0 bg-primary/30 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 rounded-xl sm:rounded-2xl bg-white flex items-center justify-center overflow-hidden shadow-strong border-3 sm:border-4 border-white/80 transition-transform duration-300 group-hover:scale-[1.02]">
                {store.logo && store.logo !== "/placeholder.svg" ? (
                  <img src={store.logo} alt={store.name} className="w-full h-full object-cover" loading="eager" />
                ) : (
                  <span className="text-5xl sm:text-6xl">🍽️</span>
                )}
              </div>
            </div>

            {/* Main Info */}
            <div className="flex-1 text-center md:text-left">
              {/* Store Name & Status */}
              <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-2 sm:gap-3 mb-2 sm:mb-3">
                <h1 className="text-xl sm:text-2xl md:text-4xl font-bold text-foreground font-display tracking-tight leading-tight">
                  {store.name}
                </h1>
                <Badge
                  className={`px-3 py-1 text-sm font-semibold ${
                    store.isOpen 
                      ? "bg-accent text-accent-foreground shadow-glow-accent animate-pulse-attention" 
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${store.isOpen ? "bg-white animate-ping" : "bg-muted-foreground"}`} />
                  {store.isOpen ? "Aberto Agora" : "Fechado"}
                </Badge>
              </div>

              {/* Customer Account */}
              <div className="flex items-center justify-center md:justify-start gap-2 mb-4 flex-wrap">
                {!authLoading && (
                  <>
                    {customer ? (
                      <div className="flex items-center gap-2 bg-secondary/80 rounded-full px-4 py-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium text-sm">{customer.name}</span>
                        {storeId && <OrderHistorySheet storeId={storeId} />}
                        <button
                          onClick={logout}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1"
                        >
                          <LogOut className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => setShowAuthModal(true)}
                        variant="outline"
                        size="sm"
                        className="rounded-full px-5 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300"
                      >
                        <User className="w-4 h-4 mr-2" />
                        Entrar / Cadastrar
                      </Button>
                    )}
                  </>
                )}
              </div>

              {/* Description */}
              <p className="text-muted-foreground text-sm md:text-base mb-4 max-w-xl line-clamp-2 text-pretty">
                {store.description}
              </p>

              {/* Stats Row - Premium badges */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-3">
                {(store.rating || store.reviewCount) && (
                  <div className="flex items-center gap-1.5 bg-warning/10 text-warning-foreground px-3 py-1.5 rounded-full">
                    <Star className="w-4 h-4 text-warning fill-warning" />
                    <span className="font-bold">{store.rating || "4.8"}</span>
                    <span className="text-muted-foreground text-sm">({store.reviewCount || 0})</span>
                  </div>
                )}

                <div className="flex items-center gap-1.5 bg-accent/10 text-accent px-3 py-1.5 rounded-full">
                  <Zap className="w-4 h-4" />
                  <span className="font-medium text-sm">{store.estimatedTime}</span>
                </div>

                {store.address && (
                  <div className="flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-full text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm truncate max-w-[150px]">{store.address.split("-")[0]}</span>
                    {store.googleMapsUrl && (
                      <a
                        href={store.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:scale-110 transition-transform"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Payment Methods */}
              {store.acceptedPayments.length > 0 && (
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-4">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  <div className="flex flex-wrap gap-1.5">
                    {store.acceptedPayments.slice(0, 4).map((payment) => (
                      <span
                        key={payment}
                        className="text-xs bg-muted/60 backdrop-blur-sm px-2.5 py-1 rounded-full text-muted-foreground font-medium"
                      >
                        {payment}
                      </span>
                    ))}
                    {store.acceptedPayments.length > 4 && (
                      <span className="text-xs text-muted-foreground">
                        +{store.acceptedPayments.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Opening Hours Toggle - Premium Neuromarketing Design */}
              <button
                onClick={() => setShowHours(!showHours)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 border border-primary/20 text-primary font-semibold hover:from-primary/15 hover:to-accent/15 hover:border-primary/30 hover:shadow-soft transition-all duration-300 group"
              >
                <div className="p-1.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="text-sm">Ver horários de funcionamento</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showHours ? "rotate-180" : ""} group-hover:scale-110`} />
              </button>

              {showHours && store.openingHours.length > 0 && (
                <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-card via-card to-secondary/30 border border-border/50 shadow-soft animate-slide-up">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground text-sm">Horários de Funcionamento</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {store.openingHours.map((schedule, idx) => {
                      const isToday = new Date().toLocaleDateString('pt-BR', { weekday: 'long' }).toLowerCase().includes(schedule.day.toLowerCase().slice(0, 3));
                      
                      return (
                        <div
                          key={schedule.day}
                          className={`relative p-3 rounded-xl transition-all duration-300 animate-scale-in overflow-hidden ${
                            schedule.isOpen
                              ? isToday 
                                ? "bg-gradient-to-br from-accent/20 to-accent/10 border-2 border-accent/40 shadow-glow-accent"
                                : "bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 hover:border-accent/40"
                              : "bg-muted/30 border border-border/50"
                          }`}
                          style={{ animationDelay: `${idx * 50}ms` }}
                        >
                          {/* Today indicator */}
                          {isToday && schedule.isOpen && (
                            <div className="absolute top-1 right-1">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                              </span>
                            </div>
                          )}
                          
                          <div className={`font-bold text-sm ${schedule.isOpen ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {schedule.day}
                            {isToday && <span className="ml-1 text-xs font-normal text-accent">(Hoje)</span>}
                          </div>
                          <div className={`mt-1 text-sm font-medium ${
                            schedule.isOpen 
                              ? 'text-accent' 
                              : 'text-muted-foreground'
                          }`}>
                            {schedule.isOpen ? (
                              schedule.hours.includes('/') ? (
                                <div className="flex flex-col gap-0.5">
                                  {schedule.hours.split('/').map((period, i) => (
                                    <span key={i} className="text-xs">{period.trim()}</span>
                                  ))}
                                </div>
                              ) : (
                                schedule.hours || "Fechado"
                              )
                            ) : (
                              <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></span>
                                Fechado
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Delivery Info Card - Desktop */}
            <div className="hidden md:block shrink-0">
              <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 rounded-2xl p-5 border border-primary/10 min-w-[180px]">
                {store.deliveryEnabled !== false && (
                  <div className="mb-4">
                    <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Taxa de entrega</div>
                    <div className="text-2xl font-bold text-foreground">
                      {store.deliveryFee === 0 ? (
                        <span className="text-accent flex items-center gap-1">
                          <Sparkles className="w-5 h-5" />
                          Grátis
                        </span>
                      ) : (
                        `R$ ${store.deliveryFee.toFixed(2).replace(".", ",")}`
                      )}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Pedido mínimo</div>
                  <div className="text-lg font-bold text-foreground">
                    R$ {store.minOrder.toFixed(2).replace(".", ",")}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Delivery Info */}
          <div className="md:hidden mt-4 grid grid-cols-2 gap-2 sm:gap-3">
            {store.deliveryEnabled !== false && (
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-4 border border-primary/10">
                <div className="text-xs text-muted-foreground mb-1">Taxa de entrega</div>
                <div className="text-lg font-bold text-foreground">
                  {store.deliveryFee === 0 ? (
                    <span className="text-accent flex items-center gap-1">
                      <Sparkles className="w-4 h-4" />
                      Grátis
                    </span>
                  ) : (
                    `R$ ${store.deliveryFee.toFixed(2).replace(".", ",")}`
                  )}
                </div>
              </div>
            )}
            <div className={`bg-gradient-to-br from-accent/5 to-accent/10 rounded-xl p-4 border border-accent/10 ${store.deliveryEnabled === false ? "col-span-2" : ""}`}>
              <div className="text-xs text-muted-foreground mb-1">Pedido mínimo</div>
              <div className="text-lg font-bold text-foreground">
                R$ {store.minOrder.toFixed(2).replace(".", ",")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Auth Modal */}
      {storeId && (
        <CustomerAuthModal
          open={showAuthModal}
          onOpenChange={setShowAuthModal}
          storeId={storeId}
        />
      )}
    </div>
  );
}
