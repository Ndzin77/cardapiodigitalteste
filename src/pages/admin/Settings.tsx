import { useState, useEffect } from "react";
import { useMyStore, useUpdateStore, OpeningHour } from "@/hooks/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { Store, MapPin, Clock, CreditCard, Save, Loader2, MessageSquare, ExternalLink, Plus, Trash2, Link, MessageCircleQuestion } from "lucide-react";
import { toast } from "sonner";
import { WhatsAppTemplateEditor } from "@/components/admin/WhatsAppTemplateEditor";
import {
  THEME_PRESETS,
  type StoreThemePresetId,
  parseThemeColorField,
  serializeThemeConfig,
  applyThemeToDocument,
} from "@/lib/storeTheme";

interface CustomPayment {
  id: string;
  name: string;
  description?: string;
}

const defaultOpeningHours: OpeningHour[] = [
  { day: "Segunda", hours: "08:00 - 18:00", isOpen: true },
  { day: "Terça", hours: "08:00 - 18:00", isOpen: true },
  { day: "Quarta", hours: "08:00 - 18:00", isOpen: true },
  { day: "Quinta", hours: "08:00 - 18:00", isOpen: true },
  { day: "Sexta", hours: "08:00 - 18:00", isOpen: true },
  { day: "Sábado", hours: "08:00 - 14:00", isOpen: true },
  { day: "Domingo", hours: "", isOpen: false },
];

const quickPaymentOptions = [
  { id: "pix", name: "Pix", icon: "💳" },
  { id: "credito", name: "Cartão de Crédito", icon: "💳" },
  { id: "debito", name: "Cartão de Débito", icon: "💳" },
  { id: "dinheiro", name: "Dinheiro", icon: "💵" },
  { id: "vale_refeicao", name: "Vale Refeição", icon: "🎫" },
  { id: "vale_alimentacao", name: "Vale Alimentação", icon: "🎫" },
];

export default function Settings() {
  const { data: store, isLoading } = useMyStore();
  const updateStore = useUpdateStore();

  const [advancedHoursDays, setAdvancedHoursDays] = useState<Record<string, boolean>>({});

  // Check if a time string contains multiple intervals (e.g., "08:00 - 12:00 / 14:00 - 18:00")
  const hasMultipleIntervals = (raw: string): boolean => {
    return raw.includes('/');
  };

  const parseSimpleRange = (raw: string): { open: string; close: string } | null => {
    // Accepts: "08:00 - 18:00" (spaces optional)
    const match = raw.trim().match(/^(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})$/);
    if (!match) return null;
    return { open: match[1], close: match[2] };
  };

  const formatSimpleRange = (open: string, close: string) => {
    if (!open && !close) return "";
    if (!open || !close) return "";
    return `${open} - ${close}`;
  };

  const updateSimpleTime = (index: number, part: "open" | "close", value: string) => {
    setFormData((prev) => {
      const current = prev.opening_hours[index];
      const parsed = parseSimpleRange(current.hours);
      const open = part === "open" ? value : parsed?.open || "";
      const close = part === "close" ? value : parsed?.close || "";

      const nextHours = formatSimpleRange(open, close) || current.hours;
      return {
        ...prev,
        opening_hours: prev.opening_hours.map((h, i) => (i === index ? { ...h, hours: nextHours } : h)),
      };
    });
  };

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    logo_url: "",
    cover_image_url: "",
    address: "",
    google_maps_url: "",
    phone: "",
    whatsapp: "",
    whatsapp_message: "",
    instagram: "",
    delivery_fee: "0",
    min_order: "0",
    estimated_time: "30-45 min",
    is_open: true,
    theme_color: "#f97316",
    accepted_payments: [] as string[],
    opening_hours: defaultOpeningHours,
    rating: "4.8",
    review_count: "0",
    checkout_link: "",
    custom_payments: [] as CustomPayment[],
    help_button_enabled: true,
    help_button_message: "",
  });

  const [themePreset, setThemePreset] = useState<StoreThemePresetId>("pizzaria");
  const [themeAccent, setThemeAccent] = useState("#22c55e");
  const [themeFontHeading, setThemeFontHeading] = useState("Plus Jakarta Sans");
  const [themeFontBody, setThemeFontBody] = useState("Plus Jakarta Sans");
  const [useCustomHeadingFont, setUseCustomHeadingFont] = useState(false);
  const [useCustomBodyFont, setUseCustomBodyFont] = useState(false);

  const [deliveryEnabled, setDeliveryEnabled] = useState(true);
  const [pickupEnabled, setPickupEnabled] = useState(true);

  const [newPaymentName, setNewPaymentName] = useState("");

  const ORDER_TEMPLATES = [
    {
      id: "curto",
      name: "Curto (rápido)",
      template:
        "*Novo Pedido*\n\nCliente: {cliente_nome}\nEndereço: {endereco} {complemento}\n\nItens:\n{produtos}\n\nTotal: {total}",
    },
    {
      id: "detalhado",
      name: "Detalhado (profissional)",
      template:
        "*Novo Pedido* — *{loja_nome}*\n\n*Cliente:* {cliente_nome}\n*WhatsApp:* {cliente_whatsapp}\n*Entrega:* {endereco} {complemento}\n\n*Itens:*\n{produtos}\n\n*Subtotal:* {subtotal}\n*Entrega:* {taxa_entrega}\n*Total:* {total}\n\nSe precisar alterar algo, me avise por aqui.",
    },
    {
      id: "pagamento",
      name: "Com pagamento",
      template:
        "*Novo Pedido* — *{loja_nome}*\n\n{cliente_nome}\n{endereco} {complemento}\n\n*Itens:*\n{produtos}\n\n*Total:* {total}\n\n*Link de pagamento:* {link_pagamento}\n(Se o link estiver vazio, me avise que eu envio outra forma.)",
    },
  ] as const;

  const HELP_TEMPLATES = [
    {
      id: "padrao",
      name: "Dúvida (simples)",
      template: "Olá! Tenho uma dúvida. Pode me ajudar?",
    },
    {
      id: "cardapio",
      name: "Sobre o cardápio",
      template: "Olá! Vim pela vitrine da {loja_nome} ({loja_link}). Tenho uma dúvida sobre o cardápio.",
    },
    {
      id: "prazo",
      name: "Entrega/prazo",
      template: "Olá! Vim pela vitrine da {loja_nome}. Qual o prazo de entrega hoje?",
    },
  ] as const;

  useEffect(() => {
    if (store) {
      const themeParsed = parseThemeColorField((store as any).theme_color);
      const config = themeParsed.config;
      const legacyHex = themeParsed.legacyHex;
      const presetFromConfig = (config?.preset as StoreThemePresetId | undefined) || "pizzaria";
      const presetDefaults = THEME_PRESETS[presetFromConfig];

      // Use the config's primary color if available, otherwise use preset default
      const primaryColor = config?.primary || presetDefaults.primary || legacyHex || "#f97316";

      const openingHoursFromDb = (store.opening_hours as OpeningHour[] | null | undefined) || [];
      
      // Detect which days have multiple intervals and set them to advanced mode
      const advancedDays: Record<string, boolean> = {};
      openingHoursFromDb.forEach((h) => {
        if (h.hours && hasMultipleIntervals(h.hours)) {
          advancedDays[h.day] = true;
        }
      });
      setAdvancedHoursDays(advancedDays);
      
      setFormData({
        name: store.name || "",
        slug: store.slug || "",
        description: store.description || "",
        logo_url: store.logo_url || "",
        cover_image_url: store.cover_image_url || "",
        address: store.address || "",
        google_maps_url: (store as any).google_maps_url || "",
        phone: store.phone || "",
        whatsapp: store.whatsapp || "",
        whatsapp_message: (store as any).whatsapp_message || "",
        instagram: store.instagram || "",
        delivery_fee: store.delivery_fee?.toString() || "0",
        min_order: store.min_order?.toString() || "0",
        estimated_time: store.estimated_time || "30-45 min",
        is_open: store.is_open ?? true,
        // Use the calculated primary color (from config or preset default)
        theme_color: primaryColor,
        accepted_payments: store.accepted_payments || [],
        opening_hours: openingHoursFromDb.length > 0 ? openingHoursFromDb : defaultOpeningHours,
        rating: (store as any).rating?.toString() || "4.8",
        review_count: (store as any).review_count?.toString() || "0",
        checkout_link: (store as any).checkout_link || "",
        custom_payments: ((store as any).custom_payments as CustomPayment[]) || [],
        help_button_enabled: (store as any).help_button_enabled ?? true,
        help_button_message: (store as any).help_button_message || "",
      });

      setThemePreset(presetFromConfig);
      setThemeAccent(config?.accent || presetDefaults.accent || "#22c55e");
      setThemeFontHeading(config?.fontHeading || presetDefaults.fontHeading || "Plus Jakarta Sans");
      setThemeFontBody(config?.fontBody || presetDefaults.fontBody || "Plus Jakarta Sans");
      setDeliveryEnabled(config?.deliveryEnabled ?? true);
      setPickupEnabled(config?.pickupEnabled ?? true);
      setUseCustomHeadingFont(false);
      setUseCustomBodyFont(false);
    }
  }, [store]);

  // Live theme preview in Admin (so preset changes are immediately visible)
  useEffect(() => {
    const presetDefaults = THEME_PRESETS[themePreset];
    const themeField = serializeThemeConfig({
      v: 1,
      preset: themePreset,
      primary: formData.theme_color || presetDefaults.primary,
      accent: themeAccent || presetDefaults.accent,
      fontHeading: themeFontHeading || presetDefaults.fontHeading,
      fontBody: themeFontBody || presetDefaults.fontBody,
      deliveryEnabled,
      pickupEnabled,
    });

    return applyThemeToDocument({ themeColorField: themeField, fallbackPrimaryHex: presetDefaults.primary });
  }, [
    themePreset,
    formData.theme_color,
    themeAccent,
    themeFontHeading,
    themeFontBody,
    deliveryEnabled,
    pickupEnabled,
  ]);

  const insertAtEnd = (field: "whatsapp_message" | "help_button_message", snippet: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: (prev[field] ? prev[field] + " " : "") + snippet,
    }));
  };

  const handleSave = async () => {
    const invalidDay = formData.opening_hours.find((h) => h.isOpen && !h.hours.trim());
    if (invalidDay) {
      toast.error(`Defina o horário de ${invalidDay.day} ou marque como fechado.`);
      return;
    }

    if (!store?.id) {
      toast.error("Não foi possível identificar a loja para salvar as configurações.");
      return;
    }

    if (!deliveryEnabled && !pickupEnabled) {
      toast.error("Ative pelo menos uma opção: Entrega ou Retirada.");
      return;
    }

    await updateStore.mutateAsync({
      id: store.id,
      name: formData.name,
      slug: formData.slug,
      description: formData.description || null,
      logo_url: formData.logo_url || null,
      cover_image_url: formData.cover_image_url || null,
      address: formData.address || null,
      google_maps_url: formData.google_maps_url || null,
      phone: formData.phone || null,
      whatsapp: formData.whatsapp || null,
      whatsapp_message: formData.whatsapp_message || null,
      instagram: formData.instagram || null,
      delivery_fee: parseFloat(formData.delivery_fee) || 0,
      min_order: parseFloat(formData.min_order) || 0,
      estimated_time: formData.estimated_time,
      is_open: formData.is_open,
      theme_color: serializeThemeConfig({
        v: 1,
        preset: themePreset,
        primary: formData.theme_color,
        accent: themeAccent,
        fontHeading: themeFontHeading,
        fontBody: themeFontBody,
        deliveryEnabled,
        pickupEnabled,
      }),
      accepted_payments: formData.accepted_payments,
      opening_hours: formData.opening_hours,
      rating: parseFloat(formData.rating) || 4.8,
      review_count: parseInt(formData.review_count) || 0,
      checkout_link: formData.checkout_link || null,
      custom_payments: formData.custom_payments,
      help_button_enabled: formData.help_button_enabled,
      help_button_message: formData.help_button_message || null,
    } as any);
  };

  const togglePayment = (payment: string) => {
    setFormData((prev) => ({
      ...prev,
      accepted_payments: prev.accepted_payments.includes(payment)
        ? prev.accepted_payments.filter((p) => p !== payment)
        : [...prev.accepted_payments, payment],
    }));
  };

  const addCustomPayment = () => {
    if (!newPaymentName.trim()) return;
    const newPayment: CustomPayment = {
      id: Date.now().toString(),
      name: newPaymentName.trim(),
    };
    setFormData((prev) => ({
      ...prev,
      custom_payments: [...prev.custom_payments, newPayment],
      accepted_payments: [...prev.accepted_payments, newPaymentName.trim()],
    }));
    setNewPaymentName("");
  };

  const removeCustomPayment = (id: string) => {
    const payment = formData.custom_payments.find((p) => p.id === id);
    if (payment) {
      setFormData((prev) => ({
        ...prev,
        custom_payments: prev.custom_payments.filter((p) => p.id !== id),
        accepted_payments: prev.accepted_payments.filter((p) => p !== payment.name),
      }));
    }
  };

  const updateOpeningHour = (index: number, field: keyof OpeningHour, value: string | boolean) => {
    setFormData((prev) => {
      const next = prev.opening_hours.map((hour, i) => {
        if (i !== index) return hour;
        const updated = { ...hour, [field]: value } as OpeningHour;
        // Stability: if user closes the day, clear the hours to avoid inconsistent state.
        if (field === "isOpen" && value === false) return { ...updated, hours: "" };
        return updated;
      });

      return { ...prev, opening_hours: next };
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 sm:h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-slide-up">
      {/* Header - Modern gradient style */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-primary/5 via-card to-secondary/30 border border-primary/10 shadow-soft">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl gradient-primary text-white shadow-medium">
              <Store className="w-5 h-5" />
            </span>
            Configurações
          </h1>
          <p className="text-sm text-muted-foreground pl-12">
            Personalize sua vitrine e atraia mais clientes
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={updateStore.isPending} 
          className="w-full sm:w-auto gradient-primary hover:opacity-90 transition-all duration-300 shadow-medium hover:shadow-strong hover:-translate-y-0.5"
        >
          {updateStore.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Salvar Alterações
        </Button>
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        {/* Modern tabs with gradient indicators */}
        <TabsList className="w-full h-auto p-1.5 flex overflow-x-auto no-scrollbar bg-secondary/50 backdrop-blur-sm rounded-xl border border-border/50">
          <TabsTrigger value="info" className="flex-1 min-w-fit gap-1.5 px-3 sm:px-4 py-2.5 text-xs sm:text-sm rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-soft data-[state=active]:text-primary transition-all duration-200">
            <Store className="w-4 h-4" />
            <span className="hidden xs:inline">Informações</span>
          </TabsTrigger>
          <TabsTrigger value="location" className="flex-1 min-w-fit gap-1.5 px-3 sm:px-4 py-2.5 text-xs sm:text-sm rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-soft data-[state=active]:text-primary transition-all duration-200">
            <MapPin className="w-4 h-4" />
            <span className="hidden xs:inline">Localização</span>
          </TabsTrigger>
          <TabsTrigger value="hours" className="flex-1 min-w-fit gap-1.5 px-3 sm:px-4 py-2.5 text-xs sm:text-sm rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-soft data-[state=active]:text-primary transition-all duration-200">
            <Clock className="w-4 h-4" />
            <span className="hidden xs:inline">Horários</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex-1 min-w-fit gap-1.5 px-3 sm:px-4 py-2.5 text-xs sm:text-sm rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-soft data-[state=active]:text-primary transition-all duration-200">
            <CreditCard className="w-4 h-4" />
            <span className="hidden xs:inline">Pagamentos</span>
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex-1 min-w-fit gap-1.5 px-3 sm:px-4 py-2.5 text-xs sm:text-sm rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-soft data-[state=active]:text-primary transition-all duration-200">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden xs:inline">WhatsApp</span>
          </TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info" className="animate-slide-up">
          <Card className="card-interactive overflow-hidden">
            <CardHeader className="p-4 sm:p-6 bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Store className="w-4 h-4 text-primary" />
                </div>
                Informações da Loja
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm pl-10">
                Dados básicos e imagens que aparecem na vitrine
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4 sm:space-y-6">
              {/* Name and slug - stacked on mobile */}
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm">Nome da Loja *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Minha Loja"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug" className="text-sm">Link Personalizado *</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-2 sm:px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-xs sm:text-sm">
                      /loja/
                    </span>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                      className="rounded-l-none h-10"
                      placeholder="minha-loja"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva seu negócio..."
                  rows={3}
                  className="text-sm"
                />
              </div>

              {/* Image Uploads - stacked on mobile */}
              <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
                <ImageUpload
                  value={formData.logo_url}
                  onChange={(url) => setFormData({ ...formData, logo_url: url })}
                  label="Logo da Loja"
                  folder="logos"
                  aspectRatio="square"
                />
                <ImageUpload
                  value={formData.cover_image_url}
                  onChange={(url) => setFormData({ ...formData, cover_image_url: url })}
                  label="Imagem de Capa"
                  folder="covers"
                  aspectRatio="banner"
                />
              </div>

              {/* Instagram */}
              <div className="space-y-2">
                <Label htmlFor="instagram" className="text-sm">Instagram</Label>
                <Input
                  id="instagram"
                  value={formData.instagram}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                  placeholder="@sualoja"
                  className="h-10"
                />
              </div>

              {/* Theme Presets - Full width grid */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Modelo do tema</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(
                    [
                      { id: "pizzaria", label: "🍕 Pizzaria", color: "#d9480f" },
                      { id: "padaria", label: "🥖 Padaria", color: "#b08968" },
                      { id: "doceria", label: "🧁 Doceria", color: "#c2255c" },
                      { id: "churrascaria", label: "🥩 Churrascaria", color: "#111827" },
                      { id: "hamburgueria", label: "🍔 Hamburgueria", color: "#f59f00" },
                      { id: "pastelaria", label: "🥟 Pastelaria", color: "#2b8a3e" },
                    ] as const
                  ).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setThemePreset(p.id);
                        const preset = THEME_PRESETS[p.id];
                        setFormData((prev) => ({ ...prev, theme_color: preset.primary }));
                        setThemeAccent(preset.accent);
                        setThemeFontHeading(preset.fontHeading);
                        setThemeFontBody(preset.fontBody);
                        setUseCustomHeadingFont(false);
                        setUseCustomBodyFont(false);
                      }}
                      className={`relative flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 border-2 ${
                        themePreset === p.id
                          ? "border-primary bg-primary/10 text-primary shadow-soft ring-1 ring-primary/20"
                          : "border-border bg-card text-foreground hover:border-muted-foreground/30 hover:bg-muted/50"
                      }`}
                    >
                      <div
                        className="w-4 h-4 rounded-full shrink-0 border border-border/50"
                        style={{ backgroundColor: p.color }}
                      />
                      <span className="truncate">{p.label}</span>
                      {themePreset === p.id && (
                        <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary animate-pulse" />
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Escolha um modelo e personalize abaixo. Você não fica "preso" ao modelo.
                </p>
              </div>

              {/* Palette */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="theme_color" className="text-sm">Cor principal</Label>
                  <div className="flex gap-2">
                    <Input
                      id="theme_color"
                      type="color"
                      value={formData.theme_color}
                      onChange={(e) => setFormData({ ...formData, theme_color: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={formData.theme_color}
                      onChange={(e) => setFormData({ ...formData, theme_color: e.target.value })}
                      className="flex-1 h-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="theme_accent" className="text-sm">Cor de destaque</Label>
                  <div className="flex gap-2">
                    <Input
                      id="theme_accent"
                      type="color"
                      value={themeAccent}
                      onChange={(e) => setThemeAccent(e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={themeAccent}
                      onChange={(e) => setThemeAccent(e.target.value)}
                      className="flex-1 h-10"
                    />
                  </div>
                </div>
              </div>

              {/* Fonts */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm">Fonte do título</Label>
                  <Select
                    value={useCustomHeadingFont ? "__custom__" : themeFontHeading}
                    onValueChange={(v) => {
                      if (v === "__custom__") {
                        setUseCustomHeadingFont(true);
                        return;
                      }
                      setUseCustomHeadingFont(false);
                      setThemeFontHeading(v);
                    }}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Escolha uma fonte" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Plus Jakarta Sans">Plus Jakarta Sans</SelectItem>
                      <SelectItem value="DM Sans">DM Sans</SelectItem>
                      <SelectItem value="Bebas Neue">Bebas Neue</SelectItem>
                      <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                      <SelectItem value="Oswald">Oswald</SelectItem>
                      <SelectItem value="__custom__">Outra (digitar)</SelectItem>
                    </SelectContent>
                  </Select>
                  {useCustomHeadingFont ? (
                    <Input
                      value={themeFontHeading}
                      onChange={(e) => setThemeFontHeading(e.target.value)}
                      placeholder="Digite o nome da fonte (Google Fonts)"
                      className="h-10"
                    />
                  ) : null}
                  <p className="text-xs text-muted-foreground">Usada no nome da loja e headings.</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Fonte do texto</Label>
                  <Select
                    value={useCustomBodyFont ? "__custom__" : themeFontBody}
                    onValueChange={(v) => {
                      if (v === "__custom__") {
                        setUseCustomBodyFont(true);
                        return;
                      }
                      setUseCustomBodyFont(false);
                      setThemeFontBody(v);
                    }}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Escolha uma fonte" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Plus Jakarta Sans">Plus Jakarta Sans</SelectItem>
                      <SelectItem value="DM Sans">DM Sans</SelectItem>
                      <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                      <SelectItem value="Oswald">Oswald</SelectItem>
                      <SelectItem value="__custom__">Outra (digitar)</SelectItem>
                    </SelectContent>
                  </Select>
                  {useCustomBodyFont ? (
                    <Input
                      value={themeFontBody}
                      onChange={(e) => setThemeFontBody(e.target.value)}
                      placeholder="Digite o nome da fonte (Google Fonts)"
                      className="h-10"
                    />
                  ) : null}
                  <p className="text-xs text-muted-foreground">Usada no restante do texto.</p>
                </div>
              </div>

              {/* Store Open Toggle */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                <Switch
                  id="is_open"
                  checked={formData.is_open}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_open: checked })}
                />
                <Label htmlFor="is_open" className="flex items-center gap-2 text-sm flex-1">
                  Loja Aberta
                  <Badge variant={formData.is_open ? "default" : "secondary"} className="text-xs">
                    {formData.is_open ? "Aberta" : "Fechada"}
                  </Badge>
                </Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Location Tab */}
        <TabsContent value="location">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Localização e Contato</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Endereço e informações de contato
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm">Endereço Completo</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Rua, número, bairro, cidade - estado"
                  rows={2}
                  className="text-sm"
                />
              </div>

              {/* Google Maps Link */}
              <div className="space-y-2">
                <Label htmlFor="google_maps_url" className="flex items-center gap-2 text-sm">
                  Link do Google Maps
                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                </Label>
                <Input
                  id="google_maps_url"
                  type="url"
                  value={formData.google_maps_url}
                  onChange={(e) => setFormData({ ...formData, google_maps_url: e.target.value })}
                  placeholder="https://maps.google.com/..."
                  className="h-10 text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Cole o link de compartilhamento do Google Maps
                </p>
              </div>

              {/* Phone and WhatsApp */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp" className="text-sm">WhatsApp (números)</Label>
                  <Input
                    id="whatsapp"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value.replace(/\D/g, "") })}
                    placeholder="5511999999999"
                    className="h-10"
                  />
                </div>
              </div>

              {/* Delivery Info - hide fee when delivery is disabled */}
              <div className={`grid gap-4 ${deliveryEnabled ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
                {deliveryEnabled && (
                  <div className="space-y-2">
                    <Label htmlFor="delivery_fee" className="text-sm">Taxa Entrega (R$)</Label>
                    <Input
                      id="delivery_fee"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.delivery_fee}
                      onChange={(e) => setFormData({ ...formData, delivery_fee: e.target.value })}
                      className="h-10"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="min_order" className="text-sm">Pedido Mínimo (R$)</Label>
                  <Input
                    id="min_order"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.min_order}
                    onChange={(e) => setFormData({ ...formData, min_order: e.target.value })}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimated_time" className="text-sm">Tempo Estimado</Label>
                  <Input
                    id="estimated_time"
                    value={formData.estimated_time}
                    onChange={(e) => setFormData({ ...formData, estimated_time: e.target.value })}
                    placeholder="30-45 min"
                    className="h-10"
                  />
                </div>
              </div>

              {/* Fulfillment options */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center justify-between rounded-xl border border-border p-3">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-foreground">Faz entrega?</p>
                    <p className="text-xs text-muted-foreground">Mostra a opção de entrega no checkout</p>
                  </div>
                  <Switch checked={deliveryEnabled} onCheckedChange={setDeliveryEnabled} />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border p-3">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-foreground">Aceita retirada?</p>
                    <p className="text-xs text-muted-foreground">Mostra a opção de retirada no checkout</p>
                  </div>
                  <Switch checked={pickupEnabled} onCheckedChange={setPickupEnabled} />
                </div>
              </div>

              {/* Rating and Reviews */}
              <div className="pt-4 border-t">
                <h3 className="text-sm font-medium text-foreground mb-3">
                  Métricas do Cabeçalho
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="rating" className="text-sm">Avaliação (1-5)</Label>
                    <Input
                      id="rating"
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      value={formData.rating}
                      onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                      placeholder="4.8"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="review_count" className="text-sm">Nº Avaliações</Label>
                    <Input
                      id="review_count"
                      type="number"
                      min="0"
                      value={formData.review_count}
                      onChange={(e) => setFormData({ ...formData, review_count: e.target.value })}
                      placeholder="234"
                      className="h-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hours Tab */}
        <TabsContent value="hours">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Horários de Funcionamento</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Configure os horários por dia (modo simples) ou personalize com intervalos
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-2 sm:space-y-3">
              {formData.opening_hours.map((hour, index) => (
                (() => {
                  const simple = parseSimpleRange(hour.hours);
                  const isAdvanced = advancedHoursDays[hour.day] === true;

                  return (
                <div 
                  key={hour.day} 
                  className="flex flex-col gap-2 p-3 rounded-lg bg-secondary/50 sm:flex-row sm:items-center sm:gap-3"
                >
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={hour.isOpen}
                      onCheckedChange={(checked) => updateOpeningHour(index, "isOpen", checked)}
                    />
                    <span className="w-20 font-medium text-sm">{hour.day}</span>
                  </div>

                  <div className="flex-1 pl-11 sm:pl-0">
                    {!hour.isOpen ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs shrink-0">Fechado</Badge>
                        <span className="text-xs text-muted-foreground">(Ative para definir horários)</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Simple mode */}
                        {!isAdvanced && (
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              <Input
                                type="time"
                                value={simple?.open || ""}
                                onChange={(e) => updateSimpleTime(index, "open", e.target.value)}
                                className="h-9 text-sm flex-1 sm:w-[120px] sm:flex-none"
                              />
                              <span className="text-xs text-muted-foreground shrink-0">até</span>
                              <Input
                                type="time"
                                value={simple?.close || ""}
                                onChange={(e) => updateSimpleTime(index, "close", e.target.value)}
                                className="h-9 text-sm flex-1 sm:w-[120px] sm:flex-none"
                              />
                            </div>
                            <span className="text-xs text-muted-foreground hidden sm:inline">
                              {simple ? `(${hour.hours})` : "(preencha)"}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-9 shrink-0"
                              onClick={() =>
                                setAdvancedHoursDays((prev) => ({ ...prev, [hour.day]: true }))
                              }
                            >
                              Intervalos
                            </Button>
                          </div>
                        )}

                        {/* Advanced mode - 2 slots for intervals */}
                        {isAdvanced && (() => {
                          // Lenient parser: extracts time even from partial strings like "14:00 - "
                          const parseTimeLenient = (raw: string): { open: string; close: string } => {
                            const times = raw.match(/\d{2}:\d{2}/g) || [];
                            return { open: times[0] || "", close: times[1] || "" };
                          };
                          const parseIntervals = (raw: string) => {
                            const parts = raw.split("/").map(p => p.trim());
                            const slot1 = parseTimeLenient(parts[0] || "");
                            const slot2 = parseTimeLenient(parts[1] || "");
                            return { slot1, slot2 };
                          };
                          const { slot1, slot2 } = parseIntervals(hour.hours);

                          const rebuildHours = (s1: { open: string; close: string }, s2: { open: string; close: string }) => {
                            const slot1Str = s1.open && s1.close ? `${s1.open} - ${s1.close}` : s1.open ? `${s1.open} - ` : "";
                            const slot2Str = s2.open && s2.close ? `${s2.open} - ${s2.close}` : s2.open ? `${s2.open} - ` : "";
                            const parts = [slot1Str, slot2Str].filter(s => s && s.trim() !== "-");
                            return parts.join(" / ");
                          };

                          const handleSlotChange = (slot: 1 | 2, part: "open" | "close", value: string) => {
                            const current = parseIntervals(hour.hours);
                            const s1 = { ...current.slot1 };
                            const s2 = { ...current.slot2 };
                            if (slot === 1) s1[part] = value;
                            else s2[part] = value;
                            updateOpeningHour(index, "hours", rebuildHours(s1, s2));
                          };

                          return (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-medium text-primary">Modo Intervalos</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-xs"
                                  onClick={() =>
                                    setAdvancedHoursDays((prev) => ({ ...prev, [hour.day]: false }))
                                  }
                                >
                                  Modo simples
                                </Button>
                              </div>
                              {/* Slot 1 */}
                              <div className="flex flex-col gap-1">
                                <span className="text-xs text-muted-foreground">1º Período (manhã)</span>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="time"
                                    key={`${hour.day}-s1o-${slot1.open}`}
                                    defaultValue={slot1.open}
                                    onChange={(e) => handleSlotChange(1, "open", e.target.value)}
                                    className="h-9 text-sm flex-1"
                                  />
                                  <span className="text-xs text-muted-foreground shrink-0">até</span>
                                  <Input
                                    type="time"
                                    key={`${hour.day}-s1c-${slot1.close}`}
                                    defaultValue={slot1.close}
                                    onChange={(e) => handleSlotChange(1, "close", e.target.value)}
                                    className="h-9 text-sm flex-1"
                                  />
                                </div>
                              </div>
                              {/* Slot 2 */}
                              <div className="flex flex-col gap-1">
                                <span className="text-xs text-muted-foreground">2º Período (tarde/noite)</span>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="time"
                                    key={`${hour.day}-s2o-${slot2.open}`}
                                    defaultValue={slot2.open}
                                    onChange={(e) => handleSlotChange(2, "open", e.target.value)}
                                    className="h-9 text-sm flex-1"
                                  />
                                  <span className="text-xs text-muted-foreground shrink-0">até</span>
                                  <Input
                                    type="time"
                                    key={`${hour.day}-s2c-${slot2.close}`}
                                    defaultValue={slot2.close}
                                    onChange={(e) => handleSlotChange(2, "close", e.target.value)}
                                    className="h-9 text-sm flex-1"
                                  />
                                </div>
                              </div>
                              {/* Preview */}
                              {hour.hours && (
                                <div className="text-xs text-primary bg-primary/10 rounded-lg px-3 py-2">
                                  Resultado: <strong>{hour.hours}</strong>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
                  );
                })()
              ))}
              <p className="text-xs text-muted-foreground pt-2">
                💡 Dica: use “Intervalos” para almoço/pausas. O Storefront exibe exatamente o texto salvo.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <div className="space-y-4">
            {/* Quick Payment Options */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Pagamentos Rápidos</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Selecione as formas de pagamento aceitas
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                <div className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-3">
                  {quickPaymentOptions.map((payment) => (
                    <div
                      key={payment.id}
                      onClick={() => togglePayment(payment.name)}
                      className={`p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.accepted_payments.includes(payment.name)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className="text-lg sm:text-2xl">{payment.icon}</span>
                        <span className="font-medium text-xs sm:text-sm flex-1 line-clamp-1">{payment.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Custom Payment Options */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Personalizadas</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Adicione formas de pagamento customizadas
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newPaymentName}
                    onChange={(e) => setNewPaymentName(e.target.value)}
                    placeholder="Ex: Boleto, PicPay..."
                    onKeyDown={(e) => e.key === "Enter" && addCustomPayment()}
                    className="h-10 text-sm"
                  />
                  <Button onClick={addCustomPayment} size="icon" className="shrink-0 h-10 w-10">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {formData.custom_payments.length > 0 && (
                  <div className="space-y-2">
                    {formData.custom_payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                      >
                        <span className="font-medium text-sm">{payment.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeCustomPayment(payment.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Active Payments Summary */}
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">Ativas:</h4>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {formData.accepted_payments.map((payment) => (
                      <Badge key={payment} variant="secondary" className="text-xs">
                        {payment}
                      </Badge>
                    ))}
                    {formData.accepted_payments.length === 0 && (
                      <span className="text-xs text-muted-foreground">
                        Nenhuma selecionada
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Checkout Link */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Link className="w-4 h-4 sm:w-5 sm:h-5" />
                  Link de Checkout
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Link de pagamento externo (opcional)
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="checkout_link" className="text-sm">Link de Pagamento</Label>
                  <Input
                    id="checkout_link"
                    type="url"
                    value={formData.checkout_link}
                    onChange={(e) => setFormData({ ...formData, checkout_link: e.target.value })}
                    placeholder="https://seulink.com/pagamento"
                    className="h-10 text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    PagSeguro, Mercado Pago, PicPay, etc.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* WhatsApp Tab */}
        <TabsContent value="whatsapp">
          <div className="space-y-4 sm:space-y-6">
            {/* Info banner */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-accent/10 border border-accent/20">
              <span className="text-2xl shrink-0">✅</span>
              <div>
                <p className="text-sm font-semibold text-foreground">Tudo já está configurado!</p>
                <p className="text-xs text-muted-foreground mt-1">
                  As mensagens de pedido e dúvidas já funcionam automaticamente. Você <strong>não precisa editar nada</strong> — mas se quiser personalizar, é só alterar abaixo.
                </p>
              </div>
            </div>
            <Tabs defaultValue="order" className="space-y-4">
              <TabsList className="w-full h-auto p-1 flex overflow-x-auto no-scrollbar">
                <TabsTrigger value="order" className="flex-1 min-w-fit gap-1.5 px-2 sm:px-3 py-2 text-xs sm:text-sm">
                  <MessageSquare className="w-4 h-4" />
                  <span className="hidden xs:inline">Pedido</span>
                </TabsTrigger>
                <TabsTrigger value="help" className="flex-1 min-w-fit gap-1.5 px-2 sm:px-3 py-2 text-xs sm:text-sm">
                  <MessageCircleQuestion className="w-4 h-4" />
                  <span className="hidden xs:inline">Dúvidas</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="order">
                <WhatsAppTemplateEditor
                  title="Mensagem de Pedido"
                  description="O cliente envia essa mensagem para o WhatsApp da loja ao finalizar o pedido."
                  fieldId="whatsapp_message"
                  value={formData.whatsapp_message}
                  onChange={(next) => setFormData((prev) => ({ ...prev, whatsapp_message: next }))}
                  placeholder="Ex: Olá! Gostaria de fazer um pedido."
                  templates={[...ORDER_TEMPLATES]}
                  variables={[
                    { key: "loja_nome", label: "Nome da loja", description: "Nome da loja" },
                    { key: "cliente_nome", label: "Cliente", description: "Nome do cliente" },
                    { key: "cliente_whatsapp", label: "WhatsApp", description: "WhatsApp do cliente" },
                    { key: "endereco", label: "Endereço", description: "Endereço" },
                    { key: "complemento", label: "Complemento", description: "Complemento" },
                    { key: "produtos", label: "Produtos", description: "Lista de produtos" },
                    { key: "subtotal", label: "Subtotal", description: "Subtotal" },
                    { key: "taxa_entrega", label: "Entrega", description: "Taxa de entrega" },
                    { key: "total", label: "Total", description: "Total" },
                    { key: "link_pagamento", label: "Link", description: "Link de pagamento" },
                    { key: "troco_para", label: "Troco para", description: "Valor que o cliente vai pagar (somente Dinheiro)" },
                    { key: "troco_levar", label: "Levar troco", description: "Quanto levar de troco (somente Dinheiro)" },
                  ]}
                  quickInsertKeys={["produtos", "total", "cliente_nome", "endereco", "link_pagamento", "troco_para", "troco_levar"]}
                  previewFallbackTemplate={
                    [
                      "Novo Pedido",
                      "",
                      "{loja_nome}",
                      "",
                      "Cliente: {cliente_nome}",
                      "Telefone: {cliente_whatsapp}",
                      "Endereço: {endereco} ({complemento})",
                      "",
                      "Itens do Pedido:",
                      "",
                      "{produtos}",
                      "",
                      "Subtotal: {subtotal}",
                      "Taxa de Entrega: {taxa_entrega}",
                      "Total: {total}",
                      "",
                      "Forma de Pagamento: Dinheiro (Troco para R$ 50)",
                      "Observações: (exemplo)",
                      "Link de Pagamento: {link_pagamento}",
                      "",
                      "Por favor, efetue o pagamento e nos envie o comprovante.",
                    ].join("\n")
                  }
                  previewVars={{
                    loja_nome: formData.name || "Minha Loja",
                    cliente_nome: "c44c44c",
                    cliente_whatsapp: "555555555",
                    endereco: "Rua Exemplo, 123",
                    complemento: "Apto 45",
                    produtos: "* 1x Pizza - R$ 39,90\n* 2x Refrigerante - R$ 14,00",
                    subtotal: "R$ 53,90",
                    taxa_entrega: "R$ 5,00",
                    total: "R$ 58,90",
                    link_pagamento: formData.checkout_link || "",
                    troco_para: "R$ 100,00",
                    troco_levar: "R$ 42,10",
                  }}
                  maxLen={3500}
                />
              </TabsContent>

              <TabsContent value="help">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div>
                      <Label htmlFor="help_button_enabled" className="text-sm font-medium">Ativar botão de dúvidas</Label>
                      <p className="text-xs text-muted-foreground">Mostra botão “Dúvidas?” flutuante na vitrine</p>
                    </div>
                    <Switch
                      id="help_button_enabled"
                      checked={formData.help_button_enabled}
                      onCheckedChange={(checked) => setFormData({ ...formData, help_button_enabled: checked })}
                    />
                  </div>

                  {formData.help_button_enabled ? (
                    <WhatsAppTemplateEditor
                      title="Botão de Dúvidas"
                      description="Mensagem pré-preenchida quando o cliente clica em “Dúvidas?”"
                      fieldId="help_button_message"
                      value={formData.help_button_message}
                      onChange={(next) => setFormData((prev) => ({ ...prev, help_button_message: next }))}
                      placeholder="Ex: Olá! Tenho uma dúvida."
                      templates={[...HELP_TEMPLATES]}
                      variables={[
                        { key: "loja_nome", label: "Nome da loja", description: "Nome da loja" },
                        { key: "loja_link", label: "Link", description: "Link da vitrine" },
                      ]}
                      quickInsertKeys={["loja_nome", "loja_link"]}
                      previewFallbackTemplate="Olá! Tenho uma dúvida sobre a {loja_nome}."
                      previewVars={{
                        loja_nome: formData.name || "Minha Loja",
                        loja_link: `${window.location.origin}/loja/${formData.slug || "minha-loja"}`,
                      }}
                      maxLen={1000}
                    />
                  ) : null}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
