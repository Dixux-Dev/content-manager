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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Perfiles de Generación</h1>
          <p className="text-muted-foreground mt-2">
            Configura perfiles personalizados para diferentes tipos de contenido
          </p>
        </div>
        
        <ProfileForm />
      </div>
    </AuthenticatedLayout>
  )
}