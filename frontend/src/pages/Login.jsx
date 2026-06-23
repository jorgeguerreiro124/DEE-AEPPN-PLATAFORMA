import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { formatApiErrorDetail } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { toast } from "sonner";

const BG_IMAGE =
  "https://images.unsplash.com/photo-1745776437727-f2c2d3594f8e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2OTV8MHwxfHNlYXJjaHwzfHxtb2Rlcm4lMjB1bml2ZXJzaXR5JTIwYnVpbGRpbmclMjBleHRlcmlvciUyMGRheXRpbWV8ZW58MHx8fHwxNzc3MzkwMzc0fDA&ixlib=rb-4.1.0&q=85";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPwd, setLoginPwd] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(loginEmail.trim(), loginPwd);
      toast.success("Sessão iniciada");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div
        className="relative hidden lg:flex p-12 text-white"
        style={{
          backgroundImage: `linear-gradient(rgba(15,23,42,0.55), rgba(15,23,42,0.85)), url('${BG_IMAGE}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="flex flex-col justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-md bg-white/15 backdrop-blur grid place-items-center">
              <BookOpen className="size-5" />
            </div>
            <div className="font-display text-lg font-semibold tracking-tight">Departamento de Educação Especial</div>
          </div>
          <div className="space-y-4 max-w-md">
            <div className="overline text-white/80">Gestão Pedagógica Integrada</div>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight">
              Organize as escolas. Apoie cada aluno.
            </h1>
            <p className="text-base text-white/85 leading-relaxed">
              Registe alunos, acompanhe medidas educativas e visualize estatísticas — tudo num só lugar.
            </p>
          </div>
          <div className="overline text-white/60">AE Prof. Paula Nogueira — Olhão</div>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <Card className="w-full max-w-md p-8">
          <div className="mb-6">
            <h2 className="font-display text-2xl sm:text-3xl tracking-tight font-semibold">Bem-vindo</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Inicie sessão com a sua conta institucional <span className="font-mono">@aeppn.pt</span>.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="nome@aeppn.pt"
                required
                data-testid="login-email-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Palavra-passe</Label>
              <Input
                id="login-password"
                type="password"
                value={loginPwd}
                onChange={(e) => setLoginPwd(e.target.value)}
                required
                data-testid="login-password-input"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading} data-testid="login-submit-btn">
              {loading ? "A entrar…" : "Entrar"}
            </Button>
          </form>

          <div className="text-xs text-muted-foreground mt-6 text-center">
            Sem conta? Solicite acesso ao administrador.
          </div>
        </Card>
      </div>
    </div>
  );
}
