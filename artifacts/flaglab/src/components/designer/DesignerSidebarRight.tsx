import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { Play, PlayerToken, RouteSegment } from "@/hooks/use-designer-state";
import { Trash2, X, Plus, Route, Pencil } from "lucide-react";
import { useState } from "react";
import { useSettings } from "@/lib/settings";

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
  TE1: "#a855f7",
  TE2: "#c084fc",
  LB: "#f59e0b",
  CB: "#ef4444",
  CB1: "#ef4444",
  CB2: "#f87171",
  S: "#dc2626",
  Rusher: "#b91c1c",
  DB3: "#fca5a5",
};

const ROUTE_STYLES = [
  { value: "solid", label: "Solid — run route" },
  { value: "dashed", label: "Dashed — option/read" },
  { value: "dotted", label: "Dotted — motion" },
  { value: "wavy", label: "Wavy — shift/screen" },
];

const ROUTE_COLORS = ["#ffffff", "#60a5fa", "#22c55e", "#ef4444", "#f97316", "#eab308", "#a855f7", "#ec4899"];

interface DesignerSidebarRightProps {
  play: Play;
  onUpdatePlay: (updates: Partial<Play>) => void;
  selectedPlayer: PlayerToken | null;
  onUpdatePlayer: (player: PlayerToken) => void;
  onRemovePlayer: (id: string) => void;
  selectedRoute: RouteSegment | null;
  onUpdateRoute: (route: RouteSegment) => void;
  onRemoveRoute: (id: string) => void;
  isDrawingRoute?: boolean;
  onStartDrawRoute?: (playerId: string) => void;
}

export function DesignerSidebarRight({
  play,
  onUpdatePlay,
  selectedPlayer,
  onUpdatePlayer,
  onRemovePlayer,
  selectedRoute,
  onUpdateRoute,
  onRemoveRoute,
  isDrawingRoute = false,
  onStartDrawRoute,
}: DesignerSidebarRightProps) {
  const { settings } = useSettings();
  const [tagInput, setTagInput] = useState("");

  const currentTags: string[] = Array.isArray(play.tags) ? (play.tags as string[]) : [];

  function addTag(tag: string) {
    const trimmed = tag.trim();
    if (!trimmed || currentTags.includes(trimmed)) return;
    onUpdatePlay({ tags: [...currentTags, trimmed] });
    setTagInput("");
  }

  function removeTag(tag: string) {
    onUpdatePlay({ tags: currentTags.filter((t) => t !== tag) });
  }

  return (
    <div className="w-72 border-l border-border bg-card flex flex-col h-full shrink-0">
      <div className="px-4 py-3 border-b font-semibold text-sm">Properties</div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">

          {selectedPlayer ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-primary text-sm">Player</h3>
                <Badge variant="outline" className="text-[10px]" style={{
                  backgroundColor: (selectedPlayer.team === "offense" ? "#3b82f6" : "#ef4444") + "22",
                  borderColor: (selectedPlayer.team === "offense" ? "#3b82f6" : "#ef4444") + "66",
                  color: selectedPlayer.team === "offense" ? "#60a5fa" : "#f87171",
                }}>
                  {selectedPlayer.team}
                </Badge>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Role Label</Label>
                <Input
                  value={selectedPlayer.role}
                  onChange={(e) => onUpdatePlayer({ ...selectedPlayer, role: e.target.value, label: e.target.value })}
                  placeholder="QB, WR1, RB…"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Color</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    className="w-10 h-10 p-0.5 rounded-lg border border-input bg-transparent cursor-pointer"
                    value={selectedPlayer.color || "#3b82f6"}
                    onChange={(e) => onUpdatePlayer({ ...selectedPlayer, color: e.target.value })}
                  />
                  <Input
                    className="flex-1 font-mono text-xs"
                    value={selectedPlayer.color || "#3b82f6"}
                    onChange={(e) => onUpdatePlayer({ ...selectedPlayer, color: e.target.value })}
                  />
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {Object.entries(ROLE_COLORS).slice(0, 10).map(([role, color]) => (
                    <button
                      key={role}
                      className="text-[9px] px-1.5 py-0.5 rounded border border-border hover:border-primary transition-colors font-medium"
                      style={{ backgroundColor: color + "33", color }}
                      onClick={() => onUpdatePlayer({ ...selectedPlayer, color })}
                      title={role}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Team Side</Label>
                <Select
                  value={selectedPlayer.team}
                  onValueChange={(v: "offense" | "defense") => onUpdatePlayer({ ...selectedPlayer, team: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="offense">Offense</SelectItem>
                    <SelectItem value="defense">Defense</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant={isDrawingRoute ? "default" : "secondary"}
                className="w-full gap-2"
                onClick={() => onStartDrawRoute?.(selectedPlayer.id)}
                disabled={isDrawingRoute}
              >
                <Pencil className="h-4 w-4" />
                {isDrawingRoute ? "Drawing… (ESC to finish)" : "Draw Route"}
              </Button>

              <Button
                variant="destructive"
                size="sm"
                className="w-full gap-2"
                onClick={() => onRemovePlayer(selectedPlayer.id)}
              >
                <Trash2 className="h-4 w-4" /> Remove Player
              </Button>

              <p className="text-[10px] text-muted-foreground text-center pt-1">
                💡 Or double-click the player on the field to draw their route
              </p>
            </div>

          ) : selectedRoute ? (
            <div className="space-y-4">
              <h3 className="font-semibold text-primary text-sm">Route</h3>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Line Style</Label>
                <Select
                  value={selectedRoute.style || "solid"}
                  onValueChange={(val) => onUpdateRoute({ ...selectedRoute, style: val as any })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROUTE_STYLES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Color</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    className="w-10 h-10 p-0.5 rounded-lg border border-input bg-transparent cursor-pointer"
                    value={selectedRoute.color || "#ffffff"}
                    onChange={(e) => onUpdateRoute({ ...selectedRoute, color: e.target.value })}
                  />
                  <Input
                    className="flex-1 font-mono text-xs"
                    value={selectedRoute.color || "#ffffff"}
                    onChange={(e) => onUpdateRoute({ ...selectedRoute, color: e.target.value })}
                  />
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {ROUTE_COLORS.map((c) => (
                    <button
                      key={c}
                      className="w-6 h-6 rounded-full border-2 transition-all hover:scale-110"
                      style={{
                        backgroundColor: c,
                        borderColor: selectedRoute.color === c ? "white" : "transparent",
                        outline: selectedRoute.color === c ? `2px solid white` : "none",
                      }}
                      onClick={() => onUpdateRoute({ ...selectedRoute, color: c })}
                    />
                  ))}
                </div>
              </div>

              <Button
                variant="destructive"
                size="sm"
                className="w-full gap-2"
                onClick={() => onRemoveRoute(selectedRoute.id)}
              >
                <Trash2 className="h-4 w-4" /> Remove Route
              </Button>
            </div>

          ) : (
            <div className="space-y-4">
              <h3 className="font-semibold text-primary text-sm">Play Details</h3>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Title</Label>
                <Input
                  value={play.title}
                  onChange={(e) => onUpdatePlay({ title: e.target.value })}
                  placeholder="e.g. Smash Right"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Format</Label>
                  <Select value={play.format} onValueChange={(val) => onUpdatePlay({ format: val })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5v5">5v5</SelectItem>
                      <SelectItem value="7v7">7v7</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Side</Label>
                  <Select value={play.mode} onValueChange={(val) => onUpdatePlay({ mode: val })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="offense">Offense</SelectItem>
                      <SelectItem value="defense">Defense</SelectItem>
                      <SelectItem value="special">Special</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  className={`flex-1 text-xs py-2 rounded-lg border transition-all font-medium ${(play as any).isManBeater ? "bg-blue-500/20 border-blue-500/60 text-blue-400" : "border-border text-muted-foreground hover:bg-muted"}`}
                  onClick={() => onUpdatePlay({ isManBeater: !(play as any).isManBeater } as any)}
                >
                  Man-Beater
                </button>
                <button
                  className={`flex-1 text-xs py-2 rounded-lg border transition-all font-medium ${(play as any).isZoneBeater ? "bg-purple-500/20 border-purple-500/60 text-purple-400" : "border-border text-muted-foreground hover:bg-muted"}`}
                  onClick={() => onUpdatePlay({ isZoneBeater: !(play as any).isZoneBeater } as any)}
                >
                  Zone-Beater
                </button>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Tags</Label>
                <div className="flex flex-wrap gap-1 min-h-[28px]">
                  {currentTags.map((tag) => {
                    const tagDef = settings.tags.find((t) => t.name === tag);
                    return (
                      <Badge key={tag} variant="outline" className="text-[10px] gap-1 pr-1"
                        style={tagDef ? {
                          backgroundColor: tagDef.color + "22",
                          borderColor: tagDef.color + "66",
                          color: tagDef.color,
                        } : undefined}>
                        {tag}
                        <button onClick={() => removeTag(tag)}><X className="h-2.5 w-2.5" /></button>
                      </Badge>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-1">
                  {settings.tags.filter((t) => !currentTags.includes(t.name)).map((t) => (
                    <button key={t.name}
                      className="text-[10px] px-1.5 py-0.5 rounded border transition-colors"
                      style={{ backgroundColor: t.color + "22", borderColor: t.color + "66", color: t.color }}
                      onClick={() => addTag(t.name)}>
                      + {t.name}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1">
                  <Input className="h-7 text-xs flex-1" placeholder="Custom tag…"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") addTag(tagInput); }} />
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => addTag(tagInput)}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Coaching Notes</Label>
                <Textarea
                  value={play.notes || ""}
                  onChange={(e) => onUpdatePlay({ notes: e.target.value })}
                  placeholder="Coaching points, reads, adjustments…"
                  className="min-h-[100px] text-sm"
                />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
