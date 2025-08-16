"use client"

import { Sidebar } from "@/components/sidebar"
import { useAuth } from "@/hooks/use-auth"
import { ReactNode } from "react"

interface AuthenticatedLayoutProps {
  children: ReactNode
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { isLoading } = useAuth(true)

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="h-full flex">
      <div className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-50 bg-gray-900">
        <Sidebar />
      </div>
      <main className="md:pl-72 flex-1">
        <div className="px-4 py-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}