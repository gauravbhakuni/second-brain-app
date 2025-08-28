// components/Footer.tsx
import Link from "next/link";
import { Button } from "./ui/button";
import { Twitter, Github, Linkedin, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-black border-t border-gray-800 text-gray-200">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand + short */}
          <div className="space-y-4">
            <span className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Second Brain
            </span>

            <p className="text-sm text-gray-400 max-w-sm">
              A private, unified place for everything you want to remember —
              notes, links, files, videos and selective sharing. Fast, simple,
              and secure.
            </p>

            <div className="flex items-center gap-3 pt-1">
              <a href="#" aria-label="Twitter" className="p-2 rounded-md hover:bg-white/5">
                <Twitter className="h-5 w-5 text-gray-300" />
              </a>
              <a href="#" aria-label="GitHub" className="p-2 rounded-md hover:bg-white/5">
                <Github className="h-5 w-5 text-gray-300" />
              </a>
              <a href="#" aria-label="LinkedIn" className="p-2 rounded-md hover:bg-white/5">
                <Linkedin className="h-5 w-5 text-gray-300" />
              </a>
              <a href="mailto:hello@secondbrain.app" aria-label="Email" className="p-2 rounded-md hover:bg-white/5">
                <Mail className="h-5 w-5 text-gray-300" />
              </a>
            </div>
          </div>

          {/* Link groups */}
          <div className="grid grid-cols-2 gap-8 md:col-span-1 lg:col-span-1">
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/features" className="hover:text-white">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/how-it-works" className="hover:text-white">How it works</Link></li>
                <li><Link href="/demo" className="hover:text-white">Demo</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/careers" className="hover:text-white">Careers</Link></li>
                <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-semibold text-gray-300">Get started</h4>
              <p className="text-sm text-gray-400 mt-1">
                Create your Second Brain and start capturing ideas — free forever.
              </p>
            </div>
            <div className="mt-4">
              <Button className="rounded-xl px-4 py-2 w-fit">Sign up</Button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-500">
            © {new Date().getFullYear()} Second Brain — Built with care.
          </div>

          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-sm text-gray-400 hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-gray-400 hover:text-white">
              Terms
            </Link>
            <Link href="/status" className="text-sm text-gray-400 hover:text-white">
              Status
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
