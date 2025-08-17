import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Sidebar } from "@/components/sidebar"
import { AuthProvider } from "@/components/providers/auth-provider"
import { SimpleSyntaxHighlighter } from "@/components/simple-syntax-highlighter"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Content Manager",
  description: "Generador y gestor de contenido con IA",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <SimpleSyntaxHighlighter />
        </AuthProvider>
      </body>
    </html>
  )
}