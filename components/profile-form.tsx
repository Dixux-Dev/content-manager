"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { profileEvents } from "@/lib/profile-events"
import { Editor } from "@/components/editor/editor"
import { SerializedEditorState } from "lexical"
import { serializedStateToText, isEditorEmpty, htmlToSerializedState, serializedStateToHtml } from "@/lib/editor-utils"
import { Save, Plus, Edit, Trash2 } from "lucide-react"

export function ProfileForm() {
  const { data: session } = useSession()
  const [profiles, setProfiles] = useState<any[]>([])
  const [editingProfile, setEditingProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    prompt: ""
  })
  const [promptEditorState, setPromptEditorState] = useState<SerializedEditorState | undefined>()

  // Cargar perfiles desde API
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
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!session?.user) return
    
    setIsSaving(true)
    try {
      const url = '/api/profiles'
      const method = editingProfile ? 'PUT' : 'POST'
      
      // Convertir el estado del editor a HTML para preservar estilos
      let promptToSave = formData.prompt
      if (promptEditorState) {
        promptToSave = serializedStateToHtml(promptEditorState)
      }
      
      const bodyData = editingProfile 
        ? { ...formData, prompt: promptToSave, id: editingProfile.id }
        : { ...formData, prompt: promptToSave, creatorId: session.user.id }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyData)
      })

      if (response.ok) {
        const savedProfile = await response.json()
        await fetchProfiles() // Recargar la lista
        
        // Emitir evento para sincronización
        if (editingProfile) {
          profileEvents.profileUpdated(savedProfile)
        } else {
          profileEvents.profileCreated(savedProfile)
        }
        
        // Limpiar formulario y cerrar modal
        setFormData({
          name: "",
          description: "",
          prompt: ""
        })
        setEditingProfile(null)
        setPromptEditorState(undefined)
        setIsModalOpen(false)
      } else {
        alert('Error guardando perfil')
      }
    } catch (error) {
      console.error('Error guardando perfil:', error)
      alert('Error guardando perfil')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = (profile: any) => {
    setEditingProfile(profile)
    setFormData({
      name: profile.name,
      description: profile.description || "",
      prompt: profile.prompt
    })
    
    // Reset editor state for fresh initialization with initialValue
    setPromptEditorState(undefined)
    setIsModalOpen(true)
  }

  const handleCreateNew = () => {
    setEditingProfile(null)
    setFormData({
      name: "",
      description: "",
      prompt: ""
    })
    setPromptEditorState(undefined)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este perfil?')) {
      return
    }

    try {
      const response = await fetch(`/api/profiles?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchProfiles() // Recargar la lista
        
        // Emitir evento para sincronización
        profileEvents.profileDeleted(id)
      } else {
        const error = await response.json()
        alert(error.error || 'Error eliminando perfil')
      }
    } catch (error) {
      console.error('Error eliminando perfil:', error)
      alert('Error eliminando perfil')
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div>Cargando perfiles...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Botón para crear nuevo perfil */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Perfiles de Generación</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona tus perfiles de contenido desde aquí
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Perfil
        </Button>
      </div>

      {/* Grid de cards de perfiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles.map((profile) => (
          <Card key={profile.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{profile.name}</CardTitle>
              {profile.description && (
                <CardDescription className="text-sm">
                  {profile.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(profile)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(profile.id)}
                  className="text-red-600 hover:text-red-700 hover:border-red-300"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Eliminar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {profiles.length === 0 && !isLoading && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-muted-foreground">
              <Plus className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No hay perfiles creados</p>
              <p className="text-sm mb-4">Crea tu primer perfil de generación para empezar</p>
              <Button onClick={handleCreateNew}>
                <Plus className="mr-2 h-4 w-4" />
                Crear Primer Perfil
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal para formulario */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProfile ? "Editar Perfil" : "Crear Nuevo Perfil"}
            </DialogTitle>
            <DialogDescription>
              Los perfiles definen cómo se genera el contenido usando prompts personalizados
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nombre del Perfil</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ej: Blog SEO Optimizado"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Breve descripción del perfil"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="prompt">Prompt Maestro</Label>
              <div className="mt-2">
                <Editor
                  key={editingProfile?.id || 'new-profile'}
                  initialValue={formData.prompt}
                  onSerializedChange={(state) => {
                    setPromptEditorState(state)
                    const htmlContent = serializedStateToHtml(state)
                    setFormData({...formData, prompt: htmlContent})
                  }}
                  placeholder="Define las instrucciones principales para la generación de contenido..."
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline"
              onClick={() => {
                setIsModalOpen(false)
                setEditingProfile(null)
                setFormData({
                  name: "",
                  description: "",
                  prompt: ""
                })
                setPromptEditorState(undefined)
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!formData.name || !formData.prompt || isSaving}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Guardando...' : editingProfile ? "Actualizar" : "Guardar"} Perfil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}