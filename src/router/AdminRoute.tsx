import { useAuth } from "../hooks/useAuth";
import type { ReactNode } from "react";

interface AdminRouteProps {
  children: ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { hasPermission } = useAuth();

  if (!hasPermission("admin.access")) {
    return (
      <div className="text-center py-12">
        <span className="text-4xl mb-4 block">🔒</span>
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          Erişim Engellendi
        </h2>
        <p className="text-gray-600">Bu sayfaya erişim yetkiniz yok.</p>
      </div>
    );
  }

  return <>{children}</>;
}
