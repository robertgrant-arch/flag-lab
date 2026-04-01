import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import NotFound from "@/pages/not-found";

import Dashboard from "@/pages/Dashboard";
import Library from "@/pages/Library";
import LibraryDetail from "@/pages/LibraryDetail";
import Designer from "@/pages/Designer";
import SuggestedPlays from "@/pages/SuggestedPlays";
import Settings from "@/pages/Settings";
import Playbooks from "@/pages/Playbooks";
import PlaybookDetail from "@/pages/PlaybookDetail";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/library" component={Library} />
      <Route path="/library/:id" component={LibraryDetail} />
      <Route path="/designer" component={Designer} />
      <Route path="/designer/:id" component={Designer} />
      <Route path="/suggested" component={SuggestedPlays} />
      <Route path="/playbooks" component={Playbooks} />
      <Route path="/playbooks/:id" component={PlaybookDetail} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
