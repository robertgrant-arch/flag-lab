import { ScrollArea } from "@/components/ui/scroll-area";
import type { PlayerToken } from "@/hooks/use-designer-state";

interface DesignerSidebarLeftProps {
  onAddPlayer: (player: PlayerToken) => void;
}

const OFFENSE_ROLES = [
  { role: "QB", color: "#ef4444", label: "Quarterback" },
  { role: "C", color: "#f97316", label: "Center" },
  { role: "WR1", color: "#3b82f6", label: "Wide Receiver 1" },
  { role: "WR2", color: "#3b82f6", label: "Wide Receiver 2" },
  { role: "WR3", color: "#60a5fa", label: "Wide Receiver 3" },
  { role: "RB", color: "#22c55e", label: "Running Back" },
  { role: "TE", color: "#a855f7", label: "Tight End" },
  { role: "FB", color: "#16a34a", label: "Fullback" },
];

const DEFENSE_ROLES = [
  { role: "CB1", color: "#ef4444", label: "Cornerback 1" },
  { role: "CB2", color: "#ef4444", label: "Cornerback 2" },
  { role: "S", color: "#dc2626", label: "Safety" },
  { role: "LB", color: "#f59e0b", label: "Linebacker" },
  { role: "Rusher", color: "#b91c1c", label: "Pass Rusher" },
  { role: "DB3", color: "#fca5a5", label: "Defensive Back" },
];

function mkPlayer(role: string, color: string, team: "offense" | "defense"): PlayerToken {
  return {
    id: `player-${role}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    role,
    label: role,
    team,
    x: team === "offense" ? 266 : 266,
    y: team === "offense" ? 700 : 500,
    color,
  };
}

interface RoleButtonProps {
  role: string;
  color: string;
  team: "offense" | "defense";
  label: string;
  onAddPlayer: (p: PlayerToken) => void;
}

function RoleButton({ role, color, team, label, onAddPlayer }: RoleButtonProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/role", role);
    e.dataTransfer.setData("text/team", team);
    e.dataTransfer.setData("text/color", color);
    e.dataTransfer.effectAllowed = "copy";
    const ghost = document.createElement("div");
    ghost.style.cssText = `
      width:36px;height:36px;border-radius:50%;display:flex;align-items:center;
      justify-content:center;color:white;font-size:11px;font-weight:bold;
      background:${color};position:fixed;top:-100px;left:-100px;z-index:9999;
    `;
    ghost.textContent = role.slice(0, 3);
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 18, 18);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  return (
    <button
      draggable
      onDragStart={handleDragStart}
      onClick={() => onAddPlayer(mkPlayer(role, color, team))}
      title={`${label} — click to add, or drag to field`}
      className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-border bg-background hover:bg-muted hover:border-primary/50 transition-all group w-full text-left cursor-grab active:cursor-grabbing"
    >
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm text-[10px] font-bold"
        style={{ background: color }}
      >
        {role.length > 3 ? role.slice(0, 3) : role}
      </div>
      <span className="text-xs font-medium truncate">{role}</span>
    </button>
  );
}

export function DesignerSidebarLeft({ onAddPlayer }: DesignerSidebarLeftProps) {
  return (
    <div className="w-52 border-r border-border bg-card flex flex-col h-full shrink-0">
      <div className="px-4 py-3 border-b">
        <div className="font-semibold text-sm">Roster</div>
        <div className="text-[11px] text-muted-foreground mt-0.5">Drag to field or click to place</div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 px-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Offense</h4>
            </div>
            {OFFENSE_ROLES.map(({ role, color, label }) => (
              <RoleButton key={role} role={role} color={color} team="offense" label={label} onAddPlayer={onAddPlayer} />
            ))}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 px-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Defense</h4>
            </div>
            {DEFENSE_ROLES.map(({ role, color, label }) => (
              <RoleButton key={role} role={role} color={color} team="defense" label={label} onAddPlayer={onAddPlayer} />
            ))}
          </div>

          <div className="border-t border-border/50 pt-3 space-y-1 text-[10px] text-muted-foreground">
            <p>🖱 <strong>Drag</strong> to place at a specific position</p>
            <p>🖱 <strong>Click</strong> to add at center field</p>
            <p>✏️ <strong>Double-click</strong> a player to draw their route</p>
            <p>🖱 <strong>Right-click</strong> a player for options</p>
            <p>⌨️ <strong>Del / Backspace</strong> to delete selected</p>
          </div>

        </div>
      </ScrollArea>
    </div>
  );
}
