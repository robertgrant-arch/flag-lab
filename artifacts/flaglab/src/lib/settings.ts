// ─── Persistent app settings via localStorage ─────────────────────────────────
// Tags are stored as { name: string, color: string }[]
// General settings: teamName, defaultFormat, snapToGrid

import { useState, useEffect, useCallback } from "react";

export interface TagDefinition {
  name: string;
  color: string;
}

export interface AppSettings {
  teamName: string;
  defaultFormat: "5v5" | "7v7";
  snapToGrid: boolean;
  tags: TagDefinition[];
}

const STORAGE_KEY = "flaglab_settings";

const DEFAULT_TAGS: TagDefinition[] = [
  { name: "Red Zone", color: "#ef4444" },
  { name: "Goal Line", color: "#f97316" },
  { name: "Screen", color: "#eab308" },
  { name: "Deep Pass", color: "#3b82f6" },
  { name: "Run", color: "#22c55e" },
  { name: "Trick Play", color: "#a855f7" },
  { name: "2-Point", color: "#ec4899" },
  { name: "Quick Pass", color: "#06b6d4" },
];

const DEFAULT_SETTINGS: AppSettings = {
  teamName: "Panthers Flag",
  defaultFormat: "5v5",
  snapToGrid: false,
  tags: DEFAULT_TAGS,
};

function load(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      tags: parsed.tags?.length ? parsed.tags : DEFAULT_SETTINGS.tags,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function save(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore quota errors
  }
}

export function useSettings() {
  const [settings, setSettingsState] = useState<AppSettings>(load);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...patch };
      save(next);
      return next;
    });
  }, []);

  return { settings, updateSettings };
}

// Singleton outside React for non-hook usage (e.g. designer canvas)
export function getSnapToGrid(): boolean {
  return load().snapToGrid;
}

export function getTagColor(tagName: string): string {
  const settings = load();
  return settings.tags.find((t) => t.name === tagName)?.color ?? "#6b7280";
}

export function getTeamName(): string {
  return load().teamName;
}
