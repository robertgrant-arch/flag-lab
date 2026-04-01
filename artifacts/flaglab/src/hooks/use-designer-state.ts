import { useCallback, useReducer } from "react";

export interface PlayerToken {
  id: string;
  role: string;
  label: string;
  team: "offense" | "defense";
  x: number;
  y: number;
  color?: string;
}

export interface RoutePoint {
  x: number;
  y: number;
}

export type RouteSegmentType = "straight" | "curve" | "angle";
export type RouteSegmentStyle = "solid" | "dashed" | "dotted" | "wavy";

export interface RouteSegment {
  id: string;
  playerId: string;
  type: RouteSegmentType;
  style: RouteSegmentStyle;
  points: RoutePoint[];
  color?: string;
}

export interface Play {
  id: string;
  title: string;
  mode: string;
  format: string;
  players: PlayerToken[];
  routes: RouteSegment[];
  tags: string[];
  notes?: string;
  isManBeater?: boolean;
  isZoneBeater?: boolean;
  coverageTargets?: string[];
  createdAt: string;
  updatedAt: string;
}

interface DesignerState {
  play: Play;
  history: Play[];
  historyIndex: number;
}

type DesignerAction =
  | { type: "INIT"; payload: Play }
  | { type: "UPDATE_PLAY"; payload: Partial<Play> }
  | { type: "ADD_PLAYER"; payload: PlayerToken }
  | { type: "UPDATE_PLAYER"; payload: PlayerToken }
  | { type: "UPDATE_PLAYER_POSITION"; payload: PlayerToken }
  | { type: "REMOVE_PLAYER"; payload: string }
  | { type: "ADD_ROUTE"; payload: RouteSegment }
  | { type: "UPDATE_ROUTE"; payload: RouteSegment }
  | { type: "REMOVE_ROUTE"; payload: string }
  | { type: "UNDO" }
  | { type: "REDO" };

const MAX_HISTORY = 50;

function designerReducer(state: DesignerState, action: DesignerAction): DesignerState {
  switch (action.type) {
    case "INIT":
      return { play: action.payload, history: [action.payload], historyIndex: 0 };

    case "UPDATE_PLAY": {
      const newPlay = { ...state.play, ...action.payload };
      return pushHistory(state, newPlay);
    }

    case "ADD_PLAYER": {
      const newPlay = { ...state.play, players: [...(state.play.players || []), action.payload] };
      return pushHistory(state, newPlay);
    }

    case "UPDATE_PLAYER": {
      const newPlay = {
        ...state.play,
        players: (state.play.players || []).map((p) => (p.id === action.payload.id ? action.payload : p)),
      };
      return pushHistory(state, newPlay);
    }

    case "UPDATE_PLAYER_POSITION": {
      return {
        ...state,
        play: {
          ...state.play,
          players: (state.play.players || []).map((p) => (p.id === action.payload.id ? action.payload : p)),
        },
      };
    }

    case "REMOVE_PLAYER": {
      const newPlay = {
        ...state.play,
        players: (state.play.players || []).filter((p) => p.id !== action.payload),
        routes: (state.play.routes || []).filter((r) => r.playerId !== action.payload),
      };
      return pushHistory(state, newPlay);
    }

    case "ADD_ROUTE": {
      const newPlay = { ...state.play, routes: [...(state.play.routes || []), action.payload] };
      return pushHistory(state, newPlay);
    }

    case "UPDATE_ROUTE": {
      const newPlay = {
        ...state.play,
        routes: (state.play.routes || []).map((r) => (r.id === action.payload.id ? action.payload : r)),
      };
      return pushHistory(state, newPlay);
    }

    case "REMOVE_ROUTE": {
      const newPlay = {
        ...state.play,
        routes: (state.play.routes || []).filter((r) => r.id !== action.payload),
      };
      return pushHistory(state, newPlay);
    }

    case "UNDO": {
      if (state.historyIndex > 0) {
        const newIndex = state.historyIndex - 1;
        return { ...state, play: state.history[newIndex], historyIndex: newIndex };
      }
      return state;
    }

    case "REDO": {
      if (state.historyIndex < state.history.length - 1) {
        const newIndex = state.historyIndex + 1;
        return { ...state, play: state.history[newIndex], historyIndex: newIndex };
      }
      return state;
    }

    default:
      return state;
  }
}

function pushHistory(state: DesignerState, newPlay: Play): DesignerState {
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push(newPlay);
  if (newHistory.length > MAX_HISTORY) newHistory.shift();
  return { play: newPlay, history: newHistory, historyIndex: newHistory.length - 1 };
}

const defaultPlay: Play = {
  id: "new",
  title: "Untitled Play",
  mode: "offense",
  format: "5v5",
  players: [],
  routes: [],
  tags: [],
  coverageTargets: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export function useDesignerState(initialPlay?: Play) {
  const [state, dispatch] = useReducer(designerReducer, {
    play: initialPlay || defaultPlay,
    history: [initialPlay || defaultPlay],
    historyIndex: 0,
  });

  const canUndo = state.historyIndex > 0;
  const canRedo = state.historyIndex < state.history.length - 1;

  const init = useCallback((play: Play) => dispatch({ type: "INIT", payload: play }), []);
  const updatePlay = useCallback((payload: Partial<Play>) => dispatch({ type: "UPDATE_PLAY", payload }), []);
  const addPlayer = useCallback((payload: PlayerToken) => dispatch({ type: "ADD_PLAYER", payload }), []);
  const updatePlayer = useCallback((payload: PlayerToken) => dispatch({ type: "UPDATE_PLAYER", payload }), []);
  const updatePlayerPosition = useCallback((payload: PlayerToken) => dispatch({ type: "UPDATE_PLAYER_POSITION", payload }), []);
  const removePlayer = useCallback((payload: string) => dispatch({ type: "REMOVE_PLAYER", payload }), []);
  const addRoute = useCallback((payload: RouteSegment) => dispatch({ type: "ADD_ROUTE", payload }), []);
  const updateRoute = useCallback((payload: RouteSegment) => dispatch({ type: "UPDATE_ROUTE", payload }), []);
  const removeRoute = useCallback((payload: string) => dispatch({ type: "REMOVE_ROUTE", payload }), []);
  const undo = useCallback(() => dispatch({ type: "UNDO" }), []);
  const redo = useCallback(() => dispatch({ type: "REDO" }), []);

  return {
    play: state.play,
    canUndo,
    canRedo,
    init,
    updatePlay,
    addPlayer,
    updatePlayer,
    updatePlayerPosition,
    removePlayer,
    addRoute,
    updateRoute,
    removeRoute,
    undo,
    redo,
  };
}
