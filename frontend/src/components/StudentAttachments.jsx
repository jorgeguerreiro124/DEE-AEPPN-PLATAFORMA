import { useCallback, useEffect, useRef, useState } from "react";
import api, { API, formatApiErrorDetail } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Paperclip, Upload, Download, Trash2, FileText, FileImage } from "lucide-react";
import { toast } from "sonner";

function formatBytes(b) {
  if (!b) return "—";
  const units = ["B", "KB", "MB"];
  let v = b, i = 0;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

function formatDate(iso) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" }); }
  catch { return iso; }
}

function fileIcon(ct) {
  if (ct && ct.startsWith("image/")) return FileImage;
  return FileText;
}

export default function StudentAttachments({ studentId }) {
  const [files, setFiles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [pendingCategory, setPendingCategory] = useState("RTP");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const inputRef = useRef(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/students/${studentId}/files`);
      setFiles(data);
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchFiles();
    api.get("/attachments/categories").then((r) => setCategories(r.data.categories)).catch(() => {});
  }, [fetchFiles]);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ficheiro excede o limite de 10 MB");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await api.post(`/students/${studentId}/files?category=${encodeURIComponent(pendingCategory)}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Ficheiro carregado");
      fetchFiles();
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.delete(`/students/${studentId}/files/${confirmDelete.id}`);
      toast.success("Ficheiro removido");
      setConfirmDelete(null);
      fetchFiles();
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    }
  };

  const downloadUrl = (fileId) => `${API}/students/${studentId}/files/${fileId}/download`;

  return (
    <Card className="p-6 lg:p-8 print:hidden" data-testid="student-attachments">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <Paperclip className="size-5 text-primary" strokeWidth={1.75} />
          <h2 className="font-display text-xl font-semibold tracking-tight">Anexos</h2>
          <Badge variant="secondary" className="ml-2">{files.length}</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={pendingCategory} onValueChange={setPendingCategory}>
            <SelectTrigger className="w-40" data-testid="attach-category-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.doc,.docx,.odt,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={handleFileSelect}
            data-testid="attach-file-input"
          />
          <Button onClick={() => inputRef.current?.click()} disabled={uploading} data-testid="attach-upload-btn">
            <Upload className="size-4 mr-2" />
            {uploading ? "A carregar…" : "Carregar"}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-4">
        Tipos permitidos: PDF, DOC, DOCX, ODT, JPG, PNG, WEBP · Tamanho máx.: 10&nbsp;MB
      </p>

      {loading ? (
        <div className="text-sm text-muted-foreground py-8 text-center">A carregar…</div>
      ) : files.length === 0 ? (
        <div className="text-sm text-muted-foreground py-10 text-center" data-testid="attach-empty">
          Sem ficheiros anexados.
        </div>
      ) : (
        <ul className="divide-y divide-border" data-testid="attach-list">
          {files.map((f) => {
            const Icon = fileIcon(f.content_type);
            return (
              <li key={f.id} className="py-3 flex items-center gap-3" data-testid={`attach-row-${f.id}`}>
                <div className="size-10 rounded-md bg-secondary text-foreground grid place-items-center shrink-0">
                  <Icon className="size-5" strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-sm truncate">{f.original_filename}</span>
                    <Badge variant="outline" className="text-[10px]">{f.category}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 truncate">
                    {formatBytes(f.size)} · {formatDate(f.created_at)}
                    {f.uploaded_by_name ? ` · ${f.uploaded_by_name}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={downloadUrl(f.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center size-9 rounded-md hover:bg-secondary transition-colors"
                    title="Abrir / Descarregar"
                    data-testid={`attach-download-${f.id}`}
                  >
                    <Download className="size-4" />
                  </a>
                  <Button
                    variant="ghost" size="icon"
                    onClick={() => setConfirmDelete(f)}
                    title="Eliminar"
                    data-testid={`attach-delete-${f.id}`}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <AlertDialog open={!!confirmDelete} onOpenChange={(v) => !v && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar ficheiro</AlertDialogTitle>
            <AlertDialogDescription>
              O ficheiro <strong>{confirmDelete?.original_filename}</strong> será removido do aluno.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="attach-confirm-delete-btn"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
