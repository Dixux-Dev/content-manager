"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { mockProfiles, categories } from "@/data/mock-data"
import { Wand2, Save } from "lucide-react"

export function ContentForm() {
  const [formData, setFormData] = useState({
    title: "",
    type: "SNIPPET",
    category: "",
    profileId: "",
    wordCount: "",
    extraInstructions: ""
  })
  
  const [generatedContent, setGeneratedContent] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    setIsGenerating(true)
    // Simulación de generación de contenido
    setTimeout(() => {
      setGeneratedContent(`<h1>${formData.title}</h1>
<p>Este es un contenido de ejemplo generado automáticamente basado en el perfil seleccionado.</p>
<p>El contenido real será generado usando la API de DeepSeek con los parámetros configurados.</p>
<ul>
  <li>Tipo: ${formData.type}</li>
  <li>Categoría: ${formData.category}</li>
  <li>Palabras: ${formData.wordCount || 'Auto'}</li>
</ul>`)
      setIsGenerating(false)
    }, 2000)
  }

  const handleSave = () => {
    console.log("Guardando contenido:", { ...formData, content: generatedContent })
    // Aquí se implementará el guardado real
  }

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
              <option value="SNIPPET">Snippet</option>
              <option value="PAGE">Página</option>
            </select>
          </div>

          <div>
            <Label htmlFor="category">Categoría</Label>
            <select
              id="category"
              className="w-full px-3 py-2 border rounded-md"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
            >
              <option value="">Selecciona una categoría</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
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
              {mockProfiles.map(profile => (
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
            <textarea
              id="extra"
              className="w-full px-3 py-2 border rounded-md"
              rows={3}
              value={formData.extraInstructions}
              onChange={(e) => setFormData({...formData, extraInstructions: e.target.value})}
              placeholder="Agrega instrucciones específicas..."
            />
          </div>

          <Button 
            onClick={handleGenerate} 
            className="w-full"
            disabled={!formData.title || !formData.category || !formData.profileId || isGenerating}
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
          {generatedContent ? (
            <>
              <div 
                className="prose prose-sm max-w-none mb-4 p-4 border rounded-md min-h-[300px]"
                dangerouslySetInnerHTML={{ __html: generatedContent }}
              />
              <Button onClick={handleSave} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Guardar Contenido
              </Button>
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