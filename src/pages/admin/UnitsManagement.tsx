import { useState } from "react";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Modal } from "../../components/common/Modal";
import { Loading } from "../../components/common/Loading";
import { useUnits } from "../../hooks/useUnits";
import { unitsApi } from "../../api/units.api";
import { isForbiddenError } from "../../api/axios";
import { useAuth } from "../../hooks/useAuth";
import { showToast } from "../../components/common/Toast";
import type { Unit } from "../../api/units.api";

export default function UnitsManagement() {
  const { data: units, isLoading, refetch } = useUnits();
  const { hasPermission } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [deletingUnit, setDeletingUnit] = useState<Unit | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    code: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      code: "",
    });
    setEditingUnit(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (unit: Unit) => {
    setEditingUnit(unit);
    setFormData({
      name: unit.name,
      description: unit.description || "",
      code: unit.code || "",
    });
    setIsModalOpen(true);
    setDropdownOpen(null);
  };

  const openDeleteModal = (unit: Unit) => {
    setDeletingUnit(unit);
    setIsDeleteModalOpen(true);
    setDropdownOpen(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const perm = editingUnit ? "units.update" : "units.create";
    if (!hasPermission(perm)) {
      showToast("Bu işlem için yetkiniz bulunmuyor.", "warning");
      return;
    }

    if (!formData.name.trim()) {
      alert("Birim adı zorunludur");
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingUnit) {
        await unitsApi.update(editingUnit.id, {
          name: formData.name,
          description: formData.description || undefined,
          code: formData.code || undefined,
        });
      } else {
        await unitsApi.create({
          name: formData.name,
          description: formData.description || undefined,
          code: formData.code || undefined,
        });
      }

      await refetch();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      if (!isForbiddenError(error)) {
        console.error("Birim kaydetme hatası:", error);
        alert("Birim kaydedilirken bir hata oluştu");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingUnit) return;

    if (!hasPermission("units.delete")) {
      showToast("Bu işlem için yetkiniz bulunmuyor.", "warning");
      return;
    }

    setIsSubmitting(true);
    setDeleteError("");

    try {
      await unitsApi.delete(deletingUnit.id);
      await refetch();
      setIsDeleteModalOpen(false);
      setDeletingUnit(null);
    } catch (error: unknown) {
      if (!isForbiddenError(error)) {
        console.error("Birim silme hatası:", error);
        const err = error as { response?: { data?: unknown } };
        const msg = typeof err.response?.data === "string"
          ? err.response.data
          : (err.response?.data as { message?: string })?.message || "Birim silinirken bir hata oluştu.";
        setDeleteError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <Loading text="Birimler yükleniyor..." />;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Birim Yönetimi</h1>
          <p className="text-gray-500 text-sm mt-1">Şirket birimlerini yönet</p>
        </div>
        <Button onClick={openCreateModal}>+ Yeni Birim</Button>
      </div>

      {/* Birim Listesi */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                Birim Adı
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                Kod
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                Açıklama
              </th>
              <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">
                Ekip Sayısı
              </th>
              <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">
                Durum
              </th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {units?.map((unit) => (
              <tr key={unit.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <span className="text-lg">🏢</span>
                    </div>
                    <span className="font-medium text-gray-800">
                      {unit.name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{unit.code || "-"}</td>
                <td className="px-6 py-4 text-gray-500 text-sm max-w-xs truncate">
                  {unit.description || "-"}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    {unit.teamCount} ekip
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      unit.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {unit.isActive ? "Aktif" : "Pasif"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2 relative">
                    <button
                      onClick={() =>
                        setDropdownOpen(
                          dropdownOpen === unit.id ? null : unit.id,
                        )
                      }
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      •••
                    </button>

                    {dropdownOpen === unit.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setDropdownOpen(null)}
                        />
                        <div className="absolute right-0 top-10 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                          <button
                            onClick={() => openEditModal(unit)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            ✏️ Düzenle
                          </button>
                          <button
                            onClick={() => openDeleteModal(unit)}
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

            {(!units || units.length === 0) && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <span className="text-4xl mb-2 block">🏢</span>
                  <p className="text-gray-500">Henüz birim yok</p>
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
        title={editingUnit ? "Birim Düzenle" : "Yeni Birim Oluştur"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Birim Adı"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Örn: Yazılım Geliştirme"
            disabled={isSubmitting}
          />

          <Input
            label="Birim Kodu"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="Örn: IT, HR, FIN"
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
              placeholder="Birim açıklaması..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              disabled={isSubmitting}
            />
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
              {editingUnit ? "Güncelle" : "Oluştur"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Silme Onay Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingUnit(null);
          setDeleteError("");
        }}
        title="Birim Sil"
      >
        <div className="space-y-4">
          {deleteError && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {deleteError}
            </div>
          )}

          <p className="text-gray-600">
            <span className="font-semibold text-gray-800">
              {deletingUnit?.name}
            </span>{" "}
            birimini silmek istediğinize emin misiniz?
          </p>

          {deletingUnit && deletingUnit.teamCount > 0 && (
            <div className="p-3 bg-yellow-50 text-yellow-700 rounded-lg text-sm">
              ⚠️ Bu birimde {deletingUnit.teamCount} ekip bulunmaktadır.
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDeletingUnit(null);
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
