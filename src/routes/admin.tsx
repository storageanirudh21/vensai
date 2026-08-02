import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useRouterState } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/admin-layout";

export const Route = createFileRoute("/admin")({
  component: AdminLayoutRouteComponent,
});

function AdminLayoutRouteComponent() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isLogin = pathname === "/admin/login";

  // Login page has its own standalone design without sidebar
  if (isLogin) {
    return <Outlet />;
  }

  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}
