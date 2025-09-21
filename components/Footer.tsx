import { Logo } from '@/components/logo'
import Link from 'next/link'

const links = [
  {
    group: 'Product',
    items: [
      { title: 'Features', href: '#' },
      { title: 'Solution', href: '#' },
      { title: 'Customers', href: '#' },
      { title: 'Pricing', href: '#' },
      { title: 'Help', href: '#' },
      { title: 'About', href: '#' },
    ],
  },
  {
    group: 'Solution',
    items: [
      { title: 'Startup', href: '#' },
      { title: 'Freelancers', href: '#' },
      { title: 'Organizations', href: '#' },
      { title: 'Students', href: '#' },
      { title: 'Collaboration', href: '#' },
      { title: 'Design', href: '#' },
      { title: 'Management', href: '#' },
    ],
  },
  {
    group: 'Company',
    items: [
      { title: 'About', href: '#' },
      { title: 'Careers', href: '#' },
      { title: 'Blog', href: '#' },
      { title: 'Press', href: '#' },
      { title: 'Contact', href: '#' },
      { title: 'Help', href: '#' },
    ],
  },
  {
    group: 'Legal',
    items: [
      { title: 'Licence', href: '#' },
      { title: 'Privacy', href: '#' },
      { title: 'Cookies', href: '#' },
      { title: 'Security', href: '#' },
    ],
  },
]

export default function FooterSection() {
  return (
    <footer className="border-b border-sidebar bg-sidebar pt-20 text-sidebar-foreground">
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid gap-12 md:grid-cols-5">
          <div className="md:col-span-2">
            <Link href="/" aria-label="go home" className="block size-fit">
              <Logo />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 md:col-span-3">
            {links.map((link, index) => (
              <div key={index} className="space-y-4 text-sm">
                <span className="block font-medium">{link.group}</span>
                {link.items.map((item, idx) => (
                  <Link
                    key={idx}
                    href={item.href}
                    className="text-muted-foreground hover:text-sidebar-accent block duration-150"
                  >
                    {item.title}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-end justify-between gap-6 border-t border-sidebar py-6">
          <span className="text-muted-foreground order-last block text-center text-sm md:order-first">
            © {new Date().getFullYear()} Tailark, All rights reserved
          </span>

          <div className="order-first flex flex-wrap justify-center gap-6 text-sm md:order-last">
            {/* Example social icons */}
            {[
              { href: '#', label: 'Twitter' },
              { href: '#', label: 'LinkedIn' },
              { href: '#', label: 'Facebook' },
            ].map((item, idx) => (
              <Link
                key={idx}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={item.label}
                className="text-muted-foreground hover:text-sidebar-accent block"
              >
                <svg
                  className="size-6"
                  xmlns="http://www.w3.org/2000/svg"
                  width="1em"
                  height="1em"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="M10 10h4v4h-4z"
                  />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
