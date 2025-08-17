"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, RefreshCw } from "lucide-react"

/**
 * Component that monitors for role changes and prompts user to refresh
 * @description Periodically checks if the user's role has been updated by an admin
 * and displays a notification prompting them to refresh their session
 */
export function RoleMonitor() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [roleChanged, setRoleChanged] = useState(false)
  const [newRole, setNewRole] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    if (!session?.user) return

    // Check for role changes every 30 seconds
    const checkRole = async () => {
      try {
        const response = await fetch('/api/auth/check-role')
        if (response.ok) {
          const data = await response.json()
          if (data.hasChanged) {
            setRoleChanged(true)
            setNewRole(data.currentRole)
          }
        }
      } catch (error) {
        console.error('Error checking role:', error)
      }
    }

    // Initial check
    checkRole()

    // Set up interval for periodic checks
    const interval = setInterval(checkRole, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [session])

  const handleRefreshSession = async () => {
    setIsRefreshing(true)
    try {
      // Update the session with the new role
      await update({
        user: {
          ...session?.user,
          role: newRole
        }
      })
      
      // Refresh the router to update all components
      router.refresh()
      
      // Reload the page to ensure complete refresh
      window.location.reload()
    } catch (error) {
      console.error('Error refreshing session:', error)
      alert('Error refreshing session. Please try logging out and back in.')
    } finally {
      setIsRefreshing(false)
    }
  }

  if (!roleChanged) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Card className="border-yellow-500 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-yellow-700">
            <AlertCircle className="h-5 w-5" />
            Permission Update Detected
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Your permissions have been updated to <strong>{newRole}</strong>. 
            Please refresh your session to apply the changes.
          </p>
          <Button 
            onClick={handleRefreshSession}
            disabled={isRefreshing}
            className="w-full"
          >
            {isRefreshing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Session
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}