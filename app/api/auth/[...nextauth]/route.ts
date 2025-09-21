
import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma"
import { compare } from "bcryptjs"

// Extend the session and user types to include id and emailVerified
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      emailVerified: Date | null
      name?: string | null
      image?: string | null
    }
  }
  interface User {
    id: string
    email: string
    emailVerified: Date | null
    name?: string | null
    image?: string | null
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials")
        }
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })
        if (!user || !user.passwordHash) {
          throw new Error("Invalid credentials")
        }
        const isValid = await compare(credentials.password, user.passwordHash)
        if (!isValid) throw new Error("Invalid credentials")
        // Only return the fields needed for the JWT session
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: user.emailVerified,
          image: user.avatarUrl || null, // Map avatarUrl to image for NextAuth compatibility
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
  async jwt({ token, user }) {
    if (user && user.email) {
      // On login
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { emailVerified: true, avatarUrl: true, name: true },
      });
      token.emailVerified = dbUser?.emailVerified ?? null;
      token.image = dbUser?.avatarUrl || null;
      token.name = dbUser?.name || user.name || null; // <-- add this
    } else if (token.email) {
      // On session refresh
      const dbUser = await prisma.user.findUnique({
        where: { email: token.email },
        select: { emailVerified: true, avatarUrl: true, name: true },
      });
      token.emailVerified = dbUser?.emailVerified ?? null;
      token.image = dbUser?.avatarUrl || null;
      token.name = dbUser?.name || token.name || null; // <-- add this
    }
    return token;
  },

  async session({ session, token }) {
    if (session.user) {
      session.user.id = typeof token.sub === "string" ? token.sub : "";
      session.user.emailVerified =
        typeof token.emailVerified === "string" || token.emailVerified instanceof Date
          ? (token.emailVerified as Date | null)
          : null;
      session.user.image = typeof token.image === "string" ? token.image : undefined;
      session.user.name = typeof token.name === "string" ? token.name : session.user.name; // <-- add this
    }
    return session;
  },
},
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
