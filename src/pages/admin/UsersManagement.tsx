import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Modal } from "../../components/common/Modal";
import { Loading } from "../../components/common/Loading";
import { Avatar } from "../../components/common/Avatar";
import { useUsers, useCreateUser } from "../../hooks/useUsers";
import { useTeams } from "../../hooks/useTeams";
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    teamId: "",
    roleId: "",
    title: "",
  });

  const { data: usersData, isLoading } = useUsers({ searchTerm });
  const { data: teams } = useTeams();
  const { data: roles } = useRoles();
  const createUserMutation = useCreateUser();

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
      teamId: "",
      roleId: "",
      title: "",
    });
    setIsModalOpen(true);
  };

  const handleViewProfile = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  const validateForm = (): boolean => {
    const messages: string[] = [];

    if (!formData.firstName.trim()) messages.push("Ad zorunludur");
    if (!formData.lastName.trim()) messages.push("Soyad zorunludur");
    if (!formData.email.trim()) messages.push("E-posta zorunludur");
    if (!formData.password || formData.password.length < 6) {
      messages.push("Şifre en az 6 karakter olmalıdır");
    }
    if (!formData.teamId) messages.push("Ekip seçimi zorunludur");
    if (!formData.roleId) messages.push("Rol seçimi zorunludur");

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

    try {
      await createUserMutation.mutateAsync(formData);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Kullanıcı oluşturma hatası:", error);
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
                  {user.teamName}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ekip
            </label>
            <select
              value={formData.teamId}
              onChange={(e) =>
                setFormData({ ...formData, teamId: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Ekip seçin...</option>
              {teams?.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name} ({team.unitName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rol
            </label>
            <select
              value={formData.roleId}
              onChange={(e) =>
                setFormData({ ...formData, roleId: e.target.value })
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
    </div>
  );
}
