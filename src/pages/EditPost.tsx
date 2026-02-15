import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { Loading } from "../components/common/Loading";
import { useCategories } from "../hooks/useCategories";
import { useTags } from "../hooks/useTags";
import { postsApi, attachmentsApi, type PostAttachment } from "../api/posts.api";
import { isForbiddenError } from "../api/axios";
import { showToast } from "../components/common/Toast";
import { useAuth } from "../hooks/useAuth";
import { formatDate } from "../utils/helpers";
import { MarkdownEditor } from "../components/common";
import { FileUpload } from "../components/posts/FileUpload";
import { AttachmentList } from "../components/posts/AttachmentList";

export default function EditPost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { hasPermission, user } = useAuth();
  const { data: categories } = useCategories();
  const { data: allTags } = useTags();

  const [postId, setPostId] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [visibility, setVisibility] = useState(2);
  const [status, setStatus] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<PostAttachment[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingAttachment, setDeletingAttachment] = useState<string | null>(null);
  const [originalStatus, setOriginalStatus] = useState<number>(0);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [reviewedByName, setReviewedByName] = useState<string | null>(null);
  const [reviewedAt, setReviewedAt] = useState<string | null>(null);

  // Post verisini API'den çek
  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;

      setIsLoading(true);
      try {
        const post = await postsApi.getBySlug(slug);
        const isOwner = post.authorId === user?.id;
        const perm = isOwner ? "posts.update" : "posts.updateOthers";
        if (!hasPermission(perm)) {
          showToast("Bu postu düzenleme yetkiniz bulunmuyor.", "warning");
          navigate("/");
          return;
        }
        setPostId(post.id);
        setTitle(post.title);
        setSummary(post.summary || "");
        setContent(post.content || "");
        setCategoryId(post.categoryId || "");
        setSelectedTags(post.tags?.map((t) => t.toLowerCase()) || []);
        setVisibility(post.visibility);
        setOriginalStatus(post.status);
        setStatus(searchParams.get("publish") === "true" ? 1 : post.status);
        setAttachments(post.attachments || []);
        setRejectionReason(post.rejectionReason || null);
        setReviewedByName(post.reviewedByName || null);
        setReviewedAt(post.reviewedAt || null);
      } catch (error) {
        if (!isForbiddenError(error)) {
          console.error("Post yükleme hatası:", error);
          setErrors({ load: "Post yüklenirken bir hata oluştu." });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

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

  const handleUploadFiles = async () => {
    if (pendingFiles.length === 0 || !postId) return;

    setIsUploading(true);
    try {
      for (const file of pendingFiles) {
        const uploaded = await attachmentsApi.upload(postId, file);
        setAttachments((prev) => [...prev, uploaded]);
      }
      setPendingFiles([]);
    } catch (error) {
      console.error("Dosya yukleme hatasi:", error);
      setErrors((prev) => ({ ...prev, upload: "Dosya yuklenirken bir hata olustu." }));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAttachment = async (id: string) => {
    setDeletingAttachment(id);
    try {
      await attachmentsApi.delete(id);
      setAttachments((prev) => prev.filter((a) => a.id !== id));
    } catch (error) {
      console.error("Dosya silme hatasi:", error);
    } finally {
      setDeletingAttachment(null);
    }
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

      const updatedPost = await postsApi.update(postData);

      if (updatedPost.status === 3) {
        if (originalStatus === 1) {
          showToast("Postunuz güncellendi ve tekrar onaya gönderildi.", "info");
        } else if (originalStatus === 4) {
          showToast("Postunuz tekrar onaya gönderildi. Onay bekleniyor.", "info");
        } else {
          showToast("Postunuz onay için gönderildi. Onaylandıktan sonra yayınlanacaktır.", "info");
        }
      }

      // Başarılı - post detay sayfasına dön
      navigate(`/posts/${slug}`);
    } catch (error) {
      if (!isForbiddenError(error)) {
        console.error("Post güncelleme hatası:", error);
        setErrors({ submit: "Post güncellenirken bir hata oluştu." });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  // Yükleniyor
  if (isLoading) {
    return <Loading text="Post yükleniyor..." />;
  }

  // Yükleme hatası
  if (errors.load) {
    return (
      <div className="text-center py-12">
        <span className="text-5xl mb-4 block">😕</span>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Hata</h2>
        <p className="text-gray-600 mb-4">{errors.load}</p>
        <Button onClick={() => navigate("/")}>Ana Sayfaya Dön</Button>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-gray-800">Post Düzenle</h1>
        </div>
      </div>

      {/* Reddedildi Banner */}
      {status === 4 && rejectionReason && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-xl">🚫</span>
            <div>
              <h3 className="font-semibold text-red-800 mb-1">Bu post reddedildi</h3>
              <p className="text-sm text-red-700 mb-2">{rejectionReason}</p>
              {reviewedByName && (
                <p className="text-xs text-red-500">
                  Reddeden: {reviewedByName}{reviewedAt ? ` - ${formatDate(reviewedAt)}` : ""}
                </p>
              )}
              <p className="text-sm text-red-600 mt-2 font-medium">
                Düzenleyip tekrar "Yayınla" olarak gönderebilirsiniz.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Onay Bekliyor Banner */}
      {status === 3 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-xl">⏳</span>
            <p className="text-sm text-amber-800 font-medium">
              Bu post onay bekliyor. Onaylandıktan sonra yayınlanacaktır.
            </p>
          </div>
        </div>
      )}

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
            <MarkdownEditor
              value={content}
              onChange={setContent}
              placeholder="Post içeriğinizi Markdown formatında yazın..."
              height={400}
              disabled={isSubmitting}
              error={errors.content}
            />
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

        {/* Dosyalar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Dosyalar</h2>

          {/* Mevcut dosyalar */}
          {attachments.length > 0 && (
            <div className="mb-4">
              <AttachmentList
                attachments={attachments}
                onDelete={handleDeleteAttachment}
                deleting={deletingAttachment}
              />
            </div>
          )}

          {/* Yeni dosya ekleme */}
          <FileUpload
            files={pendingFiles}
            onFilesChange={setPendingFiles}
            disabled={isSubmitting || isUploading}
          />

          {pendingFiles.length > 0 && (
            <div className="mt-3">
              <Button
                type="button"
                onClick={handleUploadFiles}
                loading={isUploading}
                disabled={isSubmitting}
              >
                Dosyalari Yukle
              </Button>
            </div>
          )}

          {errors.upload && (
            <p className="mt-2 text-sm text-red-600">{errors.upload}</p>
          )}
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
