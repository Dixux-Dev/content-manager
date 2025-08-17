import { ContentTable } from "@/components/content-table"
import { AuthenticatedLayout } from "@/components/layouts/authenticated-layout"
import { getAuthSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function HomePage() {
  const session = await getAuthSession()
  
  if (!session) {
    redirect("/login")
  }
  
  const userRole = session.user.role as 'ADMIN' | 'VIEWER'
  
  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Content Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome, {session.user.name || session.user.email}! Manage and generate AI content easily.
          </p>
        </div>
        
        <ContentTable userRole={userRole} />
      </div>
    </AuthenticatedLayout>
  )
}