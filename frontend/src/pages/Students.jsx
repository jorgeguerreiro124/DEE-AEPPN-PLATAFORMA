import { useCallback, useEffect, useMemo, useState } from "react";
import api, { API, formatApiErrorDetail } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, FileDown, Search, FileText, School } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import StudentFormDialog from "@/components/StudentFormDialog";
import { toast } from "sonner";

const NIVEIS = ["Todos", "Pré-escolar", "1.º Ciclo", "2.º Ciclo", "3.º Ciclo", "Secundário"];

export default function Students() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tags, setTags] = useState([]);
  const [adaptacoesTags, setAdaptacoesTags] = useState([]);
  const [search, setSearch] = useState("");
  const [nivel, setNivel] = useState("Todos");
  const [turmaFilter, setTurmaFilter] = useState("Todas");
  const [escolaFilter, setEscolaFilter] = useState("");
  const [medidaFilter, setMedidaFilter] = useState("Todas");
  const [allEscolas, setAllEscolas] = useState([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (nivel !== "Todos") params.nivel_ensino = nivel;
      if (turmaFilter !== "Todas") params.turma = turmaFilter;
      if (escolaFilter.trim()) params.escola = escolaFilter.trim();
      if (medidaFilter !== "Todas") params.medida = medidaFilter;
      const { data } = await api.get("/students", { params });
      setItems(data);
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  }, [search, nivel, turmaFilter, escolaFilter, medidaFilter]);

  const fetchEscolas = useCallback(async () => {
    try {
      const { data } = await api.get("/stats");
      setAllEscolas((data.por_escola || []).map((e) => e.name).filter(Boolean));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    api.get("/medidas/tags").then((r) => setTags(r.data.tags)).catch(() => {});
    api.get("/adaptacoes/tags").then((r) => setAdaptacoesTags(r.data.tags)).catch(() => {});
    fetchEscolas();
  }, [fetchEscolas]);

  useEffect(() => {
    const t = setTimeout(fetchAll, 250);
    return () => clearTimeout(t);
  }, [fetchAll]);

  const turmas = useMemo(() => ["Todas", ...Array.from(new Set(items.map(i => i.turma)))], [items]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.delete(`/students/${confirmDelete.id}`);
      toast.success("Aluno eliminado");
      setConfirmDelete(null);
      fetchAll();
      fetchEscolas();
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    }
  };

  const exportCsv = () => {
    window.open(`${API}/students/export/csv`, "_blank");
  };

  const exportPdf = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    const rows = items.map(s => `
      <tr>
        <td>${escapeHtml(s.nome)}</td>
        <td>${s.idade}</td>
        <td>${escapeHtml(s.turma)}</td>
        <td>${escapeHtml(s.escola)}</td>
        <td>${escapeHtml(s.nivel_ensino)}</td>
        <td>${escapeHtml((s.medidas_tags || []).join(", "))}</td>
      </tr>`).join("");
    win.document.write(`
      <html><head><title>Relatório de Alunos</title>
      <style>
        body{font-family:Arial,sans-serif;padding:24px;color:#0f172a}
        h1{font-size:20px;margin-bottom:4px}
        .subtitle{color:#64748b;font-size:12px;margin-bottom:24px}
        table{width:100%;border-collapse:collapse;font-size:12px}
        th,td{padding:8px;border-bottom:1px solid #e2e8f0;text-align:left;vertical-align:top}
        th{background:#f8fafc;font-weight:600}
      </style></head><body>
        <h1>Relatório de Alunos</h1>
        <div class="subtitle">Gerado em ${new Date().toLocaleString("pt-PT")} — ${items.length} aluno(s)</div>
        <table>
          <thead><tr><th>Nome</th><th>Idade</th><th>Turma</th><th>Escola</th><th>Nível</th><th>Medidas</th></tr></thead>
          <tbody>${rows || `<tr><td colspan="6" style="text-align:center;color:#64748b;padding:24px">Sem dados</td></tr>`}</tbody>
        </table>
        <script>window.onload=()=>window.print();</script>
      </body></html>`);
    win.document.close();
  };

  return (
    <div className="space-y-6" data-testid="students-page">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="overline">Gestão</div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight mt-2">Alunos</h1>
          <p className="text-sm text-muted-foreground mt-1">Registe e acompanhe os alunos e as suas medidas educativas.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportCsv} data-testid="export-csv-btn">
            <FileDown className="size-4 mr-2" /> Exportar CSV
          </Button>
          <Button variant="outline" onClick={exportPdf} data-testid="export-pdf-btn">
            <FileText className="size-4 mr-2" /> Exportar PDF
          </Button>
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }} data-testid="new-student-btn">
            <Plus className="size-4 mr-2" /> Novo Aluno
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          <div className="space-y-1.5">
            <Label className="overline">Pesquisar nome</Label>
            <div className="relative">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Nome do aluno…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="search-input"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="overline">Nível</Label>
            <Select value={nivel} onValueChange={setNivel}>
              <SelectTrigger data-testid="filter-nivel"><SelectValue /></SelectTrigger>
              <SelectContent>
                {NIVEIS.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="overline">Turmas</Label>
            <Select value={turmaFilter} onValueChange={setTurmaFilter}>
              <SelectTrigger data-testid="filter-turma"><SelectValue /></SelectTrigger>
              <SelectContent>
                {turmas.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="overline">Medida</Label>
            <Select value={medidaFilter} onValueChange={setMedidaFilter}>
              <SelectTrigger data-testid="filter-medida"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Todas">Todas</SelectItem>
                {tags.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="overline">Escola</Label>
            <div className="relative">
              <School className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Procurar por escola…"
                value={escolaFilter}
                onChange={(e) => setEscolaFilter(e.target.value)}
                className="pl-9"
                data-testid="filter-escola"
                list="escolas-list"
              />
              <datalist id="escolas-list">
                {allEscolas.map((e) => <option key={e} value={e} />)}
              </datalist>
            </div>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="w-20">Idade</TableHead>
              <TableHead>Turma</TableHead>
              <TableHead>Escola</TableHead>
              <TableHead>Nível</TableHead>
              <TableHead>Tipo Medida</TableHead>
              <TableHead>Medidas</TableHead>
              <TableHead className="text-right w-28">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">A carregar…</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground" data-testid="empty-state">
                Nenhum aluno registado. Clique em "Novo Aluno" para começar.
              </TableCell></TableRow>
            ) : items.map((s) => (
              <TableRow key={s.id} data-testid={`student-row-${s.id}`} className="hover:bg-secondary/40">
                <TableCell className="font-medium">
                  <Link
                    to={`/alunos/${s.id}`}
                    className="hover:text-primary hover:underline underline-offset-4 transition-colors"
                    data-testid={`student-link-${s.id}`}
                  >
                    {s.nome}
                  </Link>
                </TableCell>
                <TableCell>{s.idade}</TableCell>
                <TableCell>{s.turma}</TableCell>
                <TableCell>{s.escola}</TableCell>
                <TableCell>{s.nivel_ensino}</TableCell>
                <TableCell>
                  {s.tipo_medida ? (
                    <Badge
                      variant="outline"
                      className={
                        s.tipo_medida === "Adicional"
                          ? "border-amber-500/50 text-amber-700 dark:text-amber-400"
                          : "border-blue-500/50 text-blue-700 dark:text-blue-400"
                      }
                    >
                      {s.tipo_medida}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {(s.medidas_tags || []).slice(0, 3).map(t =>
                      <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                    )}
                    {(s.medidas_tags || []).length > 3 && (
                      <Badge variant="outline" className="text-[10px]">+{s.medidas_tags.length - 3}</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(s); setDialogOpen(true); }} data-testid={`edit-${s.id}`}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(s)} data-testid={`delete-${s.id}`}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <StudentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        student={editing}
        tags={tags}
        adaptacoesTags={adaptacoesTags}
        onSaved={() => { fetchAll(); fetchEscolas(); }}
      />

      <AlertDialog open={!!confirmDelete} onOpenChange={(v) => !v && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminação</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é permanente. O aluno <strong>{confirmDelete?.nome}</strong> será eliminado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-delete-btn">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} data-testid="confirm-delete-btn"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
