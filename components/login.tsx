'use client';

import { LogoIcon } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError("");
        const form = e.currentTarget;
        const email = (form.email as HTMLInputElement).value;
        const password = (form.pwd as HTMLInputElement).value;
        const res = await signIn("credentials", {
            redirect: false,
            email,
            password,
        });
        setLoading(false);
        if (res?.error) {
            setError(res.error);
        } else {
            // Poll for session update (max 3s)
            let attempts = 0;
            const maxAttempts = 15;
            const pollSession = async () => {
                const session = await getSession();
                if (session?.user?.emailVerified) {
                    router.push("/dashboard");
                } else if (session?.user) {
                    router.push("/verify");
                } else if (attempts < maxAttempts) {
                    attempts++;
                    setTimeout(pollSession, 200);
                } else {
                    setError("Session could not be established. Please try again.");
                }
            };
            pollSession();
        }
    }



    return (
        <section className="flex min-h-screen px-4 py-16 md:py-32 bg-transparent">
            <form
                onSubmit={handleSubmit}
                className="bg-muted m-auto h-fit w-full max-w-sm overflow-hidden rounded-[calc(var(--radius)+.125rem)] border shadow-md shadow-zinc-950/5 [--color-muted:var(--color-zinc-900)]"
            >
                <div className="bg-card -m-px rounded-[calc(var(--radius)+.125rem)] border p-8 pb-6">
                    <div className="text-center">
                        <Link href="/" aria-label="go home" className="mx-auto block w-fit">
                            <LogoIcon />
                        </Link>
                        <h1 className="mb-1 mt-4 text-xl font-semibold">Sign In to Second Brain</h1>
                        <p className="text-sm">Welcome back! Sign in to continue</p>
                    </div>

                    <div className="mt-6 space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="block text-sm">
                                Email
                            </Label>
                            <Input type="email" required name="email" id="email" />
                        </div>

                        <div className="space-y-0.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="pwd" className=" text-sm">
                                    Password
                                </Label>
                                <Button asChild variant="link" size="sm">
                                    <Link href="#" className="link intent-info variant-ghost text-sm">
                                        Forgot your Password ?
                                    </Link>
                                </Button>
                            </div>
                            <Input
                                type="password"
                                required
                                name="pwd"
                                id="pwd"
                                className="input sz-md variant-mixed"
                            />
                        </div>

                        <Button className="w-full" type="submit" disabled={loading}>
                            {loading ? "Signing In..." : "Sign In"}
                        </Button>
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    </div>


                </div>

                <div className="p-3">
                    <p className="text-accent-foreground text-center text-sm">
                        Don&apos;t have an account ?
                        <Button asChild variant="link" className="px-2">
                            <Link href="/signup">Create account</Link>
                        </Button>
                    </p>
                </div>
            </form>
        </section>
    );
}
