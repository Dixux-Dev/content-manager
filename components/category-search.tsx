"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Plus, Search } from "lucide-react"

interface CategorySearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
}

export function CategorySearch({ 
  value, 
  onChange, 
  placeholder = "Buscar o crear categoría...",
  required = false 
}: CategorySearchProps) {
  const [categories, setCategories] = useState<string[]>([])
  const [filteredCategories, setFilteredCategories] = useState<string[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Cargar categorías existentes
  useEffect(() => {
    fetchCategories()
  }, [])

  // Filtrar categorías según búsqueda
  useEffect(() => {
    if (value.trim() === '') {
      setFilteredCategories(categories)
    } else {
      const filtered = categories.filter(category =>
        category.toLowerCase().includes(value.toLowerCase())
      )
      setFilteredCategories(filtered)
    }
  }, [value, categories])

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
    onChange(newValue)
    setShowDropdown(true)
  }

  const handleInputFocus = () => {
    setShowDropdown(true)
  }

  const handleCategorySelect = (category: string) => {
    onChange(category)
    setShowDropdown(false)
    inputRef.current?.blur()
  }

  // Verificar si ya existe la categoría exacta (case insensitive)
  const exactCategoryExists = categories.some(cat => 
    cat.toLowerCase() === value.toLowerCase().trim()
  )

  const handleAddNewCategory = () => {
    const trimmedValue = value.trim()
    console.log('🔵 Agregar nueva categoría:', trimmedValue)
    if (trimmedValue) {
      console.log('✅ Agregando categoría:', trimmedValue)
      onChange(trimmedValue)
      setShowDropdown(false)
      inputRef.current?.blur()
      // Actualizar la lista de categorías localmente si no existe
      if (!exactCategoryExists) {
        setCategories(prev => [...prev, trimmedValue])
      }
    } else {
      console.log('❌ No se puede agregar categoría vacía')
    }
  }

  // Mostrar botón si hay texto, no existe exactamente, y dropdown está abierto
  const showAddButton = value.trim() !== '' && !exactCategoryExists && showDropdown
  
  // Debug: mostrar estado del botón
  if (value.trim() !== '') {
    console.log('🟡 Estado botón agregar:', {
      value: value.trim(),
      exactCategoryExists,
      showDropdown,
      showAddButton
    })
  }

  return (
    <div className="relative">
      <Label htmlFor="category">Categoría{required && " *"}</Label>
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            id="category"
            value={value}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            className="pl-8"
            required={required}
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
                      <button
                        key={category}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                        onClick={() => handleCategorySelect(category)}
                      >
                        {category}
                      </button>
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
                    className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none flex items-center border-0 bg-transparent cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleAddNewCategory()
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar "{value.trim()}"
                  </button>
                )}

                {/* Mensaje cuando no hay resultados */}
                {filteredCategories.length === 0 && !showAddButton && (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    No se encontraron categorías
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