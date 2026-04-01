import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, X, Pencil, Check } from "lucide-react";
import { useSettings, type TagDefinition } from "@/lib/settings";

const TAG_PRESETS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280",
];

function TagRow({
  tag,
  onUpdate,
  onDelete,
}: {
  tag: TagDefinition;
  onUpdate: (t: TagDefinition) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(tag.name);

  function commit() {
    if (name.trim()) onUpdate({ ...tag, name: name.trim() });
    setEditing(false);
  }

  return (
    <div className="flex items-center gap-3 group">
      <input
        type="color"
        value={tag.color}
        onChange={(e) => onUpdate({ ...tag, color: e.target.value })}
        className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent p-0.5 shrink-0"
        title="Tag color"
      />
      {editing ? (
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-8 text-sm flex-1"
          onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
          autoFocus
        />
      ) : (
        <Badge
          className="px-3 py-1 text-xs font-medium cursor-text flex-1 justify-start"
          style={{ backgroundColor: tag.color + "33", color: tag.color, borderColor: tag.color + "66" }}
          variant="outline"
        >
          {tag.name}
        </Badge>
      )}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost" size="icon" className="h-7 w-7"
          onClick={() => { if (editing) { commit(); } else { setEditing(true); setName(tag.name); } }}
        >
          {editing ? <Check className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onDelete}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export default function Settings() {
  const { settings, updateSettings } = useSettings();

  const [teamName, setTeamName] = useState(settings.teamName);
  const [defaultFormat, setDefaultFormat] = useState(settings.defaultFormat);
  const [snapToGrid, setSnapToGrid] = useState(String(settings.snapToGrid));
  const [tags, setTags] = useState<TagDefinition[]>(settings.tags);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#3b82f6");

  function handleSave() {
    updateSettings({
      teamName: teamName.trim() || "Panthers Flag",
      defaultFormat: defaultFormat as "5v5" | "7v7",
      snapToGrid: snapToGrid === "true",
      tags,
    });
    toast.success("Settings saved");
  }

  function addTag() {
    const name = newTagName.trim();
    if (!name) return;
    if (tags.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
      toast.error("Tag already exists");
      return;
    }
    setTags([...tags, { name, color: newTagColor }]);
    setNewTagName("");
  }

  return (
    <AppLayout headerTitle="Settings">
      <div className="p-6 max-w-3xl mx-auto w-full space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground mt-2">Manage your team profile and app preferences.</p>
        </div>

        {/* Team Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Team Profile</CardTitle>
            <CardDescription>Your team's details appear on printed playbooks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="teamName">Team Name</Label>
              <Input
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Panthers Flag"
              />
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Designer Preferences</CardTitle>
            <CardDescription>Customize your play designer experience.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="defaultFormat">Default Play Format</Label>
              <Select value={defaultFormat} onValueChange={(v) => setDefaultFormat(v as any)}>
                <SelectTrigger id="defaultFormat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5v5">5v5</SelectItem>
                  <SelectItem value="7v7">7v7</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="snapToGrid">Snap to Grid</Label>
              <Select value={snapToGrid} onValueChange={setSnapToGrid}>
                <SelectTrigger id="snapToGrid">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Enabled</SelectItem>
                  <SelectItem value="false">Disabled</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Aligns players to a 20-unit grid in the designer.</p>
            </div>
          </CardContent>
        </Card>

        {/* Tag Manager */}
        <Card>
          <CardHeader>
            <CardTitle>Tag Manager</CardTitle>
            <CardDescription>
              Create and color-code custom tags to organize your plays.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {tags.map((tag, i) => (
                <TagRow
                  key={i}
                  tag={tag}
                  onUpdate={(updated) => setTags(tags.map((t, j) => (j === i ? updated : t)))}
                  onDelete={() => setTags(tags.filter((_, j) => j !== i))}
                />
              ))}
            </div>

            {/* Add new tag */}
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <input
                type="color"
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent p-0.5 shrink-0"
              />
              <div className="flex gap-1 flex-wrap">
                {TAG_PRESETS.map((c) => (
                  <button
                    key={c}
                    className={`w-5 h-5 rounded-full border-2 ${newTagColor === c ? "border-white scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setNewTagColor(c)}
                  />
                ))}
              </div>
              <Input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="New tag name…"
                className="h-8 text-sm flex-1"
                onKeyDown={(e) => e.key === "Enter" && addTag()}
              />
              <Button size="sm" variant="outline" onClick={addTag} disabled={!newTagName.trim()} className="gap-1 shrink-0">
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </div>
    </AppLayout>
  );
}
