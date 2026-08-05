import { Link, useRouterState } from "@tanstack/react-router";
import { Facebook, Instagram, Linkedin, Youtube } from "lucide-react";
import { collections } from "@/lib/products";
import { useLead } from "@/lib/lead";

export function SiteFooter() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname.startsWith("/admin")) return null;

  const { openQuery } = useLead();

  return (
    <footer className="relative bg-[#1c1712] text-white pt-16 md:pt-24 px-4 sm:px-6 md:px-12 pb-8 overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#c69c63_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="relative mx-auto max-w-7xl">
        {/* Top Header CTA Row */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between pb-12 md:pb-16 px-2">
          <h2 className="font-sans text-3xl font-light tracking-tight sm:text-4xl md:text-5xl max-w-xl leading-tight">
            Ready to Start Your Interior Design Project?
          </h2>
          <button
            type="button"
            onClick={() => openQuery()}
            className="w-fit rounded-full border border-white/40 bg-white px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#1c1712] transition-all hover:bg-[#eee4d8] hover:border-white cursor-pointer shrink-0"
          >
            Contact Us
          </button>
        </div>

        {/* Floating White Card */}
        <div className="rounded-3xl bg-[#fcfaf5] text-[#28251f] p-8 md:p-14 shadow-2xl">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr_1fr_1fr] pb-12 border-b border-[#e2dacd]">
            {/* Left Column: Brand, Contact & Socials */}
            <div>
              <Link to="/" className="flex items-center gap-3 mb-6 group">
                <img
                  src="/logo.png"
                  alt="Vensai Global"
                  className="h-11 sm:h-12 w-auto object-contain transition-transform group-hover:scale-[1.02]"
                />
                <div className="flex flex-col text-left leading-none">
                  <span className="font-display font-bold text-lg sm:text-xl tracking-[0.16em] uppercase text-[#1c1712]">
                    VENSAI GLOBAL
                  </span>
                </div>
              </Link>

              <div className="space-y-2 text-sm text-[#4a443b] font-medium">
                <p>
                  <a href="https://wa.me/919059099792" target="_blank" rel="noopener noreferrer" className="hover:text-[#96754b] transition-colors">
                    +91 90590 99792 (WhatsApp)
                  </a>
                </p>
                <p>
                  <a href="mailto:hello@vensai.in" className="hover:text-[#96754b] transition-colors">
                    hello@vensai.in
                  </a>
                </p>
                <p className="text-xs text-[#787063] pt-1">
                  Chennai · Hyderabad · Bengaluru, India
                </p>
              </div>

              {/* Social Icon Square Buttons */}
              <div className="mt-6 flex gap-2">
                {[
                  { icon: Instagram, label: "Instagram", href: "#" },
                  { icon: Facebook, label: "Facebook", href: "#" },
                  { icon: Linkedin, label: "LinkedIn", href: "#" },
                  { icon: Youtube, label: "YouTube", href: "#" },
                ].map(({ icon: Icon, label, href }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    className="grid h-9 w-9 place-items-center rounded-lg border border-[#d8d0c2] bg-white text-[#4a443b] transition-all hover:border-[#96754b] hover:bg-[#96754b] hover:text-white"
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.5} />
                  </a>
                ))}
              </div>

              <div className="mt-8 space-y-1 text-[0.72rem] text-[#8c8273] leading-relaxed">
                <p>© Copyright {new Date().getFullYear()} Vensai Global. All rights reserved.</p>
                <p>
                  Design &amp; Developed by{" "}
                  <a
                    href="https://www.viscano.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-[#28251f] hover:text-[#96754b] underline underline-offset-2 transition-colors"
                  >
                    Viscano
                  </a>
                </p>
              </div>
            </div>

            {/* Column 1: Pages */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[#8c8273]">
                Pages
              </h3>
              <ul className="mt-4 space-y-2.5 text-xs text-[#4a443b] font-medium">
                <li>
                  <Link to="/" className="hover:text-[#96754b] transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/products" className="hover:text-[#96754b] transition-colors">
                    Products
                  </Link>
                </li>
                <li>
                  <Link to="/catalogues" className="hover:text-[#96754b] transition-colors">
                    Catalogues &amp; Specs
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="hover:text-[#96754b] transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-[#96754b] transition-colors">
                    Contact Studio
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: Collections */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[#8c8273]">
                Collections
              </h3>
              <ul className="mt-4 space-y-2.5 text-xs text-[#4a443b] font-medium">
                {collections.slice(1, 7).map((c) => (
                  <li key={c}>
                    <Link
                      to="/products"
                      search={{ collection: c }}
                      className="hover:text-[#96754b] transition-colors"
                    >
                      {c}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Services / Utility */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[#8c8273]">
                Services
              </h3>
              <ul className="mt-4 space-y-2.5 text-xs text-[#4a443b] font-medium">
                <li>
                  <button
                    type="button"
                    onClick={() => openQuery("Sample Swatch Box Request")}
                    className="text-left hover:text-[#96754b] transition-colors cursor-pointer"
                  >
                    Sample Swatch Box
                  </button>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-[#96754b] transition-colors">
                    Experience Center Visit
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openQuery("Trade & Commercial Inquiry")}
                    className="text-left hover:text-[#96754b] transition-colors cursor-pointer"
                  >
                    Trade & Commercial
                  </button>
                </li>
                <li>
                  <Link to="/products" className="hover:text-[#96754b] transition-colors">
                    Specification Guides
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Huge Brand Watermark Inside Card */}
          <div className="pt-8 overflow-hidden text-center">
            <span className="block select-none font-sans text-[16vw] sm:text-[14vw] md:text-[10rem] lg:text-[11.5rem] font-bold leading-[0.75] tracking-[-0.08em] text-[#28251f] uppercase">
              VENSAI
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
