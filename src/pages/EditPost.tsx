import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { Loading } from "../components/common/Loading";
import { useCategories } from "../hooks/useCategories";
import { useTags } from "../hooks/useTags";
import { postsApi } from "../api/posts.api";

export default function EditPost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: categories } = useCategories();
  const { data: allTags } = useTags();

  const [postId, setPostId] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [visibility, setVisibility] = useState(2);
  const [status, setStatus] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Post verisini API'den çek
  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;

      setIsLoading(true);
      try {
        const post = await postsApi.getBySlug(slug);
        setPostId(post.id);
        setTitle(post.title);
        setSummary(post.summary || "");
        setContent(post.content || "");
        setCategoryId(post.categoryId || "");
        setSelectedTags(post.tags || []);
        setVisibility(post.visibility);
        setStatus(post.status);
      } catch (error) {
        console.error("Post yükleme hatası:", error);
        setErrors({ load: "Post yüklenirken bir hata oluştu." });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !selectedTags.includes(tag) && selectedTags.length < 5) {
      setSelectedTags([...selectedTags, tag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag));
  };

  const handleSelectExistingTag = (tagName: string) => {
    const tag = tagName.toLowerCase();
    if (!selectedTags.includes(tag) && selectedTags.length < 5) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = "Başlık zorunludur";
    } else if (title.length < 5) {
      newErrors.title = "Başlık en az 5 karakter olmalıdır";
    }

    if (!content.trim()) {
      newErrors.content = "İçerik zorunludur";
    } else if (content.length < 50) {
      newErrors.content = "İçerik en az 50 karakter olmalıdır";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const postData = {
        id: postId,
        title,
        summary,
        content,
        categoryId: categoryId || undefined,
        tags: selectedTags,
        visibility,
        status,
      };

      console.log("Updating post:", postData);

      await postsApi.update(postData);

      // Başarılı - post detay sayfasına dön
      navigate(`/posts/${slug}`);
    } catch (error) {
      console.error("Post güncelleme hatası:", error);
      setErrors({ submit: "Post güncellenirken bir hata oluştu." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  // Filtrelenmiş tag önerileri
  const tagSuggestions = allTags
    ?.filter(
      (tag) =>
        tag.name.toLowerCase().includes(tagInput.toLowerCase()) &&
        !selectedTags.includes(tag.name.toLowerCase()),
    )
    .slice(0, 5);

  // Yükleniyor
  if (isLoading) {
    return <Loading text="Post yükleniyor..." />;
  }

  // Yükleme hatası
  if (errors.load) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <span className="text-5xl mb-4 block">😕</span>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Hata</h2>
        <p className="text-gray-600 mb-4">{errors.load}</p>
        <Button onClick={() => navigate("/")}>Ana Sayfaya Dön</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <span>←</span>
            <span>Geri</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Post Düzenle</h1>
        </div>
      </div>

      {/* Genel Hata */}
      {errors.submit && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">
          {errors.submit}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Ana İçerik */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="mb-6">
            <Input
              label="Başlık"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Post başlığını girin..."
              error={errors.title}
              disabled={isSubmitting}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Özet (Opsiyonel)
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Kısa bir özet yazın..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              İçerik
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Post içeriğinizi yazın..."
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm ${
                errors.content ? "border-red-500" : "border-gray-300"
              }`}
              rows={15}
              disabled={isSubmitting}
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">{errors.content}</p>
            )}
          </div>
        </div>

        {/* Ayarlar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Ayarlar</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kategori
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                <option value="">Kategori seçin...</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Görünürlük
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                <option value={0}>🔒 Sadece Ekibim</option>
                <option value={1}>🏢 Sadece Birimim</option>
                <option value={2}>🌐 Tüm Şirket</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Durum
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                <option value={0}>📝 Taslak</option>
                <option value={1}>✅ Yayınla</option>
              </select>
            </div>
          </div>

          {/* Etiketler */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Etiketler (Maks. 5)
            </label>

            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedTags.map((tag: string) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-blue-500 hover:text-blue-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="relative">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Etiket yazın ve Enter'a basın..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting || selectedTags.length >= 5}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleAddTag}
                  disabled={!tagInput.trim() || selectedTags.length >= 5}
                >
                  Ekle
                </Button>
              </div>

              {tagInput && tagSuggestions && tagSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                  {tagSuggestions.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleSelectExistingTag(tag.name)}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between"
                    >
                      <span>#{tag.name}</span>
                      <span className="text-xs text-gray-400">
                        {tag.usageCount} kullanım
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Butonlar */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={handleBack}
            disabled={isSubmitting}
          >
            İptal
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Güncelle
          </Button>
        </div>
      </form>
    </div>
  );
}
