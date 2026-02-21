import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PostList } from "../components/posts";
import { Loading } from "../components/common";
import { Avatar } from "../components/common/Avatar";
import { searchApi } from "../api/search.api";
import { postsApi } from "../api/posts.api";
import { usePopularTags } from "../hooks/useTags";
import { useTopAuthors } from "../hooks/useUsers";

type SearchTab = "posts" | "users" | "tags";

export default function Search() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";

  const [activeTab, setActiveTab] = useState<SearchTab>("posts");
  const [postPage, setPostPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [tagPage, setTagPage] = useState(1);

  const PAGE_SIZE = 10;

  const { data: searchData, isLoading } = useQuery({
    queryKey: ["search-page", query, postPage, userPage, tagPage],
    queryFn: () =>
      searchApi.search({
        q: query,
        postPage,
        postPageSize: PAGE_SIZE,
        userPage,
        userPageSize: PAGE_SIZE,
        tagPage,
        tagPageSize: PAGE_SIZE,
      }),
    enabled: !!query,
  });

  // Sağ sidebar verileri
  const { data: popularTags } = usePopularTags(8);
  const { data: topAuthors } = useTopAuthors(5);
  const { data: trendingData } = useQuery({
    queryKey: ["posts", "trending"],
    queryFn: () => postsApi.getAll({ sortBy: "3", pageSize: 5 }),
  });

  const postCount = searchData?.posts?.totalCount || 0;
  const userCount = searchData?.users?.totalCount || 0;
  const tagCount = searchData?.tags?.totalCount || 0;

  const posts =
    searchData?.posts?.items?.map((post) => ({
      id: post.id,
      title: post.title,
      summary: post.summary,
      authorName: post.authorName,
      authorProfileImage: post.authorProfileImage,
      teamName: post.teamName,
      createdAt: post.publishedAt || "",
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      viewCount: post.viewCount,
      categoryName: post.categoryName,
      categoryColor: post.categoryColor,
      tags: post.tags,
      isPinned: false,
      isLiked: false,
      isFavorited: false,
    })) || [];

  const totalPostPages = Math.ceil(postCount / PAGE_SIZE);
  const totalUserPages = Math.ceil(userCount / PAGE_SIZE);
  const totalTagPages = Math.ceil(tagCount / PAGE_SIZE);

  if (!query) {
    return (
      <div className="text-center py-12">
        <span className="text-5xl mb-4 block">🔍</span>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Arama</h1>
        <p className="text-gray-500">
          Aramak istediğiniz kelimeyi üst kısımdaki arama çubuğuna yazın.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <Loading text="Arama sonuçları yükleniyor..." />;
  }

  const tabs: { key: SearchTab; label: string; count: number; icon: string }[] =
    [
      { key: "posts", label: "Postlar", count: postCount, icon: "📝" },
      { key: "users", label: "Kullanıcılar", count: userCount, icon: "👥" },
      { key: "tags", label: "Etiketler", count: tagCount, icon: "🏷️" },
    ];

  return (
    <div className="flex gap-6">
      {/* Sol - Arama Sonuçları */}
      <div className="flex-1 min-w-0">
        {/* Başlık */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 wrap-break-words">
            "{query}" için arama sonuçları
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {postCount + userCount + tagCount} sonuç bulundu
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                if (tab.key === "posts") setPostPage(1);
                if (tab.key === "users") setUserPage(1);
                if (tab.key === "tags") setTagPage(1);
              }}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.icon} {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Post Sonuçları */}
        {activeTab === "posts" && (
          <div>
            <PostList
              posts={posts}
              emptyMessage="Bu arama için post bulunamadı."
              onPostClick={(post) => {
                const slug = searchData?.posts?.items?.find(
                  (p) => p.id === post.id,
                )?.slug;
                if (slug) navigate(`/posts/${slug}`);
              }}
            />

            {totalPostPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setPostPage((p) => Math.max(1, p - 1))}
                  disabled={postPage === 1}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Önceki
                </button>
                <span className="text-sm text-gray-600">
                  {postPage} / {totalPostPages}
                </span>
                <button
                  onClick={() =>
                    setPostPage((p) => Math.min(totalPostPages, p + 1))
                  }
                  disabled={postPage === totalPostPages}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sonraki
                </button>
              </div>
            )}
          </div>
        )}

        {/* Kullanıcı Sonuçları */}
        {activeTab === "users" && (
          <div>
            {searchData?.users?.items && searchData.users.items.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {searchData.users.items.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => navigate(`/profile/${user.id}`)}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-left hover:shadow-md transition-shadow group"
                  >
                    <div className="flex flex-col items-center text-center">
                      <Avatar name={user.fullName} size="lg" />
                      <h3 className="font-semibold text-gray-800 mt-3 group-hover:text-blue-600 transition-colors truncate w-full">
                        {user.fullName}
                      </h3>
                      {user.title && (
                        <p className="text-sm text-gray-500 truncate w-full mt-0.5">
                          {user.title}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full">
                          {user.unitName}
                        </span>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                          {user.teamName}
                        </span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-100 w-full">
                        <span className="text-sm font-medium text-gray-700">
                          {user.postCount}
                        </span>
                        <span className="text-xs text-gray-400 ml-1">post</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <span className="text-4xl mb-2 block">👥</span>
                <p className="text-gray-500">
                  Bu arama için kullanıcı bulunamadı.
                </p>
              </div>
            )}

            {totalUserPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                  disabled={userPage === 1}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Önceki
                </button>
                <span className="text-sm text-gray-600">
                  {userPage} / {totalUserPages}
                </span>
                <button
                  onClick={() =>
                    setUserPage((p) => Math.min(totalUserPages, p + 1))
                  }
                  disabled={userPage === totalUserPages}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sonraki
                </button>
              </div>
            )}
          </div>
        )}

        {/* Etiket Sonuçları */}
        {activeTab === "tags" && (
          <div>
            {searchData?.tags?.items && searchData.tags.items.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {searchData.tags.items.map((tag) => {
                  const maxUsage = Math.max(
                    ...searchData.tags.items.map((t) => t.usageCount),
                    1,
                  );
                  const barWidth = Math.max(
                    (tag.usageCount / maxUsage) * 100,
                    8,
                  );

                  return (
                    <button
                      key={tag.id}
                      onClick={() => navigate(`/posts?tag=${tag.slug}`)}
                      className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-left hover:shadow-md hover:border-blue-200 transition-all group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-blue-600 font-semibold group-hover:text-blue-700 transition-colors">
                          #{tag.name}
                        </span>
                        <span className="text-lg">🏷️</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-800">
                        {tag.usageCount}
                      </p>
                      <p className="text-xs text-gray-400 mb-2">post</p>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <span className="text-4xl mb-2 block">🏷️</span>
                <p className="text-gray-500">
                  Bu arama için etiket bulunamadı.
                </p>
              </div>
            )}

            {totalTagPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setTagPage((p) => Math.max(1, p - 1))}
                  disabled={tagPage === 1}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Önceki
                </button>
                <span className="text-sm text-gray-600">
                  {tagPage} / {totalTagPages}
                </span>
                <button
                  onClick={() =>
                    setTagPage((p) => Math.min(totalTagPages, p + 1))
                  }
                  disabled={tagPage === totalTagPages}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sonraki
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sağ - Sidebar (tüm tab'larda görünür) */}
      <div className="hidden lg:block w-80 space-y-5 sticky top-21 self-start">
        {topAuthors && topAuthors.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm">
              ✍️ Popüler Yazarlar
            </h3>
            <div className="space-y-2.5">
              {topAuthors.slice(0, 4).map((author) => (
                <div
                  key={author.id}
                  onClick={() => navigate(`/profile/${author.id}`)}
                  className="flex items-center gap-2.5 p-1.5 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                >
                  <Avatar
                    name={author.fullName}
                    imageUrl={author.profileImageUrl}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {author.fullName}
                    </p>
                    <p className="text-xs text-gray-400">{author.teamName}</p>
                  </div>
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full shrink-0">
                    {author.postCount} post
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {trendingData?.items && trendingData.items.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm">
              📈 En Çok Okunan Postlar
            </h3>
            <div className="space-y-2.5">
              {trendingData.items.slice(0, 5).map((post, idx) => (
                <div
                  key={post.id}
                  onClick={() => navigate(`/posts/${post.slug || post.id}`)}
                  className="flex gap-2.5 p-1.5 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                >
                  <span className="text-base font-bold text-gray-300 shrink-0 w-5 text-center">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 line-clamp-1">
                      {post.title}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <span>{post.authorName}</span>
                      <span>·</span>
                      <span>👁️ {post.viewCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {popularTags && popularTags.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm">
              🔥 Popüler Etiketler
            </h3>
            <div className="flex flex-wrap gap-2">
              {popularTags.map((tag) => (
                <span
                  key={tag.id}
                  onClick={() => navigate(`/posts?tag=${tag.slug}`)}
                  className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg hover:bg-gray-200 cursor-pointer transition-colors"
                >
                  #{tag.name}
                  <span className="ml-1 text-gray-400 text-xs">
                    {tag.usageCount}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
