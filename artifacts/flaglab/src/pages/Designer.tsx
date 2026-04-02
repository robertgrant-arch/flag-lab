import { useEffect, useState, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useParams, useLocation } from "wouter";
import { useDesignerState } from "@/hooks/use-designer-state";
import type { PlayerToken, RouteSegment } from "@/hooks/use-designer-state";
import { DesignerCanvas } from "@/components/designer/DesignerCanvas";
import { DesignerSidebarLeft } from "@/components/designer/DesignerSidebarLeft";
import { DesignerSidebarRight } from "@/components/designer/DesignerSidebarRight";
import { DesignerToolbar, type PlayerPreset } from "@/components/designer/DesignerToolbar";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useSettings } from "@/lib/settings";

export interface Annotation {
  id: string;
  x: number;
  y: number;
  text: string;
}

const ROLE_COLORS: Record<string, string> = {
  QB: "#ef4444", C: "#f97316", WR1: "#3b82f6", WR2: "#3b82f6", WR3: "#60a5fa",
  WR4: "#93c5fd", RB: "#22c55e", FB: "#16a34a", TE: "#a855f7",
  CB1: "#ef4444", CB2: "#f87171", S: "#dc2626", LB: "#f59e0b",
  Rusher: "#b91c1c", DB3: "#fca5a5",
};

export default function Designer() {
  const params = useParams();
  const id = params.id;
  const isNew = !id || id === "new";
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { settings } = useSettings();

  const {
    play, canUndo, canRedo, init, updatePlay,
    addPlayer, updatePlayer, updatePlayerPosition, removePlayer,
    addRoute, updateRoute, removeRoute, undo, redo,
  } = useDesignerState();

  const [initialized, setInitialized] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [annotationMode, setAnnotationMode] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(settings.snapToGrid);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isDrawingRoute, setIsDrawingRoute] = useState(false);
  const [drawRequest, setDrawRequest] = useState<{ playerId: string; at: number } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isNew && !initialized) {
      fetch(`/api/plays/${id}`)
        .then((r) => r.json())
        .then((serverPlay) => {
          const normalized = {
            ...serverPlay,
            title: serverPlay.title || "Untitled Play",
            players: Array.isArray(serverPlay.players) ? serverPlay.players : [],
            routes: Array.isArray(serverPlay.routes) ? serverPlay.routes : [],
            tags: Array.isArray(serverPlay.tags) ? serverPlay.tags : [],
          };
          init(normalized);
          setInitialized(true);
          try {
            const stored = localStorage.getItem(`flaglab_annotations_${serverPlay.id}`);
            if (stored) setAnnotations(JSON.parse(stored));
          } catch { /* ignore */ }
        })
        .catch(() => {
          toast.error("Failed to load play");
          setInitialized(true);
        });
    } else if (isNew && !initialized) {
      setInitialized(true);
    }
  }, [id, isNew, initialized, init]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  const handleNewPlay = useCallback(() => {
    const freshPlay = {
      id: "new",
      title: "Untitled Play",
      mode: "offense",
      format: "5v5",
      players: [] as PlayerToken[],
      routes: [] as RouteSegment[],
      tags: [] as string[],
      coverageTargets: [] as string[],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    init(freshPlay);
    setSelectedPlayerId(null);
    setSelectedRouteId(null);
    setAnnotations([]);
    setIsAnimating(false);
    setAnnotationMode(false);
    setIsDrawingRoute(false);
    setDrawRequest(null);
    setInitialized(true);
    setLocation("/designer");
    toast.success("New play created");
  }, [init, setLocation]);

  const handleTitleChange = useCallback((title: string) => {
    updatePlay({ title });
  }, [updatePlay]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        title: play.title, mode: play.mode, format: play.format,
        players: play.players, routes: play.routes, tags: play.tags,
        notes: play.notes ?? undefined, isManBeater: play.isManBeater ?? undefined,
        isZoneBeater: play.isZoneBeater ?? undefined, coverageTargets: play.coverageTargets || [],
      };
      if (isNew || play.id === "new") {
        const res = await fetch("/api/plays", {
          method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload, (_, v) => v === null ? undefined : v),
        });
        if (!res.ok) throw new Error("Create failed");
        const newPlay = await res.json();
        if (annotations.length > 0) {
          localStorage.setItem(`flaglab_annotations_${newPlay.id}`, JSON.stringify(annotations));
        }
        toast.success("Play created!");
        setLocation(`/designer/${newPlay.id}`);
      } else {
        const res = await fetch(`/api/plays/${play.id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload, (_, v) => v === null ? undefined : v),
        });
        if (!res.ok) throw new Error("Save failed");
              const savedPlay = await res.json();
      init({ ...savedPlay, players: savedPlay.players ?? [], routes: savedPlay.routes ?? [], tags: savedPlay.tags ?? [] });
        if (annotations.length > 0) {
          localStorage.setItem(`flaglab_annotations_${play.id}`, JSON.stringify(annotations));
        } else {
          localStorage.removeItem(`flaglab_annotations_${play.id}`);
        }
        queryClient.invalidateQueries({ queryKey: ["/api/plays"] });
        toast.success("Play saved!");
      }
    } catch { toast.error("Failed to save play"); }
    finally { setIsSaving(false); }
  };

  const handleDuplicate = async () => {
    if (isNew || play.id === "new") return;
    try {
      const res = await fetch(`/api/plays/${play.id}/duplicate`, { method: "POST" });
      if (!res.ok) throw new Error();
      const newPlay = await res.json();
      toast.success(`Duplicated as "${newPlay.title}"`);
      setLocation(`/designer/${newPlay.id}`);
    } catch { toast.error("Failed to duplicate play"); }
  };

  const handleLoadFormation = useCallback(
    (players: PlayerPreset[]) => {
      const defPlayers = play.players?.filter((p) => p.team === "defense") ?? [];
      const newPlayers: PlayerToken[] = [
        ...defPlayers,
        ...players.map((p) => ({
          id: `${p.id}-${Date.now()}`, role: p.role, label: p.role,
          team: p.team as "offense" | "defense", x: p.x, y: p.y, color: p.color,
        })),
      ];
      updatePlay({ players: newPlayers, routes: [] as RouteSegment[] });
      toast.success("Formation loaded");
    },
    [play.players, updatePlay],
  );

  const handleDropPlayer = useCallback(
    (role: string, team: "offense" | "defense", x: number, y: number) => {
      const color = ROLE_COLORS[role] ?? (team === "offense" ? "#3b82f6" : "#ef4444");
      addPlayer({
        id: `player-${role}-${Date.now()}`, role, label: role, team, x, y, color,
      });
    },
    [addPlayer],
  );

  const handleStartDrawRoute = useCallback((playerId: string) => {
    setDrawRequest({ playerId, at: Date.now() });
    setSelectedPlayerId(playerId);
    setAnnotationMode(false);
  }, []);

  const handleAddAnnotation = useCallback((x: number, y: number, text: string) => {
    setAnnotations((prev) => [...prev, { id: `ann-${Date.now()}`, x, y, text }]);
  }, []);

  const handleUpdateAnnotation = useCallback((id: string, text: string) => {
    setAnnotations((prev) => prev.map((a) => (a.id === id ? { ...a, text } : a)));
  }, []);

  const handleRemoveAnnotation = useCallback((id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
  }, []);

  if (!isNew && !initialized) {
    return (
      <AppLayout headerTitle="Loading…">
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  const selectedPlayer = play.players?.find((p) => p.id === selectedPlayerId) ?? null;
  const selectedRoute = play.routes?.find((r) => r.id === selectedRouteId) ?? null;

  return (
    <AppLayout
      headerTitle={play.title || "Play Designer"}
      onTitleChange={handleTitleChange}
      onNewPlay={handleNewPlay}
    >
      <div className="flex flex-col flex-1 overflow-hidden">
        <DesignerToolbar
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
          onSave={handleSave}
          onAnimate={() => { setIsAnimating((v) => !v); setAnnotationMode(false); }}
          isSaving={isSaving}
          isNew={isNew}
          onDuplicate={handleDuplicate}
          onLoadFormation={handleLoadFormation}
          annotationMode={annotationMode}
          onToggleAnnotation={() => setAnnotationMode((v) => !v)}
          snapToGrid={snapToGrid}
          onToggleSnap={() => setSnapToGrid((v) => !v)}
          currentFormat={play.format as "5v5" | "7v7"}
        />
        <div className="flex flex-1 overflow-hidden relative">
          <DesignerSidebarLeft onAddPlayer={addPlayer} />

          <div className="flex-1 relative overflow-hidden">
            <DesignerCanvas
              players={play.players || []}
              routes={play.routes || []}
              format={play.format}
              onUpdatePlayer={updatePlayer}
              onUpdatePlayerPosition={updatePlayerPosition}
              onRemovePlayer={removePlayer}
              onAddRoute={addRoute}
              onUpdateRoute={updateRoute}
              onRemoveRoute={removeRoute}
              onDropPlayer={handleDropPlayer}
              selectedPlayerId={selectedPlayerId}
              setSelectedPlayerId={setSelectedPlayerId}
              selectedRouteId={selectedRouteId}
              setSelectedRouteId={setSelectedRouteId}
              isAnimating={isAnimating}
              annotationMode={annotationMode}
              annotations={annotations}
              onAddAnnotation={handleAddAnnotation}
              onUpdateAnnotation={handleUpdateAnnotation}
              onRemoveAnnotation={handleRemoveAnnotation}
              snapToGrid={snapToGrid}
              drawRequest={drawRequest}
              onDrawingStateChange={setIsDrawingRoute}
            />
          </div>

          <DesignerSidebarRight
            play={play}
            onUpdatePlay={updatePlay}
            selectedPlayer={selectedPlayer}
            onUpdatePlayer={updatePlayer}
            onRemovePlayer={removePlayer}
            selectedRoute={selectedRoute}
            onUpdateRoute={updateRoute}
            onRemoveRoute={removeRoute}
            isDrawingRoute={isDrawingRoute}
            onStartDrawRoute={handleStartDrawRoute}
          />
        </div>
      </div>
    </AppLayout>
  );
}
