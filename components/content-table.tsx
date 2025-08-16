"use client"

import { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { 
  Edit, 
  Trash2, 
  Eye,
  Search,
  Filter
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ContentWithRelations } from "@/types"
import { mockContent } from "@/data/mock-data"

interface ContentTableProps {
  userRole?: 'ADMIN' | 'VIEWER'
}

export function ContentTable({ userRole = 'VIEWER' }: ContentTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedType, setSelectedType] = useState<string>("")
  
  // Usar mock data por ahora
  const content = mockContent

  const filteredContent = content.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || item.category === selectedCategory
    const matchesType = !selectedType || item.type === selectedType
    
    return matchesSearch && matchesCategory && matchesType
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de Contenido</CardTitle>
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
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {userRole === 'ADMIN' && (
                        <>
                          <Button size="sm" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
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
      </CardContent>
    </Card>
  )
}