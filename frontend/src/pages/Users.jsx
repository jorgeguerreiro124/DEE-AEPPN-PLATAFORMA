import { useCallback, useEffect, useState } from "react";
import api, { formatApiErrorDetail } from "@/lib/api";
import { Button } from "@/components/ui/button";
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
import { Plus, Pencil, Trash2, ShieldCheck, User as UserIcon } from "lucide-react";
import UserFormDialog from "@/components/UserFormDialog";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function Users() {
  const { user: me } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/users");
      setItems(data);
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.delete(`/users/${confirmDelete.id}`);
      toast.success("Utilizador eliminado");
      setConfirmDelete(null);
      fetchAll();
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    }
  };

  return (
    <div className="space-y-6" data-testid="users-page">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="overline">Administração</div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight mt-2">Utilizadores</h1>
          <p className="text-sm text-muted-foreground mt-1">Gira os utilizadores com acesso à plataforma.</p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }} data-testid="new-user-btn">
          <Plus className="size-4 mr-2" /> Novo Utilizador
        </Button>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead className="text-right w-28">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground">A carregar…</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground">Sem utilizadores.</TableCell></TableRow>
            ) : items.map((u) => {
              const isMe = me?.id === u.id;
              return (
                <TableRow key={u.id} data-testid={`user-row-${u.id}`} className="hover:bg-secondary/40">
                  <TableCell className="font-medium">
                    {u.name}
                    {isMe && <span className="ml-2 text-xs text-muted-foreground">(você)</span>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    {u.role === "admin" ? (
                      <Badge className="bg-primary text-primary-foreground gap-1">
                        <ShieldCheck className="size-3" /> Administrador
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <UserIcon className="size-3" /> Utilizador
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost" size="icon"
                      onClick={() => { setEditing(u); setDialogOpen(true); }}
                      data-testid={`edit-user-${u.id}`}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      onClick={() => setConfirmDelete(u)}
                      disabled={isMe}
                      title={isMe ? "Não pode eliminar a sua conta" : "Eliminar"}
                      data-testid={`delete-user-${u.id}`}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <UserFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={editing}
        onSaved={fetchAll}
      />

      <AlertDialog open={!!confirmDelete} onOpenChange={(v) => !v && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminação</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é permanente. O utilizador <strong>{confirmDelete?.name}</strong> ({confirmDelete?.email}) será eliminado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="confirm-user-delete-btn"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
