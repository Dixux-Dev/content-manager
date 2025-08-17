import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: "/login",
  },
})

// Protect specific routes including root
export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/generator/:path*", 
    "/profiles/:path*",
    "/admin/:path*"
  ],
}