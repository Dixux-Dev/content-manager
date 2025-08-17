"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, X, Trash2 } from "lucide-react"

/**
 * Props for the MultiCategorySelector component
 * @description Category selection component with search, create, and delete functionality
 */
interface MultiCategorySelectorProps {
  /** Array of currently selected category names
   * @description The controlled value of selected categories
   * @example ["development", "typescript", "documentation"]
   */
  value: string[]
  /** Callback fired when category selection changes
   * @description Called with updated array when categories are added or removed
   * @param value - The new array of selected category names
   */
  onChange: (value: string[]) => void
  /** Placeholder text for the search input
   * @default "Search or create categories..."
   * @example "Select project categories..."
   */
  placeholder?: string
  /** Whether category selection is required
   * @default false
   * @description Adds visual indicator and affects validation
   */
  required?: boolean
}

/**
 * Multi-select category component with search, create, and delete functionality
 * @description Allows users to select multiple categories from existing ones or create new categories
 * Features include:
 * - Search/filter existing categories
 * - Create new categories on-the-fly
 * - Delete existing categories (with confirmation)
 * - Visual badges for selected categories
 * - Keyboard navigation support
 * 
 * @component
 * @example
 * ```tsx
 * const [categories, setCategories] = useState<string[]>([])
 * 
 * <MultiCategorySelector
 *   value={categories}
 *   onChange={setCategories}
 *   placeholder="Select categories..."
 *   required
 * />
 * ```
 */
export function MultiCategorySelector({ 
  value, 
  onChange, 
  placeholder = "Search or create categories...",
  required = false 
}: MultiCategorySelectorProps) {
  const [categories, setCategories] = useState<string[]>([])
  const [filteredCategories, setFilteredCategories] = useState<string[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load existing categories
  useEffect(() => {
    fetchCategories()
  }, [])

  // Filter categories based on search
  useEffect(() => {
    if (searchValue.trim() === '') {
      // Show only unselected categories
      setFilteredCategories(categories.filter(cat => !value.includes(cat)))
    } else {
      const filtered = categories.filter(category =>
        category.toLowerCase().includes(searchValue.toLowerCase()) &&
        !value.includes(category)
      )
      setFilteredCategories(filtered)
    }
  }, [searchValue, categories, value])

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

  // Check if exact category already exists (case insensitive)
  const exactCategoryExists = categories.some(cat => 
    cat.toLowerCase() === searchValue.toLowerCase().trim()
  )

  const handleAddNewCategory = () => {
    const trimmedValue = searchValue.trim()
    if (trimmedValue && !value.includes(trimmedValue)) {
      onChange([...value, trimmedValue])
      setSearchValue("")
      setShowDropdown(false)
      // Update category list locally if it doesn't exist
      if (!exactCategoryExists) {
        setCategories(prev => [...prev, trimmedValue])
      }
      inputRef.current?.focus()
    }
  }

  const handleDeleteCategory = async (categoryToDelete: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete the category "${categoryToDelete}"? It will be removed from all existing content.`
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
        // Remove category from local list
        setCategories(prev => prev.filter(cat => 
          cat.toLowerCase().trim() !== categoryToDelete.toLowerCase().trim()
        ))
        // Remove category from selected values if it was selected
        onChange(value.filter(cat => 
          cat.toLowerCase().trim() !== categoryToDelete.toLowerCase().trim()
        ))
        alert(data.message || `Category "${categoryToDelete}" deleted successfully`)
      } else {
        const error = await response.json()
        alert(`Error deleting category: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Connection error when deleting category')
    }
  }

  // Handle Enter key to add category
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

  // Show button if there's text, doesn't exist exactly, and dropdown is open
  const showAddButton = searchValue.trim() !== '' && !exactCategoryExists && showDropdown && !value.includes(searchValue.trim())

  return (
    <div className="space-y-2">
      <Label htmlFor="categories">Categories{required && " *"}</Label>
      
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
                Loading categories...
              </div>
            ) : (
              <>
                {/* Filtered existing categories */}
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
                          title={`Delete category "${category}" permanently`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
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
                    className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none flex items-center"
                    onClick={handleAddNewCategory}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add "{searchValue.trim()}"
                  </button>
                )}

                {/* Message when no results */}
                {filteredCategories.length === 0 && !showAddButton && (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    {searchValue.trim() ? 'No categories found' : 'Type to search or create categories'}
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