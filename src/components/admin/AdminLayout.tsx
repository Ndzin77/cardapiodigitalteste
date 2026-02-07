import { ReactNode, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { FooterDeveloperBadge, FloatingDeveloperBadge } from "@/components/DeveloperWatermark";
import { useMyStore } from "@/hooks/useStore";
import { applyThemeToDocument } from "@/lib/storeTheme";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Package,
  Tag,
  Settings,
  Eye,
  LogOut,
  Store,
  Menu,
  ClipboardList,
  Users,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const menuItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Pedidos", url: "/admin/orders", icon: ClipboardList },
  { title: "Produtos", url: "/admin/products", icon: Package },
  { title: "Categorias", url: "/admin/categories", icon: Tag },
  { title: "Clientes", url: "/admin/customers", icon: Users },
  { title: "Configurações", url: "/admin/settings", icon: Settings },
];

function AdminSidebar() {
  const { signOut } = useAuth();
  const { data: store, isLoading } = useMyStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { state, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handlePreview = () => {
    if (store?.slug) {
      window.open(`/loja/${store.slug}`, "_blank");
    }
  };

  const handleNavClick = () => {
    // Close mobile sidebar on navigation
    setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent>
        <SidebarGroup>
          <div className="p-3 sm:p-4 flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Store className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                {isLoading ? (
                  <Skeleton className="h-5 w-24" />
                ) : (
                  <h2 className="font-semibold text-foreground truncate text-sm sm:text-base">
                    {store?.name || "Minha Loja"}
                  </h2>
                )}
              </div>
            )}
          </div>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/admin"}
                      className="flex items-center gap-3 hover:bg-muted/50 rounded-lg px-3 py-2.5 text-sm"
                      activeClassName="bg-primary/10 text-primary font-medium"
                      onClick={handleNavClick}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handlePreview}
                  className="flex items-center gap-3 hover:bg-muted/50 rounded-lg px-3 py-2.5 cursor-pointer text-sm"
                >
                  <Eye className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>Ver Vitrine</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleSignOut}
                  className="flex items-center gap-3 hover:bg-destructive/10 text-destructive rounded-lg px-3 py-2.5 cursor-pointer text-sm"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>Sair</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { data: store } = useMyStore();

  useEffect(() => {
    if (!store) return;
    return applyThemeToDocument({ themeColorField: (store as any).theme_color });
  }, [store]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <main className="flex-1 flex flex-col min-w-0">
          <header className="h-12 sm:h-14 border-b flex items-center px-3 sm:px-4 gap-3 bg-card sticky top-0 z-10">
            <SidebarTrigger>
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            <span className="text-sm font-medium text-muted-foreground truncate sm:hidden">
              Painel Admin
            </span>
          </header>
          <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto">
            {children}
          </div>
          <FooterDeveloperBadge />
        </main>
        <FloatingDeveloperBadge />
      </div>
    </SidebarProvider>
  );
}
