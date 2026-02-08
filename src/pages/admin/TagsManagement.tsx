import { useState } from "react";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Modal } from "../../components/common/Modal";
import { Loading } from "../../components/common/Loading";
import { useTags } from "../../hooks/useTags";
import { tagsApi } from "../../api/tags.api";
import type { Tag } from "../../api/tags.api";

export default function TagsManagement() {
  const { data: tags, isLoading, refetch } = useTags();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [tagName, setTagName] = useState("");
  const [error, setError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  const resetForm = () => {
    setTagName("");
    setError("");
    setEditingTag(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (tag: Tag) => {
    setEditingTag(tag);
    setTagName(tag.name);
    setError("");
    setIsModalOpen(true);
    setDropdownOpen(null);
  };

  const openDeleteModal = (tag: Tag) => {
    setDeletingTag(tag);
    setIsDeleteModalOpen(true);
    setDropdownOpen(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tagName.trim()) {
      setError("Etiket adı zorunludur");
      return;
    }

    if (tagName.trim().length < 2) {
      setError("Etiket adı en az 2 karakter olmalıdır");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      if (editingTag) {
        // Güncelleme
        await tagsApi.update(editingTag.id, {
          id: editingTag.id,
          name: tagName.trim(),
        });
      } else {
        // Yeni oluşturma
        await tagsApi.create(tagName.trim());
      }

      await refetch();
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error("Etiket kaydetme hatası:", err);
      setError("Etiket kaydedilirken bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingTag) return;

    setIsSubmitting(true);
    setDeleteError("");

    try {
      await tagsApi.delete(deletingTag.id);
      await refetch();
      setIsDeleteModalOpen(false);
      setDeletingTag(null);
    } catch (error: unknown) {
      console.error("Etiket silme hatası:", error);
      const err = error as { response?: { data?: unknown } };
      const msg = typeof err.response?.data === "string"
        ? err.response.data
        : (err.response?.data as { message?: string })?.message || "Etiket silinirken bir hata oluştu.";
      setDeleteError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtrelenmiş etiketler
  const filteredTags = tags?.filter((tag) =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (isLoading) {
    return <Loading text="Etiketler yükleniyor..." />;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Etiket Yönetimi</h1>
          <p className="text-gray-500 text-sm mt-1">Post etiketlerini yönet</p>
        </div>
        <Button onClick={openCreateModal}>+ Yeni Etiket</Button>
      </div>

      {/* Arama */}
      <div className="mb-6">
        <Input
          placeholder="Etiket ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <span className="text-lg">🏷️</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {tags?.length || 0}
              </p>
              <p className="text-sm text-gray-500">Toplam Etiket</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <span className="text-lg">📝</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {tags?.reduce((sum, tag) => sum + tag.usageCount, 0) || 0}
              </p>
              <p className="text-sm text-gray-500">Toplam Kullanım</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <span className="text-lg">🔥</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {tags?.filter((t) => t.usageCount > 0).length || 0}
              </p>
              <p className="text-sm text-gray-500">Aktif Etiket</p>
            </div>
          </div>
        </div>
      </div>

      {/* Etiket Listesi */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                Etiket
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                Slug
              </th>
              <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">
                Kullanım
              </th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredTags?.map((tag) => (
              <tr key={tag.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      #{tag.name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-500 text-sm">{tag.slug}</td>
                <td className="px-6 py-4 text-center">
                  <span
                    className={`px-2 py-1 rounded-full text-sm ${
                      tag.usageCount > 0
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {tag.usageCount} post
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end relative">
                    <button
                      onClick={() =>
                        setDropdownOpen(dropdownOpen === tag.id ? null : tag.id)
                      }
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      •••
                    </button>

                    {dropdownOpen === tag.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setDropdownOpen(null)}
                        />
                        <div className="absolute right-0 top-10 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                          <button
                            onClick={() => openEditModal(tag)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            ✏️ Düzenle
                          </button>
                          <button
                            onClick={() => openDeleteModal(tag)}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            🗑️ Sil
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {(!filteredTags || filteredTags.length === 0) && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center">
                  <span className="text-4xl mb-2 block">🏷️</span>
                  <p className="text-gray-500">
                    {searchTerm
                      ? "Arama sonucu bulunamadı"
                      : "Henüz etiket yok"}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Oluştur/Düzenle Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingTag ? "Etiket Düzenle" : "Yeni Etiket Oluştur"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Input
            label="Etiket Adı"
            value={tagName}
            onChange={(e) => setTagName(e.target.value)}
            placeholder="Örn: javascript, react, typescript"
            disabled={isSubmitting}
          />

          <p className="text-sm text-gray-500">
            Etiket adı küçük harflere dönüştürülecek ve slug otomatik
            oluşturulacaktır.
          </p>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              disabled={isSubmitting}
            >
              İptal
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {editingTag ? "Güncelle" : "Oluştur"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Silme Onay Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingTag(null);
          setDeleteError("");
        }}
        title="Etiket Sil"
      >
        <div className="space-y-4">
          {deleteError && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {deleteError}
            </div>
          )}

          <p className="text-gray-600">
            <span className="font-semibold text-gray-800">
              #{deletingTag?.name}
            </span>{" "}
            etiketini silmek istediğinize emin misiniz?
          </p>

          {deletingTag && deletingTag.usageCount > 0 && (
            <div className="p-3 bg-yellow-50 text-yellow-700 rounded-lg text-sm">
              ⚠️ Bu etiket {deletingTag.usageCount} postda kullanılmaktadır.
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDeletingTag(null);
              }}
              disabled={isSubmitting}
            >
              İptal
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleDelete}
              loading={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              Sil
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
