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
  ChevronDown,
  Bell,
  Search,
  SlidersHorizontal,
  Store
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { AdminUser, AdminRole } from "@/types/catalogue";
import { NavbarLogo } from "@/components/navbar-logo";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [mounted, setMounted] = useState(false);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const navigate = useNavigate();
  const state = useRouterState();
  const currentPath = state.location.pathname;

  useEffect(() => {
    setMounted(true);
  }, []);

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
          await signOut(auth);
          toast.error("Unauthorized access.");
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

  if (!mounted || loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-black border-t-transparent shadow-sm" />
          <p className="font-mono text-xs font-semibold text-neutral-600 uppercase tracking-widest">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  const menuGroups = [
    {
      title: "Overview",
      items: [
        { label: "Dashboard", href: "/admin", icon: LayoutDashboard }
      ]
    },
    {
      title: "Catalogue & Inventory",
      items: [
        { label: "Products", href: "/admin/products", icon: Package },
        { label: "Categories", href: "/admin/categories", icon: FolderTree },
        { label: "Media Library", href: "/admin/media", icon: ImageIcon },
        { label: "Brochures", href: "/admin/brochures", icon: FileText }
      ]
    },
    {
      title: "Orders & Leads",
      items: [
        { label: "Enquiries", href: "/admin/enquiries", icon: Inbox },
        { label: "Site Visits", href: "/admin/site-visits", icon: Calendar }
      ]
    },
    {
      title: "Store Settings",
      items: [
        { label: "Admin Users", href: "/admin/users", icon: Users },
        { label: "Settings", href: "/admin/settings", icon: Settings }
      ]
    }
  ];

  const isLinkActive = (href: string) => {
    if (href === "/admin") {
      return currentPath === "/admin";
    }
    return currentPath.startsWith(href);
  };

  const getRoleLabel = (_role?: AdminRole) => "Admin";

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-white text-black border-r border-neutral-200">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-neutral-200 px-5 bg-white">
        <Link to="/admin" className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Vensai Global" className="h-8 w-auto object-contain" />
          <span className="font-display text-sm font-bold tracking-[0.14em] uppercase text-black whitespace-nowrap">
            VENSAI GLOBAL
          </span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3.5 py-5 space-y-6">
        {menuGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <h2 className="px-3 text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono">
              {group.title}
            </h2>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = isLinkActive(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.label}>
                    <Link
                      to={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "group flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition-all",
                        active
                          ? "bg-black text-white shadow-sm"
                          : "text-neutral-700 hover:bg-neutral-100 hover:text-black"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className={cn("h-4 w-4 shrink-0 transition-colors", active ? "text-white" : "text-black")} />
                        {item.label}
                      </span>
                      {active && (
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Admin User Footer Profile */}
      {admin && (
        <div className="border-t border-neutral-200 p-3.5 bg-neutral-50">
          <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-2.5 shadow-xs">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black text-white font-bold text-xs">
                {admin.name ? admin.name.substring(0, 2).toUpperCase() : "VP"}
              </div>
              <div className="overflow-hidden">
                <p className="truncate text-xs font-bold text-black">{admin.name}</p>
                <p className="truncate text-[10px] text-neutral-500 font-mono">{getRoleLabel(admin.role)}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-md p-1.5 text-black hover:bg-neutral-100 hover:text-red-600 transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4 text-black" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="admin-panel flex min-h-screen w-full bg-white text-black font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden w-60 shrink-0 md:block">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setMobileOpen(false)} />
          <div className="relative flex w-60 flex-col bg-white shadow-2xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3.5 rounded-lg bg-neutral-100 p-1 text-black"
            >
              <X className="h-4 w-4 text-black" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white">
        {/* Top Header Bar */}
        <header className="flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-6 md:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-black md:hidden"
            >
              <Menu className="h-5 w-5 text-black" />
            </button>

            {/* Global Search Bar */}
            <div className="relative hidden sm:flex items-center">
              <Search className="absolute left-3.5 h-4 w-4 text-black pointer-events-none" />
              <input
                type="text"
                placeholder="Search store catalogue..."
                className="h-9 w-72 rounded-lg bg-neutral-50 border border-neutral-200 pl-10 pr-4 text-xs text-black placeholder-neutral-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* View Live Store Link */}
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-700 border border-neutral-200 px-3 py-1.5 rounded-lg bg-neutral-50"
            >
              <Store className="h-3.5 w-3.5 text-black" />
              View Live Store
            </a>

            {/* Notification Icon */}
            <button className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-50 border border-neutral-200 text-black" aria-label="Notifications">
              <Bell className="h-4 w-4 text-black" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-black ring-2 ring-white" />
            </button>

            {/* Profile Widget */}
            {admin && (
              <div className="flex items-center gap-2.5 pl-3 border-l border-neutral-200">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white font-bold text-xs">
                  {admin.name ? admin.name.substring(0, 2).toUpperCase() : "VP"}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-black">{admin.name}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-black" />
                  </div>
                  <p className="text-[10px] text-neutral-500 font-mono">{getRoleLabel(admin.role)}</p>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Content Body with Crisp White Background */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-white">
          {children}
        </main>
      </div>
    </div>
  );
}
