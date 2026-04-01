import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Loader2 } from "lucide-react";
import { useListSuggestedPlays } from "@workspace/api-client-react";
import { PlayCard } from "@/components/PlayCard";

export default function SuggestedPlays() {
  const [search, setSearch] = useState("");
  
  const { data: plays, isLoading } = useListSuggestedPlays({ search: search || undefined });

  return (
    <AppLayout headerTitle="Suggested Plays">
      <div className="p-6 max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Play Catalog</h2>
          <p className="text-muted-foreground mt-2">Browse our curated collection of professional flag football plays.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search catalog..." 
              className="pl-9 bg-card"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" className="gap-2 bg-card">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : plays && plays.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {plays.map((play) => (
              <PlayCard key={play.id} play={play} isSuggested />
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-24 text-muted-foreground border border-dashed rounded-xl bg-card/50">
            <p className="text-lg font-medium text-foreground mb-1">No plays found</p>
            <p className="text-sm">Try adjusting your search</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
