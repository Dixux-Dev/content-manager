import { ContentForm } from "@/components/content-form"
import { AuthenticatedLayout } from "@/components/layouts/authenticated-layout"
import { getAuthSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function GeneratorPage() {
  const session = await getAuthSession()
  
  // El middleware se encarga de la redirección
  // pero lo mantenemos como respaldo
  if (!session) {
    redirect("/login")
  }
  
  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Generador de Contenido</h1>
          <p className="text-muted-foreground mt-2">
            Crea contenido único utilizando perfiles de IA personalizados
          </p>
        </div>
        
        <ContentForm />
      </div>
    </AuthenticatedLayout>
  )
}