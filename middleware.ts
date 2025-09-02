import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const isAuthPage = req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/signup")

  // If user is not logged in
  if ((!token || !token.email) && req.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // If user is logged in but not verified, redirect to /verify
  if (token && token.email && !token.emailVerified && req.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/verify", req.url))
  }

  // If user is logged in and visiting /login, redirect to dashboard
  if (token && token.email && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
}
