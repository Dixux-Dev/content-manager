"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function useAuth(requireAuth: boolean = true) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (requireAuth && status === "unauthenticated") {
      router.push("/login")
    }
  }, [requireAuth, status, router])

  return {
    user: session?.user,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    role: session?.user?.role,
  }
}

export function useRequireAuth() {
  const { user, isLoading } = useAuth(true)
  return { user, isLoading }
}

export function useRequireAdmin() {
  const { user, role, isLoading } = useAuth(true)
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && role !== "ADMIN") {
      router.push("/")
    }
  }, [role, isLoading, router])

  return { user, isLoading, isAdmin: role === "ADMIN" }
}