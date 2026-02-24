import { useState } from "react";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Modal } from "../../components/common/Modal";
import { Loading } from "../../components/common/Loading";
import {
  useRoles,
  usePermissions,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
} from "../../hooks/useRoles";
import { rolesApi } from "../../api/roles.api";
import { isForbiddenError } from "../../api/axios";
import { useAuth } from "../../hooks/useAuth";
import { showToast } from "../../components/common/Toast";
import type { Role } from "../../api/roles.api";

export default function RolesManagement() {
  const { hasPermission } = useAuth();

  if (!hasPermission("roles.manage")) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <span className="text-5xl mb-4 block">🔒</span>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Erişim Engellendi
          </h2>
          <p className="text-gray-600">
            Rol yönetimi yetkiniz bulunmuyor.
          </p>
        </div>
      </div>
    );
  }

  return <RolesManagementContent />;
}

function RolesManagementContent() {
  const { hasPermission } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
    parentRoleId: "" as string,
    requiresPostApproval: false,
    hasTeamAssignment: false,
    canApproveSubordinates: false,
  });
  const [isLoadingRole, setIsLoadingRole] = useState(false);

  const { data: roles, isLoading } = useRoles();
  const { data: permissionGroups } = usePermissions();
  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();
  const deleteRoleMutation = useDeleteRole();

  const handleOpenCreate = () => {
    if (!hasPermission("roles.manage")) {
      showToast("Rol oluşturma yetkiniz bulunmuyor.", "warning");
      return;
    }
    setEditingRole(null);
    setFormData({ name: "", description: "", permissions: [], parentRoleId: "", requiresPostApproval: false, hasTeamAssignment: false, canApproveSubordinates: false });
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (role: Role) => {
    if (!hasPermission("roles.manage")) {
      showToast("Rol düzenleme yetkiniz bulunmuyor.", "warning");
      return;
    }
    setEditingRole(role);
    setIsLoadingRole(true);
    setIsModalOpen(true);

    try {
      const fullRole = await rolesApi.getById(role.id);
      setEditingRole(fullRole);
      const permNames = (fullRole.permissions ?? []).map((p) =>
        typeof p === "string" ? p : p.name,
      );
      setFormData({
        name: fullRole.name,
        description: fullRole.description ?? "",
        permissions: permNames,
        parentRoleId: fullRole.parentRoleId ?? "",
        requiresPostApproval: fullRole.requiresPostApproval ?? false,
        hasTeamAssignment: fullRole.hasTeamAssignment ?? false,
        canApproveSubordinates: fullRole.canApproveSubordinates ?? false,
      });
    } catch (error) {
      console.error("Rol detayı yüklenemedi:", error);
      const permNames = (role.permissions ?? []).map((p) =>
        typeof p === "string" ? p : p.name,
      );
      setFormData({
        name: role.name,
        description: role.description ?? "",
        permissions: permNames,
        parentRoleId: role.parentRoleId ?? "",
        requiresPostApproval: role.requiresPostApproval ?? false,
        hasTeamAssignment: role.hasTeamAssignment ?? false,
        canApproveSubordinates: role.canApproveSubordinates ?? false,
      });
    } finally {
      setIsLoadingRole(false);
    }
  };

  const handleOpenDelete = (role: Role) => {
    if (!hasPermission("roles.manage")) {
      showToast("Rol silme yetkiniz bulunmuyor.", "warning");
      return;
    }
    setDeletingRole(role);
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  const togglePermission = (permissionName: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permissionName)
        ? prev.permissions.filter((p) => p !== permissionName)
        : [...prev.permissions, permissionName],
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      showToast("Rol adı zorunludur.", "warning");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasPermission("roles.manage")) {
      showToast("Bu işlem için yetkiniz bulunmuyor.", "warning");
      return;
    }

    if (!validateForm()) return;

    // Permission name'leri ID'lere çevir
    const allPermissions = permissionGroups?.flatMap((g) => g.permissions) ?? [];
    const permissionIds = formData.permissions
      .map((name) => allPermissions.find((p) => p.name === name)?.id)
      .filter((id): id is string => !!id);

    const submitData = {
      name: formData.name,
      description: formData.description,
      permissionIds,
      parentRoleId: formData.parentRoleId || null,
      requiresPostApproval: formData.requiresPostApproval,
      hasTeamAssignment: formData.hasTeamAssignment,
      canApproveSubordinates: formData.canApproveSubordinates,
    };

    try {
      if (editingRole) {
        await updateRoleMutation.mutateAsync({
          id: editingRole.id,
          data: submitData,
        });
      } else {
        await createRoleMutation.mutateAsync(submitData);
      }
      setIsModalOpen(false);
    } catch (error: unknown) {
      if (!isForbiddenError(error)) {
        console.error("Rol kaydetme hatası:", error);
      }
    }
  };

  const handleDelete = async () => {
    if (!deletingRole) return;

    if (!hasPermission("roles.manage")) {
      showToast("Bu işlem için yetkiniz bulunmuyor.", "warning");
      return;
    }

    try {
      await deleteRoleMutation.mutateAsync(deletingRole.id);
      setIsDeleteModalOpen(false);
    } catch (error: unknown) {
      if (!isForbiddenError(error)) {
        const message =
          error instanceof Error ? error.message : "Rol silinemedi";
        setDeleteError(message);
      }
    }
  };

  if (isLoading) {
    return <Loading text="Roller yükleniyor..." />;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Rol Yönetimi</h1>
          <p className="text-gray-500 text-sm mt-1">
            Sistemdeki rolleri ve izinleri yönetin
          </p>
        </div>
        <Button onClick={handleOpenCreate}>+ Yeni Rol</Button>
      </div>

      {/* Rol Listesi */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Rol Adı
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Açıklama
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Kullanıcı Sayısı
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                İzin Sayısı
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Üst Rol
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Özellikler
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {roles?.map((role) => (
              <tr key={role.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <span className="font-medium text-gray-800">{role.name}</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {role.description || "-"}
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                    {role.userCount} kullanıcı
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                    {role.permissionCount ?? 0} izin
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {role.parentRoleName || "-"}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {role.requiresPostApproval && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-700">
                        Onay Gerekli
                      </span>
                    )}
                    {role.hasTeamAssignment && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
                        Ekip Ataması
                      </span>
                    )}
                    {role.canApproveSubordinates && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                        Ast Onaylama
                      </span>
                    )}
                    {!role.requiresPostApproval && !role.hasTeamAssignment && !role.canApproveSubordinates && (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleOpenEdit(role)}
                      className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => handleOpenDelete(role)}
                      className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Sil
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(!roles || roles.length === 0) && (
          <div className="text-center py-12">
            <span className="text-4xl mb-2 block">🛡️</span>
            <p className="text-gray-500">Henüz rol tanımlanmamış</p>
          </div>
        )}
      </div>

      {/* Rol Oluştur / Düzenle Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRole ? "Rol Düzenle" : "Yeni Rol Oluştur"}
        size="lg"
      >
        {isLoadingRole ? (
          <div className="flex items-center justify-center py-8">
            <Loading text="Rol detayı yükleniyor..." />
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Rol Adı"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            placeholder="Örn: Takım Lideri"
          />

          <Input
            label="Açıklama (Opsiyonel)"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Bu rolün kısa açıklaması"
          />

          {/* Üst Rol Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Üst Rol
            </label>
            <select
              value={formData.parentRoleId}
              onChange={(e) =>
                setFormData({ ...formData, parentRoleId: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Üst rol yok</option>
              {roles
                ?.filter((r) => r.id !== editingRole?.id)
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Rol Özellikleri Toggle'ları */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Rol Özellikleri
            </label>
            <div className="space-y-3 border border-gray-200 rounded-lg p-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-sm font-medium text-gray-700">Post Onayı Gerektirir</span>
                  <p className="text-xs text-gray-500">Bu roldeki kullanıcıların postları onay gerektirir</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, requiresPostApproval: !formData.requiresPostApproval })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.requiresPostApproval ? "bg-blue-600" : "bg-gray-300"}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.requiresPostApproval ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-sm font-medium text-gray-700">Ekip Ataması</span>
                  <p className="text-xs text-gray-500">Bu roldeki kullanıcılara ekip atanabilir</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, hasTeamAssignment: !formData.hasTeamAssignment })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.hasTeamAssignment ? "bg-blue-600" : "bg-gray-300"}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.hasTeamAssignment ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-sm font-medium text-gray-700">Ast Onaylama</span>
                  <p className="text-xs text-gray-500">Bu roldeki kullanıcılar astlarının postlarını onaylayabilir</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, canApproveSubordinates: !formData.canApproveSubordinates })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.canApproveSubordinates ? "bg-blue-600" : "bg-gray-300"}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.canApproveSubordinates ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </label>
            </div>
          </div>

          {/* Permission Checkbox Listesi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              İzinler
            </label>
            <div className="space-y-4 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4">
              {permissionGroups?.map((group) => (
                <div key={group.group}>
                  <h4 className="text-sm font-semibold text-gray-800 mb-2 capitalize">
                    {group.group}
                  </h4>
                  <div className="space-y-2 ml-2">
                    {group.permissions.map((permission) => (
                      <label
                        key={permission.id}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(
                            permission.name,
                          )}
                          onChange={() => togglePermission(permission.name)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          {permission.displayName}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              {(!permissionGroups || permissionGroups.length === 0) && (
                <p className="text-sm text-gray-500 text-center py-4">
                  İzinler yükleniyor...
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
            >
              İptal
            </Button>
            <Button
              type="submit"
              loading={
                createRoleMutation.isPending || updateRoleMutation.isPending
              }
            >
              {editingRole ? "Güncelle" : "Oluştur"}
            </Button>
          </div>
        </form>
        )}
      </Modal>

      {/* Silme Onay Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Rol Sil"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            <strong>{deletingRole?.name}</strong> rolünü silmek istediğinize
            emin misiniz?
          </p>

          {deletingRole && deletingRole.userCount > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Bu role atanmış <strong>{deletingRole.userCount}</strong>{" "}
                kullanıcı bulunmaktadır.
              </p>
            </div>
          )}

          {deleteError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{deleteError}</p>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              İptal
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={deleteRoleMutation.isPending}
            >
              Sil
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
