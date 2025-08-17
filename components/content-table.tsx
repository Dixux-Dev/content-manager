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
import { profileEvents } from "@/lib/profile-events"
import { ContentWithRelations } from "@/types"
import { Badge } from "@/components/ui/badge"
import { MultiCategorySelector } from "@/components/multi-category-selector"
import { Editor } from "@/components/editor/editor"
import { SerializedEditorState } from "lexical"
import { serializedStateToHtml, htmlToSerializedState } from "@/lib/editor-utils"

interface ContentTableProps {
  userRole?: 'ADMIN' | 'VIEWER'
}

export function ContentTable({ userRole = 'VIEWER' }: ContentTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedType, setSelectedType] = useState<string>("")
  const [content, setContent] = useState<ContentWithRelations[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingContent, setEditingContent] = useState<ContentWithRelations | null>(null)

  // Cargar contenido y categorías desde API
  useEffect(() => {
    fetchContent()
    fetchCategories()
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

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Error cargando categorías:', error)
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
        await fetchCategories() // Recargar categorías
      } else {
        alert('Error eliminando contenido')
      }
    } catch (error) {
      console.error('Error eliminando contenido:', error)
      alert('Error eliminando contenido')
    }
  }

  const filteredContent = content.filter(item => {
    // Buscar en título o en cualquiera de las categorías
    const categoriesString = Array.isArray(item.categories) ? item.categories.join(' ') : ''
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         categoriesString.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Filtrar por categoría específica
    const matchesCategory = !selectedCategory || 
                           (Array.isArray(item.categories) && item.categories.includes(selectedCategory))
    
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
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
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
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(item.categories) ? 
                        item.categories.map((category) => (
                          <Badge key={category} variant="secondary" className="text-xs">
                            {category}
                          </Badge>
                        )) : null
                      }
                    </div>
                  </td>
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
            onSave={() => {
              fetchContent()
              fetchCategories()
            }}
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
    categories: content?.categories || [],
    content: content?.content || '',
    profileId: content?.profileId || ''
  })

  const [profiles, setProfiles] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [editorKey, setEditorKey] = useState<string>(`editor-${Date.now()}`)
  const [editorState, setEditorState] = useState<SerializedEditorState | undefined>()

  // Actualizar formData cuando cambia el contenido
  useEffect(() => {
    if (content) {
      setFormData({
        title: content.title || '',
        type: content.type || 'SNIPPET',
        categories: content.categories || [],
        content: content.content || '',
        profileId: content.profileId || ''
      })
      
      // Reset editor state for new content
      try {
        if (content.content && content.content.trim()) {
          const lexicalState = htmlToSerializedState(content.content)
          setEditorState(lexicalState)
        } else {
          setEditorState(undefined)
        }
        setEditorKey(`editor-${content.id || 'new'}-${Date.now()}`)
      } catch (error) {
        console.error('Error converting content to editor state:', error)
        setEditorState(undefined)
        setEditorKey(`editor-fallback-${Date.now()}`)
      }
    } else {
      // New content - reset editor
      setEditorState(undefined)
      setEditorKey(`editor-new-${Date.now()}`)
    }
  }, [content])

  useEffect(() => {
    fetchProfiles()

    // Suscribirse a eventos de perfiles para sincronización
    const unsubscribeCreated = profileEvents.subscribe('profile-created', () => {
      fetchProfiles() // Recargar lista cuando se crea un perfil
    })

    const unsubscribeUpdated = profileEvents.subscribe('profile-updated', () => {
      fetchProfiles() // Recargar lista cuando se actualiza un perfil
    })

    const unsubscribeDeleted = profileEvents.subscribe('profile-deleted', () => {
      fetchProfiles() // Recargar lista cuando se elimina un perfil
    })

    // Cleanup - desuscribirse cuando el componente se desmonta
    return () => {
      unsubscribeCreated()
      unsubscribeUpdated()
      unsubscribeDeleted()
    }
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
      
      const bodyData = content ? 
        { ...formData, id: content.id } : 
        { ...formData }

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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
            <MultiCategorySelector
              value={formData.categories}
              onChange={(value) => setFormData({...formData, categories: value})}
              required
            />
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
            <div className="mt-2" onClick={(e) => e.stopPropagation()}>
              <Editor
                key={editorKey}
                editorSerializedState={editorState}
                initialValue={!editorState ? formData.content : undefined}
                onSerializedChange={(state) => {
                  // Update editor state and convert to HTML
                  setEditorState(state)
                  try {
                    const htmlContent = serializedStateToHtml(state)
                    setFormData(prevFormData => ({...prevFormData, content: htmlContent}))
                  } catch (error) {
                    console.error('Error converting editor state to HTML:', error)
                  }
                }}
                placeholder="Escribe o edita el contenido aquí..."
              />
            </div>
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