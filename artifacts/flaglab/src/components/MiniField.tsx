import { PlayerToken, RouteSegment } from "@workspace/api-client-react";

interface MiniFieldProps {
  players: PlayerToken[];
  routes: RouteSegment[];
  format: "5v5" | "7v7";
}

export function MiniField({ players, routes, format }: MiniFieldProps) {
  // Simplified field rendering
  const width = 100;
  const height = 120;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full object-contain">
      <rect width={width} height={height} fill="hsl(142 71% 20%)" rx="4" />
      {/* Field Lines */}
      {[20, 40, 60, 80, 100].map((y) => (
        <line key={y} x1="0" y1={y} x2={width} y2={y} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      ))}
      {/* Line of Scrimmage */}
      <line x1="0" y1="60" x2={width} y2="60" stroke="hsl(var(--primary))" strokeWidth="2" />
      
      {/* Routes */}
      {routes?.map((route) => {
        if (!route.points || route.points.length < 2) return null;
        const d = `M ${route.points.map(p => `${p.x / 10},${p.y / 10}`).join(" L ")}`;
        return (
          <path
            key={route.id}
            d={d}
            fill="none"
            stroke={route.color || "white"}
            strokeWidth="1.5"
            strokeDasharray={route.style === 'dashed' ? "4,4" : route.style === 'dotted' ? "2,2" : "none"}
          />
        );
      })}

      {/* Players */}
      {players?.map((player) => (
        <g key={player.id} transform={`translate(${player.x / 10}, ${player.y / 10})`}>
          <circle 
            r="3" 
            fill={player.color || (player.team === 'offense' ? "hsl(210 79% 60%)" : "hsl(0 84% 60%)")} 
            stroke="white"
            strokeWidth="0.5"
          />
        </g>
      ))}
    </svg>
  );
}
