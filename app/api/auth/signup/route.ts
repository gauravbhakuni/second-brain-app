import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";

export async function POST(req: Request) {
	try {
		const { name, email, password } = await req.json();
		if (!name || !email || !password) {
			return NextResponse.json({ message: "Missing fields" }, { status: 400 });
		}
		// Check if user already exists
		const existing = await prisma.user.findUnique({ where: { email } });
		if (existing) {
			return NextResponse.json({ message: "Email already in use" }, { status: 400 });
		}
		// Hash password
		const passwordHash = await hash(password, 10);
		// Create user
		await prisma.user.create({
			data: {
				name,
				email,
				passwordHash,
			},
		});
		return NextResponse.json({ message: "Signup successful" }, { status: 201 });
	} catch {
		return NextResponse.json({ message: "Server error" }, { status: 500 });
	}
}
