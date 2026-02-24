import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useSearch } from "../../hooks/useSearch";
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
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // 300ms debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchResults, isLoading: searchLoading } = useSearch(
    debouncedQuery,
    showSearchDropdown
  );

  // Dışarı tıklayınca dropdown'ı kapat
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (e.target.value.trim().length >= 2) {
      setShowSearchDropdown(true);
    } else {
      setShowSearchDropdown(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setShowSearchDropdown(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const postCount = searchResults?.posts?.totalCount || 0;
  const userCount = searchResults?.users?.totalCount || 0;
  const tagCount = searchResults?.tags?.totalCount || 0;
  const hasResults = postCount > 0 || userCount > 0 || tagCount > 0;

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
          <div
            ref={searchRef}
            className="relative flex-1 max-w-xl mx-4 hidden md:block"
          >
            <form onSubmit={handleSearch}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  🔍
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchInput}
                  onFocus={() => {
                    if (searchQuery.trim().length >= 2)
                      setShowSearchDropdown(true);
                  }}
                  placeholder="Post, etiket veya kullanıcı ara..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </form>

            {/* Arama Dropdown */}
            {showSearchDropdown && debouncedQuery.length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
                {searchLoading ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    Aranıyor...
                  </div>
                ) : !hasResults ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    Sonuç bulunamadı.
                  </div>
                ) : (
                  <>
                    {/* Postlar */}
                    {searchResults?.posts?.items &&
                      searchResults.posts.items.length > 0 && (
                        <div>
                          <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Postlar ({postCount})
                          </div>
                          {searchResults.posts.items.map((post) => (
                            <button
                              key={post.id}
                              onClick={() => {
                                navigate(`/posts/${post.slug}`);
                                setShowSearchDropdown(false);
                                setSearchQuery("");
                              }}
                              className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-start gap-3"
                            >
                              <span className="text-blue-500 mt-0.5 shrink-0">
                                📝
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">
                                  {post.title}
                                </p>
                                {post.summary && (
                                  <p className="text-xs text-gray-500 truncate">
                                    {post.summary}
                                  </p>
                                )}
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {post.authorName}{post.teamName ? ` · ${post.teamName}` : ""}
                                </p>
                              </div>
                            </button>
                          ))}
                          {postCount > searchResults.posts.items.length && (
                            <button
                              onClick={() => {
                                navigate(
                                  `/search?q=${encodeURIComponent(debouncedQuery)}`
                                );
                                setShowSearchDropdown(false);
                                setSearchQuery("");
                              }}
                              className="w-full px-4 py-2 text-center text-xs text-blue-600 hover:bg-blue-50 font-medium"
                            >
                              Tüm postları gör ({postCount})
                            </button>
                          )}
                        </div>
                      )}

                    {/* Kullanıcılar */}
                    {searchResults?.users?.items &&
                      searchResults.users.items.length > 0 && (
                        <div>
                          <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Kullanıcılar ({userCount})
                          </div>
                          {searchResults.users.items.map((u) => (
                            <button
                              key={u.id}
                              onClick={() => {
                                navigate(`/profile/${u.id}`);
                                setShowSearchDropdown(false);
                                setSearchQuery("");
                              }}
                              className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
                            >
                              <Avatar name={u.fullName} size="sm" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">
                                  {u.fullName}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {u.email}{u.teamName ? ` · ${u.teamName}` : ""}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                    {/* Etiketler */}
                    {searchResults?.tags?.items &&
                      searchResults.tags.items.length > 0 && (
                        <div>
                          <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Etiketler ({tagCount})
                          </div>
                          <div className="px-4 py-2 flex flex-wrap gap-2">
                            {searchResults.tags.items.map((tag) => (
                              <button
                                key={tag.id}
                                onClick={() => {
                                  navigate(`/posts?tag=${tag.slug}`);
                                  setShowSearchDropdown(false);
                                  setSearchQuery("");
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition-colors"
                              >
                                <span className="text-blue-600 font-medium">
                                  #{tag.name}
                                </span>
                                <span className="text-gray-400 text-xs">
                                  {tag.usageCount}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Tümünü gör */}
                    <div className="border-t border-gray-100">
                      <button
                        onClick={() => {
                          navigate(
                            `/search?q=${encodeURIComponent(debouncedQuery)}`
                          );
                          setShowSearchDropdown(false);
                          setSearchQuery("");
                        }}
                        className="w-full px-4 py-2.5 text-center text-sm text-blue-600 hover:bg-blue-50 font-medium transition-colors"
                      >
                        "{debouncedQuery}" için tüm sonuçları gör
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

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
                        {user?.teamName || user?.unitName}
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
