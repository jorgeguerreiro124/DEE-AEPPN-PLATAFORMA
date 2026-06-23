import { useRef, useState } from "react";
import api, { API, formatApiErrorDetail } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Camera, Trash2, ImageOff } from "lucide-react";
import { toast } from "sonner";

const MAX_BYTES = 5 * 1024 * 1024;

export default function StudentPhoto({ student, onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  // bust browser cache after upload/delete
  const [version, setVersion] = useState(Date.now());

  const hasPhoto = !!student.photo_path;
  const src = hasPhoto ? `${API}/students/${student.id}/photo?v=${version}` : null;

  const initials = (student.nome || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const handleSelect = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_BYTES) {
      toast.error("Fotografia excede o limite de 5 MB");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await api.post(`/students/${student.id}/photo`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Fotografia atualizada");
      setVersion(Date.now());
      onChange?.();
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!window.confirm("Remover fotografia?")) return;
    try {
      await api.delete(`/students/${student.id}/photo`);
      toast.success("Fotografia removida");
      setVersion(Date.now());
      onChange?.();
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    }
  };

  return (
    <div className="flex items-center gap-4" data-testid="student-photo">
      <div className="relative size-24 sm:size-28 shrink-0">
        {hasPhoto ? (
          <img
            src={src}
            alt={student.nome}
            className="size-full rounded-full object-cover border border-border shadow-sm"
            data-testid="student-photo-img"
          />
        ) : (
          <div className="size-full rounded-full bg-secondary text-foreground/70 grid place-items-center font-display text-2xl sm:text-3xl font-semibold border border-border" data-testid="student-photo-placeholder">
            {initials || <ImageOff className="size-8" />}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2 print:hidden">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleSelect}
          data-testid="student-photo-input"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          data-testid="student-photo-upload-btn"
        >
          <Camera className="size-4 mr-2" />
          {uploading ? "A enviar…" : hasPhoto ? "Alterar foto" : "Adicionar foto"}
        </Button>
        {hasPhoto && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="text-destructive hover:text-destructive"
            data-testid="student-photo-remove-btn"
          >
            <Trash2 className="size-4 mr-2" />
            Remover
          </Button>
        )}
        <p className="text-xs text-muted-foreground">JPG, PNG ou WEBP · máx. 5 MB</p>
      </div>
    </div>
  );
}
