import { useAuth } from "../../hooks/useAuth";
import { useCategories } from "../../hooks/useCategories";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeMenu: string;
  onMenuChange: (menu: string) => void;
}

export function Sidebar({
  isOpen,
  onClose,
  activeMenu,
  onMenuChange,
}: SidebarProps) {
  const { hasPermission } = useAuth();
  const { data: categories } = useCategories();

  const menuItems = [
    { id: "home", label: "Ana Sayfa", icon: "🏠" },
    { id: "drafts", label: "Taslaklarım", icon: "📝" },
    { id: "favorites", label: "Favorilerim", icon: "⭐" },
  ];

  const adminMenuItems = [
    { id: "admin-pending-approval", label: "Onay Bekleyenler", icon: "⏳", permissions: ["posts.approve"] },
    { id: "admin-users", label: "Kullanıcılar", icon: "👤", permissions: ["users.create"] },
    { id: "admin-roles", label: "Roller", icon: "🛡️", permissions: ["roles.manage"] },
    { id: "admin-categories", label: "Kategoriler", icon: "📁", permissions: ["categories.create", "categories.update", "categories.delete"] },
    { id: "admin-tags", label: "Etiketler", icon: "🏷️", permissions: ["tags.create", "tags.update", "tags.delete"] },
    { id: "admin-units", label: "Birimler", icon: "🏢", permissions: ["units.create", "units.update", "units.delete"] },
    { id: "admin-teams", label: "Ekip Yönetimi", icon: "⚙️", permissions: ["teams.create", "teams.update", "teams.delete"] },
  ];

  const visibleAdminItems = adminMenuItems.filter((item) =>
    item.permissions.some((p) => hasPermission(p))
  );

  return (
    <>
      {/* Backdrop (Mobil) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky inset-y-0 left-0 z-50 lg:top-[60px]
          w-64 bg-white border-r border-gray-200
          transform transition-transform duration-200
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          h-screen lg:h-[calc(100vh-60px)] overflow-y-auto
        `}
      >
        <div className="p-4">
          {/* Logo (Mobil) */}
          <div className="flex items-center justify-between mb-6 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">N</span>
              </div>
              <span className="font-bold text-gray-800">NoteX</span>
            </div>
            <button onClick={onClose} className="text-gray-500 text-xl">
              ✕
            </button>
          </div>

          {/* Ana Menü */}
          <nav className="space-y-1 mb-6">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onMenuChange(item.id);
                  onClose();
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors
                  ${
                    activeMenu === item.id
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }
                `}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Kategoriler (API'den) */}
          {categories && categories.length > 0 && (
            <div className="mb-6">
              <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Kategoriler
              </h3>
              <div className="space-y-1">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      onMenuChange(`category-${cat.id}`);
                      onClose();
                    }}
                    className={`
                      w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors
                      ${
                        activeMenu === `category-${cat.id}`
                          ? "bg-blue-50 text-blue-600 font-medium"
                          : "text-gray-600 hover:bg-gray-50"
                      }
                    `}
                  >
                    <span>{cat.icon || "📄"}</span>
                    <span className="text-sm">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Admin Menü */}
          {visibleAdminItems.length > 0 && (
            <div>
              <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Yönetim
              </h3>
              <div className="space-y-1">
                {visibleAdminItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onMenuChange(item.id);
                      onClose();
                    }}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors
                      ${
                        activeMenu === item.id
                          ? "bg-blue-50 text-blue-600 font-medium"
                          : "text-gray-600 hover:bg-gray-50"
                      }
                    `}
                  >
                    <span>{item.icon}</span>
                    <span className="text-sm">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
