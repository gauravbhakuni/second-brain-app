import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const { avatarUrl } = await request.json();
    if (!avatarUrl) {
      return NextResponse.json({ message: "Missing avatarUrl" }, { status: 400 });
    }
    await prisma.user.update({
      where: { email: token.email },
      data: { avatarUrl },
    });
    return NextResponse.json({ message: "Avatar updated successfully" }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
