"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { enUS } from "date-fns/locale"
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
import { ContentWithRelations, ProfileWithCreator } from "@/types"
import { Badge } from "@/components/ui/badge"
import { MultiCategorySelector } from "@/components/multi-category-selector"
import { Editor } from "@/components/editor/editor"
import { SerializedEditorState } from "lexical"
import { serializedStateToHtml, htmlToSerializedState, isEditorEmpty, serializedStateToText } from "@/lib/editor-utils"

// Helper function to get displayable content
function getDisplayableContent(content: string): string {
  try {
    const parsed = JSON.parse(content)
    if (parsed.root && parsed.root.children) {
      // It's a serialized Lexical state, convert to HTML
      return serializedStateToHtml(parsed)
    }
  } catch (e) {
    // Not JSON, return as is (HTML or text)
  }
  return content
}

/**
 * Props for the ContentTable component
 * @description Data table for displaying and managing content items with role-based permissions
 */
interface ContentTableProps {
  /** User's role determining available actions
   * @default 'VIEWER'
   * @description ADMIN can create/edit/delete content, VIEWER can only view
   */
  userRole?: 'ADMIN' | 'VIEWER'
}

/**
 * Content management table with search, filtering, and CRUD operations
 * @description Displays content items in a table format with search/filter capabilities
 * Features include:
 * - Search by title or category
 * - Filter by category and content type
 * - Role-based actions (view for all, edit/delete for admins)
 * - Inline content preview
 * - Modal-based creation and editing
 * 
 * @component
 * @example
 * ```tsx
 * // For admin users
 * <ContentTable userRole="ADMIN" />
 * 
 * // For viewer users (default)
 * <ContentTable userRole="VIEWER" />
 * ```
 */
export function ContentTable({ userRole = 'VIEWER' }: ContentTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedType, setSelectedType] = useState<string>("")
  const [content, setContent] = useState<ContentWithRelations[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingContent, setEditingContent] = useState<ContentWithRelations | null>(null)

  // Load content and categories from API
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
      console.error('Error loading content:', error)
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
      console.error('Error loading categories:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content?')) {
      return
    }

    try {
      const response = await fetch(`/api/content?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchContent() // Reload list
        await fetchCategories() // Reload categories
      } else {
        alert('Error deleting content')
      }
    } catch (error) {
      console.error('Error deleting content:', error)
      alert('Error deleting content')
    }
  }

  const filteredContent = content.filter(item => {
    // Search in title or any categories
    const categoriesString = Array.isArray(item.categories) ? item.categories.join(' ') : ''
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         categoriesString.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Filter by specific category
    const matchesCategory = !selectedCategory || 
                           (Array.isArray(item.categories) && item.categories.includes(selectedCategory))
    
    const matchesType = !selectedType || item.type === selectedType
    
    return matchesSearch && matchesCategory && matchesType
  })

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div>Loading content...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Content List</CardTitle>
          {userRole === 'ADMIN' && (
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Content
            </Button>
          )}
        </div>
        <div className="flex gap-4 mt-4">
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title or category..."
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
            <option value="">All categories</option>
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
            <option value="">All types</option>
            <option value="SNIPPET">Snippet</option>
            <option value="PAGE">Page</option>
          </select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">Title</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Profile</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Actions</th>
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
                    {format(item.createdAt, 'dd MMM yyyy', { locale: enUS })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        title="View content"
                        onClick={() => {
                          const displayContent = getDisplayableContent(item.content)
                          alert(`Content: ${displayContent.substring(0, 200)}...`)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {userRole === 'ADMIN' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            title="Edit content"
                            onClick={() => setEditingContent(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            title="Delete content"
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

        {/* Creation/edit form */}
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

/**
 * Props for the ContentFormModal component
 * @description Modal form for creating and editing content items
 */
interface ContentFormModalProps {
  /** The content item to edit, null for creating new content
   * @description When null, opens in creation mode; when provided, opens in edit mode
   */
  content: ContentWithRelations | null
  /** Callback fired when modal should be closed
   * @description Called when user cancels or clicks outside modal
   */
  onClose: () => void
  /** Callback fired when content is successfully saved
   * @description Called after successful create/update operation to refresh parent data
   */
  onSave: () => void
}

/**
 * Modal form component for creating and editing content
 * @description Full-featured form with rich text editor for content management
 * Features include:
 * - Rich text editor with Lexical
 * - Category selection with MultiCategorySelector
 * - Profile selection for content generation
 * - Type selection (PAGE/SNIPPET)
 * - Validation and error handling
 * 
 * @component
 */
function ContentFormModal({ 
  content, 
  onClose, 
  onSave 
}: ContentFormModalProps) {
  const [formData, setFormData] = useState({
    title: content?.title || '',
    type: content?.type || 'SNIPPET',
    categories: content?.categories || [],
    content: content?.content || '',
    profileId: content?.profileId || ''
  })

  const [profiles, setProfiles] = useState<ProfileWithCreator[]>([])
  const [isLoading, setIsLoading] = useState(false)
  // REMOVED: editorKey state that was causing re-mounts
  const [editorState, setEditorState] = useState<SerializedEditorState | undefined>()

  // Update formData when content changes
  useEffect(() => {
    if (content) {
      setFormData({
        title: content.title || '',
        type: content.type || 'SNIPPET',
        categories: content.categories || [],
        content: content.content || '',
        profileId: content.profileId || ''
      })
      
      // Clear editor state and let initialValue handle content loading
      setEditorState(undefined)
    } else {
      // New content - reset editor
      setEditorState(undefined)
    }
  }, [content])

  useEffect(() => {
    fetchProfiles()

    // Subscribe to profile events for synchronization
    const unsubscribeCreated = profileEvents.subscribe('profile-created', () => {
      fetchProfiles() // Reload list when profile is created
    })

    const unsubscribeUpdated = profileEvents.subscribe('profile-updated', () => {
      fetchProfiles() // Reload list when profile is updated
    })

    const unsubscribeDeleted = profileEvents.subscribe('profile-deleted', () => {
      fetchProfiles() // Reload list when profile is deleted
    })

    // Cleanup - unsubscribe when component unmounts
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
      console.error('Error loading profiles:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)


    try {
      const url = content ? '/api/content' : '/api/content'
      const method = content ? 'PUT' : 'POST'
      
      // SIMPLIFIED: Convert editor state to HTML or use existing content
      const contentToSave = editorState ? serializedStateToHtml(editorState) : formData.content
      
      const bodyData = content ? 
        { ...formData, content: contentToSave, id: content.id } : 
        { ...formData, content: contentToSave }


      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyData)
      })

      if (response.ok) {
        const savedData = await response.json()
        onSave()
        onClose()
      } else {
        const errorData = await response.json()
        console.error('Content save error:', errorData)
        alert('Error saving content')
      }
    } catch (error) {
      console.error('Content save exception:', error)
      alert('Error saving content')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-[80%] max-w-6xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">
          {content ? 'Edit Content' : 'New Content'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              className="w-full px-3 py-2 border rounded-md"
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value as any})}
            >
              <option value="SNIPPET">Snippet</option>
              <option value="PAGE">Page</option>
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
            <label className="block text-sm font-medium mb-1">Profile</label>
            <select
              className="w-full px-3 py-2 border rounded-md"
              value={formData.profileId}
              onChange={(e) => setFormData({...formData, profileId: e.target.value})}
              required
            >
              <option value="">Select profile</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Content</label>
            <div className="mt-2" onClick={(e) => e.stopPropagation()}>
              <Editor
                initialValue={formData.content}
                onSerializedChange={setEditorState}
                placeholder="Write or edit content here..."
              />
            </div>
          </div>


          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}