import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: "/login",
  },
})

// Protect specific routes including root and API endpoints
export const config = {
  matcher: [
    "/",
    "/dashboard",
    "/generator", 
    "/profiles",
    "/users",
    "/api/((?!auth).*)" // Protect all API routes except auth
  ],
}