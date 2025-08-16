"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Save, Plus, Edit, Trash2 } from "lucide-react"

export function ProfileForm() {
  const { data: session } = useSession()
  const [profiles, setProfiles] = useState<any[]>([])
  const [editingProfile, setEditingProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    prompt: "",
    tone: "",
    style: "",
    format: ""
  })

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
      const bodyData = editingProfile 
        ? { ...formData, id: editingProfile.id }
        : { ...formData, creatorId: session.user.id }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyData)
      })

      if (response.ok) {
        await fetchProfiles() // Recargar la lista
        // Limpiar formulario
        setFormData({
          name: "",
          description: "",
          prompt: "",
          tone: "",
          style: "",
          format: ""
        })
        setEditingProfile(null)
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
      prompt: profile.prompt,
      tone: profile.tone || "",
      style: profile.style || "",
      format: profile.format || ""
    })
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
      <Card>
        <CardHeader>
          <CardTitle>
            {editingProfile ? "Editar Perfil" : "Crear Nuevo Perfil"}
          </CardTitle>
          <CardDescription>
            Los perfiles definen cómo se genera el contenido
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nombre del Perfil</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Ej: Blog SEO Optimizado"
              />
            </div>
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Breve descripción del perfil"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="prompt">Prompt Maestro</Label>
            <textarea
              id="prompt"
              className="w-full px-3 py-2 border rounded-md"
              rows={4}
              value={formData.prompt}
              onChange={(e) => setFormData({...formData, prompt: e.target.value})}
              placeholder="Define las instrucciones principales para la generación de contenido..."
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="tone">Tono</Label>
              <Input
                id="tone"
                value={formData.tone}
                onChange={(e) => setFormData({...formData, tone: e.target.value})}
                placeholder="Ej: Profesional"
              />
            </div>
            <div>
              <Label htmlFor="style">Estilo</Label>
              <Input
                id="style"
                value={formData.style}
                onChange={(e) => setFormData({...formData, style: e.target.value})}
                placeholder="Ej: Informativo"
              />
            </div>
            <div>
              <Label htmlFor="format">Formato</Label>
              <Input
                id="format"
                value={formData.format}
                onChange={(e) => setFormData({...formData, format: e.target.value})}
                placeholder="Ej: HTML"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleSave}
              disabled={!formData.name || !formData.prompt || isSaving}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Guardando...' : editingProfile ? "Actualizar" : "Guardar"} Perfil
            </Button>
            {editingProfile && (
              <Button 
                variant="outline"
                onClick={() => {
                  setEditingProfile(null)
                  setFormData({
                    name: "",
                    description: "",
                    prompt: "",
                    tone: "",
                    style: "",
                    format: ""
                  })
                }}
              >
                Cancelar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Perfiles Existentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {profiles.map((profile) => (
              <div key={profile.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{profile.name}</h3>
                    {profile.description && (
                      <p className="text-sm text-gray-600 mt-1">{profile.description}</p>
                    )}
                    <div className="mt-2 flex gap-4 text-sm text-gray-500">
                      {profile.tone && <span>Tono: {profile.tone}</span>}
                      {profile.style && <span>Estilo: {profile.style}</span>}
                      {profile.format && <span>Formato: {profile.format}</span>}
                    </div>
                    <p className="mt-2 text-sm text-gray-700">{profile.prompt}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(profile)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(profile.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}