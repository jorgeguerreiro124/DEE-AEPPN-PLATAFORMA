import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api, { formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";

const empty = { email: "", name: "", password: "", role: "user" };

export default function UserFormDialog({ open, onOpenChange, user, onSaved }) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const isEdit = !!user;

  useEffect(() => {
    if (open) {
      setForm(user
        ? { email: user.email, name: user.name, password: "", role: user.role || "user" }
        : empty);
    }
  }, [open, user]);

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        const payload = { name: form.name.trim(), role: form.role };
        if (form.password) payload.password = form.password;
        await api.put(`/users/${user.id}`, payload);
        toast.success("Utilizador atualizado");
      } else {
        await api.post("/users", {
          email: form.email.trim().toLowerCase(),
          name: form.name.trim(),
          password: form.password,
          role: form.role,
        });
        toast.success("Utilizador criado");
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
      <DialogContent className="max-w-md" data-testid="user-form-dialog">
        <DialogHeader>
          <DialogTitle className="font-display tracking-tight">
            {isEdit ? "Editar Utilizador" : "Novo Utilizador"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Atualize o nome, papel ou defina uma nova palavra-passe."
              : "Preencha os dados do novo utilizador."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="u-name">Nome</Label>
            <Input id="u-name" value={form.name} onChange={(e) => update("name", e.target.value)}
              required data-testid="user-name-input" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="u-email">Email</Label>
            <Input
              id="u-email"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              disabled={isEdit}
              required={!isEdit}
              data-testid="user-email-input"
            />
            {isEdit && (
              <p className="text-xs text-muted-foreground">O email não pode ser alterado.</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="u-role">Papel</Label>
            <Select value={form.role} onValueChange={(v) => update("role", v)}>
              <SelectTrigger id="u-role" data-testid="user-role-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="user">Utilizador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="u-pwd">{isEdit ? "Nova palavra-passe (opcional)" : "Palavra-passe"}</Label>
            <Input
              id="u-pwd"
              type="password"
              minLength={isEdit ? undefined : 6}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              required={!isEdit}
              placeholder={isEdit ? "Deixar em branco para manter" : "Mínimo 6 caracteres"}
              data-testid="user-password-input"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="cancel-user-btn">
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} data-testid="save-user-btn">
              {saving ? "A guardar…" : isEdit ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
