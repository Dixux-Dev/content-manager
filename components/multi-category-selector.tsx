"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, X, Trash2 } from "lucide-react"

interface MultiCategorySelectorProps {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  required?: boolean
}

export function MultiCategorySelector({ 
  value, 
  onChange, 
  placeholder = "Buscar o crear categorías...",
  required = false 
}: MultiCategorySelectorProps) {
  const [categories, setCategories] = useState<string[]>([])
  const [filteredCategories, setFilteredCategories] = useState<string[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Cargar categorías existentes
  useEffect(() => {
    fetchCategories()
  }, [])

  // Filtrar categorías según búsqueda
  useEffect(() => {
    if (searchValue.trim() === '') {
      // Mostrar solo categorías no seleccionadas
      setFilteredCategories(categories.filter(cat => !value.includes(cat)))
    } else {
      const filtered = categories.filter(category =>
        category.toLowerCase().includes(searchValue.toLowerCase()) &&
        !value.includes(category)
      )
      setFilteredCategories(filtered)
    }
  }, [searchValue, categories, value])

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const fetchCategories = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Error cargando categorías:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setSearchValue(newValue)
    setShowDropdown(true)
  }

  const handleInputFocus = () => {
    setShowDropdown(true)
  }

  const handleCategorySelect = (category: string) => {
    if (!value.includes(category)) {
      onChange([...value, category])
    }
    setSearchValue("")
    setShowDropdown(false)
    inputRef.current?.focus()
  }

  const handleCategoryRemove = (categoryToRemove: string) => {
    onChange(value.filter(cat => cat !== categoryToRemove))
  }

  // Verificar si ya existe la categoría exacta (case insensitive)
  const exactCategoryExists = categories.some(cat => 
    cat.toLowerCase() === searchValue.toLowerCase().trim()
  )

  const handleAddNewCategory = () => {
    const trimmedValue = searchValue.trim()
    if (trimmedValue && !value.includes(trimmedValue)) {
      onChange([...value, trimmedValue])
      setSearchValue("")
      setShowDropdown(false)
      // Actualizar la lista de categorías localmente si no existe
      if (!exactCategoryExists) {
        setCategories(prev => [...prev, trimmedValue])
      }
      inputRef.current?.focus()
    }
  }

  const handleDeleteCategory = async (categoryToDelete: string) => {
    const confirmed = window.confirm(
      `¿Estás seguro de que quieres eliminar permanentemente la categoría "${categoryToDelete}"? Se eliminará de todos los contenidos existentes.`
    )
    
    if (!confirmed) return

    try {
      const response = await fetch('/api/categories', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category: categoryToDelete
        })
      })

      if (response.ok) {
        const data = await response.json()
        // Remover la categoría de la lista local
        setCategories(prev => prev.filter(cat => 
          cat.toLowerCase().trim() !== categoryToDelete.toLowerCase().trim()
        ))
        // Remover la categoría de los valores seleccionados si estaba seleccionada
        onChange(value.filter(cat => 
          cat.toLowerCase().trim() !== categoryToDelete.toLowerCase().trim()
        ))
        alert(data.message || `Categoría "${categoryToDelete}" eliminada exitosamente`)
      } else {
        const error = await response.json()
        alert(`Error eliminando categoría: ${error.error || 'Error desconocido'}`)
      }
    } catch (error) {
      console.error('Error eliminando categoría:', error)
      alert('Error de conexión al eliminar categoría')
    }
  }

  // Manejar teclas Enter para agregar categoría
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (searchValue.trim() && !exactCategoryExists) {
        handleAddNewCategory()
      } else if (filteredCategories.length > 0) {
        handleCategorySelect(filteredCategories[0])
      }
    }
  }

  // Mostrar botón si hay texto, no existe exactamente, y dropdown está abierto
  const showAddButton = searchValue.trim() !== '' && !exactCategoryExists && showDropdown && !value.includes(searchValue.trim())

  return (
    <div className="space-y-2">
      <Label htmlFor="categories">Categorías{required && " *"}</Label>
      
      {/* Selected categories badges */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((category) => (
            <Badge key={category} variant="secondary" className="flex items-center gap-1">
              {category}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => handleCategoryRemove(category)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            id="categories"
            value={searchValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="pl-8"
          />
        </div>

        {showDropdown && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                Cargando categorías...
              </div>
            ) : (
              <>
                {/* Categorías existentes filtradas */}
                {filteredCategories.length > 0 && (
                  <>
                    {filteredCategories.map((category) => (
                      <div
                        key={category}
                        className="flex items-center justify-between group hover:bg-gray-100 focus-within:bg-gray-100"
                      >
                        <button
                          type="button"
                          className="flex-1 px-3 py-2 text-left text-sm hover:bg-transparent focus:bg-transparent focus:outline-none"
                          onClick={() => handleCategorySelect(category)}
                        >
                          {category}
                        </button>
                        <button
                          type="button"
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none mr-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteCategory(category)
                          }}
                          title={`Eliminar categoría "${category}" permanentemente`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </>
                )}

                {/* Separador si hay categorías y se puede agregar nueva */}
                {filteredCategories.length > 0 && showAddButton && (
                  <div className="border-t border-gray-200"></div>
                )}

                {/* Botón para agregar nueva categoría */}
                {showAddButton && (
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none flex items-center"
                    onClick={handleAddNewCategory}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar "{searchValue.trim()}"
                  </button>
                )}

                {/* Mensaje cuando no hay resultados */}
                {filteredCategories.length === 0 && !showAddButton && (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    {searchValue.trim() ? 'No se encontraron categorías' : 'Escribe para buscar o crear categorías'}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}