import { useState } from "react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  BookOpen,
  ChevronRight,
  Copy,
} from "lucide-react";
import {
  usePlaybooks,
  useCreatePlaybook,
  useUpdatePlaybook,
  useDeletePlaybook,
  useDuplicatePlaybook,
  type Playbook,
} from "@/lib/playbook-api";

const FORMAT_COLORS: Record<string, string> = {
  "5v5": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "7v7": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  both: "bg-green-500/20 text-green-400 border-green-500/30",
};

function PlaybookFormDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
  isPending,
  title,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Partial<Playbook>;
  onSubmit: (data: { name: string; description: string; format: string }) => void;
  isPending: boolean;
  title: string;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [format, setFormat] = useState(initial?.format ?? "both");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), description: description.trim(), format });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pb-name">Name</Label>
            <Input
              id="pb-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Week 1 Offense"
              autoFocus
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pb-desc">Description (optional)</Label>
            <Input
              id="pb-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Format</Label>
            <div className="flex gap-2">
              {(["5v5", "7v7", "both"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormat(f)}
                  className={`flex-1 rounded-md border py-1.5 text-sm font-medium transition-colors ${
                    format === f
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  {f === "both" ? "Both" : f}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Playbooks() {
  const { data: playbooks, isLoading } = usePlaybooks();
  const createMutation = useCreatePlaybook();
  const updateMutation = useUpdatePlaybook();
  const deleteMutation = useDeletePlaybook();
  const duplicateMutation = useDuplicatePlaybook();

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Playbook | null>(null);
  const [deleting, setDeleting] = useState<Playbook | null>(null);

  function handleCreate(data: { name: string; description: string; format: string }) {
    createMutation.mutate(data, { onSuccess: () => setShowCreate(false) });
  }

  function handleUpdate(data: { name: string; description: string; format: string }) {
    if (!editing) return;
    updateMutation.mutate({ id: editing.id, ...data }, { onSuccess: () => setEditing(null) });
  }

  function handleDelete() {
    if (!deleting) return;
    deleteMutation.mutate(deleting.id, { onSuccess: () => setDeleting(null) });
  }

  return (
    <AppLayout
      headerTitle="Playbooks"
      headerActions={
        <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          New Playbook
        </Button>
      }
    >
      <div className="p-6 max-w-4xl mx-auto w-full">
        <div className="mb-6">
          <h2 className="text-3xl font-bold tracking-tight">Playbooks</h2>
          <p className="text-muted-foreground mt-1">
            Organize your plays into game-day playbooks.
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array(3)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-xl" />
              ))}
          </div>
        ) : !playbooks?.length ? (
          <div className="border border-dashed rounded-xl p-12 text-center">
            <BookOpen className="h-10 w-10 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">No playbooks yet.</p>
            <Button
              variant="outline"
              className="mt-4 gap-1.5"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="h-4 w-4" />
              Create your first playbook
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {playbooks.map((pb) => (
              <div
                key={pb.id}
                className="group relative rounded-xl border bg-card p-5 flex flex-col gap-3 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base truncate">{pb.name}</h3>
                    {pb.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {pb.description}
                      </p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditing(pb)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => duplicateMutation.mutate(pb.id)}
                        disabled={duplicateMutation.isPending}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleting(pb)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-2 mt-auto">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full border ${FORMAT_COLORS[pb.format] ?? FORMAT_COLORS["both"]}`}
                  >
                    {pb.format === "both" ? "5v5 & 7v7" : pb.format}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {pb.playCount} {pb.playCount === 1 ? "play" : "plays"}
                  </span>
                </div>

                <Link
                  href={`/playbooks/${pb.id}`}
                  className="absolute inset-0 rounded-xl"
                  aria-label={`Open ${pb.name}`}
                />

                <div className="flex items-center justify-end mt-auto pt-1 border-t border-border/50">
                  <span className="text-xs text-primary flex items-center gap-0.5 font-medium">
                    Open <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <PlaybookFormDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        title="New Playbook"
        onSubmit={handleCreate}
        isPending={createMutation.isPending}
      />

      {editing && (
        <PlaybookFormDialog
          key={editing.id}
          open
          onOpenChange={(v) => !v && setEditing(null)}
          title="Rename Playbook"
          initial={editing}
          onSubmit={handleUpdate}
          isPending={updateMutation.isPending}
        />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete playbook?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong>{deleting?.name}</strong> and its play associations.
              Your plays themselves won't be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
