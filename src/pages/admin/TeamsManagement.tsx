import { useState } from "react";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Modal } from "../../components/common/Modal";
import { Loading } from "../../components/common/Loading";
import { useTeams } from "../../hooks/useTeams";
import { useUnits } from "../../hooks/useUnits";
import { teamsApi } from "../../api/teams.api";
import { isForbiddenError } from "../../api/axios";
import { useAuth } from "../../hooks/useAuth";
import { showToast } from "../../components/common/Toast";
import type { Team } from "../../api/teams.api";

export default function TeamsManagement() {
  const { data: teams, isLoading, refetch } = useTeams();
  const { data: units } = useUnits();
  const { hasPermission } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    code: "",
    unitId: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      code: "",
      unitId: "",
    });
    setEditingTeam(null);
  };

  const openCreateModal = () => {
    if (!hasPermission("teams.create")) {
      showToast("Ekip oluşturma yetkiniz bulunmuyor.", "warning");
      return;
    }
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (team: Team) => {
    if (!hasPermission("teams.update")) {
      showToast("Ekip düzenleme yetkiniz bulunmuyor.", "warning");
      return;
    }
    setEditingTeam(team);
    setFormData({
      name: team.name,
      description: team.description || "",
      code: team.code || "",
      unitId: team.unitId,
    });
    setIsModalOpen(true);
    setDropdownOpen(null);
  };

  const openDeleteModal = (team: Team) => {
    if (!hasPermission("teams.delete")) {
      showToast("Ekip silme yetkiniz bulunmuyor.", "warning");
      return;
    }
    setDeletingTeam(team);
    setIsDeleteModalOpen(true);
    setDropdownOpen(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const perm = editingTeam ? "teams.update" : "teams.create";
    if (!hasPermission(perm)) {
      showToast("Bu işlem için yetkiniz bulunmuyor.", "warning");
      return;
    }

    if (!formData.name.trim()) {
      alert("Ekip adı zorunludur");
      return;
    }

    if (!formData.unitId) {
      alert("Birim seçimi zorunludur");
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingTeam) {
        await teamsApi.update(editingTeam.id, {
          name: formData.name,
          description: formData.description || undefined,
          code: formData.code || undefined,
          unitId: formData.unitId,
        });
      } else {
        await teamsApi.create({
          name: formData.name,
          description: formData.description || undefined,
          code: formData.code || undefined,
          unitId: formData.unitId,
        });
      }

      await refetch();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      if (!isForbiddenError(error)) {
        console.error("Ekip kaydetme hatası:", error);
        alert("Ekip kaydedilirken bir hata oluştu");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingTeam) return;

    if (!hasPermission("teams.delete")) {
      showToast("Bu işlem için yetkiniz bulunmuyor.", "warning");
      return;
    }

    setIsSubmitting(true);
    setDeleteError("");

    try {
      await teamsApi.delete(deletingTeam.id);
      await refetch();
      setIsDeleteModalOpen(false);
      setDeletingTeam(null);
    } catch (error: unknown) {
      if (!isForbiddenError(error)) {
        console.error("Ekip silme hatası:", error);
        const err = error as { response?: { data?: unknown } };
        const msg = typeof err.response?.data === "string"
          ? err.response.data
          : (err.response?.data as { message?: string })?.message || "Ekip silinirken bir hata oluştu.";
        setDeleteError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <Loading text="Ekipler yükleniyor..." />;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Ekip Yönetimi</h1>
          <p className="text-gray-500 text-sm mt-1">Şirket ekiplerini yönet</p>
        </div>
        <Button onClick={openCreateModal}>+ Yeni Ekip</Button>
      </div>

      {/* Ekip Listesi */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                Ekip Adı
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                Birim
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                Kod
              </th>
              <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">
                Üye
              </th>
              <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">
                Post
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
            {teams?.map((team) => (
              <tr key={team.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <span className="text-lg">👥</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-800">
                        {team.name}
                      </span>
                      {team.description && (
                        <p className="text-xs text-gray-500 truncate max-w-50">
                          {team.description}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                    {team.unitName}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600">{team.code || "-"}</td>
                <td className="px-6 py-4 text-center">
                  <span className="text-gray-600">{team.userCount}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-gray-600">{team.postCount}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      team.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {team.isActive ? "Aktif" : "Pasif"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2 relative">
                    <button
                      onClick={() =>
                        setDropdownOpen(
                          dropdownOpen === team.id ? null : team.id,
                        )
                      }
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      •••
                    </button>

                    {dropdownOpen === team.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setDropdownOpen(null)}
                        />
                        <div className="absolute right-0 top-10 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                          <button
                            onClick={() => openEditModal(team)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            ✏️ Düzenle
                          </button>
                          <button
                            onClick={() => openDeleteModal(team)}
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

            {(!teams || teams.length === 0) && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <span className="text-4xl mb-2 block">👥</span>
                  <p className="text-gray-500">Henüz ekip yok</p>
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
        title={editingTeam ? "Ekip Düzenle" : "Yeni Ekip Oluştur"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Ekip Adı"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Örn: Backend Ekibi"
            disabled={isSubmitting}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Birim
            </label>
            <select
              value={formData.unitId}
              onChange={(e) =>
                setFormData({ ...formData, unitId: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              <option value="">Birim seçin...</option>
              {units?.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Ekip Kodu"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="Örn: BE, FE, QA"
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
              placeholder="Ekip açıklaması..."
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
              {editingTeam ? "Güncelle" : "Oluştur"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Silme Onay Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingTeam(null);
          setDeleteError("");
        }}
        title="Ekip Sil"
      >
        <div className="space-y-4">
          {deleteError && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {deleteError}
            </div>
          )}

          <p className="text-gray-600">
            <span className="font-semibold text-gray-800">
              {deletingTeam?.name}
            </span>{" "}
            ekibini silmek istediğinize emin misiniz?
          </p>

          {deletingTeam && deletingTeam.userCount > 0 && (
            <div className="p-3 bg-yellow-50 text-yellow-700 rounded-lg text-sm">
              ⚠️ Bu ekipte {deletingTeam.userCount} kullanıcı bulunmaktadır.
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDeletingTeam(null);
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
