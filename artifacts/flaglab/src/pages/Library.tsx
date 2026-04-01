import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Plus, Loader2, X } from "lucide-react";
import { Link } from "wouter";
import { useListPlays } from "@workspace/api-client-react";
import { PlayCard } from "@/components/PlayCard";
import { useSettings } from "@/lib/settings";

export default function Library() {
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [selectedFormat, setSelectedFormat] = useState<string>("");
  const [selectedMode, setSelectedMode] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const { settings } = useSettings();

  const { data: plays, isLoading } = useListPlays({
    search: search || undefined,
    tag: selectedTag || undefined,
    format: (selectedFormat as "5v5" | "7v7") || undefined,
    mode: (selectedMode as "offense" | "defense") || undefined,
  });

  const hasFilters = !!selectedTag || !!selectedFormat || !!selectedMode;

  function clearFilters() {
    setSelectedTag("");
    setSelectedFormat("");
    setSelectedMode("");
  }

  return (
    <AppLayout
      headerTitle="Play Library"
      headerActions={
        <Button asChild size="sm">
          <Link href="/designer">
            <Plus className="h-4 w-4 mr-2" />
            New Play
          </Link>
        </Button>
      }
    >
      <div className="p-6 max-w-7xl mx-auto w-full flex flex-col">
        {/* Search + Filter toggle */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search plays by name…"
              className="pl-9 bg-card"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            variant={showFilters ? "secondary" : "outline"}
            className="gap-2 bg-card"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
            Filters
            {hasFilters && (
              <Badge variant="destructive" className="h-4 w-4 p-0 text-[10px] flex items-center justify-center rounded-full">
                !
              </Badge>
            )}
          </Button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="mb-4 p-4 border rounded-xl bg-card space-y-3">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Format</label>
                <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                  <SelectTrigger className="w-28 h-8 text-sm">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any</SelectItem>
                    <SelectItem value="5v5">5v5</SelectItem>
                    <SelectItem value="7v7">7v7</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Mode</label>
                <Select value={selectedMode} onValueChange={setSelectedMode}>
                  <SelectTrigger className="w-32 h-8 text-sm">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any</SelectItem>
                    <SelectItem value="offense">Offense</SelectItem>
                    <SelectItem value="defense">Defense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Tag</label>
                <Select value={selectedTag} onValueChange={setSelectedTag}>
                  <SelectTrigger className="w-40 h-8 text-sm">
                    <SelectValue placeholder="Any tag" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any tag</SelectItem>
                    {settings.tags.map((t) => (
                      <SelectItem key={t.name} value={t.name}>
                        <span className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: t.color }} />
                          {t.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 h-8">
                  <X className="h-3.5 w-3.5" /> Clear
                </Button>
              )}
            </div>

            {/* Active filter tags */}
            {hasFilters && (
              <div className="flex flex-wrap gap-2">
                {selectedFormat && (
                  <Badge variant="secondary" className="gap-1">
                    {selectedFormat}
                    <button onClick={() => setSelectedFormat("")}><X className="h-3 w-3" /></button>
                  </Badge>
                )}
                {selectedMode && (
                  <Badge variant="secondary" className="gap-1 capitalize">
                    {selectedMode}
                    <button onClick={() => setSelectedMode("")}><X className="h-3 w-3" /></button>
                  </Badge>
                )}
                {selectedTag && (
                  <Badge
                    variant="outline"
                    className="gap-1"
                    style={{
                      backgroundColor: (settings.tags.find((t) => t.name === selectedTag)?.color ?? "#6b7280") + "22",
                      borderColor: (settings.tags.find((t) => t.name === selectedTag)?.color ?? "#6b7280") + "66",
                      color: settings.tags.find((t) => t.name === selectedTag)?.color ?? "#6b7280",
                    }}
                  >
                    {selectedTag}
                    <button onClick={() => setSelectedTag("")}><X className="h-3 w-3" /></button>
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : plays && plays.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {plays.map((play) => (
              <PlayCard key={play.id} play={play} />
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground border border-dashed rounded-xl bg-card/50 py-20">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-foreground mb-1">No plays found</p>
            <p className="text-sm mb-4">Try adjusting your search or filters</p>
            <Button asChild>
              <Link href="/designer">Create New Play</Link>
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
