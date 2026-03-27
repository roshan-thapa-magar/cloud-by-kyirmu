import Link from "next/link"
import { Instagram, Facebook, Mail, Coffee, Heart } from "lucide-react"
import { FaTiktok } from "react-icons/fa"

export function Footer() {
  const currentYear = new Date().getFullYear()

  const footerSections = [
    {
      title: "Product",
      links: [
        { label: "Features", href: "#" },
        { label: "Pricing", href: "#" },
        { label: "Security", href: "#" },
        { label: "Enterprise", href: "#" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "#" },
        { label: "Blog", href: "#" },
        { label: "Careers", href: "#" },
        { label: "Press", href: "#" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Documentation", href: "#" },
        { label: "Community", href: "#" },
        { label: "API Reference", href: "#" },
        { label: "Support", href: "#" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy", href: "#" },
        { label: "Terms", href: "#" },
        { label: "Cookies", href: "#" },
        { label: "License", href: "#" },
      ],
    },
  ]

  const socialLinks = [
    { icon: Instagram, href: "#", label: "Instagram", color: "hover:text-pink-600" },
    { icon: Facebook, href: "#", label: "Facebook", color: "hover:text-blue-600" },
    { icon: FaTiktok, href: "#", label: "TikTok", color: "hover:text-black dark:hover:text-white" },
    { icon: Mail, href: "mailto:info@example.com", label: "Email", color: "hover:text-amber-600" },
  ]

  return (
    <footer className="relative border-t border-border bg-gradient-to-b from-background to-secondary/5 mt-12 md:mt-16 overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-0 left-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        {/* Main footer content */}
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5 mb-12">
          {/* Brand section - Enhanced */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center gap-3 group">
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 group-hover:shadow-xl">
                <span className="text-primary-foreground font-bold text-sm">KC</span>
                <Coffee className="absolute -top-1 -right-1 w-3 h-3 text-amber-400" />
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight">KYIRMU CAFE</span>
                <p className="text-xs text-muted-foreground">Est. 2026</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Crafting exceptional digital experiences with modern technology and artisanal attention to detail.
            </p>

            {/* Social links with hover effects */}
            <div className="flex gap-3 pt-2">
              {socialLinks.map((social) => {
                const Icon = social.icon
                return (
                  <Link
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className={`relative p-2 rounded-lg bg-secondary/50 text-muted-foreground ${social.color} transition-all duration-300 hover:scale-110 hover:shadow-md group`}
                  >
                    <Icon className="w-4 h-4 transition-transform group-hover:rotate-6" />
                    <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-background px-2 py-1 rounded-full border border-border shadow-sm">
                      {social.label}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Footer sections - Enhanced */}
          {footerSections.map((section) => (
            <div key={section.title} className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground/80">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-all duration-200 hover:translate-x-1 inline-block group"
                    >
                      <span className="relative">
                        {link.label}
                        <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-primary group-hover:w-full transition-all duration-300" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom section - Enhanced */}
        <div className="relative border-t border-border/60 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
          {/* Decorative line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

          <p className="text-muted-foreground text-center sm:text-left flex flex-wrap items-center justify-center gap-1">
            <span>&copy; {currentYear} Cloud by Kyirmu. All rights reserved.</span>
            <span className="hidden sm:inline mx-2">•</span>
            <span className="flex items-center gap-1">
              Developed with <Heart className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" /> by
              <span className="font-semibold text-foreground bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Roshan Thapa Magar
              </span>
            </span>
            <span className="hidden sm:inline mx-2">•</span>
            <a href="tel:+9779742531161" className="hover:text-foreground transition-colors flex items-center gap-1">
              <span className="text-xs">📞</span> +977 9742531161
            </a>
          </p>

          <div className="flex gap-6">
            <Link
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors text-sm relative group"
            >
              Sitemap
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary group-hover:w-full transition-all duration-300" />
            </Link>
            <Link
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors text-sm relative group"
            >
              Status
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary group-hover:w-full transition-all duration-300" />
            </Link>
            <Link
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors text-sm relative group"
            >
              Contact
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary group-hover:w-full transition-all duration-300" />
            </Link>
          </div>
        </div>

        {/* Badge */}
        <div className="absolute bottom-4 right-4 opacity-70 hover:opacity-100 transition-opacity">
          <div className="text-[10px] text-muted-foreground bg-secondary/30 px-2 py-1 rounded-full border border-border/50 flex items-center gap-1">
            <span className="w-1 h-1 bg-primary rounded-full" />
            Kathmandu, Nepal  {/* More complete location */}
          </div>
        </div>
      </div>
    </footer>
  )
}