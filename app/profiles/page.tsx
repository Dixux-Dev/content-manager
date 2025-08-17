import { ProfileForm } from "@/components/profile-form"
import { AuthenticatedLayout } from "@/components/layouts/authenticated-layout"
import { getAuthSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function ProfilesPage() {
  const session = await getAuthSession()
  
  if (!session) {
    redirect("/login")
  }
  
  // Only admins can manage profiles
  if (session.user.role !== "ADMIN") {
    redirect("/")
  }
  
  return (
    <AuthenticatedLayout>
      <ProfileForm />
    </AuthenticatedLayout>
  )
}