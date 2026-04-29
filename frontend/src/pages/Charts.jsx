import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Users, ShieldCheck, ListChecks, Tags } from "lucide-react";

const COLOR = {
  primary: "hsl(var(--chart-1))",
  green: "hsl(var(--chart-2))",
  orange: "hsl(var(--chart-3))",
  purple: "hsl(var(--chart-4))",
  pink: "hsl(var(--chart-5))",
  muted: "hsl(var(--muted-foreground))",
};

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
};

function Section({ icon: Icon, overline, title, kpi, kpiLabel, children, testid }) {
  return (
    <Card className="p-6 transition-all duration-200" data-testid={testid}>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="overline">{overline}</div>
          <h2 className="font-display text-xl sm:text-2xl tracking-tight font-semibold mt-1">{title}</h2>
        </div>
        <div className="flex items-center gap-3">
          {kpi !== undefined && (
            <div className="text-right">
              <div className="overline">{kpiLabel}</div>
              <div className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">{kpi}</div>
            </div>
          )}
          <div className="size-10 rounded-md bg-secondary text-foreground grid place-items-center">
            <Icon className="size-5" strokeWidth={1.75} />
          </div>
        </div>
      </div>
      {children}
    </Card>
  );
}

function Empty({ height = 260 }) {
  return (
    <div className="grid place-items-center text-sm text-muted-foreground" style={{ height }}>
      Sem dados para apresentar.
    </div>
  );
}

export default function Charts() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let m = true;
    api.get("/stats")
      .then((r) => m && setData(r.data))
      .catch((e) => m && setError(e.response?.data?.detail || "Erro ao carregar"));
    return () => { m = false; };
  }, []);

  if (error) return <div className="text-destructive">{String(error)}</div>;
  if (!data) {
    return (
      <div className="space-y-6">
        {[1, 2, 3, 4].map(i => <Card key={i} className="p-6 h-64 animate-pulse bg-secondary/40" />)}
      </div>
    );
  }

  const { kpis, por_turma, por_nivel, por_escola, por_medida } = data;
  const total = kpis.total_alunos || 0;
  const com_medidas = kpis.alunos_com_medidas || 0;
  const sem_medidas = Math.max(0, total - com_medidas);
  const seletiva = kpis.alunos_seletiva || 0;
  const adicional = kpis.alunos_adicional || 0;
  const sem_tipo = Math.max(0, total - seletiva - adicional);

  const medidasComp = [
    { name: "Com medidas", value: com_medidas },
    { name: "Sem medidas", value: sem_medidas },
  ];

  const tipoComp = [
    { name: "Seletiva", value: seletiva },
    { name: "Adicional", value: adicional },
    { name: "Sem tipo", value: sem_tipo },
  ];

  return (
    <div className="space-y-6" data-testid="charts-page">
      <div>
        <div className="overline">Estatísticas</div>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight mt-2">Gráficos</h1>
        <p className="text-sm text-muted-foreground mt-1">Análise visual dos dados pedagógicos.</p>
      </div>

      {/* 1. Total de Alunos */}
      <Section
        testid="chart-total-alunos"
        icon={Users}
        overline="01"
        title="Total de Alunos"
        kpi={total}
        kpiLabel="Total"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="overline mb-3">Por Nível de Ensino</div>
            {por_nivel.length === 0 ? <Empty /> : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={por_nivel}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" stroke={COLOR.muted} fontSize={12} />
                  <YAxis stroke={COLOR.muted} fontSize={12} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" fill={COLOR.primary} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div>
            <div className="overline mb-3">Por Turma</div>
            {por_turma.length === 0 ? <Empty /> : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={por_turma}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" stroke={COLOR.muted} fontSize={12} />
                  <YAxis stroke={COLOR.muted} fontSize={12} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" fill={COLOR.green} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="lg:col-span-2">
            <div className="overline mb-3">Por Escola</div>
            {por_escola.length === 0 ? <Empty /> : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={por_escola} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" stroke={COLOR.muted} fontSize={12} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" stroke={COLOR.muted} fontSize={12} width={160} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" fill={COLOR.purple} radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </Section>

      {/* 2. Alunos com Medidas (Total) */}
      <Section
        testid="chart-com-medidas"
        icon={ShieldCheck}
        overline="02"
        title="Alunos com Medidas (Total)"
        kpi={com_medidas}
        kpiLabel="Com medidas"
      >
        {total === 0 ? <Empty /> : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={medidasComp} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                  <Cell fill={COLOR.primary} />
                  <Cell fill="hsl(var(--muted))" />
                </Pie>
                <Legend />
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              <Stat label="Com medidas" value={com_medidas} total={total} color={COLOR.primary} />
              <Stat label="Sem medidas" value={sem_medidas} total={total} color="hsl(var(--muted-foreground))" />
            </div>
          </div>
        )}
      </Section>

      {/* 3. Alunos com Medidas (Seletivas e Adicionais) */}
      <Section
        testid="chart-tipo-medida"
        icon={ListChecks}
        overline="03"
        title="Alunos com Medidas (Seletivas e Adicionais)"
        kpi={seletiva + adicional}
        kpiLabel="Seletiva + Adicional"
      >
        {total === 0 ? <Empty /> : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={tipoComp}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" stroke={COLOR.muted} fontSize={12} />
                <YAxis stroke={COLOR.muted} fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  <Cell fill={COLOR.primary} />
                  <Cell fill={COLOR.orange} />
                  <Cell fill="hsl(var(--muted))" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              <Stat label="Seletiva" value={seletiva} total={total} color={COLOR.primary} />
              <Stat label="Adicional" value={adicional} total={total} color={COLOR.orange} />
              <Stat label="Sem tipo" value={sem_tipo} total={total} color="hsl(var(--muted-foreground))" />
            </div>
          </div>
        )}
      </Section>

      {/* 4. Medidas Educativas Atribuídas */}
      <Section
        testid="chart-medidas-tags"
        icon={Tags}
        overline="04"
        title="Medidas Educativas Atribuídas"
        kpi={por_medida.reduce((s, m) => s + m.value, 0)}
        kpiLabel="Atribuições"
      >
        {por_medida.length === 0 ? <Empty /> : (
          <ResponsiveContainer width="100%" height={Math.max(280, por_medida.length * 38)}>
            <BarChart data={por_medida} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" stroke={COLOR.muted} fontSize={12} allowDecimals={false} />
              <YAxis dataKey="name" type="category" stroke={COLOR.muted} fontSize={12} width={180} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" fill={COLOR.orange} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Section>
    </div>
  );
}

function Stat({ label, value, total, color }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full" style={{ background: color }} />
          <span className="text-sm">{label}</span>
        </div>
        <div className="font-display text-lg font-semibold tracking-tight">
          {value} <span className="text-xs text-muted-foreground font-normal">({pct}%)</span>
        </div>
      </div>
      <div className="mt-1.5 h-1.5 rounded-full bg-secondary overflow-hidden">
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
