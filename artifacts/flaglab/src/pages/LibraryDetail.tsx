
import { useState, useRef, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useParams, Link } from "wouter";
import { useGetPlay } from "@workspace/api-client-react";
import { getGetPlayQueryKey } from "@workspace/api-client-react";
import {
  Loader2,
  ArrowLeft,
  Edit2,
  Play as PlayIcon,
  Square,
  AlertCircle,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { DesignerCanvas } from "@/components/designer/DesignerCanvas";
import type { PlayerToken, RouteSegment } from "@/hooks/use-designer-state";

// ─── Role colour map (matches Designer) ────────────────────────────────────
const ROLE_COLORS: Record<string, string> = {
  QB: "#ef4444",
  C: "#f97316",
  WR1: "#3b82f6",
  WR2: "#3b82f6",
  WR3: "#60a5fa",
  WR4: "#93c5fd",
  RB: "#22c55e",
  FB: "#16a34a",
  TE: "#a855f7",
  CB1: "#ef4444",
  CB2: "#f87171",
  S: "#dc2626",
  LB: "#f59e0b",
  Rusher: "#b91c1c",
  DB3: "#fca5a5",
};

const getRoleColor = (role: string): string =>
  ROLE_COLORS[role] ?? "#6b7280";

// ─── No-op handlers for read-only canvas ───────────────────────────────────
const noop = () => {};
const noopStr = (_: string) => {};
const noopPlayer = (_: PlayerToken) => {};
const noopRoute = (_: RouteSegment) => {};
const noopDrop = (
  _role: string,
  _team: "offense" | "defense",
  _x: number,
  _y: number
) => {};

// ─── SVG → PNG export ───────────────────────────────────────────────────────
//
// Pipeline:
//   1. querySelector("svg") inside the canvas container
//   2. Clone + fix width/height/viewBox attributes
//   3. XMLSerializer → Blob URL
//   4. Load into a hidden <img>, draw to an off-screen <canvas> at 2×
//   5. canvas.toBlob("image/png") → share (Web Share API) or anchor download
//
async function exportCanvasToPng(
  container: HTMLElement,
  filename: string
): Promise<void> {
  const svg = container.querySelector("svg");
  if (!svg) throw new Error("No SVG found in canvas container");

  // DesignerCanvas hard-codes a 533 × 1200 viewBox
  const SVG_W = 533;
  const SVG_H = 1200;
  // 2× scale for retina / phone screens
  const SCALE = 2;
  const PX_W = SVG_W * SCALE;
  const PX_H = SVG_H * SCALE;

  // Clone so mutations don't touch the live DOM
  const cloned = svg.cloneNode(true) as SVGElement;
  cloned.setAttribute("width", String(SVG_W));
  cloned.setAttribute("height", String(SVG_H));
  if (!cloned.getAttribute("viewBox")) {
    cloned.setAttribute("viewBox", `0 0 ${SVG_W} ${SVG_H}`);
  }

  const serialized = new XMLSerializer().serializeToString(cloned);
  const svgBlob = new Blob([serialized], {
    type: "image/svg+xml;charset=utf-8",
  });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = PX_W;
        canvas.height = PX_H;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get 2D canvas context"));
          return;
        }
        // Solid background so transparency doesn't become black on iOS
        ctx.fillStyle = "#1a3a1a";
        ctx.fillRect(0, 0, PX_W, PX_H);
        ctx.drawImage(img, 0, 0, PX_W, PX_H);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("canvas.toBlob returned null"));
          },
          "image/png"
        );
      };

      img.onerror = () => reject(new Error("Failed to load SVG as image"));
      img.src = svgUrl;
    });

    // ── Web Share API — shows native iOS/Android share sheet ───────────
    const pngFile = new File([pngBlob], filename, { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [pngFile] })) {
      await navigator.share({
        files: [pngFile],
        title: filename.replace(/\.png$/i, ""),
      });
      return;
    }

    // ── Anchor download fallback (desktop + unsupported browsers) ───────
    const downloadUrl = URL.createObjectURL(pngBlob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    // Delay revoke so Safari has time to start the download
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    }, 200);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

// ─── Sub-components ─────────────────────────────────────────────────────────

interface PlayerRowProps {
  role: string;
  color: string;
}

function PlayerRow({ role, color }: PlayerRowProps) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-md hover:bg-white/5 transition-colors">
      <span
        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
        style={{ backgroundColor: color }}
      >
        {role.slice(0, 2)}
      </span>
      <span className="text-sm text-foreground/80 font-medium">{role}</span>
    </div>
  );
}

interface SectionHeaderProps {
  label: string;
}

function SectionHeader({ label }: SectionHeaderProps) {
  return (
    <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 select-none">
      {label}
    </p>
  );
}

interface DetailRowProps {
  label: string;
  value: React.ReactNode;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex flex-col gap-0.5 px-3 py-2">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
        {label}
      </span>
      <div className="text-sm text-foreground font-medium">{value}</div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function LibraryDetail() {
  const params = useParams();
  const id = params.id as string;

  const { data: play, isLoading } = useGetPlay(id, {
    query: { enabled: !!id, queryKey: getGetPlayQueryKey(id) },
  });

  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Ref on the <main> wrapper — exportCanvasToPng queries for the SVG inside it
  const canvasContainerRef = useRef<HTMLElement>(null);

  const handleSaveToPhone = useCallback(async () => {
    if (!canvasContainerRef.current || isSaving) return;
    setIsSaving(true);
    try {
      const raw = play?.title?.trim() || "play";
      // Strip characters that are invalid in filenames
      const safeTitle = raw.replace(/[^a-z0-9_\-\s]/gi, "").trim() || "play";
      await exportCanvasToPng(canvasContainerRef.current, `${safeTitle}.png`);
    } catch (err) {
      console.error("[LibraryDetail] Save to phone failed:", err);
    } finally {
      setIsSaving(false);
    }
  }, [play?.title, isSaving]);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-[calc(100vh-48px)] items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  // ── Not found state ────────────────────────────────────────────────────────
  if (!play) {
    return (
      <AppLayout>
        <div className="flex h-[calc(100vh-48px)] flex-col items-center justify-center gap-4">
          <AlertCircle className="w-8 h-8 text-muted-foreground" />
          <p className="text-muted-foreground text-sm">Play not found.</p>
          <Link href="/library">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back to Library
            </Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  // ── Derived data ───────────────────────────────────────────────────────────
  const players: PlayerToken[] = play.players ?? [];
  const routes: RouteSegment[] = play.routes ?? [];

  const offensePlayers = players.filter((p) => p.team === "offense");
  const defensePlayers = players.filter((p) => p.team === "defense");

  const tags: string[] = play.tags ?? [];
  const coachingNotes: string = play.coachingNotes ?? play.notes ?? "";

  // ── 3-panel layout ─────────────────────────────────────────────────────────
  return (
    <AppLayout>
      {/* ── Top header bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-border/60 bg-background flex-shrink-0">
        {/* Left: back link + title */}
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/library">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-foreground px-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Library
            </Button>
          </Link>
          <Separator orientation="vertical" className="h-4" />
          <span className="text-sm font-semibold truncate max-w-[260px]">
            {play.title ?? "Untitled Play"}
          </span>
          {play.format && (
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 shrink-0"
            >
              {play.format}
            </Badge>
          )}
        </div>

        {/* Right: animate + save + edit */}
        <div className="flex items-center gap-2">
          <Button
            variant={isAnimating ? "default" : "outline"}
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => setIsAnimating((prev) => !prev)}
          >
            {isAnimating ? (
              <>
                <Square className="w-3.5 h-3.5" />
                Stop
              </>
            ) : (
              <>
                <PlayIcon className="w-3.5 h-3.5" />
                Animate
              </>
            )}
          </Button>

          {/* ── Save to Phone ─────────────────────────────────────────────── */}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={handleSaveToPhone}
            disabled={isSaving}
            title="Save play as image"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            {/* Label: hidden on xs, visible on sm+ */}
            <span className="hidden sm:inline">
              {isSaving ? "Saving…" : "Save"}
            </span>
          </Button>

          <Link href={`/designer/${id}`}>
            <Button size="sm" className="gap-1.5 text-xs">
              <Edit2 className="w-3.5 h-3.5" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* ── 3-panel body ───────────────────────────────────────────────────── */}
      <div className="flex h-[calc(100vh-96px)] overflow-hidden bg-background">
        {/* ── LEFT SIDEBAR: Player roster ──────────────────────────────────── */}
        <aside className="w-[200px] flex-shrink-0 border-r border-border/60 flex flex-col">
          <ScrollArea className="flex-1">
            <div className="py-2">
              {offensePlayers.length > 0 && (
                <>
                  <SectionHeader label="Offense" />
                  {offensePlayers.map((p) => (
                    <PlayerRow
                      key={p.id}
                      role={p.role}
                      color={getRoleColor(p.role)}
                    />
                  ))}
                </>
              )}

              {defensePlayers.length > 0 && (
                <>
                  {offensePlayers.length > 0 && (
                    <Separator className="my-2 mx-3" />
                  )}
                  <SectionHeader label="Defense" />
                  {defensePlayers.map((p) => (
                    <PlayerRow
                      key={p.id}
                      role={p.role}
                      color={getRoleColor(p.role)}
                    />
                  ))}
                </>
              )}

              {players.length === 0 && (
                <p className="px-3 py-4 text-xs text-muted-foreground/50 text-center">
                  No players on this play.
                </p>
              )}
            </div>
          </ScrollArea>
        </aside>

        {/* ── CENTER: Canvas ────────────────────────────────────────────────── */}
        {/*
          ref is placed here (not on DesignerCanvas itself) so that
          querySelector("svg") reliably finds the SVG regardless of how
          DesignerCanvas renders its internals.
        */}
        <main
          ref={canvasContainerRef}
          className="flex-1 overflow-hidden flex items-start justify-center bg-muted/20"
        >
          <DesignerCanvas
            players={players}
            routes={routes}
            format={play.format ?? "5v5"}
            // Read-only — all mutation handlers are no-ops
            onUpdatePlayer={noopPlayer}
            onUpdatePlayerPosition={noopPlayer}
            onRemovePlayer={noopStr}
            onAddRoute={noopRoute}
            onUpdateRoute={noopRoute}
            onRemoveRoute={noopStr}
            onDropPlayer={noopDrop}
            selectedPlayerId={selectedPlayerId}
            setSelectedPlayerId={setSelectedPlayerId}
            selectedRouteId={selectedRouteId}
            setSelectedRouteId={setSelectedRouteId}
            isAnimating={isAnimating}
          />
        </main>

        {/* ── RIGHT SIDEBAR: Play details ───────────────────────────────────── */}
        <aside className="w-[250px] flex-shrink-0 border-l border-border/60 flex flex-col">
          <ScrollArea className="flex-1">
            <div className="py-2">
              <SectionHeader label="Play Details" />

              <DetailRow label="Title" value={play.title ?? "—"} />

              <DetailRow
                label="Format"
                value={
                  play.format ? (
                    <Badge variant="outline" className="text-xs font-medium">
                      {play.format}
                    </Badge>
                  ) : (
                    "—"
                  )
                }
              />

              {play.side && (
                <DetailRow
                  label="Side"
                  value={
                    <Badge variant="secondary" className="text-xs capitalize">
                      {play.side}
                    </Badge>
                  }
                />
              )}

              {/* Man / Zone beater toggles (read-only display) */}
              <div className="px-3 py-2 flex flex-col gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  Coverage Beaters
                </span>
                <div className="flex gap-2">
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-colors ${
                      play.manBeater
                        ? "border-blue-500/60 bg-blue-500/10 text-blue-400"
                        : "border-border/40 text-muted-foreground/40"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        play.manBeater
                          ? "bg-blue-400"
                          : "bg-muted-foreground/30"
                      }`}
                    />
                    Man
                  </div>
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-colors ${
                      play.zoneBeater
                        ? "border-amber-500/60 bg-amber-500/10 text-amber-400"
                        : "border-border/40 text-muted-foreground/40"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        play.zoneBeater
                          ? "bg-amber-400"
                          : "bg-muted-foreground/30"
                      }`}
                    />
                    Zone
                  </div>
                </div>
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div className="px-3 py-2 flex flex-col gap-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                    Tags
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Coaching Notes */}
              {coachingNotes && (
                <>
                  <Separator className="my-2 mx-3" />
                  <div className="px-3 py-2 flex flex-col gap-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                      Coaching Notes
                    </span>
                    <p className="text-xs text-foreground/70 leading-relaxed whitespace-pre-wrap">
                      {coachingNotes}
                    </p>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </aside>
      </div>
    </AppLayout>
  );
}
