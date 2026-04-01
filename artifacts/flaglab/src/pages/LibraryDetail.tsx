import { AppLayout } from "@/components/layout/AppLayout";
import { useParams, Link } from "wouter";
import { useGetPlay } from "@workspace/api-client-react";
import { getGetPlayQueryKey } from "@workspace/api-client-react";
import { Loader2, ArrowLeft, Edit2, Play as PlayIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MiniField } from "@/components/MiniField";

export default function LibraryDetail() {
  const params = useParams();
  const id = params.id as string;

  const { data: play, isLoading } = useGetPlay(id, {
    query: { enabled: !!id, queryKey: getGetPlayQueryKey(id) }
  });

  if (isLoading) {
    return (
      <AppLayout headerTitle="Loading Play...">
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!play) {
    return (
      <AppLayout headerTitle="Play Not Found">
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-lg text-muted-foreground mb-4">This play doesn't exist or has been removed.</p>
          <Button asChild>
            <Link href="/library">Back to Library</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      headerTitle={play.title}
      headerActions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <PlayIcon className="h-4 w-4" />
            Animate
          </Button>
          <Button size="sm" className="gap-2" asChild>
            <Link href={`/designer/${play.id}`}>
              <Edit2 className="h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      }
    >
      <div className="p-6 max-w-6xl mx-auto w-full space-y-6">
        <Button variant="ghost" size="sm" className="w-fit gap-2 -ml-2 text-muted-foreground" asChild>
          <Link href="/library">
            <ArrowLeft className="h-4 w-4" />
            Back to Library
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="col-span-1 lg:col-span-2 overflow-hidden border-2">
            <div className="aspect-[4/3] bg-muted relative">
              <MiniField players={play.players} routes={play.routes} format={play.format} />
            </div>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Play Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Format & Mode</div>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{play.format}</Badge>
                    <Badge variant={play.mode === 'offense' ? "default" : "destructive"}>{play.mode}</Badge>
                  </div>
                </div>
                
                {play.primaryConcept && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Primary Concept</div>
                    <div>{play.primaryConcept}</div>
                  </div>
                )}

                {play.tags && play.tags.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">Tags</div>
                    <div className="flex flex-wrap gap-1">
                      {play.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="bg-background">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="pt-2">
                  <div className="flex gap-2">
                    {play.isManBeater && <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Man-Beater</Badge>}
                    {play.isZoneBeater && <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">Zone-Beater</Badge>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {play.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Coaching Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{play.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
