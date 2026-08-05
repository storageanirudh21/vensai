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
  { label: "Catalogues", to: "/catalogues" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
] as const;

export function SiteHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname.startsWith("/admin")) return null;

  const { openQuery } = useLead();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
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
        {/* Left Side: Desktop/Tablet Nav & Mobile Menu Button */}
        <div className="flex items-center gap-6">
          {/* Desktop & Tablet Navigation Links (Visible on md and larger) */}
          <nav className="hidden md:flex items-center gap-6">
            {nav.map((item) => {
              const isActive = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "text-[0.7rem] font-semibold tracking-[0.18em] uppercase transition-colors hover:opacity-80",
                    isActive
                      ? overHero
                        ? "text-white underline underline-offset-4"
                        : "text-[#5e492e] font-bold"
                      : overHero
                        ? "text-white/80"
                        : "text-[#292721]/80"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Mobile Menu Button (Only visible on mobile view < md) */}
          <button
            type="button"
            onClick={() => setMenu((v) => !v)}
            className={cn(
              "flex md:hidden items-center gap-2 text-[0.68rem] font-semibold tracking-[0.18em] uppercase hover:opacity-75 transition-opacity cursor-pointer",
              overHero ? "text-white" : "text-[#292721]"
            )}
          >
            {menu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span>Menu</span>
          </button>
        </div>

        {/* Center: Brand Logo (Dead Centered) */}
        <div className="flex justify-center">
          <NavbarLogo overHero={overHero} />
        </div>

        {/* Right Side: Quick Query & Consultation */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => openQuery()}
            className={cn(
              "hidden md:flex items-center gap-2 border px-4 py-2 text-[0.65rem] font-semibold tracking-[0.16em] uppercase transition-all cursor-pointer",
              overHero
                ? "border-white/50 text-white hover:bg-white hover:text-[#28251f]"
                : "border-[#755c3b] text-[#5e492e] hover:bg-[#5e492e] hover:text-white"
            )}
          >
            <MessageSquareText className="h-3.5 w-3.5" />
            <span>Consultation</span>
          </button>
        </div>
      </div>

      {/* Mobile Only Bottom Sheet Navigation Modal (< md) */}
      <AnimatePresence>
        {menu && (
          <div className="md:hidden">
            {/* Dark Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setMenu(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs"
            />

            {/* Bottom Sheet Card */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] overflow-y-auto rounded-t-[32px] bg-white px-6 pt-6 pb-8 text-[#181512] shadow-2xl"
            >
              {/* Sheet Header */}
              <div className="flex items-center justify-between border-b border-neutral-100 pb-5">
                <span className="font-sans text-sm font-extrabold tracking-wider uppercase text-[#181512]">
                  VENSAI GLOBAL
                </span>
                <button
                  type="button"
                  onClick={() => setMenu(false)}
                  className="grid h-9 w-9 place-items-center rounded-full bg-neutral-100 text-neutral-600 transition-colors hover:bg-neutral-200 active:scale-95 cursor-pointer"
                  aria-label="Close Menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Menu Links List */}
              <div className="flex flex-col pt-2">
                {nav.map((item) => {
                  const isActive = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMenu(false)}
                      className={cn(
                        "border-b border-neutral-100 py-4 font-sans text-base font-semibold transition-colors",
                        isActive
                          ? "text-[#E05326]"
                          : "text-[#28251f] hover:text-[#E05326]"
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              {/* Bottom Action Button */}
              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setMenu(false);
                    openQuery();
                  }}
                  className="w-full rounded-full bg-[#0F172A] py-4 text-center font-sans text-sm font-semibold text-white transition-all hover:bg-black active:scale-[0.98] shadow-lg cursor-pointer"
                >
                  Book Consultation
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
}
