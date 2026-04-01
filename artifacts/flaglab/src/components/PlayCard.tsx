import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "wouter";
import { Play, SuggestedPlay } from "@workspace/api-client-react";
import { Edit2, Eye, Download, BookOpen, ChevronDown } from "lucide-react";
import { MiniField } from "./MiniField";
import { useLoadSuggestedPlay } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { usePlaybooks, useAddPlayToPlaybook } from "@/lib/playbook-api";
import { useSettings } from "@/lib/settings";

interface PlayCardProps {
  play: Play | SuggestedPlay;
  isSuggested?: boolean;
}

function TagBadge({ tag }: { tag: string }) {
  const { settings } = useSettings();
  const tagDef = settings.tags.find((t) => t.name === tag);
  if (tagDef) {
    return (
      <Badge
        key={tag}
        variant="outline"
        className="text-[10px] bg-background"
        style={{
          backgroundColor: tagDef.color + "22",
          borderColor: tagDef.color + "66",
          color: tagDef.color,
        }}
      >
        {tag}
      </Badge>
    );
  }
  return (
    <Badge key={tag} variant="outline" className="text-[10px] bg-background">
      {tag}
    </Badge>
  );
}

function AddToPlaybookButton({ playId }: { playId: string }) {
  const { data: playbooks } = usePlaybooks();
  const addMutation = useAddPlayToPlaybook();

  function handleAdd(playbookId: string, playbookName: string) {
    addMutation.mutate(
      { playbookId, playId },
      {
        onSuccess: () => toast.success(`Added to "${playbookName}"`),
        onError: () => toast.error("Failed to add to playbook"),
      }
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 w-full">
          <BookOpen className="h-3.5 w-3.5" />
          Add to Playbook
          <ChevronDown className="h-3 w-3 ml-auto" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Select Playbook</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {!playbooks?.length ? (
          <DropdownMenuItem disabled>No playbooks yet</DropdownMenuItem>
        ) : (
          playbooks.map((pb) => (
            <DropdownMenuItem key={pb.id} onClick={() => handleAdd(pb.id, pb.name)}>
              {pb.name}
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/playbooks" className="text-primary">
            Manage Playbooks →
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function PlayCard({ play, isSuggested }: PlayCardProps) {
  const [, setLocation] = useLocation();
  const loadPlay = useLoadSuggestedPlay();

  const handleLoad = async () => {
    if (!isSuggested) return;
    try {
      const loadedPlay = await loadPlay.mutateAsync({ id: play.id });
      toast.success("Play loaded successfully");
      setLocation(`/designer/${loadedPlay.id}`);
    } catch (e) {
      toast.error("Failed to load play");
    }
  };

  return (
    <Card className="flex flex-col overflow-hidden hover:border-primary/50 transition-colors group">
      {!isSuggested && (
        <div className="h-32 bg-muted relative overflow-hidden border-b border-border p-2">
          <MiniField players={play.players} routes={play.routes} format={play.format} />
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle
            className="text-lg font-bold line-clamp-1 group-hover:text-primary transition-colors"
            title={play.title || (play as SuggestedPlay).name}
          >
            {play.title || (play as SuggestedPlay).name}
          </CardTitle>
          <div className="flex gap-1 shrink-0">
            <Badge variant="secondary" className="text-xs">{play.format}</Badge>
            <Badge variant={play.mode === "offense" ? "default" : "destructive"} className="text-xs">
              {play.mode}
            </Badge>
          </div>
        </div>
        {isSuggested && (play as SuggestedPlay).coachingPurpose && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {(play as SuggestedPlay).coachingPurpose}
          </p>
        )}
      </CardHeader>
      <CardContent className="flex-1 pb-3">
        <div className="flex flex-wrap gap-1 mt-1">
          {play.tags?.map((tag) => (
            <TagBadge key={tag} tag={tag} />
          ))}
          {play.isManBeater && (
            <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-500 border-blue-500/20">
              Man-Beater
            </Badge>
          )}
          {play.isZoneBeater && (
            <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-500 border-purple-500/20">
              Zone-Beater
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex flex-col gap-2">
        {isSuggested ? (
          <Button className="w-full gap-2" onClick={handleLoad} disabled={loadPlay.isPending}>
            <Download className="h-4 w-4" />
            {loadPlay.isPending ? "Loading..." : "Load into Designer"}
          </Button>
        ) : (
          <>
            <div className="flex gap-2 w-full">
              <Button variant="outline" size="sm" className="flex-1 gap-2" asChild>
                <Link href={`/library/${play.id}`}>
                  <Eye className="h-4 w-4" />
                  View
                </Link>
              </Button>
              <Button size="sm" className="flex-1 gap-2" asChild>
                <Link href={`/designer/${play.id}`}>
                  <Edit2 className="h-4 w-4" />
                  Edit
                </Link>
              </Button>
            </div>
            <AddToPlaybookButton playId={play.id} />
          </>
        )}
      </CardFooter>
    </Card>
  );
}
