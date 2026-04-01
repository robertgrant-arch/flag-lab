import { useState, useRef, useEffect, useCallback } from "react";
import type { PlayerToken, RouteSegment } from "@/hooks/use-designer-state";
import { usePlayAnimation } from "@/hooks/use-play-animation";
import { Slider } from "@/components/ui/slider";
import type { Annotation } from "@/pages/Designer";

const FIELD_WIDTH = 533;
const FIELD_HEIGHT = 1200;
const GRID_SIZE = 20;
const PLAYER_RADIUS = 16;

function snapCoord(v: number, snap: boolean): number {
  if (!snap) return v;
  return Math.round(v / GRID_SIZE) * GRID_SIZE;
}

interface ContextMenuState {
  x: number;
  y: number;
  type: "player" | "route";
  id: string;
}

interface DesignerCanvasProps {
  players: PlayerToken[];
  routes: RouteSegment[];
  format: string;
  onUpdatePlayer: (player: PlayerToken) => void;
  onUpdatePlayerPosition: (player: PlayerToken) => void;
  onRemovePlayer: (id: string) => void;
  onAddRoute: (route: RouteSegment) => void;
  onUpdateRoute: (route: RouteSegment) => void;
  onRemoveRoute: (id: string) => void;
  onDropPlayer: (role: string, team: "offense" | "defense", x: number, y: number) => void;
  selectedPlayerId: string | null;
  setSelectedPlayerId: (id: string | null) => void;
  selectedRouteId: string | null;
  setSelectedRouteId: (id: string | null) => void;
  isAnimating: boolean;
  annotationMode?: boolean;
  annotations?: Annotation[];
  onAddAnnotation?: (x: number, y: number, text: string) => void;
  onUpdateAnnotation?: (id: string, text: string) => void;
  onRemoveAnnotation?: (id: string) => void;
  snapToGrid?: boolean;
  drawRequest?: { playerId: string; at: number } | null;
  onDrawingStateChange?: (drawing: boolean) => void;
}

export function DesignerCanvas({
  players,
  routes,
  format,
  onUpdatePlayer,
  onUpdatePlayerPosition,
  onRemovePlayer,
  onAddRoute,
  onUpdateRoute,
  onRemoveRoute,
  onDropPlayer,
  selectedPlayerId,
  setSelectedPlayerId,
  selectedRouteId,
  setSelectedRouteId,
  isAnimating,
  annotationMode = false,
  annotations = [],
  onAddAnnotation,
  onUpdateAnnotation,
  onRemoveAnnotation,
  snapToGrid = false,
  drawRequest,
  onDrawingStateChange,
}: DesignerCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingPlayerId, setDraggingPlayerId] = useState<string | null>(null);
  const [drawingRouteForPlayer, setDrawingRouteForPlayer] = useState<string | null>(null);
  const [currentRoutePoints, setCurrentRoutePoints] = useState<{ x: number; y: number }[]>([]);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [pendingAnnotation, setPendingAnnotation] = useState<{ x: number; y: number } | null>(null);
  const [pendingAnnotationText, setPendingAnnotationText] = useState("");
  const [editingAnnotationId, setEditingAnnotationId] = useState<string | null>(null);
  const [editingAnnotationText, setEditingAnnotationText] = useState("");
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const draggedRef = useRef(false);
  const { animatedPlayers } = usePlayAnimation(players, routes, isAnimating, animationSpeed);
  const displayPlayers = isAnimating ? animatedPlayers : players;

  const getSVGCoords = useCallback((clientX: number, clientY: number): { x: number; y: number } => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const CTM = svgRef.current.getScreenCTM();
    if (!CTM) return { x: 0, y: 0 };
    return {
      x: Math.max(0, Math.min(FIELD_WIDTH, (clientX - CTM.e) / CTM.a)),
      y: Math.max(0, Math.min(FIELD_HEIGHT, (clientY - CTM.f) / CTM.d)),
    };
  }, []);

  const getMouseCoords = useCallback(
    (e: React.MouseEvent | MouseEvent) => getSVGCoords(e.clientX, e.clientY),
    [getSVGCoords],
  );

  const getScreenPos = useCallback(
    (svgX: number, svgY: number): { x: number; y: number } | null => {
      if (!svgRef.current) return null;
      const CTM = svgRef.current.getScreenCTM();
      if (!CTM) return null;
      const rect = svgRef.current.getBoundingClientRect();
      return { x: svgX * CTM.a + CTM.e - rect.left, y: svgY * CTM.d + CTM.f - rect.top };
    },
    [],
  );

  const finishRoute = useCallback(() => {
    if (drawingRouteForPlayer && currentRoutePoints.length > 1) {
      onAddRoute({
        id: `route-${Date.now()}`,
        playerId: drawingRouteForPlayer,
        type: "straight",
        points: currentRoutePoints,
        style: "solid",
        color: "#ffffff",
      });
    }
    setDrawingRouteForPlayer(null);
    setCurrentRoutePoints([]);
    setMousePos(null);
    onDrawingStateChange?.(false);
  }, [drawingRouteForPlayer, currentRoutePoints, onAddRoute, onDrawingStateChange]);

  useEffect(() => {
    if (!drawRequest) return;
    const player = players.find((p) => p.id === drawRequest.playerId);
    if (player) {
      setDrawingRouteForPlayer(drawRequest.playerId);
      setCurrentRoutePoints([{ x: player.x, y: player.y }]);
      setSelectedPlayerId(drawRequest.playerId);
      onDrawingStateChange?.(true);
    }
  }, [drawRequest?.at]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (contextMenu) { setContextMenu(null); return; }

      if (pendingAnnotation) {
        if (e.key === "Enter") commitAnnotation();
        if (e.key === "Escape") setPendingAnnotation(null);
        return;
      }
      if (editingAnnotationId) {
        if (e.key === "Escape") setEditingAnnotationId(null);
        return;
      }

      if (e.key === "Escape") {
        if (drawingRouteForPlayer) {
          finishRoute();
          return;
        }
        setSelectedPlayerId(null);
        setSelectedRouteId(null);
        return;
      }

      if ((e.key === "Delete" || e.key === "Backspace") &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA") {
        if (selectedPlayerId) {
          onRemovePlayer(selectedPlayerId);
          setSelectedPlayerId(null);
        } else if (selectedRouteId) {
          onRemoveRoute(selectedRouteId);
          setSelectedRouteId(null);
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    drawingRouteForPlayer, currentRoutePoints, selectedPlayerId, selectedRouteId,
    pendingAnnotation, editingAnnotationId, contextMenu, finishRoute,
    onRemovePlayer, onRemoveRoute,
  ]);

  const commitAnnotation = () => {
    if (!pendingAnnotation) return;
    const text = pendingAnnotationText.trim();
    if (text && onAddAnnotation) onAddAnnotation(pendingAnnotation.x, pendingAnnotation.y, text);
    setPendingAnnotation(null);
    setPendingAnnotationText("");
  };

  const handleSvgClick = (e: React.MouseEvent) => {
    if (draggingPlayerId || isAnimating || contextMenu) {
      setContextMenu(null);
      return;
    }
    setContextMenu(null);

    const raw = getMouseCoords(e);
    const coords = { x: snapCoord(raw.x, snapToGrid), y: snapCoord(raw.y, snapToGrid) };

    if (annotationMode && onAddAnnotation) {
      setPendingAnnotation(coords);
      setPendingAnnotationText("");
      return;
    }

    if (drawingRouteForPlayer) {
      setCurrentRoutePoints((prev) => [...prev, coords]);
    } else {
      setSelectedPlayerId(null);
      setSelectedRouteId(null);
    }
  };

  const handleSvgDoubleClick = (e: React.MouseEvent) => {
    if (drawingRouteForPlayer) {
      finishRoute();
    }
  };

  const handlePointerDown = (e: React.MouseEvent, playerId: string) => {
    if (isAnimating || annotationMode) return;
    if (e.button === 0) {
      if (drawingRouteForPlayer) return;
      setSelectedPlayerId(playerId);
      setSelectedRouteId(null);
      setDraggingPlayerId(playerId);
      draggedRef.current = false;
      e.stopPropagation();
    }
  };

  const handlePointerMove = (e: React.MouseEvent) => {
    if (isAnimating) return;
    const raw = getMouseCoords(e);
    const coords = { x: snapCoord(raw.x, snapToGrid), y: snapCoord(raw.y, snapToGrid) };

    if (draggingPlayerId) {
      draggedRef.current = true;
      const player = players.find((p) => p.id === draggingPlayerId);
      if (player) {
        onUpdatePlayerPosition({ ...player, ...coords });
      }
    }

    if (drawingRouteForPlayer && currentRoutePoints.length > 0) {
      setMousePos(coords);
    }
  };

  const handlePointerUp = () => {
    if (draggingPlayerId && draggedRef.current) {
      const player = players.find((p) => p.id === draggingPlayerId);
      if (player) {
        onUpdatePlayer(player);
      }
    }
    setDraggingPlayerId(null);
    draggedRef.current = false;
  };

  const handlePlayerDoubleClick = (e: React.MouseEvent, playerId: string) => {
    e.stopPropagation();
    if (isAnimating || annotationMode) return;
    if (drawingRouteForPlayer === playerId) {
      finishRoute();
    } else if (!drawingRouteForPlayer) {
      const player = players.find((p) => p.id === playerId);
      if (player) {
        setDrawingRouteForPlayer(playerId);
        setCurrentRoutePoints([{ x: player.x, y: player.y }]);
        setSelectedPlayerId(playerId);
        onDrawingStateChange?.(true);
      }
    }
  };

  const handlePlayerContextMenu = (e: React.MouseEvent, playerId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAnimating) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    setContextMenu({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      type: "player",
      id: playerId,
    });
    setSelectedPlayerId(playerId);
  };

  const handleRouteContextMenu = (e: React.MouseEvent, routeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAnimating) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    setContextMenu({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      type: "route",
      id: routeId,
    });
    setSelectedRouteId(routeId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    const hasPlayer = e.dataTransfer.types.includes("text/role");
    if (hasPlayer) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const role = e.dataTransfer.getData("text/role");
    const team = e.dataTransfer.getData("text/team") as "offense" | "defense";
    if (!role || !team) return;
    const raw = getSVGCoords(e.clientX, e.clientY);
    const x = snapCoord(raw.x, snapToGrid);
    const y = snapCoord(raw.y, snapToGrid);
    onDropPlayer(role, team, x, y);
  };

  const gridLines = snapToGrid
    ? [
        ...Array.from({ length: Math.floor(FIELD_WIDTH / GRID_SIZE) + 1 }, (_, i) => (
          <line key={`vg-${i}`} x1={i * GRID_SIZE} y1={0} x2={i * GRID_SIZE} y2={FIELD_HEIGHT}
            stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
        )),
        ...Array.from({ length: Math.floor(FIELD_HEIGHT / GRID_SIZE) + 1 }, (_, i) => (
          <line key={`hg-${i}`} x1={0} y1={i * GRID_SIZE} x2={FIELD_WIDTH} y2={i * GRID_SIZE}
            stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
        )),
      ]
    : [];

  const getCursor = () => {
    if (annotationMode) return "cursor-crosshair";
    if (drawingRouteForPlayer) return "cursor-crosshair";
    if (draggingPlayerId) return "cursor-grabbing";
    return "cursor-default";
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-muted flex items-center justify-center flex-col">

      {/* Pending annotation input overlay */}
      {pendingAnnotation && (() => {
        const pos = getScreenPos(pendingAnnotation.x, pendingAnnotation.y);
        if (!pos) return null;
        return (
          <div className="absolute z-30 flex flex-col gap-1 bg-popover border border-border rounded-lg shadow-xl p-2"
            style={{ left: pos.x + 8, top: pos.y - 10 }}>
            <input autoFocus
              className="h-8 text-sm px-2 rounded border border-input bg-background min-w-[140px] outline-none"
              placeholder="Label text…"
              value={pendingAnnotationText}
              onChange={(e) => setPendingAnnotationText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitAnnotation();
                if (e.key === "Escape") setPendingAnnotation(null);
                e.stopPropagation();
              }}
            />
            <div className="flex gap-1">
              <button className="flex-1 text-xs bg-primary text-primary-foreground rounded px-2 py-1" onClick={commitAnnotation}>Add</button>
              <button className="flex-1 text-xs bg-muted rounded px-2 py-1" onClick={() => setPendingAnnotation(null)}>Cancel</button>
            </div>
          </div>
        );
      })()}

      {/* Annotation edit overlay */}
      {editingAnnotationId && (() => {
        const ann = annotations.find((a) => a.id === editingAnnotationId);
        if (!ann) return null;
        const pos = getScreenPos(ann.x, ann.y);
        if (!pos) return null;
        return (
          <div className="absolute z-30 flex flex-col gap-1 bg-popover border border-border rounded-lg shadow-xl p-2"
            style={{ left: pos.x + 8, top: pos.y - 10 }}>
            <input autoFocus
              className="h-8 text-sm px-2 rounded border border-input bg-background min-w-[140px] outline-none"
              value={editingAnnotationText}
              onChange={(e) => setEditingAnnotationText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (onUpdateAnnotation) onUpdateAnnotation(editingAnnotationId, editingAnnotationText.trim());
                  setEditingAnnotationId(null);
                }
                if (e.key === "Escape") setEditingAnnotationId(null);
                e.stopPropagation();
              }}
            />
            <div className="flex gap-1">
              <button className="flex-1 text-xs bg-primary text-primary-foreground rounded px-2 py-1"
                onClick={() => { if (onUpdateAnnotation) onUpdateAnnotation(editingAnnotationId, editingAnnotationText.trim()); setEditingAnnotationId(null); }}>
                Update
              </button>
              <button className="flex-1 text-xs bg-destructive text-destructive-foreground rounded px-2 py-1"
                onClick={() => { if (onRemoveAnnotation) onRemoveAnnotation(editingAnnotationId); setEditingAnnotationId(null); }}>
                Delete
              </button>
            </div>
          </div>
        );
      })()}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="absolute z-40 bg-popover border border-border rounded-lg shadow-xl py-1 min-w-[140px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {contextMenu.type === "player" && (
            <>
              <button
                className="w-full text-left text-sm px-3 py-1.5 hover:bg-muted transition-colors"
                onClick={() => {
                  const player = players.find((p) => p.id === contextMenu.id);
                  if (player) {
                    setDrawingRouteForPlayer(contextMenu.id);
                    setCurrentRoutePoints([{ x: player.x, y: player.y }]);
                    onDrawingStateChange?.(true);
                  }
                  setContextMenu(null);
                }}
              >
                ✏️ Draw Route
              </button>
              <button
                className="w-full text-left text-sm px-3 py-1.5 hover:bg-muted transition-colors"
                onClick={() => {
                  const playerRoutes = routes.filter((r) => r.playerId === contextMenu.id);
                  playerRoutes.forEach((r) => onRemoveRoute(r.id));
                  setContextMenu(null);
                }}
              >
                🗑 Clear Route
              </button>
              <div className="border-t border-border my-1" />
              <button
                className="w-full text-left text-sm px-3 py-1.5 hover:bg-destructive/20 text-destructive transition-colors"
                onClick={() => {
                  onRemovePlayer(contextMenu.id);
                  setSelectedPlayerId(null);
                  setContextMenu(null);
                }}
              >
                ✕ Remove Player
              </button>
            </>
          )}
          {contextMenu.type === "route" && (
            <button
              className="w-full text-left text-sm px-3 py-1.5 hover:bg-destructive/20 text-destructive transition-colors"
              onClick={() => {
                onRemoveRoute(contextMenu.id);
                setSelectedRouteId(null);
                setContextMenu(null);
              }}
            >
              ✕ Delete Route
            </button>
          )}
        </div>
      )}

      <svg
        ref={svgRef}
        viewBox={`0 0 ${FIELD_WIDTH} ${FIELD_HEIGHT}`}
        className={`w-full h-full max-h-[90vh] object-contain drop-shadow-xl select-none ${getCursor()} ${isDragOver ? "opacity-80" : ""}`}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onClick={handleSvgClick}
        onDoubleClick={handleSvgDoubleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onContextMenu={(e) => e.preventDefault()}
      >
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" />
          </marker>
          <marker id="arrow-drawing" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="yellow" />
          </marker>
        </defs>

        {/* Field */}
        <rect width={FIELD_WIDTH} height={FIELD_HEIGHT} fill="hsl(142 71% 22%)" />
        {gridLines}

        {/* Yard lines */}
        {Array.from({ length: 13 }).map((_, i) => (
          <g key={i}>
            <line x1={0} y1={i * 100} x2={FIELD_WIDTH} y2={i * 100} stroke="rgba(255,255,255,0.35)" strokeWidth={i === 0 || i === 12 ? 3 : 1.5} />
            {i > 0 && i < 12 && (
              <text x={22} y={i * 100 - 5} fill="rgba(255,255,255,0.4)" fontSize="18" fontWeight="bold" fontFamily="Arial">
                {i * 10}
              </text>
            )}
          </g>
        ))}

        {/* Hash marks */}
        {Array.from({ length: 12 }).map((_, i) =>
          [100, 160, 373, 433].map((x) => (
            <line key={`hash-${i}-${x}`} x1={x} y1={i * 100 + 45} x2={x} y2={i * 100 + 55}
              stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
          ))
        )}

        {/* Endzones */}
        <rect x="0" y="0" width={FIELD_WIDTH} height="100" fill="rgba(255,255,255,0.07)" />
        <rect x="0" y={FIELD_HEIGHT - 100} width={FIELD_WIDTH} height="100" fill="rgba(255,255,255,0.07)" />

        {/* Line of Scrimmage */}
        <line x1="0" y1="600" x2={FIELD_WIDTH} y2="600" stroke="hsl(var(--primary))" strokeWidth="3" opacity="0.9" />
        <text x={FIELD_WIDTH - 8} y="596" fill="hsl(var(--primary))" fontSize="10" textAnchor="end" opacity="0.7" fontFamily="Arial">LOS</text>

        {/* Drop zone indicator */}
        {isDragOver && (
          <rect x="0" y="0" width={FIELD_WIDTH} height={FIELD_HEIGHT}
            fill="none" stroke="hsl(var(--primary))" strokeWidth="4" strokeDasharray="12,8" opacity="0.7" />
        )}

        {/* Routes */}
        {routes.map((route) => {
          const player = players.find((p) => p.id === route.playerId);
          if (!player) return null;
          const points = [{ x: player.x, y: player.y }, ...route.points];
          let d: string;

          if (route.style === "wavy") {
            d = `M ${points[0].x},${points[0].y}`;
            for (let i = 1; i < points.length; i++) {
              const prev = points[i - 1], curr = points[i];
              const dx = curr.x - prev.x, dy = curr.y - prev.y;
              const len = Math.sqrt(dx * dx + dy * dy);
              if (len < 1) continue;
              const amp = Math.min(len * 0.15, 18);
              const cx1 = prev.x + dx / 4 - (dy / len) * amp;
              const cy1 = prev.y + dy / 4 + (dx / len) * amp;
              const cx2 = prev.x + (3 * dx) / 4 + (dy / len) * amp;
              const cy2 = prev.y + (3 * dy) / 4 - (dx / len) * amp;
              d += ` C ${cx1},${cy1} ${cx2},${cy2} ${curr.x},${curr.y}`;
            }
          } else {
            d = `M ${points.map((p) => `${p.x},${p.y}`).join(" L ")}`;
          }

          const isSelected = selectedRouteId === route.id;
          const dashArray = route.style === "dashed" ? "10,8" : route.style === "dotted" ? "3,5" : "none";
          const strokeColor = route.color || "#ffffff";

          return (
            <g key={route.id}>
              <path d={d} fill="none" stroke={strokeColor} strokeWidth={isSelected ? 4 : 2.5}
                strokeDasharray={dashArray} markerEnd="url(#arrow)"
                className={isAnimating ? "" : "cursor-pointer"}
                opacity={isAnimating ? 0.25 : isSelected ? 1 : 0.9}
              />
              {!isAnimating && (
                <path d={d} fill="none" stroke="transparent" strokeWidth="18"
                  className="cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); setSelectedRouteId(route.id); setSelectedPlayerId(null); }}
                  onContextMenu={(e) => handleRouteContextMenu(e, route.id)}
                />
              )}
              {isSelected && !isAnimating && (
                <path d={d} fill="none" stroke={strokeColor} strokeWidth="6"
                  strokeDasharray={dashArray} opacity="0.25" />
              )}
            </g>
          );
        })}

        {/* In-progress drawing route */}
        {drawingRouteForPlayer && currentRoutePoints.length > 0 && (
          <>
            <path
              d={`M ${currentRoutePoints.map((p) => `${p.x},${p.y}`).join(" L ")}${mousePos ? ` L ${mousePos.x},${mousePos.y}` : ""}`}
              fill="none" stroke="yellow" strokeWidth="2.5" strokeDasharray="8,5"
              markerEnd="url(#arrow-drawing)" opacity="0.85"
            />
            {currentRoutePoints.map((pt, i) => (
              <circle key={i} cx={pt.x} cy={pt.y} r="3" fill="yellow" opacity="0.7" />
            ))}
          </>
        )}

        {/* Players */}
        {displayPlayers.map((player) => {
          const isSelected = selectedPlayerId === player.id;
          const isDrawing = drawingRouteForPlayer === player.id;
          const playerColor = player.color || (player.team === "offense" ? "#3b82f6" : "#ef4444");

          return (
            <g
              key={player.id}
              transform={`translate(${player.x}, ${player.y})`}
              onMouseDown={(e) => handlePointerDown(e, player.id)}
              onDoubleClick={(e) => handlePlayerDoubleClick(e, player.id)}
              onContextMenu={(e) => handlePlayerContextMenu(e, player.id)}
              className={isAnimating || annotationMode ? "" : "cursor-grab"}
              style={{ cursor: draggingPlayerId === player.id ? "grabbing" : (annotationMode || isAnimating ? "default" : "grab") }}
            >
              {/* Selection glow */}
              {isSelected && !isAnimating && (
                <>
                  <circle r={PLAYER_RADIUS + 8} fill={playerColor} opacity="0.15" />
                  <circle r={PLAYER_RADIUS + 5} fill="none" stroke={playerColor} strokeWidth="2" opacity="0.5" />
                </>
              )}

              {/* Drawing mode indicator */}
              {isDrawing && (
                <circle r={PLAYER_RADIUS + 10} fill="none" stroke="yellow" strokeWidth="2.5"
                  strokeDasharray="6,4" opacity="0.9">
                  <animateTransform attributeName="transform" type="rotate"
                    from="0" to="360" dur="3s" repeatCount="indefinite" />
                </circle>
              )}

              {/* Player body */}
              <circle r={PLAYER_RADIUS} fill={playerColor} stroke="white" strokeWidth="2.5" />

              {/* Role label */}
              <text x="0" y="5" textAnchor="middle" fill="white" fontSize="11"
                fontWeight="bold" fontFamily="Arial" className="pointer-events-none select-none">
                {player.role.length > 4 ? player.role.slice(0, 4) : player.role}
              </text>

              {/* Team indicator dot */}
              <circle cx={PLAYER_RADIUS - 3} cy={-(PLAYER_RADIUS - 3)} r="4"
                fill={player.team === "offense" ? "#22c55e" : "#ef4444"}
                stroke="white" strokeWidth="1.5" />
            </g>
          );
        })}

        {/* Text Annotations */}
        {annotations.map((ann) => (
          <g key={ann.id} className="cursor-pointer"
            onClick={(e) => { e.stopPropagation(); if (!isAnimating) { setEditingAnnotationId(ann.id); setEditingAnnotationText(ann.text); } }}>
            <rect x={ann.x - 4} y={ann.y - 15} width={ann.text.length * 7.5 + 8} height="20"
              rx="3" fill="rgba(0,0,0,0.6)" />
            <text x={ann.x} y={ann.y} fill="yellow" fontSize="13" fontWeight="600"
              fontFamily="monospace" className="pointer-events-none select-none">
              {ann.text}
            </text>
          </g>
        ))}
      </svg>

      {/* Route drawing banner */}
      {drawingRouteForPlayer && !annotationMode && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-yellow-500/90 text-black px-4 py-2 rounded-full text-sm font-semibold z-10 flex items-center gap-2 shadow-lg">
          <span>✏️</span>
          <span>Click to add waypoints · Double-click or ESC to finish</span>
        </div>
      )}

      {/* Animation speed */}
      {isAnimating && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground px-6 py-4 rounded-xl border shadow-xl flex items-center gap-4 w-80 z-10">
          <div className="text-sm font-medium whitespace-nowrap">Speed: {animationSpeed}x</div>
          <Slider value={[animationSpeed]} min={0.5} max={3} step={0.5}
            onValueChange={(v) => setAnimationSpeed(v[0])} />
        </div>
      )}

      {/* Annotation mode banner */}
      {annotationMode && !drawingRouteForPlayer && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-blue-600/90 text-white px-4 py-2 rounded-full text-sm font-semibold z-10 shadow-lg">
          📝 Click anywhere on the field to add a label
        </div>
      )}
    </div>
  );
}
