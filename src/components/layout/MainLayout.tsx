import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Aktif menüyü URL'den belirle
  const getActiveMenu = (): string => {
    const path = location.pathname;
    if (path === "/" || path === "/posts") return "home";
    if (path === "/favorites") return "favorites";
    if (path === "/teams") return "teams";
    if (path === "/drafts") return "drafts";
    if (path.startsWith("/admin/users")) return "admin-users";
    if (path.startsWith("/admin/categories")) return "admin-categories";
    if (path.startsWith("/admin/tags")) return "admin-tags";
    if (path.startsWith("/admin/units")) return "admin-units";
    if (path.startsWith("/admin/teams")) return "admin-teams";
    if (path.startsWith("/admin/roles")) return "admin-roles";
    return "home";
  };

  const handleMenuChange = (menu: string) => {
    switch (menu) {
      case "home":
        navigate("/");
        break;
      case "posts":
        navigate("/posts");
        break;
      case "favorites":
        navigate("/favorites");
        break;
      case "teams":
        navigate("/teams");
        break;
      case "drafts":
        navigate("/drafts");
        break;
      case "admin-users":
        navigate("/admin/users");
        break;
      case "admin-categories":
        navigate("/admin/categories");
        break;
      case "admin-tags":
        navigate("/admin/tags");
        break;
      case "admin-units":
        navigate("/admin/units");
        break;
      case "admin-teams":
        navigate("/admin/teams");
        break;
      case "admin-roles":
        navigate("/admin/roles");
        break;
      default:
        if (menu.startsWith("category-")) {
          const categoryId = menu.replace("category-", "");
          navigate(`/posts?category=${categoryId}`);
        }
    }
  };

  const handleCreatePost = () => {
    navigate("/posts/new");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header
        onMenuClick={() => setSidebarOpen(true)}
        onCreatePost={handleCreatePost}
      />
      <div className="flex">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeMenu={getActiveMenu()}
          onMenuChange={handleMenuChange}
        />
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
