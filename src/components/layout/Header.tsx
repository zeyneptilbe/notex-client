import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Avatar } from "../common/Avatar";
import { NotificationsDropdown } from "./NotificationsDropdown";

interface HeaderProps {
  onMenuClick?: () => void;
  onCreatePost?: () => void;
}

export function Header({ onMenuClick, onCreatePost }: HeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/posts?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Sol - Menu ve Logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <span className="text-xl">☰</span>
            </button>

            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigate("/")}
            >
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">N</span>
              </div>
              <span className="text-xl font-bold text-gray-800 hidden sm:block">
                NoteX
              </span>
            </div>
          </div>

          {/* Orta - Arama */}
          <form
            onSubmit={handleSearch}
            className="flex-1 max-w-xl mx-4 hidden md:block"
          >
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                🔍
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Post, etiket veya kullanıcı ara..."
                className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </form>

          {/* Sağ - Butonlar ve Profil */}
          <div className="flex items-center gap-3">
            {/* Yeni Post Butonu */}
            <button
              onClick={onCreatePost}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors hidden sm:flex items-center gap-2"
            >
              <span>+</span>
              <span className="hidden md:inline">Yeni Post</span>
            </button>

            {/* Bildirimler */}
            <NotificationsDropdown />

            {/* Profil Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Avatar name={user?.fullName || "User"} size="sm" />
                <span className="text-gray-700 text-sm hidden md:block">
                  {user?.fullName}
                </span>
                <span className="text-gray-400 text-xs">▼</span>
              </button>

              {showDropdown && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowDropdown(false)}
                  ></div>

                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-medium text-gray-800">
                        {user?.fullName}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {user?.email}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {user?.teamName}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        navigate("/profile");
                      }}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <span>👤</span>
                      <span>Profilim</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        navigate("/favorites");
                      }}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <span>❤️</span>
                      <span>Favorilerim</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        // Settings sayfası eklenecek
                      }}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <span>⚙️</span>
                      <span>Ayarlar</span>
                    </button>

                    <hr className="my-1" />

                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <span>🚪</span>
                      <span>Çıkış Yap</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
