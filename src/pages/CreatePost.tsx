import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { useCategories } from "../hooks/useCategories";
import { useTags } from "../hooks/useTags";
import { postsApi, attachmentsApi } from "../api/posts.api";
import { isForbiddenError } from "../api/axios";
import { showToast } from "../components/common/Toast";
import { MarkdownEditor } from "../components/common";
import { FileUpload } from "../components/posts/FileUpload";
import { useAuth } from "../hooks/useAuth";

export default function CreatePost() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  if (!hasPermission("posts.create")) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <span className="text-5xl mb-4 block">🔒</span>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Erişim Engellendi
          </h2>
          <p className="text-gray-600 mb-6">
            Post oluşturma yetkiniz bulunmuyor.
          </p>
          <Button onClick={() => navigate("/")}>Ana Sayfaya Dön</Button>
        </div>
      </div>
    );
  }

  return <CreatePostContent />;
}

// Tüm visibility seçenekleri
const ALL_VISIBILITY_OPTIONS = [
  { value: 0, label: "Sadece Ekibim", icon: "🔒" },
  { value: 1, label: "Sadece Müdürlüğüm", icon: "🏢" },
  { value: 3, label: "Grup Müdürlüğüm", icon: "👥" },
  { value: 4, label: "Direktörlüğüm", icon: "🏛️" },
  { value: 2, label: "Tüm Şirket", icon: "🌐" },
];

function CreatePostContent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: categories } = useCategories();
  const { data: allTags } = useTags();

  const allowedVisibilities = user?.allowedVisibilities ?? [2];
  const visibilityOptions = ALL_VISIBILITY_OPTIONS.filter((opt) =>
    allowedVisibilities.includes(opt.value),
  );
  const needsApproval = user?.needsPostApproval ?? false;

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [visibility, setVisibility] = useState(() => allowedVisibilities[0] ?? 2);
  const [status, setStatus] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const handleSelectTag = (tagName: string) => {
    const tag = tagName.toLowerCase();
    if (selectedTags.includes(tag)) {
      // Zaten seçiliyse kaldır
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else if (selectedTags.length < 5) {
      // Seçili değilse ve limit aşılmamışsa ekle
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag));
  };

  const validate = (): boolean => {
    const messages: string[] = [];

    if (!title.trim()) {
      messages.push("Başlık zorunludur");
    } else if (title.length < 5) {
      messages.push("Başlık en az 5 karakter olmalıdır");
    }

    if (!content.trim()) {
      messages.push("İçerik zorunludur");
    } else if (content.length < 50) {
      messages.push("İçerik en az 50 karakter olmalıdır");
    }

    if (!categoryId) {
      messages.push("Kategori seçimi zorunludur");
    }

    if (messages.length > 0) {
      showToast(messages.join("\n"), "warning");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const postData = {
        title,
        summary,
        content,
        categoryId: categoryId || undefined,
        tags: selectedTags,
        visibility,
        status,
      };

      const createdPost = await postsApi.create(postData);

      // Dosyaları yükle
      for (const file of pendingFiles) {
        await attachmentsApi.upload(createdPost.id, file);
      }

      if (createdPost.status === 3 && needsApproval) {
        showToast("Postunuz onay için gönderildi. Onaylandıktan sonra yayınlanacaktır.", "info");
      }

      navigate("/");
    } catch (error) {
      if (!isForbiddenError(error)) {
        console.error("Post oluşturma hatası:", error);
        showToast("Post oluşturulurken bir hata oluştu.", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div>
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
          <h1 className="text-2xl font-bold text-gray-800">
            Yeni Post Oluştur
          </h1>
        </div>
      </div>

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
            <MarkdownEditor
              value={content}
              onChange={setContent}
              placeholder="Post içeriğinizi yazın..."
              height={400}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Ayarlar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Ayarlar</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kategori <span className="text-red-500">*</span>
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
              {visibilityOptions.length === 1 ? (
                <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                  {visibilityOptions[0].icon} {visibilityOptions[0].label}
                </div>
              ) : (
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                >
                  {visibilityOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.icon} {opt.label}
                    </option>
                  ))}
                </select>
              )}
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

          {/* Etiketler - Dropdown Seçim */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Etiketler (Maks. 5)
            </label>

            {/* Seçilen Etiketler */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedTags.map((tag) => (
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

            {/* Etiket Seçim Alanı */}
            {allTags && allTags.length > 0 ? (
              <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => {
                    const isSelected = selectedTags.includes(
                      tag.name.toLowerCase(),
                    );
                    const isDisabled = !isSelected && selectedTags.length >= 5;

                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => !isDisabled && handleSelectTag(tag.name)}
                        disabled={isDisabled}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          isSelected
                            ? "bg-blue-600 text-white"
                            : isDisabled
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        #{tag.name}
                        <span className="ml-1 text-xs opacity-70">
                          ({tag.usageCount})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Henüz etiket oluşturulmamış. Yönetim panelinden etiket
                ekleyebilirsiniz.
              </p>
            )}

            {selectedTags.length >= 5 && (
              <p className="mt-2 text-sm text-amber-600">
                Maksimum 5 etiket seçebilirsiniz.
              </p>
            )}
          </div>
        </div>

        {/* Dosya Yükleme */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Dosya Ekle
          </h2>
          <FileUpload
            files={pendingFiles}
            onFilesChange={setPendingFiles}
            disabled={isSubmitting}
          />
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
            {status === 1 ? "Yayınla" : "Kaydet"}
          </Button>
        </div>
      </form>
    </div>
  );
}
