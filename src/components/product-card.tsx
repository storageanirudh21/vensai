import { forwardRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type ProductCardProps = {
  product: {
    slug: string;
    name: string;
    collection: string;
    image: string;
    badge?: string;
  };
  index?: number;
  ctaType?: "enquire" | "explore";
};

export const ProductCard = forwardRef<HTMLElement, ProductCardProps>(
  ({ product, index = 0 }, ref) => {
    const [imageLoaded, setImageLoaded] = useState(false);

    return (
      <motion.article
        ref={ref}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.55, delay: Math.min(index, 8) * 0.05, ease: [0.22, 1, 0.36, 1] }}
      >
        <Link to="/products/$slug" params={{ slug: product.slug }} className="group block">
          <div className="relative aspect-[4/5] overflow-hidden bg-[#ddd1c0]">
            {!imageLoaded && (
              <Skeleton className="absolute inset-0 h-full w-full rounded-none bg-[#eae3d7] animate-pulse" />
            )}
            <img
              src={product.image}
              alt={product.name}
              loading={index < 6 ? "eager" : "lazy"}
              decoding="async"
              onLoad={() => setImageLoaded(true)}
              className={cn(
                "h-full w-full object-cover transition-all duration-300 ease-out group-hover:scale-[1.035]",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
            />
            {product.badge && imageLoaded && (
              <span className="absolute left-3 top-3 z-10 border border-white/60 bg-[#261b14]/70 px-2 py-1 text-[0.55rem] uppercase tracking-[0.15em] text-white">
                {product.badge}
              </span>
            )}
          </div>
          <div className="border-b border-[#cdc4b7] py-3">
            {!imageLoaded ? (
              <div className="space-y-2 py-1">
                <Skeleton className="h-2.5 w-1/3 bg-[#eae3d7] animate-pulse" />
                <div className="flex items-center justify-between gap-4">
                  <Skeleton className="h-4 w-3/4 bg-[#eae3d7] animate-pulse" />
                  <Skeleton className="h-3.5 w-3.5 rounded-full bg-[#eae3d7] animate-pulse shrink-0" />
                </div>
              </div>
            ) : (
              <>
                <p className="text-[0.56rem] font-medium uppercase tracking-[0.15em] text-[#776f63]">
                  {product.collection}
                </p>
                <div className="mt-1 flex items-center justify-between gap-4">
                  <h3 className="text-sm font-medium tracking-[-0.025em] text-[#27221c] transition-colors group-hover:text-[#755c3b]">
                    {product.name}
                  </h3>
                  <ArrowUpRight
                    size={14}
                    className="text-[#776f63] shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </div>
              </>
            )}
          </div>
        </Link>
      </motion.article>
    );
  }
);
ProductCard.displayName = "ProductCard";
