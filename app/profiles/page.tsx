import { ProfileForm } from "@/components/profile-form"
import { AuthenticatedLayout } from "@/components/layouts/authenticated-layout"
import { getAuthSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { hasPermission, UserRole } from "@/lib/permissions"

export default async function ProfilesPage() {
  const session = await getAuthSession()
  
  if (!session) {
    redirect("/login")
  }
  
  const userRole = session.user.role as UserRole
  
  // Check if user has permission to read profiles
  if (!hasPermission(userRole, 'PROFILE_READ')) {
    redirect("/")
  }
  
  return (
    <AuthenticatedLayout>
      <ProfileForm />
    </AuthenticatedLayout>
  )
}