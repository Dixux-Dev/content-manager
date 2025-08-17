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
  placeholder = "Search or create category...",
  required = false 
}: CategorySearchProps) {
  const [categories, setCategories] = useState<string[]>([])
  const [filteredCategories, setFilteredCategories] = useState<string[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load existing categories
  useEffect(() => {
    fetchCategories()
  }, [])

  // Filter categories based on search
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

  // Close dropdown when clicking outside
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
      console.error('Error loading categories:', error)
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

  // Check if exact category already exists (case insensitive)
  const exactCategoryExists = categories.some(cat => 
    cat.toLowerCase() === value.toLowerCase().trim()
  )

  const handleAddNewCategory = () => {
    const trimmedValue = value.trim()
    if (trimmedValue) {
      onChange(trimmedValue)
      setShowDropdown(false)
      inputRef.current?.blur()
      // Update category list locally if it doesn't exist
      if (!exactCategoryExists) {
        setCategories(prev => [...prev, trimmedValue])
      }
    }
  }

  // Show button if there's text, doesn't exist exactly, and dropdown is open
  const showAddButton = value.trim() !== '' && !exactCategoryExists && showDropdown

  return (
    <div className="relative">
      <Label htmlFor="category">Category{required && " *"}</Label>
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
                Loading categories...
              </div>
            ) : (
              <>
                {/* Filtered existing categories */}
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

                {/* Separator if there are categories and new one can be added */}
                {filteredCategories.length > 0 && showAddButton && (
                  <div className="border-t border-gray-200"></div>
                )}

                {/* Button to add new category */}
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
                    Add "{value.trim()}"
                  </button>
                )}

                {/* Message when no results */}
                {filteredCategories.length === 0 && !showAddButton && (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    No categories found
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