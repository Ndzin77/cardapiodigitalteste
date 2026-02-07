import { useState } from "react";
import { useMyStore } from "@/hooks/useStore";
import { useStoreCustomers, useResetCustomerPassword, formatPhoneDisplay, Customer } from "@/hooks/useCustomers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Users, Search, KeyRound, Check, X, Loader2, ShoppingBag } from "lucide-react";

export default function Customers() {
  const { data: store, isLoading: storeLoading } = useMyStore();
  const { data: customers = [], isLoading: customersLoading } = useStoreCustomers(store?.id);
  const resetPassword = useResetCustomerPassword();
  const [search, setSearch] = useState("");
  const [resettingId, setResettingId] = useState<string | null>(null);

  // Sort customers alphabetically and filter by search
  const filteredCustomers = customers
    .filter((customer) => {
      const searchLower = search.toLowerCase();
      return (
        customer.name.toLowerCase().includes(searchLower) ||
        customer.phone.includes(search.replace(/\D/g, ""))
      );
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  const handleResetPassword = async (customer: Customer) => {
    setResettingId(customer.id);
    try {
      await resetPassword.mutateAsync(customer.id);
      toast.success(`Senha de ${customer.name} foi removida. O cliente pode criar uma nova.`);
    } catch (error: any) {
      toast.error(error.message || "Erro ao resetar senha");
    } finally {
      setResettingId(null);
    }
  };

  const isLoading = storeLoading || customersLoading;

  const totalCustomers = customers.length;
  const withPassword = customers.filter((c) => c.has_password).length;
  const withoutPassword = totalCustomers - withPassword;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header with gradient */}
      <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-primary/5 via-card to-secondary/30 border border-primary/10 shadow-soft">
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl gradient-primary text-white shadow-medium">
            <Users className="w-5 h-5" />
          </span>
          Clientes
        </h1>
        <p className="text-muted-foreground mt-1 pl-[52px] text-sm">Gerencie os clientes cadastrados na sua loja</p>
      </div>

      {/* Stats cards with hover effects */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="card-interactive group">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-muted group-hover:bg-primary/10 transition-colors">
                <Users className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              Total de Clientes
            </CardDescription>
            <CardTitle className="text-3xl font-bold">{isLoading ? <Skeleton className="h-9 w-16" /> : totalCustomers}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="card-interactive group border-accent/20">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-accent/10 group-hover:bg-accent/20 transition-colors">
                <Check className="w-3.5 h-3.5 text-accent" />
              </div>
              Com Senha Ativa
            </CardDescription>
            <CardTitle className="text-3xl font-bold text-accent">{isLoading ? <Skeleton className="h-9 w-16" /> : withPassword}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="card-interactive group">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-muted group-hover:bg-muted-foreground/10 transition-colors">
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              Sem Senha
            </CardDescription>
            <CardTitle className="text-3xl font-bold">{isLoading ? <Skeleton className="h-9 w-16" /> : withoutPassword}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Customer list card */}
      <Card className="card-interactive overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-secondary/50 to-transparent border-b border-border/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                Lista de Clientes
              </CardTitle>
              <CardDescription className="pl-10 mt-1">Clientes cadastrados na vitrine</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou telefone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-card border-border/50 focus:border-primary/50 transition-colors"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 sm:p-6 sm:pt-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {search ? <>Nenhum cliente encontrado para "{search}"</> : <>Nenhum cliente cadastrado ainda</>}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="font-semibold">Nome</TableHead>
                    <TableHead className="font-semibold">Telefone</TableHead>
                    <TableHead className="text-center font-semibold">Pedidos</TableHead>
                    <TableHead className="text-center font-semibold">Senha</TableHead>
                    <TableHead className="hidden sm:table-cell font-semibold">Último Login</TableHead>
                    <TableHead className="hidden sm:table-cell font-semibold">Cadastro</TableHead>
                    <TableHead className="text-right font-semibold">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer, idx) => (
                    <TableRow 
                      key={customer.id} 
                      className="group hover:bg-primary/5 transition-colors"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell className="text-muted-foreground">{formatPhoneDisplay(customer.phone)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="gap-1 hover:bg-primary/10 transition-colors cursor-default">
                          <ShoppingBag className="h-3 w-3" />
                          {customer.order_count || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {customer.has_password ? (
                          <Badge variant="default" className="justify-center">
                            <Check className="h-3 w-3 mr-1" />
                            Ativa
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="justify-center">
                            <X className="h-3 w-3 mr-1" />
                            Pendente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {customer.last_login_at
                          ? format(new Date(customer.last_login_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                          : "—"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {format(new Date(customer.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">
                        {customer.has_password && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" disabled={resettingId === customer.id}>
                                {resettingId === customer.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <KeyRound className="h-4 w-4 mr-1" />
                                    <span className="hidden sm:inline">Resetar Senha</span>
                                    <span className="sm:hidden">Resetar</span>
                                  </>
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Resetar Senha</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja remover a senha de <strong>{customer.name}</strong>?
                                  <br />
                                  <br />
                                  O cliente poderá criar uma nova senha no próximo acesso.
                                  O histórico de pedidos será mantido.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleResetPassword(customer)}>Sim, Resetar</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
