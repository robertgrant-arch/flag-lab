import { ReactNode, useState, useEffect, useRef } from "react";
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
  onTitleChange?: (title: string) => void;
  onNewPlay?: () => void;
}

export function AppLayout({ children, headerTitle, headerActions, onTitleChange, onNewPlay }: AppLayoutProps) {
  const [location, setLocation] = useLocation();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(headerTitle || "");
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditTitle(headerTitle || "");
  }, [headerTitle]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (onTitleChange && editTitle.trim()) {
      onTitleChange(editTitle.trim());
    }
  };

  const handleNewPlay = () => {
    if (onNewPlay) {
      onNewPlay();
    } else {
      setLocation(`/designer/new?t=${Date.now()}`);
    }
  };

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
              <div className="w-6 h-6 rounded-full bg-primary" />
              FlagLab
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={location === item.href || (item.href !== "/" && location.startsWith(item.href))}>
                        <Link href={item.href}>
                          <item.icon className="w-4 h-4" />
                          {item.title}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <div className="p-3 mt-auto">
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
              onClick={handleNewPlay}
            >
              <Plus className="w-4 h-4" />
              New Play
            </Button>
          </div>
        </Sidebar>
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b border-border flex items-center px-4 gap-3 bg-background/80 backdrop-blur-sm sticky top-0 z-30">
            <SidebarTrigger>
              <Menu className="w-5 h-5" />
            </SidebarTrigger>
            {headerTitle && (
              <>
                <div className="w-px h-6 bg-border" />
                {isEditingTitle && onTitleChange ? (
                  <input
                    ref={titleInputRef}
                    className="text-sm font-semibold bg-transparent border border-primary/50 rounded px-2 py-1 outline-none focus:border-primary text-foreground"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={handleTitleSubmit}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleTitleSubmit();
                      if (e.key === "Escape") {
                        setEditTitle(headerTitle || "");
                        setIsEditingTitle(false);
                      }
                    }}
                  />
                ) : (
                  <h1
                    className={`text-sm font-semibold truncate ${onTitleChange ? "cursor-pointer hover:text-primary transition-colors" : ""}`}
                    onClick={() => { if (onTitleChange) setIsEditingTitle(true); }}
                    title={onTitleChange ? "Click to edit title" : undefined}
                  >
                    {headerTitle}
                  </h1>
                )}
              </>
            )}
            <div className="ml-auto flex items-center gap-2">
              {headerActions}
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
