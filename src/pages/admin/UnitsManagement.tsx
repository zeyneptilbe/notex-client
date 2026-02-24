import { useState, useMemo } from "react";
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

type TreeNode = Unit & { children: TreeNode[] };

function buildTree(units: Unit[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  for (const u of units) {
    map.set(u.id, { ...u, children: [] });
  }

  const roots: TreeNode[] = [];
  for (const node of map.values()) {
    if (node.parentUnitId && map.has(node.parentUnitId)) {
      map.get(node.parentUnitId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sort = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, "tr"));
    for (const n of nodes) sort(n.children);
  };
  sort(roots);
  return roots;
}

function getAllIds(units: Unit[]): Set<string> {
  return new Set(units.map((u) => u.id));
}

export default function UnitsManagement() {
  const { hasPermission } = useAuth();

  if (
    !hasPermission("units.create") &&
    !hasPermission("units.update") &&
    !hasPermission("units.delete")
  ) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <span className="text-5xl mb-4 block">🔒</span>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Erişim Engellendi
          </h2>
          <p className="text-gray-600">
            Birim yönetimi yetkiniz bulunmuyor.
          </p>
        </div>
      </div>
    );
  }

  return <UnitsManagementContent />;
}

function UnitsManagementContent() {
  const { data: units, isLoading, refetch } = useUnits();
  const { hasPermission } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [deletingUnit, setDeletingUnit] = useState<Unit | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [createDropdownOpen, setCreateDropdownOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() =>
    getAllIds(units ?? []),
  );

  const tree = useMemo(() => buildTree(units ?? []), [units]);

  // Keep new units expanded when data refreshes
  useMemo(() => {
    if (units) {
      setExpandedIds((prev) => {
        const next = new Set(prev);
        for (const u of units) next.add(u.id);
        return next;
      });
    }
  }, [units]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    code: "",
    level: 1,
    parentUnitId: "",
  });

  const levelLabels: Record<number, string> = {
    1: "Direktörlük",
    2: "Grup Müdürlüğü",
    3: "Müdürlük",
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      code: "",
      level: 1,
      parentUnitId: "",
    });
    setEditingUnit(null);
  };

  const openCreateModal = (level: number) => {
    if (!hasPermission("units.create")) {
      showToast("Birim oluşturma yetkiniz bulunmuyor.", "warning");
      return;
    }
    resetForm();
    setFormData((prev) => ({ ...prev, level }));
    setCreateDropdownOpen(false);
    setIsModalOpen(true);
  };

  const openEditModal = (unit: Unit) => {
    if (!hasPermission("units.update")) {
      showToast("Birim düzenleme yetkiniz bulunmuyor.", "warning");
      return;
    }
    setEditingUnit(unit);
    setFormData({
      name: unit.name,
      description: unit.description || "",
      code: unit.code || "",
      level: unit.level || 1,
      parentUnitId: unit.parentUnitId || "",
    });
    setIsModalOpen(true);
    setDropdownOpen(null);
  };

  const openDeleteModal = (unit: Unit) => {
    if (!hasPermission("units.delete")) {
      showToast("Birim silme yetkiniz bulunmuyor.", "warning");
      return;
    }
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
          level: formData.level,
          parentUnitId: formData.parentUnitId || null,
        });
      } else {
        await unitsApi.create({
          name: formData.name,
          description: formData.description || undefined,
          code: formData.code || undefined,
          level: formData.level,
          parentUnitId: formData.parentUnitId || undefined,
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

  const renderTreeNode = (node: TreeNode, depth: number) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedIds.has(node.id);
    const paddingLeft = depth * 32;

    return (
      <div key={node.id}>
        <div className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 group">
          {/* Girinti + Chevron */}
          <div className="flex items-center shrink-0" style={{ paddingLeft }}>
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(node.id)}
                className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded hover:bg-gray-200 transition-colors"
              >
                <svg
                  className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <span className="w-6" />
            )}
          </div>

          {/* Birim ikonu + Adı */}
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
            <span className="text-lg">🏢</span>
          </div>
          <span className="font-medium text-gray-800 min-w-0 truncate">
            {node.name}
          </span>

          {/* Seviye Badge */}
          <span className={`px-2 py-1 text-xs font-medium rounded-full shrink-0 ${
            node.level === 1 ? "bg-purple-100 text-purple-700" :
            node.level === 2 ? "bg-blue-100 text-blue-700" :
            "bg-green-100 text-green-700"
          }`}>
            {levelLabels[node.level] || `Seviye ${node.level}`}
          </span>

          {/* Kod */}
          <span className="text-sm text-gray-500 shrink-0">
            {node.code || ""}
          </span>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Ekip Sayısı */}
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm shrink-0">
            {node.teamCount} ekip
          </span>

          {/* Durum */}
          <span className={`px-2 py-1 rounded-full text-xs font-medium shrink-0 ${
            node.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
          }`}>
            {node.isActive ? "Aktif" : "Pasif"}
          </span>

          {/* İşlemler */}
          <div className="relative shrink-0">
            <button
              onClick={() =>
                setDropdownOpen(dropdownOpen === node.id ? null : node.id)
              }
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              •••
            </button>

            {dropdownOpen === node.id && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setDropdownOpen(null)}
                />
                <div className="absolute right-0 top-10 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  <button
                    onClick={() => openEditModal(node)}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    ✏️ Düzenle
                  </button>
                  <button
                    onClick={() => openDeleteModal(node)}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    🗑️ Sil
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Alt birimler */}
        {hasChildren && isExpanded && (
          <div>{node.children.map((child) => renderTreeNode(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Birim Yönetimi</h1>
          <p className="text-gray-500 text-sm mt-1">Şirket birimlerini yönet</p>
        </div>
        <div className="relative">
          <Button onClick={() => setCreateDropdownOpen(!createDropdownOpen)}>
            + Yeni Birim ▼
          </Button>
          {createDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setCreateDropdownOpen(false)}
              />
              <div className="absolute right-0 top-12 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                <button
                  onClick={() => openCreateModal(1)}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  Direktörlük Ekle
                </button>
                <button
                  onClick={() => openCreateModal(2)}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  Grup Müdürlüğü Ekle
                </button>
                <button
                  onClick={() => openCreateModal(3)}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  Müdürlük Ekle
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Hiyerarşi Bilgi Kutusu */}
      <div className="flex items-center gap-2 px-4 py-2.5 mb-6 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
        <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <span>
          <span className="font-medium">Birim Hiyerarşisi:</span>{" "}
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" /> Direktörlük
            <span className="text-blue-400 mx-0.5">→</span>
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Grup Müdürlüğü
            <span className="text-blue-400 mx-0.5">→</span>
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Müdürlük
            <span className="text-blue-400 mx-0.5">→</span>
            Ekip
          </span>
        </span>
      </div>

      {/* Birim Listesi — Ağaç Görünümü */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {tree.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <span className="text-4xl mb-2 block">🏢</span>
            <p className="text-gray-500">Henüz birim yok</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {tree.map((node) => renderTreeNode(node, 0))}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seviye
            </label>
            <select
              value={formData.level}
              onChange={(e) =>
                setFormData({ ...formData, level: Number(e.target.value), parentUnitId: "" })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              <option value={1}>Direktörlük</option>
              <option value={2}>Grup Müdürlüğü</option>
              <option value={3}>Müdürlük</option>
            </select>
          </div>

          {formData.level > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Üst Birim
              </label>
              <select
                value={formData.parentUnitId}
                onChange={(e) =>
                  setFormData({ ...formData, parentUnitId: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                <option value="">Üst birim seçin...</option>
                {units
                  ?.filter((u) => u.level === formData.level - 1)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

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
