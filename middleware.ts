import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: "/login",
  },
})

// Proteger rutas específicas incluida la raíz
export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/generator/:path*", 
    "/profiles/:path*",
    "/admin/:path*"
  ],
}