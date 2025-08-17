"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Edit, Trash2, UserPlus, Shield, Eye, PenTool } from "lucide-react"
import { UserRole, hasPermission } from "@/lib/permissions"

interface User {
  id: string
  name: string | null
  email: string
  role: UserRole
  createdAt: string
  updatedAt: string
}

const roleIcons = {
  ADMIN: Shield,
  EDITOR: PenTool,
  VIEWER: Eye
}

const roleColors = {
  ADMIN: "bg-red-100 text-red-800",
  EDITOR: "bg-blue-100 text-blue-800", 
  VIEWER: "bg-gray-100 text-gray-800"
}

export function UserManagement() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const userRole = session?.user?.role as UserRole
  const canEdit = hasPermission(userRole, 'USER_UPDATE')
  const canDelete = hasPermission(userRole, 'USER_DELETE')
  const canChangeRole = hasPermission(userRole, 'USER_CHANGE_ROLE')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setIsModalOpen(true)
  }

  const handleSaveUser = async () => {
    if (!editingUser) return

    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: editingUser.id,
          name: editingUser.name,
          role: editingUser.role
        })
      })

      if (response.ok) {
        await fetchUsers()
        setIsModalOpen(false)
        setEditingUser(null)
        
        // If the updated user is the current user, trigger a session update
        if (editingUser.id === session?.user?.id) {
          // Update the session with new role
          await update({
            user: {
              ...session.user,
              role: editingUser.role
            }
          })
          // Refresh the page to ensure all components get updated permissions
          router.refresh()
        }
        
        // Show success message
        alert('User updated successfully. The user may need to refresh their page to see role changes.')
      } else {
        const error = await response.json()
        alert(error.error || 'Error updating user')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Error updating user')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    setIsDeleting(userId)
    try {
      const response = await fetch(`/api/users?id=${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchUsers()
      } else {
        const error = await response.json()
        alert(error.error || 'Error deleting user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Error deleting user')
    } finally {
      setIsDeleting(null)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div>Loading users...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => {
          const RoleIcon = roleIcons[user.role]
          const isCurrentUser = session?.user?.id === user.id
          
          return (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{user.name || 'No Name'}</CardTitle>
                  <Badge className={roleColors[user.role]}>
                    <RoleIcon className="w-3 h-3 mr-1" />
                    {user.role}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex justify-end gap-2">
                  {canEdit && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditUser(user)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  )}
                  {canDelete && !isCurrentUser && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={isDeleting === user.id}
                      className="text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      {isDeleting === user.id ? 'Deleting...' : 'Delete'}
                    </Button>
                  )}
                </div>
                {isCurrentUser && (
                  <p className="text-xs text-blue-600 mt-2">This is your account</p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {users.length === 0 && !isLoading && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-muted-foreground">
              <UserPlus className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No users found</p>
              <p className="text-sm">Users will appear here when they register</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit User Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and permissions
            </DialogDescription>
          </DialogHeader>

          {editingUser && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={editingUser.name || ''}
                  onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                  placeholder="User's full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={editingUser.email}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>

              {canChangeRole && (
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({...editingUser, role: e.target.value as UserRole})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="ADMIN">Admin - Full access</option>
                    <option value="EDITOR">Editor - Content and profiles</option>
                    <option value="VIEWER">Viewer - Read only</option>
                  </select>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}