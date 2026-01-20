import { useState } from "react";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Modal } from "../../components/common/Modal";
import { Loading } from "../../components/common/Loading";
import { useUnits, useCreateUnit, useDeleteUnit } from "../../hooks/useUnits";

export default function UnitsManagement() {
  const { data: units, isLoading } = useUnits();
  const createUnitMutation = useCreateUnit();
  const deleteUnitMutation = useDeleteUnit();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    code: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUnitMutation.mutateAsync(formData);
      setIsModalOpen(false);
      setFormData({ name: "", description: "", code: "" });
    } catch (error) {
      console.error("Birim oluşturma hatası:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Bu birimi silmek istediğinize emin misiniz?")) {
      try {
        await deleteUnitMutation.mutateAsync(id);
      } catch (error) {
        console.error("Birim silme hatası:", error);
      }
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
        <Button onClick={() => setIsModalOpen(true)}>+ Yeni Birim</Button>
      </div>

      {/* Birim Listesi */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Birim Adı
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Kod
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Açıklama
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Ekip Sayısı
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                İşlem
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {units?.map((unit) => (
              <tr key={unit.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-purple-600 font-semibold">🏢</span>
                    </div>
                    <span className="font-medium text-gray-800">
                      {unit.name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-mono rounded">
                    {unit.code || "-"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {unit.description || "-"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {unit.teamCount} ekip
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleDelete(unit.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Sil
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(!units || units.length === 0) && (
          <div className="text-center py-12">
            <span className="text-4xl mb-2 block">🏢</span>
            <p className="text-gray-500">Henüz birim yok</p>
          </div>
        )}
      </div>

      {/* Yeni Birim Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Yeni Birim Oluştur"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Birim Adı"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Örn: Yazılım Geliştirme"
          />

          <Input
            label="Kod (Opsiyonel)"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="Örn: YG"
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
              placeholder="Birim açıklaması..."
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
            <Button type="submit" loading={createUnitMutation.isPending}>
              Oluştur
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
