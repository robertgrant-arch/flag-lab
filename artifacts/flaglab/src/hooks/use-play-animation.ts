import { useState, useEffect, useRef, useCallback } from "react";
import type { PlayerToken, RouteSegment } from "@/hooks/use-designer-state";

export function usePlayAnimation(players: PlayerToken[], routes: RouteSegment[], isAnimating: boolean, speed: number = 1) {
  const [progress, setProgress] = useState(0); // 0 to 1
  const requestRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number | null>(null);
  
  const DURATION = 3000 / speed; // 3 seconds base duration

  const animate = useCallback((time: number) => {
    if (startTimeRef.current === null) {
      startTimeRef.current = time;
    }
    const elapsed = time - startTimeRef.current;
    const currentProgress = Math.min(elapsed / DURATION, 1);
    
    setProgress(currentProgress);

    if (currentProgress < 1) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      // Loop or stop
      // startTimeRef.current = null;
      // requestRef.current = requestAnimationFrame(animate);
    }
  }, [DURATION]);

  useEffect(() => {
    if (isAnimating) {
      startTimeRef.current = null;
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      setProgress(0);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isAnimating, animate]);

  // Calculate animated positions for players
  const animatedPlayers = players.map(player => {
    const route = routes.find(r => r.playerId === player.id);
    if (!route || route.points.length < 2) return player;
    
    // Total length estimation (simplified)
    const points = [{ x: player.x, y: player.y }, ...route.points];
    let totalLength = 0;
    const segmentLengths: number[] = [];
    
    for (let i = 0; i < points.length - 1; i++) {
      const dx = points[i+1].x - points[i].x;
      const dy = points[i+1].y - points[i].y;
      const len = Math.sqrt(dx*dx + dy*dy);
      totalLength += len;
      segmentLengths.push(len);
    }
    
    const targetLength = totalLength * progress;
    let currentLength = 0;
    
    for (let i = 0; i < segmentLengths.length; i++) {
      if (currentLength + segmentLengths[i] >= targetLength) {
        const segmentProgress = (targetLength - currentLength) / segmentLengths[i];
        const currentX = points[i].x + (points[i+1].x - points[i].x) * segmentProgress;
        const currentY = points[i].y + (points[i+1].y - points[i].y) * segmentProgress;
        return { ...player, x: currentX, y: currentY };
      }
      currentLength += segmentLengths[i];
    }
    
    const lastPoint = points[points.length - 1];
    return { ...player, x: lastPoint.x, y: lastPoint.y };
  });

  return { progress, animatedPlayers };
}
