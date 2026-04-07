import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  
  const token = ""
  // ↑ cherche dans les cookies du navigateur
  // un cookie qui s'appelle "session"
  
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
    // ↑ si pas de cookie → redirige vers /login
    // l'utilisateur n'atteint jamais la page demandée
  }
  
  // si on arrive ici = token existe → laisse passer
  return NextResponse.next()
}

export const config = {
  matcher: ['/home/:path*', '/rules/:path*', '/lose/:path*', '/wining/:path*']
  // ↑ ce middleware ne s'active QUE sur ces routes
  // /login, /signup, /about... ne sont pas concernés
}