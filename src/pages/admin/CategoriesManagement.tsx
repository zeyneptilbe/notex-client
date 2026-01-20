import { useState } from 'react'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { Modal } from '../../components/common/Modal'
import { Loading } from '../../components/common/Loading'
import { useCategories } from '../../hooks/useCategories'

const ICON_OPTIONS = ['📄', '📚', '🔧', '⭐', '📢', '💡', '🎯', '🚀', '📊', '🔒']
const COLOR_OPTIONS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#EC4899', '#06B6D4', '#84CC16']

export default function CategoriesManagement() {
  const { data: categories, isLoading } = useCategories()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '📄',
    color: '#3B82F6',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Creating category:', formData)
    setIsModalOpen(false)
  }

  if (isLoading) {
    return <Loading text="Kategoriler yükleniyor..." />
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Kategori Yönetimi</h1>
          <p className="text-gray-500 text-sm mt-1">Post kategorilerini yönet</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>+ Yeni Kategori</Button>
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
              <button className="text-gray-400 hover:text-gray-600">•••</button>
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">{category.name}</h3>
            <p className="text-sm text-gray-500 mb-3 line-clamp-2">
              {category.description || 'Açıklama yok'}
            </p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">{category.postCount} post</span>
              <span
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: category.color }}
              ></span>
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

      {/* Yeni Kategori Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Yeni Kategori Oluştur"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Kategori Adı"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Örn: Teknik Döküman"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Açıklama</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Kategori açıklaması..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">İkon</label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon })}
                  className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-colors ${
                    formData.icon === icon
                      ? 'bg-blue-100 ring-2 ring-blue-500'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Renk</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              İptal
            </Button>
            <Button type="submit">Oluştur</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}