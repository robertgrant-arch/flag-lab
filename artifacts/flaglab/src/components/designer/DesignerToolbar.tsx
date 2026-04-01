import { Button } from "@/components/ui/button";
import { Undo2, Redo2, Copy, Save, Play, Type, Grid3x3 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export interface PlayerPreset {
  id: string;
  role: string;
  x: number;
  y: number;
  color: string;
  team: "offense" | "defense";
}

interface FormationPreset {
  name: string;
  players: PlayerPreset[];
}

const FORMATION_PRESETS_5V5: FormationPreset[] = [
  {
    name: "Spread",
    players: [
      { id: "qb", role: "QB", x: 266, y: 480, color: "#ef4444", team: "offense" },
      { id: "wr1", role: "WR1", x: 53, y: 540, color: "#60a5fa", team: "offense" },
      { id: "wr2", role: "WR2", x: 153, y: 540, color: "#60a5fa", team: "offense" },
      { id: "wr3", role: "WR3", x: 380, y: 540, color: "#60a5fa", team: "offense" },
      { id: "wr4", role: "WR4", x: 480, y: 540, color: "#60a5fa", team: "offense" },
    ],
  },
  {
    name: "Trips Right",
    players: [
      { id: "qb", role: "QB", x: 180, y: 480, color: "#ef4444", team: "offense" },
      { id: "wr1", role: "WR1", x: 60, y: 540, color: "#60a5fa", team: "offense" },
      { id: "wr2", role: "WR2", x: 320, y: 540, color: "#60a5fa", team: "offense" },
      { id: "wr3", role: "WR3", x: 400, y: 540, color: "#60a5fa", team: "offense" },
      { id: "wr4", role: "WR4", x: 480, y: 540, color: "#60a5fa", team: "offense" },
    ],
  },
  {
    name: "Trips Left",
    players: [
      { id: "qb", role: "QB", x: 353, y: 480, color: "#ef4444", team: "offense" },
      { id: "wr1", role: "WR1", x: 53, y: 540, color: "#60a5fa", team: "offense" },
      { id: "wr2", role: "WR2", x: 133, y: 540, color: "#60a5fa", team: "offense" },
      { id: "wr3", role: "WR3", x: 213, y: 540, color: "#60a5fa", team: "offense" },
      { id: "wr4", role: "WR4", x: 453, y: 540, color: "#60a5fa", team: "offense" },
    ],
  },
  {
    name: "Bunch Right",
    players: [
      { id: "qb", role: "QB", x: 160, y: 470, color: "#ef4444", team: "offense" },
      { id: "wr1", role: "WR1", x: 60, y: 540, color: "#60a5fa", team: "offense" },
      { id: "wr2", role: "WR2", x: 360, y: 530, color: "#60a5fa", team: "offense" },
      { id: "wr3", role: "WR3", x: 420, y: 560, color: "#60a5fa", team: "offense" },
      { id: "wr4", role: "WR4", x: 420, y: 510, color: "#60a5fa", team: "offense" },
    ],
  },
  {
    name: "Empty Backfield",
    players: [
      { id: "qb", role: "QB", x: 266, y: 500, color: "#ef4444", team: "offense" },
      { id: "wr1", role: "WR1", x: 53, y: 545, color: "#60a5fa", team: "offense" },
      { id: "wr2", role: "WR2", x: 180, y: 545, color: "#60a5fa", team: "offense" },
      { id: "wr3", role: "WR3", x: 352, y: 545, color: "#60a5fa", team: "offense" },
      { id: "wr4", role: "WR4", x: 479, y: 545, color: "#60a5fa", team: "offense" },
    ],
  },
];

const FORMATION_PRESETS_7V7: FormationPreset[] = [
  {
    name: "Pro Set",
    players: [
      { id: "qb", role: "QB", x: 266, y: 455, color: "#ef4444", team: "offense" },
      { id: "c", role: "C", x: 266, y: 555, color: "#f97316", team: "offense" },
      { id: "wr1", role: "WR1", x: 53, y: 555, color: "#60a5fa", team: "offense" },
      { id: "wr2", role: "WR2", x: 479, y: 555, color: "#60a5fa", team: "offense" },
      { id: "rb", role: "RB", x: 266, y: 620, color: "#22c55e", team: "offense" },
      { id: "te1", role: "TE1", x: 160, y: 555, color: "#a855f7", team: "offense" },
      { id: "te2", role: "TE2", x: 373, y: 555, color: "#a855f7", team: "offense" },
    ],
  },
  {
    name: "Shotgun Spread",
    players: [
      { id: "qb", role: "QB", x: 266, y: 490, color: "#ef4444", team: "offense" },
      { id: "c", role: "C", x: 266, y: 560, color: "#f97316", team: "offense" },
      { id: "wr1", role: "WR1", x: 40, y: 555, color: "#60a5fa", team: "offense" },
      { id: "wr2", role: "WR2", x: 140, y: 555, color: "#60a5fa", team: "offense" },
      { id: "wr3", role: "WR3", x: 393, y: 555, color: "#60a5fa", team: "offense" },
      { id: "wr4", role: "WR4", x: 493, y: 555, color: "#60a5fa", team: "offense" },
      { id: "rb", role: "RB", x: 186, y: 490, color: "#22c55e", team: "offense" },
    ],
  },
  {
    name: "Trips Right TE",
    players: [
      { id: "qb", role: "QB", x: 200, y: 475, color: "#ef4444", team: "offense" },
      { id: "c", role: "C", x: 266, y: 560, color: "#f97316", team: "offense" },
      { id: "wr1", role: "WR1", x: 53, y: 555, color: "#60a5fa", team: "offense" },
      { id: "te", role: "TE", x: 340, y: 555, color: "#a855f7", team: "offense" },
      { id: "wr2", role: "WR2", x: 410, y: 555, color: "#60a5fa", team: "offense" },
      { id: "wr3", role: "WR3", x: 479, y: 555, color: "#60a5fa", team: "offense" },
      { id: "rb", role: "RB", x: 200, y: 560, color: "#22c55e", team: "offense" },
    ],
  },
  {
    name: "I-Form",
    players: [
      { id: "qb", role: "QB", x: 266, y: 455, color: "#ef4444", team: "offense" },
      { id: "c", role: "C", x: 266, y: 555, color: "#f97316", team: "offense" },
      { id: "wr1", role: "WR1", x: 53, y: 555, color: "#60a5fa", team: "offense" },
      { id: "wr2", role: "WR2", x: 479, y: 555, color: "#60a5fa", team: "offense" },
      { id: "fb", role: "FB", x: 266, y: 600, color: "#22c55e", team: "offense" },
      { id: "rb", role: "RB", x: 266, y: 650, color: "#22c55e", team: "offense" },
      { id: "te", role: "TE", x: 373, y: 555, color: "#a855f7", team: "offense" },
    ],
  },
];

interface DesignerToolbarProps {
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onSave: () => void;
  onAnimate: () => void;
  isSaving?: boolean;
  isNew?: boolean;
  onDuplicate?: () => void;
  onLoadFormation?: (players: PlayerPreset[]) => void;
  annotationMode?: boolean;
  onToggleAnnotation?: () => void;
  snapToGrid?: boolean;
  onToggleSnap?: () => void;
  currentFormat?: "5v5" | "7v7";
}

export function DesignerToolbar({
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onSave,
  onAnimate,
  isSaving,
  isNew,
  onDuplicate,
  onLoadFormation,
  annotationMode,
  onToggleAnnotation,
  snapToGrid,
  onToggleSnap,
  currentFormat,
}: DesignerToolbarProps) {
  const presets = currentFormat === "7v7" ? FORMATION_PRESETS_7V7 : FORMATION_PRESETS_5V5;

  return (
    <div className="h-12 border-b border-border bg-card flex items-center justify-between px-4 shrink-0 shadow-sm z-10">
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onUndo} disabled={!canUndo}>
              <Undo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onRedo} disabled={!canRedo}>
              <Redo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Redo</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6 mx-2" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onDuplicate} disabled={isNew || !onDuplicate}>
              <Copy className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Duplicate Play</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6 mx-2" />

        {onLoadFormation && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8 px-2">
                Formation Templates
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>{currentFormat ?? "5v5"} Formations</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {presets.map((preset) => (
                  <DropdownMenuItem key={preset.name} onClick={() => onLoadFormation(preset.players)}>
                    {preset.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {onToggleAnnotation && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={annotationMode ? "secondary" : "ghost"}
                size="icon"
                onClick={onToggleAnnotation}
                className={annotationMode ? "ring-1 ring-primary" : ""}
              >
                <Type className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Text Annotations {annotationMode ? "(active)" : ""}</TooltipContent>
          </Tooltip>
        )}

        {onToggleSnap !== undefined && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={snapToGrid ? "secondary" : "ghost"}
                size="icon"
                onClick={onToggleSnap}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Snap to Grid {snapToGrid ? "(on)" : "(off)"}</TooltipContent>
          </Tooltip>
        )}
      </div>

      <div className="flex items-center gap-2">
        {annotationMode && (
          <Badge variant="secondary" className="text-xs animate-pulse">
            Click field to add label
          </Badge>
        )}
        <Button variant="outline" size="sm" className="gap-2" onClick={onAnimate}>
          <Play className="h-4 w-4" />
          Animate
        </Button>
        <Button size="sm" className="gap-2" onClick={onSave} disabled={isSaving}>
          <Save className="h-4 w-4" />
          {isSaving ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
