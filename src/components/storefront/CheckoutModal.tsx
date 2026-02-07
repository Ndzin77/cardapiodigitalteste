import { useCart } from "@/hooks/useCart";
import { useCreateOrder } from "@/hooks/useOrders";
import { saveCustomerInfo, loadCustomerInfo } from "@/hooks/useCustomerOrders";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { StoreInfo } from "@/types/store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState, useEffect } from "react";
import { MessageCircle, CreditCard, Banknote, QrCode, CheckCircle2, Loader2, User, ClipboardList, Eye, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { applyWhatsAppTemplate, clampText, encodeWhatsAppText, sanitizeWhatsAppNumber } from "@/lib/whatsappTemplates";

interface CheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store: StoreInfo;
  storeId: string;
}

export function CheckoutModal({ open, onOpenChange, store, storeId }: CheckoutModalProps) {
  const { items, subtotal, clearCart, setIsOpen } = useCart();
  const createOrder = useCreateOrder();
  const { customer, register, isLoading: authLoading } = useCustomerAuth();
  const [step, setStep] = useState<"form" | "success" | "register-prompt">("form");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerPassword, setRegisterPassword] = useState("");
  const [savedCustomerPhone, setSavedCustomerPhone] = useState("");
  const [savedCustomerName, setSavedCustomerName] = useState("");
  
  const deliveryEnabled = store.deliveryEnabled ?? true;
  const pickupEnabled = store.pickupEnabled ?? true;
  const hasDeliveryChoice = deliveryEnabled && pickupEnabled;
  const onlyPickup = !deliveryEnabled && pickupEnabled;

  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">(
    onlyPickup ? "pickup" : "delivery",
  );
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    complement: "",
    paymentMethod: "pix",
    change: "",
    observations: "",
  });

  // Load saved customer info on mount
  useEffect(() => {
    const saved = loadCustomerInfo();
    if (saved) {
      setFormData((prev) => ({
        ...prev,
        name: saved.name || prev.name,
        phone: saved.phone || prev.phone,
      }));
    }
  }, []);

  const deliveryFee = store.deliveryFee;
  const effectiveDeliveryFee = deliveryType === "delivery" ? deliveryFee : 0;
  const total = subtotal + effectiveDeliveryFee;

  const formatBRL = (value: number) => `R$ ${value.toFixed(2).replace(".", ",")}`;
  const parseBRLNumber = (raw: string) => {
    const clean = String(raw || "")
      .replace(/\s/g, "")
      .replace(/\./g, "")
      .replace(/,/g, ".")
      .replace(/[^0-9.]/g, "");
    const n = Number(clean);
    return Number.isFinite(n) ? n : 0;
  };

  const cashGiven = formData.paymentMethod === "cash" ? parseBRLNumber(formData.change) : 0;
  const changeToBring = formData.paymentMethod === "cash" && cashGiven > 0 ? Math.max(0, cashGiven - total) : 0;

  const buildOrderVars = () => {
    const itemsList = items
      .map((item) => {
        let line = `• ${item.quantity}x ${item.product.name} - R$ ${(item.product.price * item.quantity)
          .toFixed(2)
          .replace(".", ",")}`;
        if (item.notes) {
          line += `\n  _${item.notes}_`;
        }
        return line;
      })
      .join("\n");

    return {
      loja_nome: store.name,
      cliente_nome: formData.name,
      cliente_whatsapp: formData.phone,
      endereco:
        deliveryType === "delivery"
          ? formData.address
          : store.address
            ? `Retirada na loja: ${store.address}`
            : "Retirada na loja",
      complemento: formData.complement,
      produtos: itemsList,
      subtotal: formatBRL(subtotal),
      taxa_entrega: formatBRL(effectiveDeliveryFee),
      total: formatBRL(total),
      link_pagamento: store.checkoutLink || "",
      troco_para: formData.paymentMethod === "cash" && cashGiven > 0 ? formatBRL(cashGiven) : "",
      troco_levar: formData.paymentMethod === "cash" && cashGiven > 0 ? formatBRL(changeToBring) : "",
    };
  };

  const buildDefaultOrderMessage = () => {
    const vars = buildOrderVars();

    const paymentLabels: Record<string, string> = {
      pix: "PIX",
      credit: "Cartão de Crédito",
      debit: "Cartão de Débito",
      cash: "Dinheiro",
    };

    const header = `*Novo Pedido*`;
    const customerBlock =
      `*${vars.loja_nome}*\n\n` +
      `*Cliente:* ${vars.cliente_nome}\n` +
      `*Telefone:* ${vars.cliente_whatsapp}\n` +
      `*Endereço:* ${vars.endereco}${vars.complemento ? ` (${vars.complemento})` : ""}`;

    const itemsBlock = `*Itens do Pedido:*\n${vars.produtos}`;
    const totalsBlock =
      `*Subtotal:* ${vars.subtotal}\n` +
      `*Taxa de Entrega:* ${vars.taxa_entrega}\n` +
      `*Total:* ${vars.total}`;

    const paymentBlock =
      `*Forma de Pagamento:* ${paymentLabels[formData.paymentMethod] || formData.paymentMethod}` +
      (formData.paymentMethod === "cash" && cashGiven > 0
        ? ` (Troco para ${formatBRL(cashGiven)} — Levar ${formatBRL(changeToBring)})`
        : "");

    const notesBlock = formData.observations ? `*Observações:* ${formData.observations}` : "";

    const checkoutBlock = store.checkoutLink
      ? `*Link de Pagamento:* ${store.checkoutLink}\nPor favor, efetue o pagamento e nos envie o comprovante.`
      : "";

    return [header, customerBlock, itemsBlock, totalsBlock, paymentBlock, notesBlock, checkoutBlock]
      .filter(Boolean)
      .join("\n\n");
  };

  const generateWhatsAppMessage = () => {
    const template = (store.whatsappMessage || "").trim();
    const vars = buildOrderVars();

    // If the store provided a template, we render *only* that (so it's fully customizable).
    // Otherwise, we use our structured default.
    const rendered = template ? applyWhatsAppTemplate(template, vars) : buildDefaultOrderMessage();

    // Basic safety limits (avoid huge URL payloads)
    return encodeWhatsAppText(clampText(rendered, 3500));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const needsAddress = deliveryType === "delivery";
    if (!formData.name || !formData.phone || (needsAddress && !formData.address)) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    setIsSubmitting(true);

    try {
      const computedCashNote =
        formData.paymentMethod === "cash" && cashGiven > 0
          ? `Troco para: ${formatBRL(cashGiven)} | Levar troco: ${formatBRL(changeToBring)}`
          : "";

      const mergedNotes =
        [formData.observations?.trim(), computedCashNote].filter(Boolean).join("\n").trim() || null;

      // Normalize phone so history/auth match consistently
      const normalizedPhone = String(formData.phone || "").replace(/\D/g, "");

      // Create order in database
      await createOrder.mutateAsync({
        store_id: storeId,
        customer_name: formData.name,
        customer_phone: normalizedPhone,
        customer_address:
          deliveryType === "delivery"
            ? formData.complement
              ? `${formData.address} (${formData.complement})`
              : formData.address
            : null,
        delivery_type: deliveryType,
        payment_method: formData.paymentMethod,
        items: items.map((item) => ({
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          unit_price: item.product.price,
          total_price: item.product.price * item.quantity,
          notes: item.notes,
        })),
        subtotal,
        delivery_fee: effectiveDeliveryFee,
        total,
        notes: mergedNotes,
        status: "pending",
      });

      // Save customer info for order history
      saveCustomerInfo({ phone: normalizedPhone, name: formData.name });
      setSavedCustomerPhone(normalizedPhone);
      setSavedCustomerName(formData.name);

      const message = generateWhatsAppMessage();
      const whatsappNumber = sanitizeWhatsAppNumber(store.whatsapp);
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;

      // Open WhatsApp immediately
      window.open(whatsappUrl, "_blank");

      // If user is not logged in, show registration prompt instead of just success
      if (!customer) {
        setStep("register-prompt");
      } else {
        setStep("success");
      }
    } catch (error) {
      console.error("Order error:", error);
      toast.error("Erro ao processar pedido. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (step === "success" || step === "register-prompt") {
      clearCart();
      setIsOpen(false);
    }
    setStep("form");
    setRegisterPassword("");
    onOpenChange(false);
  };

  const handleQuickRegister = async () => {
    if (!registerPassword || registerPassword.length < 4) {
      toast.error("A senha deve ter pelo menos 4 caracteres.");
      return;
    }
    
    setIsRegistering(true);
    try {
      const result = await register(storeId, savedCustomerPhone, savedCustomerName, registerPassword);
      if (result.success) {
        toast.success("Cadastro realizado! Agora você pode acompanhar seus pedidos.");
        setStep("success");
      } else {
        toast.error(result.error || "Erro ao cadastrar. Tente novamente.");
      }
    } catch (error) {
      console.error("Register error:", error);
      toast.error("Erro ao cadastrar. Tente novamente.");
    } finally {
      setIsRegistering(false);
    }
  };

  const skipRegistration = () => {
    setStep("success");
  };

  // Get payment options from store's accepted payments
  const acceptedLower = (store.acceptedPayments || []).map((p) => String(p || "").toLowerCase());
  const isAllEnabled = (store.acceptedPayments || []).length === 0;

  const basePayments = [
    { id: "pix", label: "PIX", icon: QrCode, enabled: acceptedLower.some((p) => p.includes("pix")) },
    {
      id: "credit",
      label: "Crédito",
      icon: CreditCard,
      enabled: acceptedLower.some((p) => p.includes("crédito") || p.includes("credito")),
    },
    {
      id: "debit",
      label: "Débito",
      icon: CreditCard,
      enabled: acceptedLower.some((p) => p.includes("débito") || p.includes("debito")),
    },
    { id: "cash", label: "Dinheiro", icon: Banknote, enabled: acceptedLower.some((p) => p.includes("dinheiro")) },
  ];

  // Custom payments created in admin (Pagamentos > Personalizadas)
  const customPayments = (store.customPayments || []).map((p) => ({
    id: p.name, // keep human-readable and consistent with acceptedPayments
    label: p.name,
    icon: CreditCard,
    enabled: isAllEnabled || acceptedLower.some((ap) => ap === String(p.name || "").toLowerCase()),
  }));

  const availablePayments = [...basePayments, ...customPayments]
    .filter((p) => isAllEnabled || p.enabled)
    .filter((p, idx, arr) => arr.findIndex((x) => x.id === p.id) === idx);

  // Default to first available or pix
  const defaultPayment = availablePayments[0]?.id || "pix";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-0 sm:p-0">
        {step === "form" ? (
          <>
            {/* Premium Header with gradient */}
            <div className="sticky top-0 z-10 bg-gradient-to-br from-primary/10 via-card to-accent/5 border-b border-border/50 p-5 backdrop-blur-sm">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-xl sm:text-2xl font-display">
                  <div className="p-2.5 rounded-xl bg-primary/10 shadow-soft">
                    <MessageCircle className="w-5 h-5 text-primary" />
                  </div>
                  <span>Finalizar Pedido</span>
                </DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground mt-2 pl-12">
                Complete seus dados para enviar via WhatsApp
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6 p-5">
              {/* Delivery / Pickup */}
              {(deliveryEnabled || pickupEnabled) && (
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">
                    Como você quer receber?
                  </h3>

                  {hasDeliveryChoice ? (
                    <RadioGroup
                      value={deliveryType}
                      onValueChange={(value) => setDeliveryType(value as "delivery" | "pickup")}
                      className="grid grid-cols-2 gap-2 sm:gap-3"
                    >
                      {[{ id: "delivery", label: "Entrega" }, { id: "pickup", label: "Retirada" }].map((opt) => (
                        <Label
                          key={opt.id}
                          htmlFor={`deliveryType-${opt.id}`}
                          className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            deliveryType === opt.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <RadioGroupItem
                            value={opt.id}
                            id={`deliveryType-${opt.id}`}
                            className="sr-only"
                          />
                          <span className="font-medium text-sm">{opt.label}</span>
                        </Label>
                      ))}
                    </RadioGroup>
                  ) : (
                    <div className="rounded-xl border border-border p-3 text-sm text-muted-foreground">
                      {onlyPickup ? "Somente retirada na loja." : "Somente entrega."}
                    </div>
                  )}
                </div>
              )}

              {/* Personal Info */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="font-semibold text-foreground text-sm sm:text-base">Seus dados</h3>

                <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm">Nome *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Seu nome"
                      required
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm">WhatsApp *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(11) 99999-9999"
                      required
                      className="h-11"
                    />
                  </div>
                </div>
              </div>

              {/* Address (only for delivery) */}
              {deliveryType === "delivery" && (
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">Endereço de entrega</h3>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm">Endereço completo *</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Rua, número, bairro"
                      required
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="complement" className="text-sm">Complemento</Label>
                    <Input
                      id="complement"
                      value={formData.complement}
                      onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                      placeholder="Apto, bloco, referência..."
                      className="h-11"
                    />
                  </div>
                </div>
              )}

              {/* Payment */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="font-semibold text-foreground text-sm sm:text-base">Forma de pagamento</h3>

                <RadioGroup
                  value={formData.paymentMethod}
                  onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                  className="grid grid-cols-2 gap-2 sm:gap-3"
                >
                  {(availablePayments.length > 0 ? availablePayments : [
                    { id: "pix", label: "PIX", icon: QrCode },
                    { id: "credit", label: "Crédito", icon: CreditCard },
                    { id: "debit", label: "Débito", icon: CreditCard },
                    { id: "cash", label: "Dinheiro", icon: Banknote },
                  ]).map((payment) => {
                    const Icon = payment.icon;
                    return (
                      <Label
                        key={payment.id}
                        htmlFor={payment.id}
                        className={`flex items-center gap-2 sm:gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          formData.paymentMethod === payment.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <RadioGroupItem value={payment.id} id={payment.id} className="sr-only" />
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                        <span className="font-medium text-sm">{payment.label}</span>
                      </Label>
                    );
                  })}
                </RadioGroup>

                {formData.paymentMethod === "cash" && (
                  <div className="space-y-2 animate-slide-up">
                    <Label htmlFor="change" className="text-sm">Troco para quanto?</Label>
                    <Input
                      id="change"
                      value={formData.change}
                      onChange={(e) => setFormData({ ...formData, change: e.target.value })}
                      placeholder="Ex: 100"
                      className="h-11"
                    />
                    <p className="text-xs text-muted-foreground">
                      {cashGiven > 0 ? (
                        <>Você vai pagar com <strong>{formatBRL(cashGiven)}</strong> — a loja deve levar <strong>{formatBRL(changeToBring)}</strong> de troco.</>
                      ) : (
                        "Digite quanto você vai pagar (ex: 100) para calcular o troco automaticamente."
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Observations */}
              <div className="space-y-2">
                <Label htmlFor="observations" className="text-sm">Observações</Label>
                <Textarea
                  id="observations"
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                  placeholder="Alguma observação sobre o pedido?"
                  rows={3}
                />
              </div>

              {/* Premium Summary Card */}
              <div className="bg-gradient-to-br from-secondary/80 via-secondary to-primary/5 rounded-2xl p-4 sm:p-5 space-y-3 border border-border/30 shadow-soft">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal ({items.length} itens)</span>
                  <span className="font-medium">R$ {subtotal.toFixed(2).replace(".", ",")}</span>
                </div>
                {deliveryType === "delivery" && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxa de entrega</span>
                    <span className="font-medium">R$ {effectiveDeliveryFee.toFixed(2).replace(".", ",")}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg sm:text-xl pt-3 border-t border-border/50">
                  <span>Total</span>
                  <span className="text-primary">R$ {total.toFixed(2).replace(".", ",")}</span>
                </div>
              </div>

              {/* Premium CTA Button */}
              <Button 
                type="submit" 
                size="lg" 
                className="w-full h-14 sm:h-16 text-base sm:text-lg font-bold gap-3 rounded-2xl gradient-primary shadow-glow hover:shadow-strong hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-5 h-5" />
                    Enviar Pedido via WhatsApp
                  </>
                )}
              </Button>
            </form>
          </>
        ) : step === "register-prompt" ? (
          /* Registration Prompt - Neuromarketing persuasive design */
          <div className="py-8 px-6 text-center animate-scale-in">
            {/* Success indicator */}
            <div className="relative inline-block mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mx-auto shadow-glow-accent">
                <CheckCircle2 className="w-10 h-10 text-accent" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary/30 animate-pulse-attention" />
            </div>
            
            <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground mb-2">
              Pedido Enviado! 🎉
            </h2>
            <p className="text-muted-foreground mb-6 text-sm">
              Seu pedido foi enviado para o WhatsApp do restaurante.
            </p>

            {/* Registration CTA Card */}
            <div className="bg-gradient-to-br from-primary/10 via-card to-accent/5 rounded-2xl p-5 border border-primary/20 shadow-soft mb-6 text-left">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/10 shrink-0">
                  <ClipboardList className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground mb-1 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-warning" />
                    Quer acompanhar seus pedidos?
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Crie uma senha rápida e acesse seu histórico de pedidos a qualquer momento. Leva só 5 segundos!
                  </p>
                  
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="quick-password" className="text-xs text-muted-foreground">
                        Crie uma senha (mínimo 4 caracteres)
                      </Label>
                      <Input
                        id="quick-password"
                        type="password"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        placeholder="••••••"
                        className="h-11"
                        onKeyDown={(e) => e.key === "Enter" && handleQuickRegister()}
                      />
                    </div>
                    
                    <Button
                      onClick={handleQuickRegister}
                      disabled={isRegistering || registerPassword.length < 4}
                      className="w-full h-12 gap-2 rounded-xl gradient-primary shadow-soft hover:shadow-medium transition-all"
                    >
                      {isRegistering ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Cadastrando...
                        </>
                      ) : (
                        <>
                          <User className="w-4 h-4" />
                          Criar Conta e Ver Pedidos
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 rounded-lg p-2">
                <Eye className="w-3.5 h-3.5 text-primary" />
                <span>Ver histórico</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 rounded-lg p-2">
                <ClipboardList className="w-3.5 h-3.5 text-primary" />
                <span>Repetir pedidos</span>
              </div>
            </div>

            {/* Skip option */}
            <button
              onClick={skipRegistration}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
            >
              Agora não, obrigado
            </button>
          </div>
        ) : (
          /* Success State - Premium celebration */
          <div className="py-12 px-6 text-center animate-scale-in">
            <div className="relative inline-block mb-8">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mx-auto shadow-glow-accent animate-float">
                <CheckCircle2 className="w-12 h-12 text-accent" />
              </div>
              {/* Celebration orbs */}
              <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary/30 animate-pulse-attention" />
              <div className="absolute -bottom-1 -left-3 w-4 h-4 rounded-full bg-accent/40 animate-float" style={{ animationDelay: '0.5s' }} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-3">
              {customer ? "Pedido Enviado! 🎉" : "Tudo Certo! 🎉"}
            </h2>
            <p className="text-muted-foreground mb-8 text-sm sm:text-base leading-relaxed max-w-sm mx-auto">
              Seu pedido foi registrado com sucesso e enviado para o WhatsApp do restaurante.
              <br />
              <span className="text-primary font-medium">Aguarde a confirmação!</span>
            </p>
            <Button 
              onClick={handleClose} 
              size="lg" 
              className="gap-3 px-8 h-12 rounded-xl gradient-primary shadow-soft hover:shadow-medium transition-all duration-300"
            >
              <CheckCircle2 className="w-5 h-5" />
              Entendido
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
