import { customFetch } from "@workspace/api-client-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface Playbook {
  id: string;
  name: string;
  description?: string | null;
  format: "5v5" | "7v7" | "both";
  color?: string | null;
  playCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlayInPlaybook {
  id: string;
  title: string;
  mode: string;
  format: string;
  players: unknown[];
  routes: unknown[];
  tags: string[];
  isManBeater?: boolean | null;
  isZoneBeater?: boolean | null;
  coverageTargets: string[];
  fieldZone?: string | null;
  difficulty?: string | null;
  primaryConcept?: string | null;
  notes?: string | null;
  suggestedUse?: string | null;
  playbookId?: string | null;
  formationId?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Keys ─────────────────────────────────────────────────────────────────────
export const playbookKeys = {
  all: () => ["playbooks"] as const,
  list: () => [...playbookKeys.all(), "list"] as const,
  detail: (id: string) => [...playbookKeys.all(), id] as const,
  plays: (id: string) => [...playbookKeys.all(), id, "plays"] as const,
};

// ── Queries ───────────────────────────────────────────────────────────────────
export function usePlaybooks() {
  return useQuery({
    queryKey: playbookKeys.list(),
    queryFn: () => customFetch<Playbook[]>("/api/playbooks"),
  });
}

export function usePlaybook(id: string) {
  return useQuery({
    queryKey: playbookKeys.detail(id),
    queryFn: () => customFetch<Playbook>(`/api/playbooks/${id}`),
    enabled: !!id,
  });
}

export function usePlaybookPlays(id: string) {
  return useQuery({
    queryKey: playbookKeys.plays(id),
    queryFn: () => customFetch<PlayInPlaybook[]>(`/api/playbooks/${id}/plays`),
    enabled: !!id,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────
export function useCreatePlaybook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string; format: string; color?: string }) =>
      customFetch<Playbook>("/api/playbooks", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: playbookKeys.list() }),
  });
}

export function useUpdatePlaybook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; description?: string; format?: string; color?: string }) =>
      customFetch<Playbook>(`/api/playbooks/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: playbookKeys.list() });
      qc.invalidateQueries({ queryKey: playbookKeys.detail(id) });
    },
  });
}

export function useDeletePlaybook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      customFetch(`/api/playbooks/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: playbookKeys.list() }),
  });
}

export function useDuplicatePlaybook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      customFetch<Playbook>(`/api/playbooks/${id}/duplicate`, { method: "POST" }),
    onSuccess: (newPb) => {
      qc.invalidateQueries({ queryKey: playbookKeys.list() });
      toast.success(`Duplicated as "${newPb.name}"`);
    },
    onError: () => toast.error("Failed to duplicate playbook"),
  });
}

export function useAddPlayToPlaybook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ playbookId, playId }: { playbookId: string; playId: string }) =>
      customFetch(`/api/playbooks/${playbookId}/plays`, {
        method: "POST",
        body: JSON.stringify({ playId }),
      }),
    onSuccess: (_data, { playbookId }) => {
      qc.invalidateQueries({ queryKey: playbookKeys.plays(playbookId) });
      qc.invalidateQueries({ queryKey: playbookKeys.list() });
    },
  });
}

export function useRemovePlayFromPlaybook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ playbookId, playId }: { playbookId: string; playId: string }) =>
      customFetch(`/api/playbooks/${playbookId}/plays/${playId}`, { method: "DELETE" }),
    onSuccess: (_data, { playbookId }) => {
      qc.invalidateQueries({ queryKey: playbookKeys.plays(playbookId) });
      qc.invalidateQueries({ queryKey: playbookKeys.list() });
    },
  });
}

export function useReorderPlaybookPlays() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ playbookId, playIds }: { playbookId: string; playIds: string[] }) =>
      customFetch(`/api/playbooks/${playbookId}/plays/reorder`, {
        method: "PUT",
        body: JSON.stringify({ playIds }),
      }),
    onSuccess: (_data, { playbookId }) => {
      qc.invalidateQueries({ queryKey: playbookKeys.plays(playbookId) });
    },
  });
}
