import { useState, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Printer,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  Search,
  BookOpen,
  LayoutGrid,
  LayoutList,
} from "lucide-react";
import {
  usePlaybook,
  usePlaybookPlays,
  useAddPlayToPlaybook,
  useRemovePlayFromPlaybook,
  useReorderPlaybookPlays,
  type PlayInPlaybook,
} from "@/lib/playbook-api";
import { useListPlays } from "@workspace/api-client-react";
import { useSettings } from "@/lib/settings";

// ── Mini SVG field preview ─────────────────────────────────────────────────────
function MiniField({ play }: { play: PlayInPlaybook }) {
  const players = Array.isArray(play.players) ? play.players : [];
  const routes = Array.isArray(play.routes) ? play.routes : [];

  return (
    <svg viewBox="0 0 106.6 240" className="w-full h-full" style={{ background: "#1a4a1a" }}>
      <rect x="0" y="0" width="106.6" height="240" fill="#1a4a1a" />
      <line x1="0" y1="120" x2="106.6" y2="120" stroke="#ffffff44" strokeWidth="0.5" strokeDasharray="2,2" />
      {routes.map((route: unknown, i: number) => {
        const r = route as { points?: Array<{ x: number; y: number }> };
        if (!r.points || r.points.length < 2) return null;
        const pts = r.points.map((p) => `${(p.x / 533) * 106.6},${(p.y / 1200) * 240}`).join(" ");
        return (
          <polyline key={i} points={pts} fill="none" stroke="#4ade80" strokeWidth="0.8" strokeLinejoin="round" strokeLinecap="round" />
        );
      })}
      {players.map((player: unknown, i: number) => {
        const p = player as { x?: number; y?: number; role?: string; color?: string };
        if (p.x == null || p.y == null) return null;
        const cx = (p.x / 533) * 106.6;
        const cy = (p.y / 1200) * 240;
        return <circle key={i} cx={cx} cy={cy} r="3" fill={p.color || "#ffffff"} />;
      })}
    </svg>
  );
}

// ── Add Play picker dialog ────────────────────────────────────────────────────
function AddPlayDialog({
  open,
  onOpenChange,
  playbookId,
  existingPlayIds,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  playbookId: string;
  existingPlayIds: Set<string>;
}) {
  const [search, setSearch] = useState("");
  const { data: plays } = useListPlays({});
  const addMutation = useAddPlayToPlaybook();

  const filtered = (plays ?? []).filter(
    (p) => !existingPlayIds.has(p.id) && p.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add a Play</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search plays…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <ScrollArea className="h-[340px]">
          {filtered.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-12">
              {plays?.length === 0 ? "No plays in your library yet." : "No plays match your search."}
            </div>
          ) : (
            <div className="space-y-1 pr-2">
              {filtered.map((play) => (
                <button
                  key={play.id}
                  onClick={() => addMutation.mutate({ playbookId, playId: play.id })}
                  disabled={addMutation.isPending}
                  className="w-full flex items-center gap-3 p-2 rounded-lg text-left hover:bg-muted/60 transition-colors group"
                >
                  <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center text-xs font-bold shrink-0">
                    {play.format}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{play.title}</div>
                    <div className="text-xs text-muted-foreground capitalize">{play.mode}</div>
                  </div>
                  <Plus className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ── PlayRow (screen) & PlayPrintCard (print) ──────────────────────────────────
function PlayRow({
  play,
  index,
  total,
  playbookId,
  onMoveUp,
  onMoveDown,
}: {
  play: PlayInPlaybook;
  index: number;
  total: number;
  playbookId: string;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const { settings } = useSettings();
  const removeMutation = useRemovePlayFromPlaybook();

  return (
    <div className="flex items-center gap-4 p-3 rounded-xl border bg-card group">
      <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-border/50">
        <MiniField play={play} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold truncate">{play.title}</div>
        <div className="text-xs text-muted-foreground capitalize mt-0.5 flex items-center gap-2 flex-wrap">
          <span>{play.mode}</span>
          <span className="text-border">·</span>
          <span>{play.format}</span>
          {play.isManBeater && <Badge variant="secondary" className="text-[10px] h-4">Man</Badge>}
          {play.isZoneBeater && <Badge variant="secondary" className="text-[10px] h-4">Zone</Badge>}
        </div>
        {play.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {play.tags.map((tag) => {
              const def = settings.tags.find((t) => t.name === tag);
              return (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-[10px] h-4"
                  style={def ? { backgroundColor: def.color + "22", borderColor: def.color + "66", color: def.color } : undefined}
                >
                  {tag}
                </Badge>
              );
            })}
          </div>
        )}
        {play.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-1 italic">{play.notes}</p>}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={index === 0} onClick={onMoveUp}>
          <ArrowUp className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={index === total - 1} onClick={onMoveDown}>
          <ArrowDown className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => removeMutation.mutate({ playbookId, playId: play.id })}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PlaybookDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const id = params.id;
  const { settings } = useSettings();

  const { data: playbook, isLoading: isLoadingPb } = usePlaybook(id);
  const { data: plays, isLoading: isLoadingPlays } = usePlaybookPlays(id);
  const reorderMutation = useReorderPlaybookPlays();

  const [showAdd, setShowAdd] = useState(false);
  const [twoPerPage, setTwoPerPage] = useState(false);

  const existingIds = new Set((plays ?? []).map((p) => p.id));

  const move = useCallback(
    (index: number, direction: -1 | 1) => {
      if (!plays) return;
      const newPlays = [...plays];
      const target = index + direction;
      if (target < 0 || target >= newPlays.length) return;
      [newPlays[index], newPlays[target]] = [newPlays[target], newPlays[index]];
      reorderMutation.mutate({ playbookId: id, playIds: newPlays.map((p) => p.id) });
    },
    [plays, id, reorderMutation],
  );

  const isLoading = isLoadingPb || isLoadingPlays;
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <AppLayout
      headerTitle={playbook?.name ?? "Playbook"}
      headerActions={
        <div className="flex items-center gap-2 print:hidden">
          <Button
            variant={twoPerPage ? "secondary" : "outline"}
            size="sm"
            className="gap-1.5"
            onClick={() => setTwoPerPage((v) => !v)}
            title="Toggle 2 plays per page when printing"
          >
            {twoPerPage ? <LayoutGrid className="h-4 w-4" /> : <LayoutList className="h-4 w-4" />}
            {twoPerPage ? "2/page" : "1/page"}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4" />
            Add Play
          </Button>
        </div>
      }
    >
      <div className="p-6 max-w-3xl mx-auto w-full">
        {/* Back link */}
        <button
          onClick={() => setLocation("/playbooks")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors print:hidden"
        >
          <ChevronLeft className="h-4 w-4" />
          All Playbooks
        </button>

        {/* ── PRINT: Cover page ─────────────────────────────────────────────── */}
        <div className="hidden print:block print-cover-page">
          <div style={{ textAlign: "center", padding: "60px 40px 40px", borderBottom: "3px solid #333" }}>
            <div style={{ fontSize: "13px", textTransform: "uppercase", letterSpacing: "2px", color: "#666", marginBottom: "24px" }}>
              {settings.teamName}
            </div>
            <h1 style={{ fontSize: "40px", fontWeight: "900", margin: "0 0 12px", lineHeight: 1.1 }}>
              {playbook?.name}
            </h1>
            {playbook?.description && (
              <p style={{ fontSize: "15px", color: "#444", margin: "0 0 20px" }}>{playbook.description}</p>
            )}
            <div style={{ display: "flex", justifyContent: "center", gap: "24px", fontSize: "12px", color: "#888", marginTop: "16px" }}>
              <span>{playbook?.format?.toUpperCase()} Format</span>
              <span>·</span>
              <span>{plays?.length ?? 0} Plays</span>
              <span>·</span>
              <span>{today}</span>
            </div>
          </div>

          {/* TOC */}
          <div style={{ padding: "32px 40px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "16px", borderBottom: "1px solid #ddd", paddingBottom: "8px" }}>
              Table of Contents
            </h2>
            <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {(plays ?? []).map((play, i) => (
                <li key={play.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px dotted #eee", fontSize: "13px" }}>
                  <span>
                    <strong style={{ marginRight: "10px", color: "#888" }}>{String(i + 1).padStart(2, "0")}</strong>
                    {play.title}
                    {play.tags?.length > 0 && (
                      <span style={{ marginLeft: "8px", fontSize: "10px", color: "#888" }}>
                        {play.tags.join(", ")}
                      </span>
                    )}
                  </span>
                  <span style={{ color: "#aaa" }}>p.{i + 2}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Screen header */}
        <div className="mb-6 print:hidden">
          {isLoadingPb ? (
            <Skeleton className="h-9 w-48" />
          ) : (
            <>
              <h2 className="text-3xl font-bold tracking-tight">{playbook?.name}</h2>
              {playbook?.description && <p className="text-muted-foreground mt-1">{playbook.description}</p>}
            </>
          )}
        </div>

        {/* Play list */}
        {isLoading ? (
          <div className="space-y-3">
            {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : !plays?.length ? (
          <div className="border border-dashed rounded-xl p-12 text-center print:hidden">
            <BookOpen className="h-10 w-10 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground text-sm">No plays in this playbook yet.</p>
            <Button variant="outline" className="mt-4 gap-1.5" onClick={() => setShowAdd(true)}>
              <Plus className="h-4 w-4" />
              Add a play
            </Button>
          </div>
        ) : (
          <>
            {/* Screen view */}
            <div className="space-y-3 print:hidden">
              {plays.map((play, index) => (
                <PlayRow
                  key={play.id}
                  play={play}
                  index={index}
                  total={plays.length}
                  playbookId={id}
                  onMoveUp={() => move(index, -1)}
                  onMoveDown={() => move(index, 1)}
                />
              ))}
              <div className="text-xs text-muted-foreground text-center pt-2">
                {plays.length} {plays.length === 1 ? "play" : "plays"} · Use arrows to reorder
              </div>
            </div>

            {/* Print view */}
            <div className={`hidden print:block ${twoPerPage ? "print-two-per-page" : "print-one-per-page"}`}>
              {plays.map((play, index) => {
                const tags = play.tags ?? [];
                return (
                  <div key={play.id} className="print-play-card" style={{
                    pageBreakInside: "avoid",
                    pageBreakAfter: twoPerPage ? (index % 2 === 1 ? "always" : "auto") : "always",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    padding: "16px",
                    marginBottom: twoPerPage ? "16px" : "0",
                    position: "relative",
                  }}>
                    {/* Play header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px", borderBottom: "1px solid #eee", paddingBottom: "8px" }}>
                      <div>
                        <div style={{ fontSize: "10px", color: "#aaa", textTransform: "uppercase", letterSpacing: "1px" }}>
                          Play {String(index + 1).padStart(2, "0")}
                        </div>
                        <h3 style={{ fontSize: "18px", fontWeight: "800", margin: "2px 0" }}>{play.title}</h3>
                        {tags.length > 0 && (
                          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "4px" }}>
                            {tags.map((tag) => (
                              <span key={tag} style={{ fontSize: "9px", padding: "1px 6px", borderRadius: "4px", border: "1px solid #ccc", backgroundColor: "#f5f5f5" }}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: "4px" }}>
                        <span style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "4px", backgroundColor: "#e5e7eb", fontWeight: "600" }}>
                          {play.format}
                        </span>
                        <span style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "4px", backgroundColor: play.mode === "offense" ? "#dbeafe" : "#fee2e2", color: play.mode === "offense" ? "#1d4ed8" : "#b91c1c", fontWeight: "600" }}>
                          {play.mode}
                        </span>
                      </div>
                    </div>

                    {/* Diagram + notes */}
                    <div style={{ display: "flex", gap: "16px" }}>
                      <div style={{ width: twoPerPage ? "100px" : "140px", height: twoPerPage ? "100px" : "140px", flexShrink: 0, borderRadius: "6px", overflow: "hidden", border: "1px solid #ddd" }}>
                        <MiniField play={play} />
                      </div>
                      <div style={{ flex: 1 }}>
                        {play.notes ? (
                          <>
                            <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "1px", color: "#999", marginBottom: "4px" }}>Coaching Notes</div>
                            <p style={{ fontSize: "11px", lineHeight: "1.5", color: "#333", whiteSpace: "pre-wrap" }}>{play.notes}</p>
                          </>
                        ) : (
                          <p style={{ fontSize: "11px", color: "#bbb", fontStyle: "italic" }}>No coaching notes.</p>
                        )}
                        <div style={{ marginTop: "8px", fontSize: "10px", color: "#bbb" }}>
                          {play.isManBeater && "Man-Beater  "}
                          {play.isZoneBeater && "Zone-Beater"}
                        </div>
                      </div>
                    </div>

                    {/* Page number footer */}
                    <div style={{ position: "absolute", bottom: "6px", right: "12px", fontSize: "9px", color: "#ccc" }}>
                      {settings.teamName} · {today} · p.{index + 2}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <AddPlayDialog open={showAdd} onOpenChange={setShowAdd} playbookId={id} existingPlayIds={existingIds} />
    </AppLayout>
  );
}
