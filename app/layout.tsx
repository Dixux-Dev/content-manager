import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Sidebar } from "@/components/sidebar"
import { AuthProvider } from "@/components/providers/auth-provider"
import { SimpleSyntaxHighlighter } from "@/components/simple-syntax-highlighter"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Content Manager",
  description: "AI content generator and manager",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <SimpleSyntaxHighlighter />
        </AuthProvider>
      </body>
    </html>
  )
}