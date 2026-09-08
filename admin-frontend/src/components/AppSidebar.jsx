import { LayoutDashboard, ListChecks, LogOut } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const navGroups = [
  {
    label: "Overview",
    items: [{ to: "/", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Survey Data",
    items: [{ to: "/responses", label: "Responses", icon: ListChecks }],
  },
];

export function AppSidebar() {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const initials = (user?.name || user?.email || "A").slice(0, 2).toUpperCase();

  return (
    <Sidebar className="border-none">
      <SidebarHeader className="px-4 py-4">
        <span className="text-sm font-semibold tracking-tight">Namma Transit</span>
        <span className="text-xs text-muted-foreground">Survey Admin</span>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive =
                    item.to === "/"
                      ? location.pathname === "/"
                      : location.pathname.startsWith(item.to);

                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <NavLink
                          to={item.to}
                          className={
                            isActive
                              ? "rounded-sm bg-gradient-to-r from-indigo-500 to-violet-500 !text-white shadow-sm transition-colors duration-200 hover:from-indigo-500 hover:to-violet-500 hover:!text-white"
                              : "rounded-sm transition-colors duration-200"
                          }
                        >
                          <item.icon />
                          <span>{item.label}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-2 px-1 py-1">
          <Avatar className="size-8">
            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-500 text-xs text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col items-start text-left">
            <span className="w-full truncate text-xs font-medium">{user?.name}</span>
            <span className="w-full truncate text-[11px] text-muted-foreground">
              {user?.email}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => signOut()}
            title="Sign out"
          >
            <LogOut />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
