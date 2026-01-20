import { useState } from "react";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Modal } from "../../components/common/Modal";
import { Loading } from "../../components/common/Loading";
import { useTeams, useCreateTeam, useDeleteTeam } from "../../hooks/useTeams";
import { useUnits } from "../../hooks/useUnits";

export default function TeamsManagement() {
  const { data: teams, isLoading } = useTeams();
  const { data: units } = useUnits();
  const createTeamMutation = useCreateTeam();
  const deleteTeamMutation = useDeleteTeam();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    code: "",
    unitId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTeamMutation.mutateAsync(formData);
      setIsModalOpen(false);
      setFormData({ name: "", description: "", code: "", unitId: "" });
    } catch (error) {
      console.error("Ekip oluşturma hatası:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Bu ekibi silmek istediğinize emin misiniz?")) {
      try {
        await deleteTeamMutation.mutateAsync(id);
      } catch (error) {
        console.error("Ekip silme hatası:", error);
      }
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
        <Button onClick={() => setIsModalOpen(true)}>+ Yeni Ekip</Button>
      </div>

      {/* Ekip Listesi */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Ekip Adı
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Birim
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Kod
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Üye
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Post
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                İşlem
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {teams?.map((team) => (
              <tr key={team.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">👥</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{team.name}</p>
                      <p className="text-xs text-gray-500">
                        {team.description || "-"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                    {team.unitName}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-mono rounded">
                    {team.code || "-"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {team.userCount} kişi
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {team.postCount} post
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleDelete(team.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Sil
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(!teams || teams.length === 0) && (
          <div className="text-center py-12">
            <span className="text-4xl mb-2 block">👥</span>
            <p className="text-gray-500">Henüz ekip yok</p>
          </div>
        )}
      </div>

      {/* Yeni Ekip Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Yeni Ekip Oluştur"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Ekip Adı"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Örn: Backend Ekibi"
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
            label="Kod (Opsiyonel)"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="Örn: BE"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Açıklama (Opsiyonel)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Ekip açıklaması..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
            >
              İptal
            </Button>
            <Button type="submit" loading={createTeamMutation.isPending}>
              Oluştur
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
