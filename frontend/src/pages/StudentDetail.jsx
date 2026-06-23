import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api, { formatApiErrorDetail } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, Pencil, Printer, User as UserIcon, School as SchoolIcon,
  Layers, GraduationCap, Calendar, ClipboardList, ShieldCheck, ListChecks,
  FileText, UserCheck, Users as UsersIcon, CalendarClock, BadgeCheck, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import StudentFormDialog from "@/components/StudentFormDialog";
import StudentAttachments from "@/components/StudentAttachments";
import StudentPhoto from "@/components/StudentPhoto";

function Field({ icon: Icon, label, value, testid }) {
  return (
    <div className="flex items-start gap-3" data-testid={testid}>
      <div className="size-9 rounded-md bg-secondary text-foreground grid place-items-center shrink-0">
        <Icon className="size-4" strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <div className="overline">{label}</div>
        <div className="font-medium text-sm sm:text-base mt-0.5 break-words">{value || "—"}</div>
      </div>
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-PT", { dateStyle: "long", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function formatShortDate(iso) {
  if (!iso) return "";
  // ISO YYYY-MM-DD without time
  try {
    const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
    return d.toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" });
  } catch {
    return iso;
  }
}

function daysUntil(iso) {
  if (!iso) return null;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
    target.setHours(0, 0, 0, 0);
    return Math.round((target - today) / 86400000);
  } catch {
    return null;
  }
}

function renderRevisaoAlert(iso) {
  const days = daysUntil(iso);
  if (days === null) return null;
  if (days < 0) {
    return (
      <div className="mt-5 flex items-center gap-3 rounded-md border border-destructive/40 bg-destructive/10 text-destructive p-3 text-sm" data-testid="rev-alert-late">
        <AlertTriangle className="size-4 shrink-0" />
        Revisão em atraso há {Math.abs(days)} dia(s).
      </div>
    );
  }
  if (days <= 30) {
    return (
      <div className="mt-5 flex items-center gap-3 rounded-md border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 p-3 text-sm" data-testid="rev-alert-soon">
        <AlertTriangle className="size-4 shrink-0" />
        Revisão prevista em {days} dia(s).
      </div>
    );
  }
  return null;
}

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [tags, setTags] = useState([]);
  const [adaptacoesTags, setAdaptacoesTags] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/students/${id}`);
      setStudent(data);
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    api.get("/medidas/tags").then((r) => setTags(r.data.tags)).catch(() => {});
    api.get("/adaptacoes/tags").then((r) => setAdaptacoesTags(r.data.tags)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-secondary/60 rounded animate-pulse" />
        <Card className="p-6 h-96 bg-secondary/40 animate-pulse" />
      </div>
    );
  }

  if (error || !student) {
    return (
      <Card className="p-8 text-center">
        <div className="overline mb-2">Aluno não encontrado</div>
        <p className="text-sm text-muted-foreground">{error || "O aluno solicitado não existe ou foi eliminado."}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/alunos")} data-testid="back-to-list-btn">
          <ArrowLeft className="size-4 mr-2" /> Voltar à lista
        </Button>
      </Card>
    );
  }

  const tipoMedidaColor =
    student.tipo_medida === "Adicional"
      ? "border-amber-500/50 text-amber-700 dark:text-amber-400"
      : student.tipo_medida === "Seletiva"
      ? "border-blue-500/50 text-blue-700 dark:text-blue-400"
      : "";

  return (
    <div className="space-y-6" data-testid="student-detail-page">
      {/* Toolbar (hidden on print) */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button variant="ghost" onClick={() => navigate("/alunos")} data-testid="back-btn">
          <ArrowLeft className="size-4 mr-2" /> Voltar à lista
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)} data-testid="edit-detail-btn">
            <Pencil className="size-4 mr-2" /> Editar
          </Button>
          <Button onClick={() => window.print()} data-testid="print-btn">
            <Printer className="size-4 mr-2" /> Imprimir / PDF
          </Button>
        </div>
      </div>

      {/* Print-only header */}
      <div className="hidden print:block">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">
          Departamento de Educação Especial · AEPPN
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Ficha do Aluno · Gerada em {new Date().toLocaleString("pt-PT")}
        </div>
      </div>

      {/* Header card */}
      <Card className="p-6 lg:p-8 print:shadow-none print:border print:border-border">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-start gap-5 min-w-0">
            <StudentPhoto student={student} onChange={load} />
            <div className="min-w-0">
              <div className="overline">Ficha do Aluno</div>
              <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight mt-2 break-words" data-testid="student-name">
                {student.nome}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-3 text-sm text-muted-foreground">
                <span>{student.idade} anos</span>
                <span aria-hidden>·</span>
                <span>{student.turma}</span>
                <span aria-hidden>·</span>
                <span>{student.nivel_ensino}</span>
              </div>
            </div>
          </div>
          {student.tipo_medida && (
            <Badge variant="outline" className={tipoMedidaColor + " text-sm px-3 py-1"} data-testid="tipo-medida-badge">
              {student.tipo_medida}
            </Badge>
          )}
        </div>
      </Card>

      {/* Identification */}
      <Card className="p-6 lg:p-8 print:shadow-none print:border print:border-border">
        <div className="overline mb-5">Identificação</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
          <Field icon={UserIcon} label="Nome" value={student.nome} testid="field-nome" />
          <Field icon={Calendar} label="Idade" value={`${student.idade} anos`} testid="field-idade" />
          <Field icon={SchoolIcon} label="Escola" value={student.escola} testid="field-escola" />
          <Field icon={Layers} label="Turma" value={student.turma} testid="field-turma" />
          <Field icon={GraduationCap} label="Nível de Ensino" value={student.nivel_ensino} testid="field-nivel" />
          <Field icon={ShieldCheck} label="Tipo de Medida" value={student.tipo_medida || "—"} testid="field-tipo" />
          <Field icon={UserCheck} label="Prof. Educação Especial" value={student.prof_educ_especial} testid="field-prof-ee" />
          <Field icon={UsersIcon} label="Diretor / Titular de Turma" value={student.diretor_turma} testid="field-dt" />
          <Field icon={Calendar} label="Ano Letivo" value={student.ano_letivo} testid="field-ano-letivo" />
          <Field icon={BadgeCheck} label="Estado do Processo" value={student.estado_processo} testid="field-estado" />
          <Field icon={CalendarClock} label="Elaboração RTP/PEI" value={formatShortDate(student.data_elaboracao_doc)} testid="field-data-elab" />
          <Field icon={CalendarClock} label="Próxima Revisão" value={formatShortDate(student.data_revisao_doc)} testid="field-data-rev" />
        </div>
        {renderRevisaoAlert(student.data_revisao_doc)}
      </Card>

      {/* Medidas educativas */}
      <Card className="p-6 lg:p-8 print:shadow-none print:border print:border-border print:break-inside-avoid">
        <div className="flex items-center gap-2 mb-4">
          <ListChecks className="size-5 text-primary" strokeWidth={1.75} />
          <h2 className="font-display text-xl font-semibold tracking-tight">Medidas Educativas</h2>
        </div>
        {student.medidas_tags && student.medidas_tags.length > 0 ? (
          <div className="flex flex-wrap gap-2" data-testid="medidas-list">
            {student.medidas_tags.map((m) => (
              <Badge key={m} variant="secondary" className="text-xs sm:text-sm px-3 py-1">{m}</Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Sem medidas atribuídas.</p>
        )}
      </Card>

      {/* Adaptações */}
      <Card className="p-6 lg:p-8 print:shadow-none print:border print:border-border print:break-inside-avoid">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList className="size-5 text-primary" strokeWidth={1.75} />
          <h2 className="font-display text-xl font-semibold tracking-tight">Adaptações ao Processo de Avaliação</h2>
        </div>
        {student.adaptacoes_avaliacao && student.adaptacoes_avaliacao.length > 0 ? (
          <ul className="space-y-2" data-testid="adaptacoes-list">
            {student.adaptacoes_avaliacao.map((a) => (
              <li key={a} className="flex items-start gap-3 text-sm">
                <span className="size-1.5 rounded-full bg-primary mt-2 shrink-0" />
                <span>{a}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Sem adaptações atribuídas.</p>
        )}
      </Card>

      {/* Notas adicionais */}
      {student.medidas_notas && (
        <Card className="p-6 lg:p-8 print:shadow-none print:border print:border-border print:break-inside-avoid">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="size-5 text-primary" strokeWidth={1.75} />
            <h2 className="font-display text-xl font-semibold tracking-tight">Notas Adicionais</h2>
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap" data-testid="notas-content">{student.medidas_notas}</p>
        </Card>
      )}

      {/* Anexos */}
      <StudentAttachments studentId={student.id} />

      {/* Metadata */}
      <Card className="p-6 print:shadow-none print:border print:border-border">
        <Separator className="mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div>
            <span className="overline block mb-1">Criado em</span>
            <span data-testid="meta-created">{formatDate(student.created_at)}</span>
          </div>
          <div>
            <span className="overline block mb-1">Última atualização</span>
            <span data-testid="meta-updated">{formatDate(student.updated_at)}</span>
          </div>
        </div>
      </Card>

      <StudentFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        student={student}
        tags={tags}
        adaptacoesTags={adaptacoesTags}
        onSaved={() => {
          load();
          toast.success("Aluno atualizado");
        }}
      />
    </div>
  );
}
