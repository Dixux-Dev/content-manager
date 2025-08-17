import { ContentForm } from "@/components/content-form"
import { AuthenticatedLayout } from "@/components/layouts/authenticated-layout"
import { getAuthSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function GeneratorPage() {
  const session = await getAuthSession()
  
  // Middleware handles redirection
  // but we keep this as backup
  if (!session) {
    redirect("/login")
  }
  
  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Content Generator</h1>
          <p className="text-muted-foreground mt-2">
            Create unique content using personalized AI profiles
          </p>
        </div>
        
        <ContentForm />
      </div>
    </AuthenticatedLayout>
  )
}