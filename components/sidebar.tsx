"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { 
  Home, 
  FileText, 
  Settings, 
  User,
  PlusCircle,
  List,
  LogOut
} from "lucide-react"
import { Button } from "@/components/ui/button"

const routes = [
  {
    label: "Content",
    icon: Home,
    href: "/",
    color: "text-sky-500",
  },
  {
    label: "Generator",
    icon: PlusCircle,
    href: "/generator",
    color: "text-violet-500",
  },
  {
    label: "Profiles",
    icon: User,
    href: "/profiles",
    color: "text-pink-700",
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session, status } = useSession()

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" })
  }

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-gray-900 text-white">
      <div className="px-3 py-2 flex-1">
        <Link href="/" className="flex items-center pl-3 mb-14">
          <div className="relative w-8 h-8 mr-4">
            <FileText className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold">
            Content Manager
          </h1>
        </Link>
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                pathname === route.href ? "text-white bg-white/10" : "text-zinc-400",
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                {route.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
      
      {status === "authenticated" && session?.user && (
        <div className="px-3 py-4 border-t border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">
                  {session.user.name || session.user.email}
                </p>
                <p className="text-xs text-gray-400">
                  {session.user.role}
                </p>
              </div>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-gray-400 hover:text-white hover:bg-white/10"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      )}
    </div>
  )
}