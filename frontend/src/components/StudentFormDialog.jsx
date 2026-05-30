import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import api, { formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";

const NIVEIS = ["Pré-escolar", "1.º Ciclo", "2.º Ciclo", "3.º Ciclo", "Secundário"];
const TIPOS_MEDIDA = ["Seletiva", "Adicional"];

const empty = {
  nome: "",
  idade: 6,
  turma: "",
  escola: "",
  nivel_ensino: "1.º Ciclo",
  tipo_medida: "",
  medidas_tags: [],
  adaptacoes_avaliacao: [],
  medidas_notas: "",
};

export default function StudentFormDialog({ open, onOpenChange, student, tags, adaptacoesTags = [], onSaved }) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(student ? { ...empty, ...student } : empty);
    }
  }, [open, student]);

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const toggleTag = (tag) => {
    setForm((p) => ({
      ...p,
      medidas_tags: p.medidas_tags.includes(tag)
        ? p.medidas_tags.filter((t) => t !== tag)
        : [...p.medidas_tags, tag],
    }));
  };

  const toggleAdaptacao = (tag) => {
    setForm((p) => ({
      ...p,
      adaptacoes_avaliacao: (p.adaptacoes_avaliacao || []).includes(tag)
        ? p.adaptacoes_avaliacao.filter((t) => t !== tag)
        : [...(p.adaptacoes_avaliacao || []), tag],
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        nome: form.nome.trim(),
        idade: Number(form.idade),
        turma: form.turma.trim(),
        escola: form.escola.trim(),
        nivel_ensino: form.nivel_ensino,
        tipo_medida: form.tipo_medida || "",
        medidas_tags: form.medidas_tags,
        adaptacoes_avaliacao: form.adaptacoes_avaliacao || [],
        medidas_notas: form.medidas_notas || "",
      };
      if (student?.id) {
        await api.put(`/students/${student.id}`, payload);
        toast.success("Aluno atualizado");
      } else {
        await api.post("/students", payload);
        toast.success("Aluno criado");
      }
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="student-form-dialog">
        <DialogHeader>
          <DialogTitle className="font-display tracking-tight">
            {student ? "Editar Aluno" : "Novo Aluno"}
          </DialogTitle>
          <DialogDescription>
            Preencha os detalhes do aluno e atribua medidas educativas se aplicável.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" value={form.nome} onChange={(e) => update("nome", e.target.value)}
                required data-testid="student-nome-input" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="idade">Idade</Label>
              <Input id="idade" type="number" min={3} max={99}
                value={form.idade} onChange={(e) => update("idade", e.target.value)}
                required data-testid="student-idade-input" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="turma">Turma</Label>
              <Input id="turma" value={form.turma} onChange={(e) => update("turma", e.target.value)}
                placeholder="ex.: 5.º A" required data-testid="student-turma-input" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="escola">Escola</Label>
              <Input id="escola" value={form.escola} onChange={(e) => update("escola", e.target.value)}
                placeholder="ex.: Escola Básica de Lisboa" required data-testid="student-escola-input" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nivel">Nível de Ensino</Label>
              <Select value={form.nivel_ensino} onValueChange={(v) => update("nivel_ensino", v)}>
                <SelectTrigger id="nivel" data-testid="student-nivel-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NIVEIS.map((n) => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo-medida">Tipo de Medida</Label>
              <Select
                value={form.tipo_medida || "__none"}
                onValueChange={(v) => update("tipo_medida", v === "__none" ? "" : v)}
              >
                <SelectTrigger id="tipo-medida" data-testid="student-tipo-medida-select">
                  <SelectValue placeholder="Selecionar…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">— Nenhum —</SelectItem>
                  {TIPOS_MEDIDA.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Medidas Educativas</Label>
            <div className="flex flex-wrap gap-2 p-3 rounded-md border border-border bg-secondary/40 min-h-[64px]" data-testid="medidas-tags-container">
              {tags.map((tag) => {
                const active = form.medidas_tags.includes(tag);
                return (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    data-testid={`tag-${tag.replace(/\s+/g, "-").toLowerCase()}`}
                    className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors duration-200 ${
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-foreground border-border hover:border-primary/50"
                    }`}
                  >
                    {tag}
                    {active && <X className="size-3 inline ml-1" />}
                  </button>
                );
              })}
            </div>
            {form.medidas_tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {form.medidas_tags.map((t) => (
                  <Badge key={t} variant="secondary">{t}</Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Adaptações ao Processo de Avaliação</Label>
            <p className="text-xs text-muted-foreground">Selecione as adaptações aplicáveis (DL 54/2018).</p>
            <div className="flex flex-wrap gap-2 p-3 rounded-md border border-border bg-secondary/40 min-h-[64px]" data-testid="adaptacoes-tags-container">
              {adaptacoesTags.map((tag) => {
                const active = (form.adaptacoes_avaliacao || []).includes(tag);
                return (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => toggleAdaptacao(tag)}
                    data-testid={`adapt-${tag.replace(/\s+/g, "-").toLowerCase()}`}
                    className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors duration-200 ${
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-foreground border-border hover:border-primary/50"
                    }`}
                  >
                    {tag}
                    {active && <X className="size-3 inline ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas Adicionais</Label>
            <Textarea
              id="notas"
              rows={4}
              placeholder="Observações pedagógicas, contexto familiar, recomendações..."
              value={form.medidas_notas || ""}
              onChange={(e) => update("medidas_notas", e.target.value)}
              data-testid="student-notas-input"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="cancel-student-btn">
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} data-testid="save-student-btn">
              {saving ? "A guardar…" : student ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
