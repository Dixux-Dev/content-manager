import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { AuthenticatedLayout } from "@/components/layouts/authenticated-layout"
import { UserManagement } from "@/components/user-management"
import { hasPermission, UserRole } from "@/lib/permissions"

export default async function UsersPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/login")
  }
  
  const userRole = session.user.role as UserRole
  
  // Check if user has permission to access user management
  if (!hasPermission(userRole, 'USER_READ')) {
    redirect("/")
  }
  
  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage user accounts and permissions
          </p>
        </div>
        
        <UserManagement />
      </div>
    </AuthenticatedLayout>
  )
}