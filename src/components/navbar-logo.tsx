import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

interface NavbarLogoProps {
  to?: string;
  overHero?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function NavbarLogo({ to = "/", overHero = false, size = "md", className }: NavbarLogoProps) {
  const logoHeights = {
    sm: "h-8 sm:h-9",
    md: "h-10 sm:h-12",
    lg: "h-12 sm:h-14",
  };

  return (
    <Link to={to} className={cn("flex items-center gap-3 shrink-0 group", className)}>
      <img
        src="/logo.png"
        alt="Vensai Global"
        className={cn(
          "w-auto object-contain transition-transform group-hover:scale-[1.03]",
          logoHeights[size]
        )}
      />
      <div className="flex flex-col text-left leading-none">
        <span
          className={cn(
            "font-display font-bold tracking-[0.16em] uppercase whitespace-nowrap",
            size === "sm" ? "text-xs sm:text-sm" : size === "lg" ? "text-xl sm:text-2xl" : "text-base sm:text-lg",
            overHero ? "text-white drop-shadow-xs" : "text-[#1c1712]"
          )}
        >
          VENSAI GLOBAL
        </span>
        <span
          className={cn(
            "font-sans text-[0.52rem] sm:text-[0.58rem] font-semibold tracking-[0.22em] uppercase mt-0.5",
            overHero ? "text-white/80" : "text-[#8c734b]"
          )}
        >
          Architectural Surfaces
        </span>
      </div>
    </Link>
  );
}
