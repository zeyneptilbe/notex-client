import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Modal } from "../../components/common/Modal";
import { Loading } from "../../components/common/Loading";
import { Avatar } from "../../components/common/Avatar";
import { Pagination } from "../../components/common/Pagination";
import { useUsers, useCreateUser, useAdminUpdateUser, useDeleteUser } from "../../hooks/useUsers";
import { usersApi } from "../../api/users.api";
import type { User } from "../../api/users.api";
import { useTeams } from "../../hooks/useTeams";
import { useUnits } from "../../hooks/useUnits";
import { useRoles } from "../../hooks/useRoles";
import { useAuth } from "../../hooks/useAuth";
import { showToast } from "../../components/common/Toast";

export default function UsersManagement() {
  const { hasPermission } = useAuth();

  if (!hasPermission("users.create")) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <span className="text-5xl mb-4 block">🔒</span>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Erişim Engellendi
          </h2>
          <p className="text-gray-600">
            Kullanıcı yönetimi yetkiniz bulunmuyor.
          </p>
        </div>
      </div>
    );
  }

  return <UsersManagementContent />;
}

function UsersManagementContent() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    title: "",
    roleId: "",
    direktorlukId: "",
    grupMudurlukId: "",
    mudurlukId: "",
    teamId: "",
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isLoadingEditUser, setIsLoadingEditUser] = useState(false);
  const [editFormData, setEditFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    title: "",
    roleId: "",
    direktorlukId: "",
    grupMudurlukId: "",
    mudurlukId: "",
    teamId: "",
  });

  const { data: usersData, isLoading } = useUsers({ searchTerm, pageNumber: page, pageSize: 15 });
  const { data: teams } = useTeams();
  const { data: units } = useUnits();
  const { data: roles } = useRoles();
  const createUserMutation = useCreateUser();
  const adminUpdateMutation = useAdminUpdateUser();
  const deleteUserMutation = useDeleteUser();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  // Rol bazlı kontrol — Create modal
  const selectedRole = roles?.find((r) => r.id === formData.roleId);
  const isTopLevelRole = selectedRole?.isSuperAdmin ?? false;
  const roleMaxLevel = selectedRole?.maxUnitLevel ?? 0;
  const showDirektorluk = roleMaxLevel >= 1;
  const showGrupMudurluk = roleMaxLevel >= 2;
  const showMudurluk = roleMaxLevel >= 3;
  const showTeam = (selectedRole?.hasTeamAssignment ?? false) && showMudurluk;

  // Kademeli hiyerarşi filtreleri
  const direktorlukler = units?.filter((u) => u.level === 1) ?? [];
  const grupMudurlukler =
    units?.filter(
      (u) => u.level === 2 && u.parentUnitId === formData.direktorlukId,
    ) ?? [];
  const mudurlukler =
    units?.filter(
      (u) => u.level === 3 && u.parentUnitId === formData.grupMudurlukId,
    ) ?? [];
  const filteredTeams =
    teams?.filter((t) => t.unitId === formData.mudurlukId) ?? [];

  const handleOpenModal = () => {
    if (!hasPermission("users.create")) {
      showToast("Kullanıcı oluşturma yetkiniz bulunmuyor.", "warning");
      return;
    }
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      title: "",
      roleId: "",
      direktorlukId: "",
      grupMudurlukId: "",
      mudurlukId: "",
      teamId: "",
    });
    setIsModalOpen(true);
  };

  const handleViewProfile = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  // --- Edit modal: rol bazlı kontrol ---
  const editSelectedRole = roles?.find((r) => r.id === editFormData.roleId);
  const editIsTopLevelRole = editSelectedRole?.isSuperAdmin ?? false;
  const editRoleMaxLevel = editSelectedRole?.maxUnitLevel ?? 0;
  const editShowDirektorluk = editRoleMaxLevel >= 1;
  const editShowGrupMudurluk = editRoleMaxLevel >= 2;
  const editShowMudurluk = editRoleMaxLevel >= 3;
  const editShowTeam = (editSelectedRole?.hasTeamAssignment ?? false) && editShowMudurluk;

  // Edit modal: kademeli hiyerarşi filtreleri
  const editGrupMudurlukler =
    units?.filter(
      (u) => u.level === 2 && u.parentUnitId === editFormData.direktorlukId,
    ) ?? [];
  const editMudurlukler =
    units?.filter(
      (u) => u.level === 3 && u.parentUnitId === editFormData.grupMudurlukId,
    ) ?? [];
  const editFilteredTeams =
    teams?.filter((t) => t.unitId === editFormData.mudurlukId) ?? [];

  const resolveUnitHierarchy = (unitId: string) => {
    const result = { direktorlukId: "", grupMudurlukId: "", mudurlukId: "" };
    if (!units || !units.length) {
      console.warn("[resolveUnitHierarchy] units yüklenmemiş");
      return result;
    }

    const unit = units.find((u) => u.id === unitId);
    if (!unit) {
      console.warn("[resolveUnitHierarchy] unit bulunamadı, unitId:", unitId);
      return result;
    }

    if (unit.level === 1) {
      result.direktorlukId = unit.id;
    } else if (unit.level === 2) {
      result.grupMudurlukId = unit.id;
      result.direktorlukId = unit.parentUnitId ?? "";
    } else if (unit.level === 3) {
      result.mudurlukId = unit.id;
      const parent = units.find((u) => u.id === unit.parentUnitId);
      if (parent) {
        result.grupMudurlukId = parent.id;
        result.direktorlukId = parent.parentUnitId ?? "";
      }
    }
    return result;
  };

  const populateEditForm = (user: User) => {
    const hierarchy = user.unitId
      ? resolveUnitHierarchy(user.unitId)
      : { direktorlukId: "", grupMudurlukId: "", mudurlukId: "" };

    setEditFormData({
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      email: user.email ?? "",
      title: user.title ?? "",
      roleId: user.roleId,
      direktorlukId: hierarchy.direktorlukId,
      grupMudurlukId: hierarchy.grupMudurlukId,
      mudurlukId: hierarchy.mudurlukId,
      teamId: user.teamId ?? "",
    });
  };

  const handleOpenEditModal = async (user: User) => {
    setEditingUser(user);
    setIsLoadingEditUser(true);
    setIsEditModalOpen(true);

    try {
      const fullUser = await usersApi.getById(user.id);
      setEditingUser(fullUser);
      populateEditForm(fullUser);
    } catch (error) {
      console.error("Kullanıcı detayı yüklenemedi:", error);
      // Fallback: liste verisinden doldur
      populateEditForm(user);
    } finally {
      setIsLoadingEditUser(false);
    }
  };

  const validateEditForm = (): boolean => {
    const messages: string[] = [];
    if (!editFormData.firstName.trim()) messages.push("Ad zorunludur");
    if (!editFormData.lastName.trim()) messages.push("Soyad zorunludur");
    if (!editFormData.email.trim()) messages.push("E-posta zorunludur");
    if (!editFormData.roleId) {
      messages.push("Rol seçimi zorunludur");
    } else if (editShowDirektorluk) {
      if (!editFormData.direktorlukId) messages.push("Direktörlük seçimi zorunludur");
    }
    if (messages.length > 0) {
      showToast(messages.join("\n"), "warning");
      return false;
    }
    return true;
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!validateEditForm()) return;

    const unitId = !editShowDirektorluk
      ? undefined
      : editFormData.mudurlukId || editFormData.grupMudurlukId || editFormData.direktorlukId;

    const payload = {
      firstName: editFormData.firstName,
      lastName: editFormData.lastName,
      email: editFormData.email,
      title: editFormData.title || undefined,
      roleId: editFormData.roleId,
      unitId: unitId || undefined,
      teamId: editFormData.teamId || null,
    };
    console.log("[AdminUpdate] payload:", JSON.stringify(payload, null, 2));

    try {
      await adminUpdateMutation.mutateAsync({
        id: editingUser.id,
        data: payload,
      });
      showToast("Kullanıcı başarıyla güncellendi.", "success");
      setIsEditModalOpen(false);
      setEditingUser(null);
    } catch (error: any) {
      console.error("[AdminUpdate] error:", error);
      const data = error?.response?.data;
      if (data?.errors) {
        const msgs = Object.values(data.errors).flat().join("\n");
        showToast(msgs, "error");
      } else if (data?.message) {
        showToast(data.message, "error");
      } else {
        showToast("Güncelleme sırasında bir hata oluştu.", "error");
      }
    }
  };

  const handleOpenDeleteModal = (user: User) => {
    setDeletingUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    try {
      await deleteUserMutation.mutateAsync(deletingUser.id);
      showToast("Kullanıcı başarıyla silindi.", "success");
      setIsDeleteModalOpen(false);
      setDeletingUser(null);
    } catch (error: any) {
      const msg = error?.response?.data?.message;
      showToast(msg || "Kullanıcı silinirken bir hata oluştu.", "error");
    }
  };

  const validateForm = (): boolean => {
    const messages: string[] = [];

    if (!formData.firstName.trim()) messages.push("Ad zorunludur");
    if (!formData.lastName.trim()) messages.push("Soyad zorunludur");
    if (!formData.email.trim()) messages.push("E-posta zorunludur");
    if (!formData.password || formData.password.length < 6) {
      messages.push("Şifre en az 6 karakter olmalıdır");
    } else {
      if (!/[A-Z]/.test(formData.password)) messages.push("Şifre en az bir büyük harf içermelidir");
      if (!/[a-z]/.test(formData.password)) messages.push("Şifre en az bir küçük harf içermelidir");
    }
    if (!formData.roleId) {
      messages.push("Rol seçimi zorunludur");
    } else if (!isTopLevelRole) {
      if (!formData.direktorlukId) messages.push("Direktörlük seçimi zorunludur");
    }

    if (messages.length > 0) {
      showToast(messages.join("\n"), "warning");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasPermission("users.create")) {
      showToast("Bu işlem için yetkiniz bulunmuyor.", "warning");
      return;
    }

    if (!validateForm()) return;

    const unitId = isTopLevelRole
      ? undefined
      : formData.mudurlukId || formData.grupMudurlukId || formData.direktorlukId;

    try {
      await createUserMutation.mutateAsync({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        roleId: formData.roleId,
        unitId: unitId || undefined,
        teamId: formData.teamId || undefined,
        title: formData.title || undefined,
      });
      setIsModalOpen(false);
    } catch (error: any) {
      const data = error?.response?.data;
      if (data?.errors) {
        const msgs = Object.values(data.errors).flat().join("\n");
        showToast(msgs, "error");
      } else if (data?.message) {
        showToast(data.message, "error");
      }
    }
  };

  if (isLoading) {
    return <Loading text="Kullanıcılar yükleniyor..." />;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Kullanıcı Yönetimi
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Sistemdeki tüm kullanıcıları görüntüle ve yönet
          </p>
        </div>
        <Button onClick={handleOpenModal}>+ Yeni Kullanıcı</Button>
      </div>

      {/* Arama */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="İsim veya e-posta ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Kullanıcı Listesi */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Kullanıcı
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                E-posta
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Birim
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Ekip
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Rol
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                İstatistik
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                İşlem
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {usersData?.items?.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div
                    className="flex items-center gap-3 cursor-pointer hover:opacity-80"
                    onClick={() => handleViewProfile(user.id)}
                  >
                    <Avatar name={user.fullName} size="sm" />
                    <div>
                      <p className="font-medium text-gray-800 hover:text-blue-600 transition-colors">
                        {user.fullName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {user.title || "-"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {user.email}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {user.unitName}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {user.teamName || "\u2014"}
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                    {user.roleName}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <span>{user.postCount} post</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleOpenEditModal(user)}
                    className="px-3 py-1 text-sm text-amber-600 hover:bg-amber-50 rounded-lg transition-colors mr-1"
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={() => handleOpenDeleteModal(user)}
                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors mr-1"
                  >
                    Sil
                  </button>
                  <button
                    onClick={() => handleViewProfile(user.id)}
                    className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    Profili Gör
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(!usersData?.items || usersData.items.length === 0) && (
          <div className="text-center py-12">
            <span className="text-4xl mb-2 block">👥</span>
            <p className="text-gray-500">Henüz kullanıcı yok</p>
          </div>
        )}
      </div>

      <Pagination currentPage={page} totalPages={usersData?.totalPages ?? 1} onPageChange={setPage} />

      {/* Yeni Kullanıcı Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Yeni Kullanıcı Oluştur"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Ad"
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
            />
            <Input
              label="Soyad"
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
            />
          </div>

          <Input
            label="E-posta"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />

          <Input
            label="Şifre"
            type="password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
          />

          <Input
            label="Ünvan (Opsiyonel)"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder="Örn: Senior Developer"
          />

          {/* Rol — en üstte */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rol <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.roleId}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  roleId: e.target.value,
                  direktorlukId: "",
                  grupMudurlukId: "",
                  mudurlukId: "",
                  teamId: "",
                })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Rol seçin...</option>
              {roles?.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          {/* GM/GM Yardımcısı → organizasyon alanları gizli */}
          {formData.roleId && isTopLevelRole && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              {selectedRole?.name} rolü için birim ve ekip ataması gerekmez.
            </div>
          )}

          {/* Organizasyon alanları — role göre kademeli */}
          {formData.roleId && showDirektorluk && (
            <>
              {/* Direktörlük */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Direktörlük <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.direktorlukId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      direktorlukId: e.target.value,
                      grupMudurlukId: "",
                      mudurlukId: "",
                      teamId: "",
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Direktörlük seçin...</option>
                  {direktorlukler.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Grup Müdürlüğü */}
              {showGrupMudurluk && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grup Müdürlüğü
                  </label>
                  <select
                    value={formData.grupMudurlukId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        grupMudurlukId: e.target.value,
                        mudurlukId: "",
                        teamId: "",
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    disabled={!formData.direktorlukId || grupMudurlukler.length === 0}
                  >
                    <option value="">
                      {!formData.direktorlukId
                        ? "Önce direktörlük seçin..."
                        : grupMudurlukler.length === 0
                          ? "Bu direktörlükte grup müdürlüğü yok"
                          : "Grup müdürlüğü seçin..."}
                    </option>
                    {grupMudurlukler.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Müdürlük */}
              {showMudurluk && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Müdürlük
                  </label>
                  <select
                    value={formData.mudurlukId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        mudurlukId: e.target.value,
                        teamId: "",
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    disabled={!formData.grupMudurlukId || mudurlukler.length === 0}
                  >
                    <option value="">
                      {!formData.grupMudurlukId
                        ? "Önce grup müdürlüğü seçin..."
                        : mudurlukler.length === 0
                          ? "Bu grup müdürlüğünde müdürlük yok"
                          : "Müdürlük seçin..."}
                    </option>
                    {mudurlukler.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Ekip */}
              {showTeam && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ekip
                  </label>
                  <select
                    value={formData.teamId}
                    onChange={(e) =>
                      setFormData({ ...formData, teamId: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    disabled={!formData.mudurlukId || filteredTeams.length === 0}
                  >
                    <option value="">
                      {!formData.mudurlukId
                        ? "Önce müdürlük seçin..."
                        : filteredTeams.length === 0
                          ? "Bu müdürlükte ekip yok"
                          : "Ekip seçin..."}
                    </option>
                    {filteredTeams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
            >
              İptal
            </Button>
            <Button type="submit" loading={createUserMutation.isPending}>
              Oluştur
            </Button>
          </div>
        </form>
      </Modal>

      {/* Kullanıcı Düzenle Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setEditingUser(null); }}
        title={editingUser ? `${editingUser.fullName} — Düzenle` : "Kullanıcı Düzenle"}
        size="lg"
      >
        {isLoadingEditUser ? (
          <div className="flex items-center justify-center py-8">
            <Loading text="Kullanıcı bilgileri yükleniyor..." />
          </div>
        ) : (
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {/* Kişisel Bilgiler */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Ad"
              value={editFormData.firstName}
              onChange={(e) =>
                setEditFormData({ ...editFormData, firstName: e.target.value })
              }
            />
            <Input
              label="Soyad"
              value={editFormData.lastName}
              onChange={(e) =>
                setEditFormData({ ...editFormData, lastName: e.target.value })
              }
            />
          </div>

          <Input
            label="E-posta"
            type="email"
            value={editFormData.email}
            onChange={(e) =>
              setEditFormData({ ...editFormData, email: e.target.value })
            }
          />

          <Input
            label="Ünvan (Opsiyonel)"
            value={editFormData.title}
            onChange={(e) =>
              setEditFormData({ ...editFormData, title: e.target.value })
            }
            placeholder="Örn: Senior Developer"
          />

          {/* Rol */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rol <span className="text-red-500">*</span>
            </label>
            <select
              value={editFormData.roleId}
              onChange={(e) =>
                setEditFormData({
                  ...editFormData,
                  roleId: e.target.value,
                  direktorlukId: "",
                  grupMudurlukId: "",
                  mudurlukId: "",
                  teamId: "",
                })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Rol seçin...</option>
              {roles?.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          {/* GM/GM Yardımcısı → organizasyon alanları gizli */}
          {editFormData.roleId && editIsTopLevelRole && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              {editSelectedRole?.name} rolü için birim ve ekip ataması gerekmez.
            </div>
          )}

          {/* Organizasyon alanları — role göre kademeli */}
          {editFormData.roleId && editShowDirektorluk && (
            <>
              {/* Direktörlük */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Direktörlük <span className="text-red-500">*</span>
                </label>
                <select
                  value={editFormData.direktorlukId}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      direktorlukId: e.target.value,
                      grupMudurlukId: "",
                      mudurlukId: "",
                      teamId: "",
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Direktörlük seçin...</option>
                  {direktorlukler.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Grup Müdürlüğü */}
              {editShowGrupMudurluk && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grup Müdürlüğü
                  </label>
                  <select
                    value={editFormData.grupMudurlukId}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        grupMudurlukId: e.target.value,
                        mudurlukId: "",
                        teamId: "",
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    disabled={!editFormData.direktorlukId || editGrupMudurlukler.length === 0}
                  >
                    <option value="">
                      {!editFormData.direktorlukId
                        ? "Önce direktörlük seçin..."
                        : editGrupMudurlukler.length === 0
                          ? "Bu direktörlükte grup müdürlüğü yok"
                          : "Grup müdürlüğü seçin..."}
                    </option>
                    {editGrupMudurlukler.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Müdürlük */}
              {editShowMudurluk && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Müdürlük
                  </label>
                  <select
                    value={editFormData.mudurlukId}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        mudurlukId: e.target.value,
                        teamId: "",
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    disabled={!editFormData.grupMudurlukId || editMudurlukler.length === 0}
                  >
                    <option value="">
                      {!editFormData.grupMudurlukId
                        ? "Önce grup müdürlüğü seçin..."
                        : editMudurlukler.length === 0
                          ? "Bu grup müdürlüğünde müdürlük yok"
                          : "Müdürlük seçin..."}
                    </option>
                    {editMudurlukler.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Ekip */}
              {editShowTeam && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ekip
                  </label>
                  <select
                    value={editFormData.teamId}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, teamId: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    disabled={!editFormData.mudurlukId || editFilteredTeams.length === 0}
                  >
                    <option value="">
                      {!editFormData.mudurlukId
                        ? "Önce müdürlük seçin..."
                        : editFilteredTeams.length === 0
                          ? "Bu müdürlükte ekip yok"
                          : "Ekip seçin..."}
                    </option>
                    {editFilteredTeams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => { setIsEditModalOpen(false); setEditingUser(null); }}
            >
              İptal
            </Button>
            <Button type="submit" loading={adminUpdateMutation.isPending}>
              Güncelle
            </Button>
          </div>
        </form>
        )}
      </Modal>

      {/* Kullanıcı Sil Onay Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setDeletingUser(null); }}
        title="Kullanıcı Sil"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            <span className="font-semibold text-gray-800">{deletingUser?.fullName}</span> adlı kullanıcıyı silmek istediğinize emin misiniz?
          </p>
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            Bu işlem geri alınamaz. Kullanıcının postları ve yorumları da silinecektir.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => { setIsDeleteModalOpen(false); setDeletingUser(null); }}
            >
              İptal
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteUser}
              loading={deleteUserMutation.isPending}
            >
              Sil
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
