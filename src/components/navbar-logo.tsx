import { Link } from "@tanstack/react-router";
import { VensaiMark } from "@/components/vensai-mark";
import { cn } from "@/lib/utils";

interface NavbarLogoProps {
  to?: string;
  overHero?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function NavbarLogo({ to = "/", overHero = false, size = "md", className }: NavbarLogoProps) {
  const markSizes = {
    sm: "h-5 w-5",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  const textSizes = {
    sm: "text-base sm:text-lg",
    md: "text-[1.65rem]",
    lg: "text-2xl sm:text-3xl",
  };

  const subTextSizes = {
    sm: "text-[0.5rem]",
    md: "text-[0.55rem]",
    lg: "text-[0.65rem]",
  };

  return (
    <Link to={to} className={cn("flex items-center gap-2.5 group text-center shrink-0", className)}>
      <VensaiMark
        className={cn(
          markSizes[size],
          "transition-transform group-hover:rotate-12 shrink-0",
          overHero ? "text-white" : "text-[#755c3b]"
        )}
      />
      <span
        className={cn(
          "font-display font-semibold tracking-[0.18em] uppercase whitespace-nowrap leading-none",
          textSizes[size],
          overHero ? "text-white" : "text-[#24221e]"
        )}
      >
        VENSAI{" "}
        <span
          className={cn(
            "font-sans font-medium tracking-[0.32em]",
            subTextSizes[size],
            overHero ? "text-white/65" : "text-[#755c3b]"
          )}
        >
          PRIME
        </span>
      </span>
    </Link>
  );
}
