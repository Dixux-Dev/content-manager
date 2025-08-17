"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { SerializedEditorState } from "lexical"
import { Save, Plus, Edit, Trash2, Eye } from "lucide-react"
import { Editor } from "@/components/editor/editor"
import { profileEvents } from "@/lib/profile-events"
import { serializedStateToText, isEditorEmpty, htmlToSerializedState, serializedStateToHtml } from "@/lib/editor-utils"
import { ProfileWithCreator } from "@/types"
import { getProfilePermissions, UserRole } from "@/lib/permissions"
import { ProfileViewerModal } from "@/components/profile-viewer-modal"

/**
 * Profile management form component
 * @description Complete profile management interface for creating, editing, and deleting AI generation profiles
 * Features include:
 * - Grid layout showing existing profiles
 * - Modal form for creating/editing profiles
 * - Rich text editor for prompt editing
 * - Real-time synchronization with other components
 * - Profile deletion with confirmation
 * - Empty state for first-time users
 * 
 * @component
 * @example
 * ```tsx
 * <ProfileForm />
 * ```
 */
export function ProfileForm() {
  const { data: session } = useSession()
  const userRole = session?.user?.role as UserRole
  const permissions = getProfilePermissions(userRole)
  
  const [profiles, setProfiles] = useState<ProfileWithCreator[]>([])
  const [editingProfile, setEditingProfile] = useState<ProfileWithCreator | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    prompt: ""
  })
  const [promptEditorState, setPromptEditorState] = useState<SerializedEditorState | undefined>()
  const [viewingProfile, setViewingProfile] = useState<ProfileWithCreator | null>(null)

  // Load profiles from API
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
      console.error('Error loading profiles:', error)
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
      
      // Convert editor state to HTML to preserve styles
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
        
        // Emit event for synchronization
        if (editingProfile) {
          profileEvents.profileUpdated(savedProfile)
        } else {
          profileEvents.profileCreated(savedProfile)
        }
        
        // Clear form and close modal
        setFormData({
          name: "",
          description: "",
          prompt: ""
        })
        setEditingProfile(null)
        setPromptEditorState(undefined)
        setIsModalOpen(false)
      } else {
        alert('Error saving profile')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Error saving profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = (profile: ProfileWithCreator) => {
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
    if (!confirm('Are you sure you want to delete this profile?')) {
      return
    }

    try {
      const response = await fetch(`/api/profiles?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchProfiles() // Recargar la lista
        
        // Emit event for synchronization
        profileEvents.profileDeleted(id)
      } else {
        const error = await response.json()
        alert(error.error || 'Error deleting profile')
      }
    } catch (error) {
      console.error('Error deleting profile:', error)
      alert('Error deleting profile')
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div>Loading profiles...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Button to create new profile */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Generation Profiles</h1>
          <p className="text-muted-foreground mt-1">
            Manage your content profiles from here
          </p>
        </div>
        {permissions.canCreate && (
          <Button onClick={handleCreateNew}>
            <Plus className="mr-2 h-4 w-4" />
            New Profile
          </Button>
        )}
      </div>

      {/* Grid of profile cards */}
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
                  onClick={() => setViewingProfile(profile)}
                  title="View profile"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                {permissions.canUpdate && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(profile)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                )}
                {permissions.canDelete && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(profile.id)}
                    className="text-red-600 hover:text-red-700 hover:border-red-300"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                )}
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
              <p className="text-lg font-medium mb-2">No profiles created</p>
              <p className="text-sm mb-4">Create your first generation profile to get started</p>
              <Button onClick={handleCreateNew}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal for form */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProfile ? "Edit Profile" : "Create New Profile"}
            </DialogTitle>
            <DialogDescription>
              Profiles define how content is generated using custom prompts
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Profile Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., SEO Optimized Blog"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Brief profile description"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="prompt">Master Prompt</Label>
              <div className="mt-2">
                <Editor
                  key={editingProfile?.id || 'new-profile'}
                  initialValue={formData.prompt}
                  onSerializedChange={(state) => {
                    setPromptEditorState(state)
                    const htmlContent = serializedStateToHtml(state)
                    setFormData({...formData, prompt: htmlContent})
                  }}
                  placeholder="Define the main instructions for content generation..."
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
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!formData.name || !formData.prompt || isSaving}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : editingProfile ? "Update" : "Save"} Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View profile modal */}
      {viewingProfile && (
        <ProfileViewerModal
          profile={viewingProfile}
          onClose={() => setViewingProfile(null)}
        />
      )}
    </div>
  )
}