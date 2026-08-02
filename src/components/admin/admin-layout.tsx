import React, { useState, useEffect } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Image as ImageIcon,
  FileText,
  Inbox,
  Calendar,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  User as UserIcon,
  ChevronRight,
  ChevronDown,
  Bell,
  Search,
  LayoutGrid,
  Sparkles,
  SlidersHorizontal
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { AdminUser, AdminRole } from "@/types/catalogue";
import { Button } from "@/components/ui/button";
import { NavbarLogo } from "@/components/navbar-logo";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const navigate = useNavigate();
  const state = useRouterState();
  const currentPath = state.location.pathname;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (currentPath !== "/admin/login") {
          navigate({ to: "/admin/login" });
        }
        setLoading(false);
        return;
      }

      try {
        const adminDoc = await getDoc(doc(db, "admins", user.uid));
        if (adminDoc.exists() && adminDoc.data().active) {
          setAdmin({ uid: user.uid, ...adminDoc.data() } as AdminUser);
        } else {
          // Logged in but not an active admin
          await signOut(auth);
          toast.error("Unauthorized: Access denied.");
          navigate({ to: "/admin/login" });
        }
      } catch (err) {
        console.error("Auth verification error:", err);
        await signOut(auth);
        navigate({ to: "/admin/login" });
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [currentPath, navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully");
      navigate({ to: "/admin/login" });
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#FAF9F5]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-[#8B7D6B] border-t-transparent shadow-md shadow-[#8B7D6B]/20" />
          <p className="font-mono text-xs font-semibold text-[#776E63] uppercase tracking-widest">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  // Sidebar items grouped by section
  const menuGroups = [
    {
      title: "Navigation",
      roles: ["super_admin", "catalogue_manager", "sales"],
      items: [
        { label: "Dashboard", href: "/admin", icon: LayoutDashboard, roles: ["super_admin", "catalogue_manager", "sales"] }
      ]
    },
    {
      title: "Catalogue",
      roles: ["super_admin", "catalogue_manager"],
      items: [
        { label: "Products", href: "/admin/products", icon: Package, roles: ["super_admin", "catalogue_manager"] },
        { label: "Categories", href: "/admin/categories", icon: FolderTree, roles: ["super_admin", "catalogue_manager"] },
        { label: "Media Library", href: "/admin/media", icon: ImageIcon, roles: ["super_admin", "catalogue_manager"] },
        { label: "Brochures", href: "/admin/brochures", icon: FileText, roles: ["super_admin", "catalogue_manager"] }
      ]
    },
    {
      title: "Leads & Enquiries",
      roles: ["super_admin", "sales"],
      items: [
        { label: "Enquiries", href: "/admin/enquiries", icon: Inbox, roles: ["super_admin", "sales"] },
        { label: "Site Visits", href: "/admin/site-visits", icon: Calendar, roles: ["super_admin", "sales"] }
      ]
    },
    {
      title: "System & Access",
      roles: ["super_admin"],
      items: [
        { label: "Admin Users", href: "/admin/users", icon: Users, roles: ["super_admin"] },
        { label: "Settings", href: "/admin/settings", icon: Settings, roles: ["super_admin"] }
      ]
    }
  ];

  // Helper to determine if link is active
  const isLinkActive = (href: string) => {
    if (href === "/admin") {
      return currentPath === "/admin";
    }
    return currentPath.startsWith(href);
  };

  const hasGroupAccess = (groupRoles: string[]) => {
    if (!admin) return false;
    return groupRoles.includes(admin.role);
  };

  const getRoleLabel = (role: AdminRole) => {
    switch (role) {
      case "super_admin": return "Super Admin";
      case "catalogue_manager": return "Catalogue Manager";
      case "sales": return "Sales Manager";
      default: return "Staff";
    }
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-white text-[#211C17] border-r border-[#E5E2DC]">
      {/* Brand Header */}
      <div className="flex h-20 items-center justify-between border-b border-[#E5E2DC] px-6">
        <div>
          <NavbarLogo size="sm" />
          <p className="text-[9px] font-medium text-[#776E63] uppercase tracking-wider mt-1 pl-[1.875rem]">Architectural Surfaces</p>
        </div>
        <button className="rounded-lg p-1.5 text-[#776E63] hover:bg-[#FAF8F5] hover:text-[#211C17] transition-colors">
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 scrollbar-hide space-y-6">
        {menuGroups.map((group) => {
          if (!hasGroupAccess(group.roles)) return null;
          return (
            <div key={group.title} className="space-y-1.5">
              <h2 className="px-3 text-[11px] font-semibold text-[#776E63] uppercase tracking-wider">
                {group.title}
              </h2>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  if (admin && !item.roles.includes(admin.role)) return null;
                  const active = isLinkActive(item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.label}>
                      <Link
                        to={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all",
                          active
                            ? "bg-[#F5F1EA] text-[#211C17] font-bold shadow-xs border border-[#E5E2DC]"
                            : "text-[#5B554C] hover:bg-[#FAF8F5] hover:text-[#211C17]"
                        )}
                      >
                        <span className="flex items-center gap-3">
                          <Icon className={cn("h-4 w-4 shrink-0 transition-colors", active ? "text-[#8B7D6B]" : "text-[#776E63] group-hover:text-[#211C17]")} />
                          {item.label}
                        </span>
                        {active && (
                          <span className="h-1.5 w-1.5 rounded-full bg-[#8B7D6B]" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Admin User Footer Profile */}
      {admin && (
        <div className="border-t border-[#E5E2DC] p-4 bg-[#FAF8F5]">
          <div className="flex items-center justify-between rounded-xl border border-[#E5E2DC] bg-white p-3 shadow-xs">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#211C17] text-[#EADFCE] font-bold text-xs">
                {admin.name ? admin.name.substring(0, 2).toUpperCase() : "VP"}
              </div>
              <div className="overflow-hidden">
                <p className="truncate text-xs font-semibold text-[#211C17]">{admin.name}</p>
                <p className="truncate text-[10px] text-[#776E63] font-medium">{getRoleLabel(admin.role)}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg p-2 text-[#776E63] hover:bg-red-50 hover:text-red-600 transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-[#FAF9F5] text-[#211C17] font-sans">
      {/* Desktop Sidebar (Permanent) */}
      <aside className="hidden w-64 shrink-0 md:block">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar (Drawer) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-[#211C17]/40 backdrop-blur-xs" onClick={() => setMobileOpen(false)} />
          
          <div className="relative flex w-64 flex-col bg-white animate-slide-in shadow-2xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-4 top-4 rounded-lg bg-[#FAF8F5] p-1.5 text-[#776E63] hover:bg-[#E5E2DC]"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Body */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="flex h-20 items-center justify-between border-b border-[#E5E2DC] bg-white px-6 md:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-xl p-2 text-[#5B554C] hover:bg-[#FAF8F5] md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Header Search Input Bar matching homepage palette */}
            <div className="relative hidden sm:flex items-center">
              <Search className="absolute left-3.5 h-4 w-4 text-[#776E63] pointer-events-none" />
              <input
                type="text"
                placeholder="Search catalogue..."
                className="h-10 w-72 rounded-xl bg-[#FAF8F5] border border-[#E5E2DC] pl-10 pr-4 text-xs text-[#211C17] placeholder-[#776E63] focus:outline-none focus:border-[#8B7D6B] focus:ring-2 focus:ring-[#8B7D6B]/20 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Icon */}
            <button className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[#FAF8F5] border border-[#E5E2DC] text-[#5B554C] hover:text-[#211C17] transition-colors" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#8B7D6B] ring-2 ring-white" />
            </button>

            {/* User Profile Pill Widget on top right */}
            {admin && (
              <div className="flex items-center gap-3 pl-2 border-l border-[#E5E2DC]">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#211C17] text-[#EADFCE] font-bold text-xs shadow-xs">
                  {admin.name ? admin.name.substring(0, 2).toUpperCase() : "VP"}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-[#211C17]">{admin.name}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-[#776E63]" />
                  </div>
                  <p className="text-[10px] text-[#776E63] font-medium">{getRoleLabel(admin.role)}</p>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

