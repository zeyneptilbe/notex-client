import { useState } from "react";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Modal } from "../../components/common/Modal";
import { Loading } from "../../components/common/Loading";
import { useCategories } from "../../hooks/useCategories";
import { categoriesApi } from "../../api/categories.api";
import type { Category } from "../../api/categories.api";

const ICON_OPTIONS = [
  "📄",
  "📚",
  "🔧",
  "📢",
  "💡",
  "🏆",
  "🚀",
  "📊",
  "🔑",
  "⭐",
  "🎯",
  "💻",
];
const COLOR_OPTIONS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EF4444",
  "#EC4899",
  "#06B6D4",
  "#84CC16",
];

export default function CategoriesManagement() {
  const { data: categories, isLoading, refetch } = useCategories();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "📄",
    color: "#3B82F6",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      icon: "📄",
      color: "#3B82F6",
    });
    setEditingCategory(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      icon: category.icon || "📄",
      color: category.color || "#3B82F6",
    });
    setIsModalOpen(true);
    setDropdownOpen(null);
  };

  const openDeleteModal = (category: Category) => {
    setDeletingCategory(category);
    setIsDeleteModalOpen(true);
    setDropdownOpen(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Kategori adı zorunludur");
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingCategory) {
        // Güncelleme
        await categoriesApi.update(editingCategory.id, {
          id: editingCategory.id,
          name: formData.name,
          description: formData.description || undefined,
          icon: formData.icon,
          color: formData.color,
        });
      } else {
        // Yeni oluşturma
        await categoriesApi.create({
          name: formData.name,
          description: formData.description || undefined,
          icon: formData.icon,
          color: formData.color,
        });
      }

      await refetch();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Kategori kaydetme hatası:", error);
      alert("Kategori kaydedilirken bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;

    setIsSubmitting(true);

    try {
      await categoriesApi.delete(deletingCategory.id);
      await refetch();
      setIsDeleteModalOpen(false);
      setDeletingCategory(null);
    } catch (error) {
      console.error("Kategori silme hatası:", error);
      alert(
        "Kategori silinirken bir hata oluştu. Kategoriye ait postlar olabilir.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <Loading text="Kategoriler yükleniyor..." />;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Kategori Yönetimi
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Post kategorilerini yönet
          </p>
        </div>
        <Button onClick={openCreateModal}>+ Yeni Kategori</Button>
      </div>

      {/* Kategori Listesi */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories?.map((category) => (
          <div
            key={category.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: `${category.color}20` }}
              >
                {category.icon}
              </div>

              {/* Dropdown Menu */}
              <div className="relative">
                <button
                  onClick={() =>
                    setDropdownOpen(
                      dropdownOpen === category.id ? null : category.id,
                    )
                  }
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  •••
                </button>

                {dropdownOpen === category.id && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setDropdownOpen(null)}
                    />
                    <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                      <button
                        onClick={() => openEditModal(category)}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        ✏️ Düzenle
                      </button>
                      <button
                        onClick={() => openDeleteModal(category)}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        🗑️ Sil
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            <h3 className="font-semibold text-gray-800 mb-1">
              {category.name}
            </h3>
            <p className="text-sm text-gray-500 mb-3 line-clamp-2">
              {category.description || "Açıklama yok"}
            </p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">{category.postCount} post</span>
              <span
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: category.color }}
              />
            </div>
          </div>
        ))}

        {(!categories || categories.length === 0) && (
          <div className="col-span-full text-center py-12 bg-white rounded-xl">
            <span className="text-4xl mb-2 block">📁</span>
            <p className="text-gray-500">Henüz kategori yok</p>
          </div>
        )}
      </div>

      {/* Oluştur/Düzenle Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingCategory ? "Kategori Düzenle" : "Yeni Kategori Oluştur"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Kategori Adı"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Örn: Teknik Döküman"
            disabled={isSubmitting}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Açıklama
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Kategori açıklaması..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              İkon
            </label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon })}
                  disabled={isSubmitting}
                  className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-colors ${
                    formData.icon === icon
                      ? "bg-blue-100 ring-2 ring-blue-500"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Renk
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  disabled={isSubmitting}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    formData.color === color
                      ? "ring-2 ring-offset-2 ring-gray-400 scale-110"
                      : ""
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

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
              {editingCategory ? "Güncelle" : "Oluştur"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Silme Onay Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingCategory(null);
        }}
        title="Kategori Sil"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            <span className="font-semibold text-gray-800">
              {deletingCategory?.name}
            </span>{" "}
            kategorisini silmek istediğinize emin misiniz?
          </p>

          {deletingCategory && deletingCategory.postCount > 0 && (
            <div className="p-3 bg-yellow-50 text-yellow-700 rounded-lg text-sm">
              ⚠️ Bu kategoride {deletingCategory.postCount} post bulunmaktadır.
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDeletingCategory(null);
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
