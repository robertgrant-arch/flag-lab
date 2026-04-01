import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  PenTool, 
  Library, 
  Lightbulb, 
  Settings as SettingsIcon,
  BookOpen,
  Menu,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger
} from "@/components/ui/sidebar";

interface AppLayoutProps {
  children: ReactNode;
  headerTitle?: string;
  headerActions?: ReactNode;
}

export function AppLayout({ children, headerTitle, headerActions }: AppLayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { title: "Dashboard", href: "/", icon: LayoutDashboard },
    { title: "Library", href: "/library", icon: Library },
    { title: "Playbooks", href: "/playbooks", icon: BookOpen },
    { title: "Designer", href: "/designer", icon: PenTool },
    { title: "Suggested Plays", href: "/suggested", icon: Lightbulb },
    { title: "Settings", href: "/settings", icon: SettingsIcon },
  ];

  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-[100dvh] flex w-full bg-background text-foreground selection:bg-primary/30">
        <Sidebar className="border-r border-sidebar-border bg-sidebar">
          <SidebarHeader className="h-14 flex items-center px-4 border-b border-sidebar-border/50">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary tracking-tight">
              <div className="w-6 h-6 rounded-sm bg-primary flex items-center justify-center">
                <div className="w-3 h-3 bg-primary-foreground rounded-full" />
              </div>
              FlagLab
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={location === item.href || (item.href !== '/' && location.startsWith(item.href))}
                        tooltip={item.title}
                      >
                        <Link href={item.href} className="flex items-center gap-3 w-full">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                  <div className="px-2 py-2 mt-4">
                    <Button asChild className="w-full justify-start gap-2 shadow-sm" size="sm">
                      <Link href="/designer">
                        <Plus className="h-4 w-4" />
                        <span>New Play</span>
                      </Link>
                    </Button>
                  </div>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 shrink-0 border-b bg-background flex items-center justify-between px-4 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              {headerTitle && (
                <>
                  <div className="h-4 w-[1px] bg-border" />
                  <h1 className="font-semibold text-sm truncate max-w-[200px] sm:max-w-md">{headerTitle}</h1>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {headerActions}
              <div className="h-4 w-[1px] bg-border mx-1 hidden sm:block" />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto flex flex-col">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
