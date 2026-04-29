import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, GraduationCap, LogOut, Sun, Moon, BookOpen, UsersRound, BarChart3 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
  { to: "/", label: "Painel", icon: LayoutDashboard, end: true, testid: "nav-dashboard" },
  { to: "/alunos", label: "Alunos", icon: GraduationCap, testid: "nav-students" },
  { to: "/graficos", label: "Gráficos", icon: BarChart3, testid: "nav-charts" },
  { to: "/utilizadores", label: "Utilizadores", icon: UsersRound, testid: "nav-users", adminOnly: true },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card">
        <div className="h-16 flex items-center gap-2 px-6 border-b border-border">
          <div className="size-9 rounded-md bg-primary text-primary-foreground grid place-items-center">
            <BookOpen className="size-5" />
          </div>
          <div>
            <div className="font-display font-semibold tracking-tight text-sm leading-tight">Departamento de Educação Especial</div>
            <div className="overline">AEPPN</div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.filter((it) => !it.adminOnly || user?.role === "admin").map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              data-testid={item.testid}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors duration-200 ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/80 hover:bg-secondary hover:text-foreground"
                }`
              }
            >
              <item.icon className="size-4" strokeWidth={1.75} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-border">
          <div className="flex items-center gap-3 px-2 mb-2">
            <Avatar className="size-9">
              <AvatarFallback className="bg-secondary text-secondary-foreground">
                {(user?.name || "?").substring(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user?.name}</div>
              <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={handleLogout}
            data-testid="logout-btn"
          >
            <LogOut className="size-4" /> Terminar sessão
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 md:px-8">
          <div className="md:hidden flex items-center gap-2">
            <div className="size-8 rounded-md bg-primary text-primary-foreground grid place-items-center">
              <BookOpen className="size-4" />
            </div>
            <span className="font-display font-semibold text-sm">DEE — AEPPN</span>
          </div>
          <div className="hidden md:block overline">Plataforma de Gestão Pedagógica</div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={toggle}
              data-testid="theme-toggle"
              aria-label="Alternar tema"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={handleLogout} data-testid="logout-btn-mobile">
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
