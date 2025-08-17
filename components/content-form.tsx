"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { profileEvents } from "@/lib/profile-events"
import { MultiCategorySelector } from "@/components/multi-category-selector"
import { Editor } from "@/components/editor/editor"
import { StyledContent } from "@/components/editor/styled-content"
import { SerializedEditorState } from "lexical"
import { serializedStateToText, isEditorEmpty, htmlToSerializedState, serializedStateToHtml } from "@/lib/editor-utils"
import { Wand2, Save } from "lucide-react"

export function ContentForm() {
  const { data: session } = useSession()
  const [profiles, setProfiles] = useState([])
  const [formData, setFormData] = useState({
    title: "",
    type: "PAGE",
    categories: [] as string[],
    profileId: "",
    wordCount: "",
    extraInstructions: ""
  })
  
  const [generatedContent, setGeneratedContent] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [generationStats, setGenerationStats] = useState<{
    wordCount?: number
    issues?: string[]
    isValid?: boolean
  }>({})
  const [generationTime, setGenerationTime] = useState<number>(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  // Removed extraInstructionsEditorState - using simple text now
  const [contentEditorState, setContentEditorState] = useState<SerializedEditorState | undefined>()

  // Cargar perfiles desde API
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

  // Timer effect for live time tracking during generation
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isTimerRunning) {
      const startTime = Date.now()
      interval = setInterval(() => {
        setGenerationTime(Date.now() - startTime)
      }, 100) // Update every 100ms for smooth animation
    }
    
    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isTimerRunning])

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true)
    setGenerationStats({})
    setGenerationTime(0)
    setIsTimerRunning(true)
    const startTime = Date.now()
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title,
          type: formData.type,
          categories: formData.categories,
          profileId: formData.profileId,
          wordCount: formData.wordCount,
          extraInstructions: formData.extraInstructions
        })
      })

      const endTime = Date.now()
      setIsTimerRunning(false)
      setGenerationTime(endTime - startTime)

      if (response.ok) {
        const data = await response.json()
        
        // Process the content and set states for immediate proper rendering
        if (data.content && data.content.trim()) {
          console.log('=== SETTING GENERATED CONTENT ===')
          console.log('Generated content:', data.content)
          
          // Set the HTML content for saving purposes
          setGeneratedContent(data.content)
          
          // Clear editor state and force re-mount for fresh styling
          setContentEditorState(undefined)
          
          // REMOVED: contentKey logic no longer needed
          
          setGenerationStats({
            wordCount: data.content.split(/\s+/).length,
            issues: [],
            isValid: true
          })
        } else {
          // Handle empty content
          console.log('=== NO CONTENT GENERATED ===')
          setGeneratedContent("")
          setContentEditorState(undefined)
          
          setGenerationStats({
            wordCount: 0,
            issues: [],
            isValid: true
          })
        }
      } else {
        const error = await response.json()
        alert(`Error generando contenido: ${error.error || 'Error desconocido'}`)
      }
    } catch (error) {
      console.error('Error generando contenido:', error)
      alert('Error de conexión al generar contenido')
    } finally {
      setIsGenerating(false)
      setIsTimerRunning(false)
    }
  }, [formData])

  // Simplified handler for extra instructions textarea
  const handleExtraInstructionsChange = useCallback((value: string) => {
    setFormData(prev => ({...prev, extraInstructions: value}))
  }, [])

  const handleContentEditorChange = useCallback((state: SerializedEditorState) => {
    console.log('✏️ Editor content changed, text:', serializedStateToText(state).substring(0, 50))
    setContentEditorState(state)
  }, [])

  const handleSave = useCallback(async () => {
    if (!generatedContent && !contentEditorState) {
      alert('No hay contenido generado para guardar')
      return
    }
    
    setIsSaving(true)
    try {
      // SIMPLIFIED: Use current editor state if available, otherwise use generated content
      let contentToSave: string
      
      if (contentEditorState) {
        // Convert current editor state to HTML
        contentToSave = serializedStateToHtml(contentEditorState)
        console.log('💾 Saving editor state as HTML:', contentToSave.substring(0, 200) + '...')
      } else {
        // Use original generated content
        contentToSave = generatedContent
        console.log('💾 Saving original generated content:', contentToSave.substring(0, 200) + '...')
      }
      
      console.log('🎨 === SENDING TO API ===')
      console.log('🎨 Final content being sent to API:', contentToSave)
      
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title,
          type: formData.type,
          categories: formData.categories,
          content: contentToSave,
          profileId: formData.profileId,
          wordCount: formData.wordCount ? parseInt(formData.wordCount) : null,
          lastEditorId: session?.user?.id || null
        })
      })

      if (response.ok) {
        const savedData = await response.json()
        console.log('🎨 === CONTENT SAVED SUCCESSFULLY ===')
        console.log('🎨 Saved data response:', savedData)
        alert('Contenido guardado exitosamente')
        // Limpiar formulario
        setFormData({
          title: "",
          type: "PAGE",
          categories: [],
          profileId: "",
          wordCount: "",
          extraInstructions: ""
        })
        setGeneratedContent("")
        setContentEditorState(undefined)
      } else {
        const errorData = await response.json()
        console.log('🎨 === SAVE ERROR ===')
        console.log('🎨 Error data:', errorData)
        alert(`Error guardando contenido: ${errorData.error || 'Error desconocido'}`)
      }
    } catch (error) {
      console.error('Error guardando contenido:', error)
      alert('Error guardando contenido')
    } finally {
      setIsSaving(false)
    }
  }, [generatedContent, contentEditorState, formData, session?.user?.id])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Generar Nuevo Contenido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Ingresa el título del contenido"
            />
          </div>

          <div>
            <Label htmlFor="type">Tipo de Contenido</Label>
            <select
              id="type"
              className="w-full px-3 py-2 border rounded-md"
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
            >
              <option value="PAGE">Página</option>
              <option value="SNIPPET">Snippet</option>
            </select>
          </div>

          <div>
            <MultiCategorySelector
              value={formData.categories}
              onChange={(value) => setFormData({...formData, categories: value})}
              placeholder="Buscar o crear categorías..."
              required
            />
          </div>

          <div>
            <Label htmlFor="profile">Perfil de Generación</Label>
            <select
              id="profile"
              className="w-full px-3 py-2 border rounded-md"
              value={formData.profileId}
              onChange={(e) => setFormData({...formData, profileId: e.target.value})}
            >
              <option value="">Selecciona un perfil</option>
              {profiles.map((profile: any) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>
          </div>

          {formData.type === 'SNIPPET' && (
            <div>
              <Label htmlFor="wordCount">Número de Palabras</Label>
              <Input
                id="wordCount"
                type="number"
                value={formData.wordCount}
                onChange={(e) => setFormData({...formData, wordCount: e.target.value})}
                placeholder="Ej: 150"
              />
            </div>
          )}

          <div>
            <Label htmlFor="extra">Instrucciones Adicionales</Label>
            <Textarea
              id="extra"
              value={formData.extraInstructions}
              onChange={(e) => handleExtraInstructionsChange(e.target.value)}
              placeholder="Agrega instrucciones específicas..."
              className="mt-2"
              rows={4}
            />
          </div>

          <Button 
            onClick={handleGenerate} 
            className="w-full"
            disabled={!formData.title || formData.categories.length === 0 || !formData.profileId || isGenerating}
          >
            <Wand2 className="mr-2 h-4 w-4" />
            {isGenerating ? "Generando..." : "Generar Contenido"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vista Previa del Contenido</CardTitle>
        </CardHeader>
        <CardContent>
          {isGenerating ? (
            // Loading state during content generation
            <div className="space-y-4">
              <div className="mb-4">
                <Label>Generando Contenido...</Label>
                <div className="mt-2 relative">
                  {/* Loading overlay for the editor */}
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-md border">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="text-sm text-gray-600">Generando contenido...</p>
                    </div>
                  </div>
                  <Editor
                    editorSerializedState={undefined}
                    onSerializedChange={() => {}}
                    placeholder="El contenido aparecerá aquí..."
                  />
                </div>
              </div>
              
              {/* Live time counter during generation */}
              <div className="bg-blue-50 p-3 rounded-md text-sm border border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="text-blue-700 font-medium">⏱️ Tiempo transcurrido:</span>
                  <span className="text-blue-800 font-mono">{(generationTime / 1000).toFixed(1)}s</span>
                </div>
              </div>
            </div>
          ) : generatedContent ? (
            <>
              <div className="mb-4">
                <Label>Vista Previa del Contenido (Editable)</Label>
                <div className="mt-2">
                  <StyledContent>
                    <Editor
                      onSerializedChange={handleContentEditorChange}
                      initialValue={generatedContent}
                      placeholder="El contenido generado aparecerá aquí para editar..."
                    />
                  </StyledContent>
                </div>
              </div>
              
              <div className="space-y-4">
                {/* Generation time display (final) */}
                {generationTime > 0 && (
                  <div className="bg-green-50 p-3 rounded-md text-sm border border-green-200">
                    <div className="flex justify-between items-center">
                      <span className="text-green-700 font-medium">✅ Generación completada en:</span>
                      <span className="text-green-800 font-mono">{(generationTime / 1000).toFixed(2)}s</span>
                    </div>
                  </div>
                )}
                
                <Button onClick={handleSave} className="w-full" disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? 'Guardando...' : 'Guardar Contenido'}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 py-12">
              <Wand2 className="mx-auto h-12 w-12 mb-4 text-gray-300" />
              <p>El contenido generado aparecerá aquí</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}