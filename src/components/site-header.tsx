import { Link, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquareText, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { NavbarLogo } from "@/components/navbar-logo";
import { useLead } from "@/lib/lead";
import { cn } from "@/lib/utils";

const nav = [
  { label: "Home", to: "/" },
  { label: "Products", to: "/products" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
] as const;

export function SiteHeader() {
  const { openQuery } = useLead();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const overHero = pathname === "/" && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b px-4 py-4 transition-all duration-500 md:px-8",
        overHero
          ? "absolute w-full border-white/20 bg-transparent text-white"
          : "border-[#d8d0c2] bg-[#f3efe7]/95 text-[#28251f] backdrop-blur-sm",
      )}
    >
      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4">
        {/* Left Side: Menu Trigger & Nav */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setMenu((v) => !v)}
            className={cn("flex items-center gap-2 text-[0.68rem] font-semibold tracking-[0.18em] uppercase hover:opacity-75 transition-opacity", overHero ? "text-white" : "text-[#292721]")}
          >
            {menu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span>Menu</span>
          </button>

          <nav className={cn("hidden items-center gap-6 border-l pl-6 lg:flex", overHero ? "border-white/25" : "border-[#cfc6b6]")}>
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn("text-[0.65rem] font-semibold tracking-[0.18em] uppercase transition-colors", overHero ? "text-white/70 hover:text-white" : "text-[#625c52] hover:text-[#121212]")}
                activeProps={{ className: overHero ? "text-white font-bold" : "text-[#121212] font-bold" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Center: Brand Logo (Dead Centered) */}
        <div className="flex justify-center">
          <NavbarLogo overHero={overHero} />
        </div>

        {/* Right Side: Quick Query & Consultation */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => openQuery()}
            className={cn("hidden md:flex items-center gap-2 border px-4 py-2 text-[0.65rem] font-semibold tracking-[0.16em] uppercase transition-all", overHero ? "border-white/50 text-white hover:bg-white hover:text-[#28251f]" : "border-[#755c3b] text-[#5e492e] hover:bg-[#5e492e] hover:text-white")}
          >
            <MessageSquareText className="h-3.5 w-3.5" />
            <span>Consultation</span>
          </button>
        </div>
      </div>

      {/* Mobile & Drawer Navigation */}
      <AnimatePresence>
        {menu && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-[#d8d0c2] bg-[#f3efe7] mt-4 pt-2 pb-4"
          >
            <div className="flex flex-col max-w-7xl mx-auto px-4">
              {nav.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenu(false)}
                  className="border-b border-[#d8d0c2] py-3.5 font-display text-3xl font-semibold uppercase tracking-wide text-[#121212] hover:pl-2 transition-all"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
