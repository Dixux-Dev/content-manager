"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { 
  Edit, 
  Trash2, 
  Eye,
  Search,
  Filter,
  Plus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ContentWithRelations } from "@/types"

interface ContentTableProps {
  userRole?: 'ADMIN' | 'VIEWER'
}

export function ContentTable({ userRole = 'VIEWER' }: ContentTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedType, setSelectedType] = useState<string>("")
  const [content, setContent] = useState<ContentWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingContent, setEditingContent] = useState<ContentWithRelations | null>(null)

  // Cargar contenido desde API
  useEffect(() => {
    fetchContent()
  }, [])

  const fetchContent = async () => {
    try {
      const response = await fetch('/api/content')
      if (response.ok) {
        const data = await response.json()
        setContent(data)
      }
    } catch (error) {
      console.error('Error cargando contenido:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este contenido?')) {
      return
    }

    try {
      const response = await fetch(`/api/content?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchContent() // Recargar la lista
      } else {
        alert('Error eliminando contenido')
      }
    } catch (error) {
      console.error('Error eliminando contenido:', error)
      alert('Error eliminando contenido')
    }
  }

  const filteredContent = content.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || item.category === selectedCategory
    const matchesType = !selectedType || item.type === selectedType
    
    return matchesSearch && matchesCategory && matchesType
  })

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div>Cargando contenido...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Lista de Contenido</CardTitle>
          {userRole === 'ADMIN' && (
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Contenido
            </Button>
          )}
        </div>
        <div className="flex gap-4 mt-4">
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <select 
            className="px-3 py-2 border rounded-md"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">Todas las categorías</option>
            <option value="Marketing Digital">Marketing Digital</option>
            <option value="Social Media">Social Media</option>
            <option value="Desarrollo">Desarrollo</option>
          </select>
          <select 
            className="px-3 py-2 border rounded-md"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="">Todos los tipos</option>
            <option value="SNIPPET">Snippet</option>
            <option value="PAGE">Página</option>
          </select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">Título</th>
                <th className="px-6 py-3">Tipo</th>
                <th className="px-6 py-3">Categoría</th>
                <th className="px-6 py-3">Perfil</th>
                <th className="px-6 py-3">Fecha</th>
                <th className="px-6 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredContent.map((item) => (
                <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{item.title}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      item.type === 'SNIPPET' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {item.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">{item.category}</td>
                  <td className="px-6 py-4">{item.profile.name}</td>
                  <td className="px-6 py-4">
                    {format(item.createdAt, 'dd MMM yyyy', { locale: es })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        title="Ver contenido"
                        onClick={() => alert(`Contenido: ${item.content.substring(0, 100)}...`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {userRole === 'ADMIN' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            title="Editar contenido"
                            onClick={() => setEditingContent(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            title="Eliminar contenido"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Formulario de creación/edición */}
        {(showCreateForm || editingContent) && (
          <ContentFormModal
            content={editingContent}
            onClose={() => {
              setShowCreateForm(false)
              setEditingContent(null)
            }}
            onSave={fetchContent}
          />
        )}
      </CardContent>
    </Card>
  )
}

// Componente de formulario modal básico
function ContentFormModal({ 
  content, 
  onClose, 
  onSave 
}: { 
  content: ContentWithRelations | null
  onClose: () => void
  onSave: () => void
}) {
  const [formData, setFormData] = useState({
    title: content?.title || '',
    type: content?.type || 'SNIPPET',
    category: content?.category || '',
    content: content?.content || '',
    profileId: content?.profileId || '',
    wordCount: content?.wordCount?.toString() || ''
  })

  const [profiles, setProfiles] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchProfiles()
  }, [])

  const fetchProfiles = async () => {
    try {
      const response = await fetch('/api/profiles')
      if (response.ok) {
        const data = await response.json()
        setProfiles(data)
      }
    } catch (error) {
      console.error('Error cargando perfiles:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const url = content ? '/api/content' : '/api/content'
      const method = content ? 'PUT' : 'POST'
      const bodyData = content ? { ...formData, id: content.id } : formData

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyData)
      })

      if (response.ok) {
        onSave()
        onClose()
      } else {
        alert('Error guardando contenido')
      }
    } catch (error) {
      console.error('Error guardando contenido:', error)
      alert('Error guardando contenido')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {content ? 'Editar Contenido' : 'Nuevo Contenido'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Título</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tipo</label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value as any})}
              >
                <option value="SNIPPET">Snippet</option>
                <option value="PAGE">Página</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Categoría</label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Perfil</label>
            <select
              className="w-full px-3 py-2 border rounded-md"
              value={formData.profileId}
              onChange={(e) => setFormData({...formData, profileId: e.target.value})}
              required
            >
              <option value="">Seleccionar perfil</option>
              {profiles.map((profile: any) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Contenido</label>
            <textarea
              className="w-full px-3 py-2 border rounded-md"
              rows={6}
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Palabras (opcional)</label>
            <Input
              type="number"
              value={formData.wordCount}
              onChange={(e) => setFormData({...formData, wordCount: e.target.value})}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}