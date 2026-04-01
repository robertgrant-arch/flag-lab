import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetDashboardSummary, useGetRecentPlays, useListPlays } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen, Lightbulb } from "lucide-react";
import { useSettings } from "@/lib/settings";

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary, isError: isSummaryError, refetch: refetchSummary } = useGetDashboardSummary();
  const { data: recentPlays, isLoading: isLoadingRecent } = useGetRecentPlays({ limit: 5 });
  const { data: allPlays } = useListPlays({});
  const { settings } = useSettings();

  const chartData = summary ? [
    { name: "5v5", value: summary.playsBy5v5, color: "hsl(var(--chart-1))" },
    { name: "7v7", value: summary.playsBy7v7, color: "hsl(var(--chart-2))" },
    { name: "Offense", value: summary.offensivePlays, color: "hsl(var(--chart-3))" },
    { name: "Defense", value: summary.defensivePlays, color: "hsl(var(--chart-4))" },
    { name: "Red Zone", value: summary.redZonePlays, color: "hsl(var(--chart-5))" },
  ] : [];

  // Build "plays by tag" chart from the full plays list
  const tagCounts: Record<string, number> = {};
  (allPlays ?? []).forEach((play) => {
    (play.tags ?? []).forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
    });
  });
  const tagChartData = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value], i) => {
      const tagDef = settings.tags.find((t) => t.name === name);
      return { name, value, color: tagDef?.color ?? `hsl(${i * 40} 70% 55%)` };
    });

  return (
    <AppLayout headerTitle="Dashboard">
      <div className="p-6 max-w-6xl mx-auto w-full space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
            <p className="text-muted-foreground">Welcome back. Here's what's happening with your playbook.</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="gap-2">
              <Link href="/designer">
                <Plus className="h-4 w-4" />
                New Play
              </Link>
            </Button>
            <Button variant="outline" asChild className="gap-2">
              <Link href="/playbooks">
                <BookOpen className="h-4 w-4" />
                New Playbook
              </Link>
            </Button>
            <Button variant="outline" asChild className="gap-2">
              <Link href="/suggested">
                <Lightbulb className="h-4 w-4" />
                Browse Suggested Plays
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoadingSummary ? (
            Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-[120px] w-full rounded-xl" />)
          ) : summary ? (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Plays</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{summary.totalPlays}</div>
                  <p className="text-xs text-muted-foreground mt-1">Plays in library</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Playbooks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{summary.totalPlaybooks}</div>
                  <p className="text-xs text-muted-foreground mt-1">Active playbooks</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{summary.recentActivity}</div>
                  <p className="text-xs text-muted-foreground mt-1">Plays edited in last 7 days</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Format Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{summary.playsBy5v5} / {summary.playsBy7v7}</div>
                  <p className="text-xs text-muted-foreground mt-1">5v5 vs 7v7 plays</p>
                </CardContent>
              </Card>
            </>
          ) : isSummaryError ? (
            <div className="col-span-4 p-6 text-center border rounded-xl border-dashed space-y-3">
              <p className="text-muted-foreground text-sm">Failed to load summary data.</p>
              <button onClick={() => refetchSummary()} className="text-primary text-sm hover:underline">
                Try again
              </button>
            </div>
          ) : (
            <div className="col-span-4 p-4 text-center text-muted-foreground border rounded-xl border-dashed">
              No data available yet.
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Play Composition chart */}
          <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
              <CardTitle>Play Composition</CardTitle>
              <CardDescription>Breakdown of your playbook by format and type</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSummary ? (
                <Skeleton className="h-[220px] w-full" />
              ) : summary ? (
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip cursor={{ fill: "hsl(var(--muted))" }} contentStyle={{ backgroundColor: "hsl(var(--popover))", borderColor: "hsl(var(--border))", borderRadius: "8px" }} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Recent Plays */}
          <Card className="col-span-1 flex flex-col">
            <CardHeader>
              <CardTitle>Recent Plays</CardTitle>
              <CardDescription>Your recently edited plays</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-4">
                {isLoadingRecent ? (
                  Array(5).fill(0).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[120px]" />
                        <Skeleton className="h-3 w-[80px]" />
                      </div>
                    </div>
                  ))
                ) : recentPlays && recentPlays.length > 0 ? (
                  recentPlays.map((play) => (
                    <Link
                      key={play.id}
                      href={`/designer/${play.id}`}
                      className="flex items-center gap-3 p-2 -mx-2 rounded-md hover:bg-muted/50 transition-colors group cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center text-xs font-bold shrink-0">
                        {play.format}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate group-hover:text-primary transition-colors">{play.title}</div>
                        <div className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                          {play.mode}
                          {play.isManBeater && " · Man-Beater"}
                          {play.isZoneBeater && " · Zone-Beater"}
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    No recent plays found.<br />
                    <Link href="/designer" className="text-primary hover:underline mt-2 inline-block">Create one now</Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Plays by Tag chart */}
        {tagChartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Plays by Tag</CardTitle>
              <CardDescription>How your plays are categorized</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tagChartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip cursor={{ fill: "hsl(var(--muted))" }} contentStyle={{ backgroundColor: "hsl(var(--popover))", borderColor: "hsl(var(--border))", borderRadius: "8px" }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {tagChartData.map((entry, index) => (
                        <Cell key={`tag-cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
