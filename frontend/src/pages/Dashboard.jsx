import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Users, School, Layers, ShieldCheck } from "lucide-react";

const COLORS = ["hsl(221 83% 53%)", "hsl(160 60% 45%)", "hsl(27 87% 60%)", "hsl(280 65% 60%)", "hsl(340 75% 55%)"];

function Kpi({ label, value, icon: Icon, testid }) {
  return (
    <Card className="p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md" data-testid={testid}>
      <div className="flex items-center justify-between">
        <div className="overline">{label}</div>
        <div className="size-9 rounded-md bg-secondary text-foreground grid place-items-center">
          <Icon className="size-4" strokeWidth={1.75} />
        </div>
      </div>
      <div className="font-display text-3xl sm:text-4xl font-semibold tracking-tight mt-3">{value}</div>
    </Card>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    api.get("/stats")
      .then((r) => mounted && setData(r.data))
      .catch((e) => mounted && setError(e.response?.data?.detail || "Erro ao carregar"));
    return () => { mounted = false; };
  }, []);

  if (error) return <div className="text-destructive">{String(error)}</div>;
  if (!data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <Card key={i} className="p-6 h-28 animate-pulse bg-secondary/40" />)}
      </div>
    );
  }

  const { kpis, por_turma, por_nivel, por_escola, por_medida } = data;

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      <div>
        <div className="overline">Painel</div>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight mt-2">Visão Geral</h1>
        <p className="text-sm text-muted-foreground mt-1">Estatísticas dos alunos registados na plataforma.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi testid="kpi-total-alunos" label="Total de Alunos" value={kpis.total_alunos} icon={Users} />
        <Kpi testid="kpi-total-escolas" label="Escolas" value={kpis.total_escolas} icon={School} />
        <Kpi testid="kpi-total-turmas" label="Turmas" value={kpis.total_turmas} icon={Layers} />
        <Kpi testid="kpi-com-medidas" label="Alunos com Medidas" value={kpis.alunos_com_medidas} icon={ShieldCheck} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="overline mb-4">Alunos por Nível de Ensino</div>
          {por_nivel.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={por_nivel}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-6">
          <div className="overline mb-4">Alunos por Turma</div>
          {por_turma.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={por_turma}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-6">
          <div className="overline mb-4">Alunos por Escola</div>
          {por_escola.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={por_escola} dataKey="value" nameKey="name" outerRadius={100} label>
                  {por_escola.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-6">
          <div className="overline mb-4">Medidas Educativas Atribuídas (Seletivas e Adicionais)</div>
          {por_medida.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={por_medida} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={140} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="value" fill="hsl(var(--chart-3))" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-[280px] grid place-items-center text-sm text-muted-foreground">
      Sem dados para apresentar.
    </div>
  );
}
